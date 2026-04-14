"""
code_generator.py — Code-generation node.

Uses Mistral AI as the code generation engine via LangChain,
replacing the local CodeT5+ model for better compatibility.
"""

from __future__ import annotations

import os
from typing import Dict

from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = (
    "You are a senior software engineer. Given a rule and vulnerable code, "
    "generate a minimal, focused code fix. Output ONLY the corrected code, "
    "no explanations, no markdown fences."
)

PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "Rule: {rule}\n\nVulnerable code:\n{vulnerable_code}"),
])

model = ChatMistralAI(
    model="mistral-large-latest",
    temperature=0.0,
    api_key=os.getenv("MISTRAL_API_KEY"),
)


def generate_fix(vulnerable_code: str, rule: str = "") -> str:
    """Generate a code fix for *vulnerable_code* under *rule*."""
    chain = PROMPT | model
    resp = chain.invoke({
        "rule": rule,
        "vulnerable_code": vulnerable_code,
    })
    return resp.content.strip()


def codet5p_node(state: Dict) -> Dict:
    """SAFEE node: generate a code fix."""
    rule = state.get("raw_requirement", "")
    vulnerable = state.get("vulnerable_code", "")

    if not vulnerable:
        return {"suggested_fix": "", "patch": ""}

    fix = generate_fix(vulnerable, rule)
    return {"suggested_fix": fix, "patch": fix}
