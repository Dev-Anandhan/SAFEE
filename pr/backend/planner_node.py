"""
planner_node.py — Small-coder LLM that parses the raw requirement into
a structured plan with confidence, rule type, and ambiguity flags.
"""

from __future__ import annotations

import json
import os
from typing import Dict

from langchain_core.prompts import ChatPromptTemplate
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv

load_dotenv()

PROMPTS: dict = json.load(open(os.path.join(os.path.dirname(__file__), "prompts.json")))

PROMPT = ChatPromptTemplate.from_messages([
    ("system", PROMPTS["planner"]["system"]),
    ("human", PROMPTS["planner"]["human_template"]),
])

model = ChatMistralAI(
    model="mistral-large-latest",
    temperature=0.0,
    api_key=os.getenv("MISTRAL_API_KEY"),
)


def planner_node(state: Dict) -> Dict:
    """Parse the raw requirement into a structured plan."""
    chain = PROMPT | model

    try:
        resp = chain.invoke({
            "requirement": state["raw_requirement"],
            "project_state": json.dumps(state.get("project_state", {})),
        })

        # Attempt to parse the LLM's JSON response using regex to extract the JSON object
        raw_content = resp.content
        print("======== MISTRAL DEBUG ========")
        print(raw_content)
        print("===============================")
        import re
        match = re.search(r'\{.*\}', raw_content, re.DOTALL)
        if match:
            parsed = json.loads(match.group(0))
        else:
            raise json.JSONDecodeError("No JSON object found in response", raw_content, 0)
        return {
            "requirement_confidence": float(parsed.get("requirement_confidence", parsed.get("confidence_score", 0.5))),
            "requirement_type": parsed.get("requirement_type", "soft-improvement"),
            "ambiguity_flags": parsed.get("ambiguity_flags", []),
            "plan": parsed.get("plan", parsed.get("execution_plan", str(parsed))),
        }
    except (json.JSONDecodeError, Exception) as exc:
        # Fallback — return a conservative parse
        return {
            "requirement_confidence": 0.5,
            "requirement_type": "soft-improvement",
            "ambiguity_flags": ["planner_parse_failed"],
            "plan": f"Could not parse requirement (error: {exc}). Manual review needed.",
        }
