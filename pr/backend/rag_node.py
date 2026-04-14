"""
rag_node.py — RAG node (retrieves relevant code snippets) and
repo-state node (passes through project / Git state).
"""

from __future__ import annotations

import os
from typing import Dict

from sb_sbert_faiss import retrieve_snippets

_INDEX_PATH = os.getenv("SAFEE_FAISS_INDEX_PATH", "data/sbert_faiss_index")


def rag_node(state: Dict) -> Dict:
    """Retrieve the most relevant code snippets for the requirement."""
    code_snippets = state.get("repo_context", {}).get("code_snippets", [])

    if not code_snippets:
        return {"retrieved_snippets": []}

    snippets = retrieve_snippets(
        query=state["raw_requirement"],
        index_path=_INDEX_PATH,
        text_snippets=code_snippets,
        k=5,
    )
    return {"retrieved_snippets": snippets}


def repo_state_node(state: Dict) -> Dict:
    """Pass through repo / project state for downstream nodes."""
    return {"repo_state": state.get("project_state", {})}
