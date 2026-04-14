"""
Firebase Auth — token verification utility for SAFEE.
Initialises the Firebase Admin SDK and exposes verify_firebase_token().
"""

import os
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv

load_dotenv()

_CRED_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "serviceAccountKey.json")

# Initialise once at module‑import time
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(_CRED_PATH)
        firebase_admin.initialize_app(cred)
    except FileNotFoundError:
        print(f"WARNING: {_CRED_PATH} not found. Firebase Auth disabled.")


def verify_firebase_token(id_token: str) -> tuple[str, dict]:
    """
    Verify a Firebase ID token and return (uid, decoded_claims).
    Raises ValueError on invalid / expired tokens.
    """
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded["uid"], decoded
    except Exception as e:
        raise ValueError(f"Invalid Firebase token: {e}")
