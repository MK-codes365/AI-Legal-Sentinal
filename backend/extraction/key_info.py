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
    header_text = document_text[:1500] # Use only relevant header text
    
    prompt = f"""
    Analyze the contract header below and extract metadata in JSON format.
    
    ### EXAMPLES:
    Header: "This SOFTWARE SERVICES AGREEMENT is made between Google India and Vikram Singh."
    Output: {{"contract_type": "Software Services Agreement", "parties": ["Google India", "Vikram Singh"], "governing_law": "India"}}
    
    Header: "FOUNDER AGREEMENT. Parties: Amit Shah, Rohan Mehra. Governing Law: Delhi."
    Output: {{"contract_type": "Founder Agreement", "parties": ["Amit Shah", "Rohan Mehra"], "governing_law": "Delhi, India", "vesting_schedule": "Not specified"}}
    
    ### YOUR TASK:
    Header: "{header_text}"
    
    Return ONLY a valid JSON object. No intro, no markdown.
    """
    
    try:
        raw_ai_response = ai.generate(prompt, max_tokens=300)
        ai_data = ai.safe_parse_json(raw_ai_response)
        
        if ai_data:
            details["contract_type"] = ai_data.get("contract_type", "Agreement")
            details["parties"] = ai_data.get("parties", ["Not detected"])
            details["governing_law"] = ai_data.get("governing_law", "India")
            
            # Additional keys
            for key in ["vesting_schedule", "lock_in_period"]:
                if key in ai_data:
                    details[key] = ai_data[key]
        else:
            raise ValueError("No valid JSON found in AI response")
            
    except Exception as e:
        print(f"DEBUG: Metadata AI Fallback triggered: {str(e)}")
        # Fallback Logic
        lines = document_text.split('\n')
        title = lines[0].strip('# *')
        details["contract_type"] = title if len(title) < 50 else "Agreement"
        details["parties"] = ["Parties Not Identified"]
        details["governing_law"] = "India"
        details["vesting_schedule"] = "Search contract for 'vesting' terms"
        details["lock_in_period"] = "Not detected"

    return details
