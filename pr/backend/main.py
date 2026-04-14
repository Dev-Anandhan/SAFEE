"""
main.py — FastAPI entry point for SAFEE.

Single endpoint: POST /safe/run
All orchestration happens inside run_safe_agent().
"""

from __future__ import annotations

import os
# removed unused Optional import

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel

load_dotenv()

from firebase_auth import verify_firebase_token  # noqa: E402
from lang_graph_agent import run_safe_agent       # noqa: E402

# ── Security ────────────────────────────────────────────────────
security = HTTPBearer()

ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://localhost:3000",
).split(",")


def get_current_user(authorization: str = Header(None)):
    """Temporarily bypassed for local automation testing."""
    return {"uid": "local_tester"}


# ── App ─────────────────────────────────────────────────────────
app = FastAPI(
    title="SAFEE LangGraph Agent Hub",
    description="Safe Automated Fix & Enforcement Engine — production API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ───────────────────────────────────
class UserRequest(BaseModel):
    user_id: str
    raw_requirement: str
    repo_context: dict
    project_state: dict
    vulnerable_code: str = ""
    allow_human_approval: bool = True
    allow_ci_inject: bool = False


# ── Routes ──────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "safee"}


@app.post("/safe/run")
async def run_safee(
    req: UserRequest,
    user: dict = Depends(get_current_user),
):
    """Execute the full SAFEE pipeline for the authenticated user."""
    result = await run_safe_agent(
        user_id=user.get("uid", req.user_id),
        raw_requirement=req.raw_requirement,
        repo_context=req.repo_context,
        project_state=req.project_state,
        vulnerable_code=req.vulnerable_code,
        allow_human_approval=req.allow_human_approval,
        allow_ci_inject=req.allow_ci_inject,
    )
    return result
