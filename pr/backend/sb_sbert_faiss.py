"""
sb_sbert_faiss.py — SBERT + FAISS index utilities.

Builds and queries a FAISS flat-L2 index over code / doc snippets
using Sentence-BERT embeddings.
"""

from __future__ import annotations

import os
from typing import List

import numpy as np

# Lazy imports — these are heavy libraries; defer until actually needed.
_model = None
_faiss = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-mpnet-base-v2")
    return _model


def _get_faiss():
    global _faiss
    if _faiss is None:
        import faiss as _f
        _faiss = _f
    return _faiss


def build_index(texts: List[str], path: str) -> None:
    """Encode *texts* with SBERT and write a FAISS flat-L2 index to *path*."""
    faiss = _get_faiss()
    model = _get_model()

    embeddings = model.encode(texts, show_progress_bar=False)
    embeddings = np.asarray(embeddings, dtype=np.float32)

    index = faiss.IndexFlatL2(embeddings.shape[1])
    index.add(embeddings)

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    faiss.write_index(index, path)


def retrieve_snippets(
    query: str,
    index_path: str,
    text_snippets: List[str],
    k: int = 5,
) -> List[str]:
    """Return the *k* most similar snippets to *query* from a pre-built index."""
    faiss = _get_faiss()
    model = _get_model()

    if not os.path.exists(index_path):
        # No index yet — fall back to returning all snippets (up to k)
        return text_snippets[:k]

    index = faiss.read_index(index_path)
    q_emb = model.encode([query], show_progress_bar=False).astype(np.float32)
    _, indices = index.search(q_emb, min(k, index.ntotal))

    results: List[str] = []
    for i in indices[0]:
        if 0 <= i < len(text_snippets):
            results.append(text_snippets[i])
    return results
