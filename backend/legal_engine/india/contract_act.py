import re
from typing import List
from ai.analyzer import analyze_clause_locally

def run_analysis(clause_data: dict) -> List[dict]:
    content = clause_data["text"]
    content_lower = content.lower()
    discovered_flags = []

    # 1. Deterministic Checks (Fast & Reliable for obvious cases)
    # Using regex for hyphens and variations
    if re.search(r"non-?compete|restraint of trade|shall not engage", content_lower):
        discovered_flags.append({
            "clause_id": clause_data["clause_id"],
            "title": clause_data["title"],
            "risk_level": "High",
            "law": "The Indian Contract Act, 1872",
            "section": "Section 27",
            "text": content,
            "reason": "Section 27 makes any restraint of trade clause void in India, with very few exceptions."
        })

    if "indemnify" in content_lower or "hold harmless" in content_lower:
        discovered_flags.append({
            "clause_id": clause_data["clause_id"],
            "title": clause_data["title"],
            "risk_level": "Medium",
            "law": "The Indian Contract Act, 1872",
            "section": "Section 124–125",
            "text": content,
            "reason": "Broad indemnity clauses can expose you to unlimited financial liability."
        })

    if "intellectual property" in content_lower or "ownership" in content_lower or "assignment" in content_lower:
        # Check if it mentions royalties (Copyright Act S.19)
        if "copyright" in content_lower and "royalty" not in content_lower:
            discovered_flags.append({
                "clause_id": clause_data["clause_id"],
                "title": clause_data["title"],
                "risk_level": "Medium",
                "law": "The Copyright Act, 1957",
                "section": "Section 19",
                "text": content,
                "reason": "Indian Copyright law requires specific mention of royalties for a valid assignment."
            })

    # 2. Local AI-Powered Deep Analysis (Selective)
    # Only run AI if not already flagged as High risk to save time/compute
    is_already_high = any(f["risk_level"] == "High" for f in discovered_flags)
    
    if not is_already_high:
        ai_analysis = analyze_clause_locally(content)
        if ai_analysis.get("is_predatory") or ai_analysis.get("risk_level") in ["High", "Medium"]:
            already_flaged = any(f["section"] == ai_analysis["section"] for f in discovered_flags)
            if not already_flaged:
                discovered_flags.append({
                    "clause_id": clause_data["clause_id"],
                    "title": clause_data["title"],
                    "risk_level": ai_analysis["risk_level"],
                    "law": ai_analysis["law"],
                    "section": ai_analysis["section"],
                    "text": content,
                    "reason": ai_analysis["explanation"]
                })
    
    return discovered_flags
