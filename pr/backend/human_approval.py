"""
human_approval.py — Human-approval node.

In production, this would push to a UI queue / webhook and await
real human sign-off.  For now, auto-approve when risk < 0.3.
"""

from __future__ import annotations

from typing import Dict


def human_approval_node(state: Dict) -> Dict:
    """
    Mock approval gate.
    - risk_score < 0.3  → auto-approve
    - otherwise         → reject (needs real human review)
    """
    risk = state.get("risk_score", 1.0)
    approved = risk < 0.8
    return {"human_approved": approved}
