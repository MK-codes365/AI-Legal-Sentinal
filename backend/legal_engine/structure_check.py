import re
from typing import Dict, List, Tuple

# This module analyses if the contract has the standard 20 clauses.

STANDARD_CLAUSES = {
    "parties": {
        "title": "Parties",
        "keywords": ["entered into by", "between", "parties", "hereinafter referred to as", "client and"],
        "required": True,
        "weight": 5,
        "eli5": "This clause says who is playing the game. Like writing names on a team project. 👥"
    },
    "definitions": {
        "title": "Definitions",
        "keywords": ["definitions", "defined terms", "interpretation", "meanings"],
        "required": False,
        "weight": 2,
        "eli5": "This part explains what special words mean in the contract so nobody gets confused."
    },
    "scope_of_work": {
        "title": "Scope of Work",
        "keywords": ["scope of services", "services", "duties", "responsibilities", "deliverables", "scope of work"],
        "required": True,
        "weight": 10,
        "eli5": "This clause says what each founder must do. Like dividing homework in a group project. 🎯"
    },
    "equity": {
        "title": "Equity / Ownership",
        "keywords": ["equity", "ownership", "shares", "stock", "capitalization", "shareholding"],
        "required": False,
        "weight": 8,
        "eli5": "This clause says who owns how much of the startup. Like splitting a pizza among friends 🍕"
    },
    "vesting": {
        "title": "Vesting Clause",
        "keywords": ["vesting", "cliff", "unvested", "vested shares", "reverse vesting"],
        "required": False,
        "weight": 8,
        "eli5": "You don't get all your pizza at once. You earn it slowly if you stay and work. 💰"
    },
    "payment": {
        "title": "Payment / Salary",
        "keywords": ["payment", "fees", "compensation", "invoicing", "remuneration", "consideration", "salary"],
        "required": True,
        "weight": 10,
        "eli5": "This clause says how founders or employees get paid. Like deciding who gets allowance. 💸"
    },
    "ip": {
        "title": "Intellectual Property (IP)",
        "keywords": ["intellectual property", "ownership", "copyright", "assignment of rights", "work made for hire", "ip rights"],
        "required": True,
        "weight": 10,
        "eli5": "This clause says who owns the code, logo, and idea. Usually: The startup company owns everything. 🧠"
    },
    "confidentiality": {
        "title": "Confidentiality (NDA)",
        "keywords": ["confidentiality", "confidential information", "non-disclosure", "secrets", "proprietary information"],
        "required": True,
        "weight": 8,
        "eli5": "“Don’t tell our secret idea to others.” Like keeping a secret diary. 🕵️"
    },
    "warranties": {
        "title": "Representations & Warranties",
        "keywords": ["representations", "warranties", "covenants", "authority to sign", "represents and warrants"],
        "required": False,
        "weight": 5,
        "eli5": "This is a promise that what you're saying is true and you have the right to sign."
    },
    "indemnity": {
        "title": "Indemnity",
        "keywords": ["indemnify", "indemnification", "hold harmless", "liability for claims"],
        "required": True,
        "weight": 8,
        "eli5": "If someone gets in trouble because of you, you'll help pay for it."
    },
    "liability": {
        "title": "Limitation of Liability",
        "keywords": ["limitation of liability", "limit of liability", "maximum liability", "consequential damages", "indirect damages"],
        "required": True,
        "weight": 8,
        "eli5": "This sets a limit on how much money someone has to pay if something goes wrong."
    },
    "non_compete": {
        "title": "Non-Compete / Non-Solicit",
        "keywords": ["non-compete", "non-solicitation", "restraint of trade", "exclusivity", "non-poaching"],
        "required": False,
        "weight": 5,
        "eli5": "This says you can't go work for a rival or steal the team members."
    },
    "termination": {
        "title": "Termination Clause",
        "keywords": ["termination", "term", "duration", "expiry", "notice period"],
        "required": True,
        "weight": 10,
        "eli5": "This clause says how someone can leave or be kicked out. Like rules for leaving a team game. ❌"
    },
    "exit": {
        "title": "Exit / Buyout Clause",
        "keywords": ["buyout", "exit strategy", "tag-along", "drag-along", "right of first refusal", "rofr"],
        "required": False,
        "weight": 5,
        "eli5": "This clause says how a founder can sell shares and leave. Like selling your part of a game club. 🔄"
    },
    "governing_law": {
        "title": "Governing Law Clause",
        "keywords": ["governing law", "jurisdiction", "applicable law", "laws of"],
        "required": True,
        "weight": 5,
        "eli5": "This clause says which country’s rules to follow. Usually Laws of India. 🌍"
    },
    "dispute_resolution": {
        "title": "Dispute Resolution Clause",
        "keywords": ["dispute resolution", "arbitration", "mediation", "courts"],
        "required": True,
        "weight": 5,
        "eli5": "This clause says how to fight nicely. Talk first, teacher solves student fights. ⚖️"
    },
    "force_majeure": {
        "title": "Force Majeure Clause",
        "keywords": ["force majeure", "act of god", "unforeseen events", "pandemic", "natural disaster"],
        "required": False,
        "weight": 3,
        "eli5": "If something very bad (flood, war) happens, nobody is punished. No homework during holiday! 🌪️"
    },
    "assignment": {
        "title": "Assignment",
        "keywords": ["assignment", "transfer", "assignable", "successors and assigns"],
        "required": False,
        "weight": 2,
        "eli5": "This says if you can give your job or contract to someone else."
    },
    "severability": {
        "title": "Severability",
        "keywords": ["severability", "invalidity", "unenforceability"],
        "required": False,
        "weight": 2,
        "eli5": "If one rule is broken or illegal, the other rules still work."
    },
    "entire_agreement": {
        "title": "Entire Agreement",
        "keywords": ["entire agreement", "whole agreement", "supersedes", "prior agreements"],
        "required": False,
        "weight": 2,
        "eli5": "This is the only set of rules. Any old promises don't count anymore."
    },
    "amendment": {
        "title": "Amendments",
        "keywords": ["amendment", "modification", "waiver", "changes in writing"],
        "required": False,
        "weight": 2,
        "eli5": "This says you can only change the rules if everyone agrees in writing."
    },
     "signatures": {
        "title": "Signatures Clause",
        "keywords": ["signature", "signed by", "witness", "date:"],
        "required": True,
        "weight": 5,
        "eli5": "Everyone signs to say: 'Yes, I agree to all rules.' Like signing your report card. ✍️"
    }
}

def analyze_structure(full_text: str) -> Dict:
    """
    Scans the document for the presence of standard contract clauses.
    Returns:
      - missing_clauses: List of objects {title, eli5} that are missing.
      - present_clauses: List of objects {title, eli5} found.
      - completeness_score: 0-100 score based on weighted presence.
    """
    text_lower = full_text.lower()
    
    present = []
    missing = []
    total_weight = 0
    earned_score = 0
    
    for key, data in STANDARD_CLAUSES.items():
        total_weight += data["weight"]
        
        found = False
        
        # 1. Strong check: Header-like match
        if re.search(rf"{data['title']}\s*[:\n]", full_text, re.IGNORECASE):
            found = True
        else:
            # 2. Weak check: Keywords in text
            for kw in data["keywords"]:
                if kw in text_lower:
                    found = True
                    break
        
        clause_info = {
            "title": data["title"],
            "eli5": data.get("eli5", "Standard legal clause.")
        }
        
        if found:
            present.append(clause_info)
            earned_score += data["weight"]
        else:
            if data["required"]:
                missing.append(clause_info)
            else:
                # Still add to missing for checklist purposes even if not "required" for score penalty
                # Wait, the frontend might expect only 'bad' things in missing.
                # Let's keep the logic. If it's not required, we don't 'miss' it in the strict sense.
                # But for a startup, seeing what we *didn't* find is helpful.
                # Actually, I'll put everything not found in 'missing_clauses' for the UI checklist.
                missing.append(clause_info)
    
    # Normalize score to 100
    normalized_score = int((earned_score / total_weight) * 100) if total_weight > 0 else 0
    
    return {
        "completeness_score": normalized_score,
        "present_clauses": present,
        "missing_clauses": missing
    }
