import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import Dict, Any, List, Tuple


class LegalVectorStore:
    """
    Lightweight in‑memory vector store backed by FAISS, enhanced for structured legal data.

    - Uses a small embedding model for low latency
    - Keeps documents and rich metadata in process memory (no persistence)
    """

    def __init__(self, model_name: str = "BAAI/bge-small-en"):
        self.model = SentenceTransformer(model_name)
        self.dim = self._get_dim()
        self.index = faiss.IndexFlatL2(self.dim)
        # Store full structured documents with metadata
        self.documents: List[Dict[str, Any]] = []

    def _get_dim(self) -> int:
        test_vec = self.model.encode(["test"])
        return int(test_vec.shape[1])

    def _build_embedding_text(self, doc: Dict[str, Any]) -> str:
        """
        Creates a dense textual representation for semantic retrieval by combining
        key metadata with the raw clause text.
        """
        doc_type = doc.get("doc_type", "Unknown Document").replace("_", " ").title()
        clause_title = doc.get("clause_title", "Unknown Clause")
        law = ", ".join(doc.get("governing_law", []))
        text = doc.get("text", "")
        
        parts = [f"[{doc_type}] {clause_title}"]
        if law:
            parts.append(f"(Governing Law: {law})")
        parts.append(f"- {text}")
        
        return " ".join(parts)

    def add_structured_documents(self, docs: List[Dict[str, Any]]) -> None:
        """
        Adds structured documentation dicts to the FAISS index.
        """
        if not docs:
            return

        texts_to_embed = [self._build_embedding_text(doc) for doc in docs]
        embeddings = self.model.encode(texts_to_embed, convert_to_numpy=True)
        
        self.index.add(embeddings.astype("float32"))
        self.documents.extend(docs)

    def search(self, query: str, k: int = 5) -> List[Tuple[Dict[str, Any], float, int]]:
        """
        Returns a list of (document_dict, L2_score, doc_index).
        Lower score means semantically closer.
        """
        if not self.documents:
            return []

        q_emb = self.model.encode([query], convert_to_numpy=True)
        D, I = self.index.search(q_emb.astype("float32"), min(k, len(self.documents)))

        results: List[Tuple[Dict[str, Any], float, int]] = []
        for pos, (idx, dist) in enumerate(zip(I[0], D[0])):
            if idx == -1:
                continue
            results.append((self.documents[idx], float(dist), int(idx)))
            
        return results

