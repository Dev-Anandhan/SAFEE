"""
code_encoder.py — Code validation node.

Uses difflib-based similarity comparison as a lightweight
validation mechanism, replacing GraphCodeBERT which has
Python 3.14 tokenizer compatibility issues.
"""

from __future__ import annotations

import difflib
from typing import Dict


def get_code_similarity(old_code: str, new_code: str) -> float:
    """Compute similarity ratio between old and new code."""
    return difflib.SequenceMatcher(None, old_code, new_code).ratio()


def graphcodebert_validate_node(state: Dict) -> Dict:
    """Validate that the suggested fix is semantically close to the original."""
    old_code = state.get("vulnerable_code", "")
    new_code = state.get("suggested_fix", "")

    if not old_code or not new_code:
        return {
            "patch_valid": False,
            "risk_score": 1.0,
            "similarity_with_repo": 0.0,
        }

    similarity = get_code_similarity(old_code, new_code)
    patch_valid = similarity > 0.3  # Some similarity expected
    risk_score = round(1.0 - similarity, 4)

    return {
        "patch_valid": patch_valid,
        "risk_score": risk_score,
        "similarity_with_repo": round(similarity, 4),
    }
