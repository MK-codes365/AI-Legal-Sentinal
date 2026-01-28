from .local_llm import get_local_ai
from .rag_engine import get_rag_engine
import json

def analyze_clause_locally(clause_text: str) -> dict:
    rag = get_rag_engine()
    ai = get_local_ai()
    
    # 1. Retrieve relevant Indian legal context
    legal_context = rag.find_relevant_context(clause_text)
    
    # 2. Construct the prompt
    prompt = f"""
    You are an expert Indian Legal Assistant specializing in the Indian Contract Act, 1872.
    
    Task: Analyze the following contract clause for predatory or unfair terms under Indian Law.
    
    Legal Context (Grounding):
    {legal_context}
    
    Contract Clause:
    "{clause_text}"
    
    Analyze if this clause violates or is unfair according to the provided legal context.
    Return your response ONLY as a JSON object with the following fields:
    - is_predatory: boolean
    - risk_level: "High", "Medium", or "Low"
    - law: "The Indian Contract Act, 1872" or "The Copyright Act, 1957"
    - section: specific section (e.g. "Section 27")
    - explanation: A simple 2-sentence explanation for a layman.
    
    Strictly avoid mentioning US law concepts like "at-will employment".
    """
    
    raw_response = ai.generate(prompt)
    
    # Debug print to see what AI returned (optional/can be removed)
    print(f"AI Raw Response: {raw_response}")
    
    try:
        # 1. Clean up markdown code blocks if present
        content = raw_response.strip()
        if "```json" in content:
            content = content.split("```json")[-1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[-1].split("```")[0].strip()

        # 2. Find the first '{' and last '}'
        start_idx = content.find('{')
        end_idx = content.rfind('}') + 1
        
        if start_idx != -1 and end_idx != -1:
            clean_json = content[start_idx:end_idx]
            return json.loads(clean_json)
        
        # 3. Fallback if no JSON-like structure is found
        return {
            "is_predatory": False, 
            "risk_level": "Low", 
            "law": "N/A", 
            "section": "N/A", 
            "explanation": "No valid analysis structure found by local AI."
        }
    except Exception as e:
        print(f"Error parsing AI response: {e}")
        return {
            "is_predatory": False, 
            "risk_level": "Low", 
            "law": "N/A", 
            "section": "N/A", 
            "explanation": "Local analysis inconclusive."
        }
