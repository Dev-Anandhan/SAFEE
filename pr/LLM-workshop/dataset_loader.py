import os
import json
import logging
from typing import List, Dict, Any

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

from embed_store import LegalVectorStore

logger = logging.getLogger(__name__)


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks

def _chunk_compliance_rule(rule: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Breaks a structured compliance rule object into multiple embedding chunks
    so the RAG system can retrieve individual rules precisely.
    """
    doc_type = rule.get("document_type", "Unknown")
    laws = rule.get("applicable_laws", [])
    purpose = rule.get("purpose", "")
    risk = "high" if rule.get("risk_weight", 0) >= 30 else "medium"
    chunks: List[Dict[str, Any]] = []

    # Chunk 1: Overview with all mandatory clauses
    mandatory = rule.get("mandatory_clauses", [])
    if mandatory:
        text = (
            f"Document type: {doc_type}. Purpose: {purpose}. "
            f"Mandatory clauses required: {'; '.join(mandatory)}. "
            f"If any of these are missing, the document is defective."
        )
        chunks.append({
            "vector_ready": True,
            "doc_type": f"Compliance Rule - {doc_type}",
            "clause_title": f"{doc_type} - Mandatory Clauses",
            "governing_law": laws,
            "risk_level": risk,
            "text": text,
        })

    # Chunk 2: Critical violations
    violations = rule.get("critical_violations", [])
    consequences = rule.get("legal_consequences", [])
    if violations:
        text = (
            f"Document type: {doc_type}. "
            f"Critical violations to detect: {'; '.join(violations)}. "
            f"Legal consequences if found: {'; '.join(consequences)}."
        )
        chunks.append({
            "vector_ready": True,
            "doc_type": f"Compliance Rule - {doc_type}",
            "clause_title": f"{doc_type} - Critical Violations",
            "governing_law": laws,
            "risk_level": "critical",
            "text": text,
        })

    # Chunk 3: Remediation steps
    remediation = rule.get("remediation", [])
    if remediation:
        text = (
            f"Document type: {doc_type}. "
            f"Remediation steps: {'; '.join(remediation)}."
        )
        chunks.append({
            "vector_ready": True,
            "doc_type": f"Compliance Rule - {doc_type}",
            "clause_title": f"{doc_type} - Remediation",
            "governing_law": laws,
            "risk_level": "info",
            "text": text,
        })

    return chunks


def load_dataset_into_store(store: LegalVectorStore, dataset_dir: str = "legal_vector_dataset") -> None:
    """
    Walks the dataset directory, reads JSON files, and processes PDF rule documents
    from the 'rules' directory, loading everything into the FAISS vector store.
    """
    total_docs_loaded = 0
    
    if not os.path.exists(dataset_dir):
        logger.warning(f"Dataset directory '{dataset_dir}' not found. Skipping dataset load.")
        return

    all_docs: List[Dict[str, Any]] = []

    for root, _, files in os.walk(dataset_dir):
        for file in files:
            if not file.endswith(".json") or file == "metadata_schema.json":
                continue
                
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    docs = json.load(f)
                    
                if isinstance(docs, list):
                    for d in docs:
                        # Check if this is a structured compliance rule object
                        if "mandatory_clauses" in d:
                            chunks = _chunk_compliance_rule(d)
                            all_docs.extend(chunks)
                            total_docs_loaded += len(chunks)
                            logger.info(f"Chunked compliance rule '{d.get('document_type', 'Unknown')}' into {len(chunks)} embeddings from {file}")
                        elif d.get("vector_ready", True):
                            all_docs.append(d)
                            total_docs_loaded += 1
                    logger.info(f"Loaded entries from {file}")
            except Exception as e:
                logger.error(f"Failed to parse JSON file {file_path}: {e}")

    if all_docs:
        logger.info(f"Vectorizing a total of {total_docs_loaded} legal clauses. This may take a moment...")
        store.add_structured_documents(all_docs)
        logger.info("Successfully loaded all documents into FAISS index.")
    else:
        logger.warning("No valid JSON documents found to load.")

    # Process PDF Rules
    rules_dir = "rules"
    if os.path.exists(rules_dir) and fitz is not None:
        logger.info(f"Processing PDF rules from {rules_dir}...")
        pdf_chunks = []
        for root, _, files in os.walk(rules_dir):
            for file in files:
                if not file.lower().endswith(".pdf"):
                    continue
                file_path = os.path.join(root, file)
                try:
                    with fitz.open(file_path) as doc:
                        full_text = ""
                        for page in doc:
                            full_text += page.get_text("text") + "\n"
                        
                        chunks = chunk_text(full_text)
                        for i, chunk in enumerate(chunks):
                            pdf_chunks.append({
                                "vector_ready": True,
                                "doc_type": "PDF Rules Document",
                                "clause_title": f"{file} - Part {i+1}",
                                "governing_law": ["Custom Internal Rules"],
                                "risk_level": "info",
                                "text": chunk.strip()
                            })
                    logger.info(f"Loaded {len(chunks)} chunks from {file}")
                except Exception as e:
                    logger.error(f"Failed to process PDF {file_path}: {e}")
                    
        if pdf_chunks:
            logger.info(f"Vectorizing {len(pdf_chunks)} chunks from PDFs...")
            store.add_structured_documents(pdf_chunks)
            total_docs_loaded += len(pdf_chunks)
            logger.info("Successfully loaded PDF rules into FAISS index.")

