import os

from dotenv import load_dotenv
from mistralai import Mistral


# Load environment variables from a local .env file, if present.
load_dotenv()

MISTRAL_MODEL_NAME = os.getenv("MISTRAL_MODEL_NAME", "mistral-small-latest")


def _get_client() -> Mistral:
    api_key = os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise RuntimeError("MISTRAL_API_KEY is not set in environment.")
    return Mistral(api_key=api_key)


from typing import List, Dict

def generate_response(messages: List[Dict[str, str]]) -> str:
    """
    Generate a response using Mistral with structured chat messages for strict RAG grounding.
    """
    client = _get_client()
    response = client.chat.complete(
        model=MISTRAL_MODEL_NAME,
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.2,
        top_p=0.9,
        max_tokens=2048,
    )
    return response.choices[0].message.content or ""

