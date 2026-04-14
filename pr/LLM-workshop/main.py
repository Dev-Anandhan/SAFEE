import os
import json
import logging
import time
from typing import Any, Dict, List

import fitz  # PyMuPDF
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from embed_store import LegalVectorStore
from mistral import generate_response
from prompt_builder import build_messages, build_scan_messages
from dataset_loader import load_dataset_into_store


logger = logging.getLogger(__name__)

SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "1.5"))


app = FastAPI(title="Privacy‑Preserving Legal RAG Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = LegalVectorStore()

# In-memory store for the latest analysis results
latest_analysis: Dict[str, Any] = {}


class QueryRequest(BaseModel):
    question: str


class QueryResponse(BaseModel):
    answer: str
    used_context: List[Dict[str, Any]]
    rejected_for_low_similarity: bool


@app.on_event("startup")
def startup_event() -> None:
    load_dataset_into_store(vector_store)


# ─── CHAT ENDPOINT (Q&A) ───────────────────────────────────────────

@app.post("/ask", response_model=QueryResponse)
async def ask_question(request: QueryRequest) -> QueryResponse:
    results = vector_store.search(request.question, k=5)

    if not results:
        return QueryResponse(
            answer="Information not found in official records.",
            used_context=[],
            rejected_for_low_similarity=True,
        )

    best_doc, best_dist, _ = results[0]
    if best_dist > SIMILARITY_THRESHOLD:
        return QueryResponse(
            answer="Information not found in official records.",
            used_context=[],
            rejected_for_low_similarity=True,
        )

    structured_context: List[Dict[str, Any]] = []
    for doc_dict, dist, idx in results:
        law = ", ".join(doc_dict.get("governing_law", []))
        structured_context.append(
            {
                "doc_type": doc_dict.get("doc_type", "Unknown"),
                "clause_title": doc_dict.get("clause_title", "Unknown"),
                "governing_law": law,
                "risk_level": doc_dict.get("risk_level", "unknown"),
                "content": doc_dict.get("text", ""),
                "similarity_score": round(dist, 4),
                "doc_index": idx,
            }
        )

    messages = build_messages(request.question, structured_context)
    answer = generate_response(messages)

    return QueryResponse(
        answer=answer,
        used_context=structured_context,
        rejected_for_low_similarity=False,
    )


# ─── UPLOAD & SCAN ENDPOINT ────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF using PyMuPDF."""
    text = ""
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text.strip()


@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Real document scanning pipeline:
    1. Extract text from uploaded PDF(s).
    2. Search the rules vector DB for relevant compliance rules.
    3. Send document text + rules to Mistral compliance engine.
    4. Parse the strict JSON response and store it for /analysis.
    """
    global latest_analysis

    start_time = time.time()
    all_issues = []
    combined_doc_text = ""
    doc_type = "Unknown"
    summary = ""
    confidence = "low"

    for file in files:
        file_bytes = await file.read()
        file_name = file.filename or "document"

        # Extract text based on file type
        if file_name.lower().endswith(".pdf"):
            doc_text = extract_text_from_pdf(file_bytes)
        else:
            # Try to read as plain text
            try:
                doc_text = file_bytes.decode("utf-8")
            except UnicodeDecodeError:
                doc_text = file_bytes.decode("latin-1", errors="replace")

        if not doc_text.strip():
            continue

        combined_doc_text += f"\n--- {file_name} ---\n{doc_text}\n"

        # Search rules database using ONLY the actual document content
        # This prevents retrieving irrelevant rules that cause hallucination
        rule_contexts: List[Dict[str, Any]] = []
        seen_indices = set()

        # Use the document's own text to find relevant rules
        results = vector_store.search(doc_text[:1500], k=10)
        for doc_dict, dist, idx in results:
            # Only include rules that are semantically close enough
            if dist > SIMILARITY_THRESHOLD:
                continue
            if idx not in seen_indices:
                seen_indices.add(idx)
                law = ", ".join(doc_dict.get("governing_law", []))
                rule_contexts.append({
                    "doc_type": doc_dict.get("doc_type", "Unknown"),
                    "clause_title": doc_dict.get("clause_title", "Unknown"),
                    "governing_law": law,
                    "risk_level": doc_dict.get("risk_level", "unknown"),
                    "content": doc_dict.get("text", ""),
                })

        # Build the scan prompt and call Mistral
        messages = build_scan_messages(doc_text, rule_contexts)
        raw_response = generate_response(messages)

        # Parse the JSON response
        try:
            analysis = json.loads(raw_response)
            doc_type = analysis.get("document_type", doc_type)
            summary = analysis.get("summary", summary)
            confidence = analysis.get("confidence", confidence)

            for issue in analysis.get("issues", []):
                issue["id"] = str(len(all_issues) + 1)
                # Normalize severity for frontend compatibility
                sev = issue.get("severity", "medium").lower()
                if sev in ("critical", "high"):
                    issue["severity"] = "critical"
                elif sev in ("medium",):
                    issue["severity"] = "warning"
                else:
                    issue["severity"] = "info"
                # Map applicable_law to framework for frontend
                issue["framework"] = issue.pop("applicable_law", "Indian Law")
                all_issues.append(issue)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Mistral JSON response: {raw_response[:500]}")
            all_issues.append({
                "id": str(len(all_issues) + 1),
                "severity": "warning",
                "title": "Analysis Parsing Error",
                "description": f"The AI engine returned a response that could not be parsed. Raw snippet: {raw_response[:200]}",
                "framework": "System",
                "location": "N/A",
                "recommendation": "Please retry the upload or contact support."
            })

    elapsed = round(time.time() - start_time, 1)

    critical_count = sum(1 for i in all_issues if i.get("severity") == "critical")
    warning_count = sum(1 for i in all_issues if i.get("severity") == "warning")
    compliant = max(0, 100 - (critical_count * 15) - (warning_count * 5))

    latest_analysis = {
        "document_type": doc_type,
        "confidence": confidence,
        "summary": summary,
        "metrics": {
            "critical_issues": critical_count,
            "warnings": warning_count,
            "compliant_sections": compliant,
            "avg_processing_time": f"{elapsed}s"
        },
        "issues": all_issues
    }

    return {
        "message": f"Successfully scanned {len(files)} document(s). Found {critical_count} critical issues and {warning_count} warnings.",
        "analysis": latest_analysis
    }


# ─── ANALYSIS ENDPOINT (returns real results) ──────────────────────

@app.get("/analysis")
async def get_analysis():
    """Returns the latest real analysis results from the most recent upload scan."""
    if not latest_analysis:
        return {
            "metrics": {
                "critical_issues": 0,
                "warnings": 0,
                "compliant_sections": 100,
                "avg_processing_time": "0s"
            },
            "issues": [],
            "message": "No documents have been scanned yet. Upload a document to begin analysis."
        }
    return latest_analysis


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}
