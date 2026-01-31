import sys
import os

# Add the current directory to sys.path to find the modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from legal_engine.report_generator import generate_pdf_report

test_data = {
    "summary": {
        "overview": "Test overview",
        "parties": ["Party A", "Party B"],
        "governing_law": "Indian Law",
        "vesting_schedule": "None",
        "lock_in_period": "None"
    },
    "risk_flags": [
        {
            "risk_level": "High",
            "title": "Unfair Termination",
            "reason": "Unilateral termination clause.",
            "explanation": "This means one party can end the contract anytime."
        }
    ],
    "structure_analysis": {
        "completeness_score": 85,
        "present_clauses": [{"title": "Termination"}],
        "missing_clauses": [{"title": "Indemnity"}]
    }
}

try:
    buffer = generate_pdf_report(test_data)
    with open("test_report.pdf", "wb") as f:
        f.write(buffer.read())
    print("✅ PDF generated successfully: test_report.pdf")
except Exception as e:
    print(f"❌ PDF generation failed: {e}")
    import traceback
    traceback.print_exc()
