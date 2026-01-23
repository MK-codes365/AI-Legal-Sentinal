import re
from typing import Dict

def extract_key_info(text: str) -> Dict:
    info = {}

    fee_match = re.search(r"(₹|\$|INR)\s?\d+[,\d]*", text)
    duration_match = re.search(r"(\d+\s+(months?|years?))", text, re.IGNORECASE)
    notice_match = re.search(r"(\d+\s+days?\s+notice)", text, re.IGNORECASE)
    law_match = re.search(r"governed by the laws of ([A-Za-z ]+)", text, re.IGNORECASE)

    info["fees"] = fee_match.group() if fee_match else "Not found"
    info["duration"] = duration_match.group() if duration_match else "Not found"
    info["termination_notice"] = notice_match.group() if notice_match else "Not found"
    info["governing_law"] = law_match.group(1) if law_match else "Not specified"

    # IP ownership heuristic
    if "intellectual property" in text.lower():
        if "client" in text.lower():
            info["ip_ownership"] = "Client"
        elif "contractor" in text.lower():
            info["ip_ownership"] = "Freelancer"
        else:
            info["ip_ownership"] = "Mentioned (unclear)"
    else:
        info["ip_ownership"] = "Not mentioned"

    return info
