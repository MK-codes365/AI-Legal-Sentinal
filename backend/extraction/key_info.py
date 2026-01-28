import re
from typing import Dict
from ai.local_llm import get_local_ai
import json

def extract_key_details(document_text: str) -> Dict:
    details = {}
    ai = get_local_ai()

    # 1. Regex Extraction (Fast for numbers/dates)
    price_pattern = re.search(r"(₹|\$|INR)\s?\d+[,\d]*", document_text)
    span_pattern = re.search(r"(\d+\s+(months?|years?))", document_text, re.IGNORECASE)
    notice_pattern = re.search(r"(\d+\s+days?\s+notice)", document_text, re.IGNORECASE)
    
    details["fees"] = price_pattern.group() if price_pattern else "Not detected"
    details["duration"] = span_pattern.group() if span_pattern else "Not detected"
    details["termination_notice"] = notice_pattern.group() if notice_pattern else "Not detected"

    # 2. AI Extraction for complex metadata (Parties, Type)
    header_text = document_text[:1500] 
    prompt = f"Analyze this contract header and return ONLY a JSON with fields: 'contract_type', 'parties' (list), 'governing_law'. Text: {header_text}"
    
    try:
        # We use a very low max_tokens for speed
        raw_ai = ai.generate(prompt, max_tokens=150)
        start = raw_ai.find('{')
        end = raw_ai.rfind('}') + 1
        if start != -1 and end != -1:
            ai_data = json.loads(raw_ai[start:end])
            details["contract_type"] = ai_data.get("contract_type", "Freelance Agreement")
            details["parties"] = ai_data.get("parties", ["N/A"])
            details["governing_law"] = ai_data.get("governing_law", "India")
        else:
            raise ValueError("No JSON found")
    except Exception as e:
        print(f"DEBUG: Metadata AI Fallback triggered: {e}")
        # 1. Fallback for Contract Type (First line)
        first_line = document_text.split('\n')[0].strip('# *')
        details["contract_type"] = first_line if len(first_line) < 60 else "Agreement"
        
        # 2. Fallback for Parties (Look for Client/Freelancer labels)
        client_match = re.search(r"Client:\s*([^\n\r,]+)", document_text, re.IGNORECASE)
        freelancer_match = re.search(r"Freelancer:\s*([^\n\r,]+)", document_text, re.IGNORECASE)
        
        parties = []
        if client_match: parties.append(client_match.group(1).strip())
        if freelancer_match: parties.append(freelancer_match.group(1).strip())
        
        details["parties"] = parties if parties else ["Parties Not Identified"]
        details["governing_law"] = "India"

    return details
