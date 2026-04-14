"""
safee_scan_repo.py -- Feeds real vulnerabilities from LLM-workshop
into the running SAFEE pipeline for automated fixing.
"""

import requests
import json
import time
import sys
import io

# Force UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8005/safe/run"

VULNERABILITIES = [
    {
        "name": "Wildcard CORS (Critical)",
        "raw_requirement": "Fix the wildcard CORS vulnerability in main.py. The current code uses allow_origins=['*'] which allows any website to call the API. Restrict CORS to only the frontend origin http://localhost:3000.",
        "repo_context": {"target_file": "main.py", "branch": "main"},
        "project_state": {"framework": "FastAPI", "language": "python"},
        "vulnerable_code": 'app.add_middleware(\n    CORSMiddleware,\n    allow_origins=["*"],\n    allow_credentials=True,\n    allow_methods=["*"],\n    allow_headers=["*"],\n)'
    },
    {
        "name": "No Authentication on Endpoints (Critical)",
        "raw_requirement": "Add API key authentication middleware to main.py. Currently all endpoints (/upload, /ask, /analysis) have no authentication. Add a simple API key check using an X-API-Key header that validates against an environment variable.",
        "repo_context": {"target_file": "main.py", "branch": "main"},
        "project_state": {"framework": "FastAPI", "language": "python"},
        "vulnerable_code": '@app.post("/upload")\nasync def upload_documents(files: List[UploadFile] = File(...)):\n    global latest_analysis\n    start_time = time.time()\n    all_issues = []\n    for file in files:\n        file_bytes = await file.read()\n        file_name = file.filename or "document"\n'
    },
    {
        "name": "No File Upload Validation (Critical)",
        "raw_requirement": "Add file type and size validation to the /upload endpoint in main.py. Currently any file type and size is accepted. Restrict uploads to PDF files only and limit file size to 10MB.",
        "repo_context": {"target_file": "main.py", "branch": "main"},
        "project_state": {"framework": "FastAPI", "language": "python"},
        "vulnerable_code": 'for file in files:\n    file_bytes = await file.read()\n    file_name = file.filename or "document"\n    if file_name.lower().endswith(".pdf"):\n        doc_text = extract_text_from_pdf(file_bytes)\n    else:\n        try:\n            doc_text = file_bytes.decode("utf-8")\n        except UnicodeDecodeError:\n            doc_text = file_bytes.decode("latin-1", errors="replace")\n'
    },
    {
        "name": "Global Mutable State Data Leakage (High)",
        "raw_requirement": "Fix the global mutable state vulnerability in main.py. The variable latest_analysis is shared across all users, so one user can see another user legal document analysis via GET /analysis. Replace with a session-keyed dict using a unique scan_id.",
        "repo_context": {"target_file": "main.py", "branch": "main"},
        "project_state": {"framework": "FastAPI", "language": "python"},
        "vulnerable_code": 'latest_analysis: Dict[str, Any] = {}\n\n@app.get("/analysis")\nasync def get_analysis():\n    if not latest_analysis:\n        return {\n            "metrics": {"critical_issues": 0, "warnings": 0, "compliant_sections": 100},\n            "issues": [],\n            "message": "No documents have been scanned yet."\n        }\n    return latest_analysis\n'
    },
]


def run_pipeline(vuln, index):
    print(f"\n{'='*60}")
    print(f"  SAFEE Pipeline Run #{index+1}: {vuln['name']}")
    print(f"{'='*60}")

    payload = {
        "user_id": "safee_scanner",
        "raw_requirement": vuln["raw_requirement"],
        "repo_context": vuln["repo_context"],
        "project_state": vuln["project_state"],
        "vulnerable_code": vuln["vulnerable_code"],
        "allow_human_approval": True,
        "allow_ci_inject": True,
    }

    headers = {"Content-Type": "application/json"}
    start = time.time()

    try:
        resp = requests.post(BASE_URL, json=payload, headers=headers, timeout=120)
        elapsed = time.time() - start

        if resp.status_code == 200:
            data = resp.json()
            print(f"  [TIME]     {elapsed:.1f}s")
            print(f"  [PLAN]     {str(data.get('plan', ''))[:200]}")
            print(f"  [FIX]      {'Yes' if data.get('patch') else 'No'}")
            print(f"  [GUARDRAIL] {data.get('guardrail_passed', 'N/A')}")
            print(f"  [VALID]    {data.get('patch_valid', 'N/A')}")
            print(f"  [RISK]     {data.get('risk_score', 'N/A')}")
            print(f"  [APPROVED] {data.get('human_approved', 'N/A')}")
            print(f"  [GITHUB]   {json.dumps(data.get('ci_results'), indent=4)}")

            if data.get("failures"):
                print(f"  [WARN]     {len(data['failures'])} failure(s)")
                for f in data["failures"]:
                    print(f"     - {f.get('step', '?')}: {str(f.get('errors', ''))[:150]}")

            patch = data.get("patch", "")
            if patch:
                print(f"\n  --- Generated Fix (first 500 chars) ---")
                print(f"  {patch[:500]}")
            print()
            return data
        else:
            print(f"  [ERROR] HTTP {resp.status_code}: {resp.text[:300]}")
            return None
    except Exception as e:
        print(f"  [ERROR] {e}")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("  SAFEE Automated Vulnerability Scanner")
    print("  Target: Dev-Anandhan/LLM-workshop")
    print(f"  Vulnerabilities to Process: {len(VULNERABILITIES)}")
    print("=" * 60)

    results = []
    for i, vuln in enumerate(VULNERABILITIES):
        result = run_pipeline(vuln, i)
        results.append({"name": vuln["name"], "result": result})
        time.sleep(2)

    print(f"\n{'='*60}")
    print("  SAFEE SCAN SUMMARY")
    print("=" * 60)
    for r in results:
        has_fix = r["result"] and r["result"].get("patch")
        pr = r["result"].get("ci_results", {}) if r["result"] else {}
        pr_status = pr.get("status", "not attempted") if pr else "not attempted"
        status = "[PASS]" if has_fix else "[FAIL]"
        print(f"  {status} {r['name']} -- PR: {pr_status}")
    print("=" * 60)
