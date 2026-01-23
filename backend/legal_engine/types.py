from typing import TypedDict

class LegalFlag(TypedDict):
    clause_id: str
    title: str
    risk_level: str
    law: str
    section: str
    reason: str
