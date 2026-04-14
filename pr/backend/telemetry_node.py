"""
telemetry_node.py — Observability / telemetry node.

Emits structured JSON events for each pipeline pass.
In production, pipe these into Prometheus, Datadog, or your SIEM.
"""

from __future__ import annotations

import datetime
from typing import Dict


def observability_node(state: Dict) -> Dict:
    """Append a telemetry event summarising the current state."""
    event = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "node": "telemetry",
        "user_id": state.get("user_id", "unknown"),
        "state_keys": sorted(state.keys()),
        "risk_score": state.get("risk_score"),
        "retries": state.get("retries", 0),
        "total_cost_usd": state.get("total_cost_usd", 0.0),
        "patch_valid": state.get("patch_valid"),
        "guardrail_violations": len(state.get("guardrails", [])),
    }
    events = list(state.get("telemetry_events", []))
    events.append(event)
    return {"telemetry_events": events}
