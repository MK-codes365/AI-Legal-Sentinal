import requests
import json
import sys

url = "http://127.0.0.1:8000/download-report"
data = {
    "summary": {
        "overview": "Test overview",
        "parties": ["Party A", "Party B"],
        "governing_law": "Indian Law",
        "vesting_schedule": "None",
        "lock_in_period": "None",
        "contract_type": "Service Agreement",
        "duration": "1 year",
        "termination_notice": "30 days"
    },
    "risk_flags": [
        {
            "risk_level": "High",
            "title": "Unfair Termination",
            "reason": "Unilateral termination clause.",
            "explanation": "This means one party can end the contract anytime.",
            "law": "Section 28",
            "section": "Indian Contract Act",
            "text": "Clause text...",
            "clause_id": 1
        }
    ],
    "structure_analysis": {
        "completeness_score": 85,
        "present_clauses": [{"title": "Termination", "eli5": "Ends the deal."}],
        "missing_clauses": [{"title": "Indemnity", "eli5": "Protection from loss."}]
    },
    "holistic_narrative": "This is a test narrative.",
    "deviations": [],
    "pii_tokenized": False,
    "token_count": 0
}

try:
    print(f"Testing POST to {url}...")
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("Success! Content length:", len(response.content))
        with open("api_test_report.pdf", "wb") as f:
            f.write(response.content)
        print("Saved to api_test_report.pdf")
    else:
        print("Response Text:", response.text)
except Exception as e:
    print(f"Request failed: {e}")
