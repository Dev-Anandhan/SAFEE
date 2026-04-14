"""
retry_cost_mem.py — Retry-control, cost-budget, and failure-memory nodes.
"""

from __future__ import annotations

import os
from typing import Dict

_MAX_RETRIES = int(os.getenv("SAFEE_MAX_RETRIES", "3"))
_COST_BUDGET = float(os.getenv("SAFEE_COST_BUDGET_USD", "1.00"))


def retry_control_node(state: Dict) -> Dict:
    """Increment retry counter; raise if exhausted."""
    retries = state.get("retries", 0) + 1
    if retries > _MAX_RETRIES:
        raise RuntimeError(
            f"Max retries ({_MAX_RETRIES}) exceeded. "
            "Escalate to human review."
        )
    return {"retries": retries}


def cost_budget_node(state: Dict) -> Dict:
    """
    Track cumulative USD cost and enforce a hard cap.
    In production, cost_per_token should come from real usage telemetry.
    """
    cost_per_token_usd = 0.00001
    approx_tokens = 2000
    cost = approx_tokens * cost_per_token_usd

    total = state.get("total_cost_usd", 0.0) + cost

    if total > _COST_BUDGET:
        raise RuntimeError(
            f"Cost budget exceeded: ${total:.4f} > ${_COST_BUDGET:.2f}"
        )

    return {"total_cost_usd": round(total, 6)}


def failure_memory_node(state: Dict) -> Dict:
    """Record the latest failure context for downstream retry logic."""
    failure = {
        "step": "codet5p",
        "code_preview": (state.get("suggested_fix") or "")[:200],
        "errors": state.get("test_results", {}).get("unit_log", "")[:500],
        "retry": state.get("retries", 0),
    }
    failures = list(state.get("failures", []))
    failures.append(failure)
    return {"failures": failures}
