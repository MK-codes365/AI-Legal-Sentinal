from .local_llm import get_local_ai
from .rag_engine import get_rag_engine
import json

def analyze_clause_locally(clause_text: str) -> dict:
    rag = get_rag_engine()
    ai = get_local_ai()
    
    legal_context = rag.find_relevant_context(clause_text)
    
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
    - redline_suggestion: A professional, fair, and legally-balanced alternative version of this clause that protects both parties while complying with the Indian Contract Act.
    
    Strictly avoid mentioning US law concepts like "at-will employment".
    """
    
    raw_response = ai.generate(prompt)
    ai_data = ai.safe_parse_json(raw_response)
    
    if ai_data:
        return ai_data
    
    return {
        "is_predatory": False, 
        "risk_level": "Low", 
        "law": "N/A", 
        "section": "N/A", 
        "explanation": "Local analysis inconclusive."
    }
