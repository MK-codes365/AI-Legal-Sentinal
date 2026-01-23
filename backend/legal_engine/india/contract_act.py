from typing import List
from legal_engine.types import LegalFlag

def analyze_clause(clause: dict) -> List[LegalFlag]:
    text = clause["text"].lower()
    flags = []

    # 1. Non-Compete (Section 27)
    if "non compete" in text or "shall not engage" in text:
        flags.append({
            "clause_id": clause["clause_id"],
            "title": clause["title"],
            "risk_level": "High",
            "law": "Indian Contract Act, 1872",
            "section": "Section 27",
            "reason": "Restraint of trade clauses are generally void in India"
        })

    # 2. Unilateral Termination (Section 23)
    if "terminate at any time" in text and "without notice" in text:
        flags.append({
            "clause_id": clause["clause_id"],
            "title": clause["title"],
            "risk_level": "Medium",
            "law": "Indian Contract Act, 1872",
            "section": "Section 23",
            "reason": "Unfair or unconscionable contract terms may be unlawful"
        })

    # 3. Unlimited Indemnity (Section 124–125)
    if "indemnify" in text and "all losses" in text:
        flags.append({
            "clause_id": clause["clause_id"],
            "title": clause["title"],
            "risk_level": "Medium",
            "law": "Indian Contract Act, 1872",
            "section": "Section 124–125",
            "reason": "Broad indemnity obligations may expose disproportionate liability"
        })

    # 4. IP Assignment (Copyright Act reference)
    if "intellectual property" in text and "all rights" in text:
        flags.append({
            "clause_id": clause["clause_id"],
            "title": clause["title"],
            "risk_level": "High",
            "law": "Copyright Act, 1957",
            "section": "Section 19",
            "reason": "Assignment of all present and future IP may be excessive"
        })

    return flags
