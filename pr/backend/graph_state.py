"""
graph_state.py — Central state schema for the SAFEE LangGraph agent.

Every node reads from and writes to a subset of this TypedDict.
"""

from typing import TypedDict, List, Optional, Dict


class GraphState(TypedDict, total=False):
    # ── Identity ────────────────────────────────────────────────
    user_id: str
    raw_requirement: str

    # ── Planner outputs ─────────────────────────────────────────
    requirement_confidence: float
    requirement_type: str          # access-control | policy | data-validation | refactoring | soft-improvement
    ambiguity_flags: List[str]
    plan: str

    # ── RAG + repo grounding ────────────────────────────────────
    retrieved_snippets: List[str]
    repo_context: dict
    repo_state: Dict[str, str]
    project_state: dict

    # ── Guardrails ──────────────────────────────────────────────
    guardrails: List[str]

    # ── CodeT5+ / code ──────────────────────────────────────────
    vulnerable_code: str
    suggested_fix: str
    patch: str

    # ── GraphCodeBERT validation ────────────────────────────────
    patch_valid: bool
    risk_score: float
    similarity_with_repo: float

    # ── Tests ───────────────────────────────────────────────────
    unit_test_passed: bool
    lint_passed: bool
    light_sast_passed: bool
    test_results: dict

    # ── Retry / cost / memory ───────────────────────────────────
    retries: int
    total_cost_usd: float
    failures: List[str]

    # ── Observability ───────────────────────────────────────────
    telemetry_events: List[dict]

    # ── Approval / CI ───────────────────────────────────────────
    human_approved: Optional[bool]
    ci_approved: Optional[bool]
    ci_results: Optional[dict]
    deployed: bool
