import re
from typing import List, Dict

CLAUSE_PATTERN = re.compile(
    r"(?:\n|^)(\d+(?:\.\d+)*\s+[A-Z][^\n]+)"
)

def split_into_clauses(text: str) -> List[Dict]:
    clauses = []
    parts = CLAUSE_PATTERN.split(text)

    for i in range(1, len(parts), 2):
        title = parts[i].strip()
        body = parts[i + 1].strip() if i + 1 < len(parts) else ""

        clauses.append({
            "clause_id": title.split()[0],
            "title": title,
            "text": body
        })

    # fallback if no numbered clauses
    if not clauses:
        clauses.append({
            "clause_id": "1",
            "title": "Full Contract",
            "text": text
        })

    return clauses
