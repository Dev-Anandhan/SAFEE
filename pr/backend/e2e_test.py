import requests
import json
import time

url = "http://localhost:8005/safe/run"

payload = {
    "user_id": "system_tester",
    "raw_requirement": "Extract the data fetching logic into a separate utility function to improve reusability and remove inline SQL queries.",
    "repo_context": {
        "target_file": "app/main.py", # Example file that might exist in the target repo
        "branch": "main"
    },
    "project_state": {
        "framework": "python",
        "recent_commits": ["initial commit"]
    },
    "vulnerable_code": "def get_user_data(user_id):\n    import sqlite3\n    conn = sqlite3.connect('db.sqlite3')\n    cursor = conn.cursor()\n    cursor.execute(f'SELECT * FROM users WHERE id = {user_id}')  # SQL Injection Risk\n    return cursor.fetchall()\n",
    "allow_human_approval": True,
    "allow_ci_inject": True
}

headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer local_test_token"
}

print("Starting SAFEE Pipeline E2E Test...")
print(f"Targeting Repository URL: https://github.com/Dev-Anandhan/LLM-workshop")

start = time.time()
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"\nResponse Time: {time.time() - start:.2f} seconds")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        res_json = response.json()
        print("\n--- Pipeline State ---")
        print(f"Planner Interpretation: {res_json.get('plan')}")
        print(f"Generated Fix: \n{res_json.get('patch')}")
        print(f"Failures: {json.dumps(res_json.get('failures'), indent=2)}")
        print(f"CI Automation Results: {json.dumps(res_json.get('ci_results'), indent=2)}")
    else:
        print(f"Error Response: {response.text}")
        
except Exception as e:
    print(f"Failed to connect to backend: {e}")
