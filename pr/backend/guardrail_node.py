"""
guardrail_node.py — Deterministic, regex-based guardrail checks.

Flags dangerous patterns in generated code *before* it reaches tests or CI.
"""

from __future__ import annotations

import re
from typing import Dict, List

# Each entry is a (compiled regex, human-readable label) pair.
_RULES: list[tuple[re.Pattern, str]] = [
    (re.compile(r"sql\s*=\s*",          re.IGNORECASE), "Raw SQL assignment"),
    (re.compile(r"query\s*=\s*",        re.IGNORECASE), "Raw query assignment"),
    (re.compile(r"\beval\s*\(",         re.IGNORECASE), "Use of eval()"),
    (re.compile(r"\bexec\s*\(",         re.IGNORECASE), "Use of exec()"),
    (re.compile(r"\bsudo\b",            re.IGNORECASE), "sudo usage"),
    (re.compile(r"os\.system\s*\(",     re.IGNORECASE), "os.system() call"),
    (re.compile(r"subprocess.*shell\s*=\s*True", re.IGNORECASE), "subprocess shell=True"),
    (re.compile(r"__import__\s*\(",     re.IGNORECASE), "Dynamic __import__()"),
    (re.compile(r"pickle\.loads?\s*\(", re.IGNORECASE), "Pickle deserialization"),
]


def _check_code(code: str) -> List[str]:
    """Return a list of human-readable violation strings."""
    violations: List[str] = []
    for pattern, label in _RULES:
        if pattern.search(code):
            violations.append(f"VIOLATION: {label} — pattern: {pattern.pattern}")
    return violations


def guardrail_node(state: Dict) -> Dict:
    """Run deterministic guardrail checks on the suggested fix."""
    code = state.get("suggested_fix", "") or state.get("vulnerable_code", "")
    violations = _check_code(code)
    return {"guardrails": violations}
