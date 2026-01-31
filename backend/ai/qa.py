import numpy as np
from typing import List, Dict
from .local_llm import get_local_ai
from .rag_engine import get_rag_engine

def find_relevant_clauses(clauses: List[Dict], query_text: str) -> List[Dict]:
    """Finds the most relevant clauses using a combination of keyword and semantic search."""
    if not clauses: return []
    
    rag = get_rag_engine()
    model = rag.model
    
    # 1. Semantic Search (Primary)
    # We encode all clauses and the query to find meaning-based matches
    clause_texts = [f"{c.get('title', '')} {c.get('text', '')}" for c in clauses]
    
    try:
        clause_embeddings = model.encode(clause_texts)
        query_embedding = model.encode([query_text])
        
        # Calculate cosine similarity
        similarities = np.dot(clause_embeddings, query_embedding.T).flatten()
        
        # Get indices of top 3 matches
        top_k = min(3, len(clauses))
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        matches = []
        for idx in top_indices:
            # Only include if there's a decent semantic match (> 0.3 similarity)
            if similarities[idx] > 0.3:
                matches.append(clauses[idx])
        
        if matches:
            return matches
    except Exception as e:
        print(f"Semantic search failed, falling back to keywords: {e}")

    # 2. Fallback: Keyword/Substring matching
    normalized_query = query_text.lower()
    keyword_matches = []
    for item in clauses:
        if normalized_query in item["text"].lower() or normalized_query in item["title"].lower():
            keyword_matches.append(item)
    
    return keyword_matches[:3]

def answer_from_contract(clauses: List[Dict], question: str, mode: str = "Professional", context_summary: str = "") -> str:
    matches = find_relevant_clauses(clauses, question)

    # Use found clauses as context, but don't block the AI if none are found
    curated_context = ""
    if matches:
        curated_context = "Relevant Contract Excerpts:\n" + "\n\n".join(
            [f"Article {c['clause_id']} - {c['title']}:\n{c['text'][:1000]}" for c in matches]
        )

    ai = get_local_ai()

    # Determine personality instruction based on mode
    personality_map = {
        "Professional": "You are a senior legal consultant. Your tone is formal, objective, and precise.",
        "ELI5": "You are a friendly legal assistant explaining things to a child. Use simple analogies and NO legal jargon.",
        "Negotiator": "You are a savvy business negotiator. Your goal is to help the user identify leverage and find better terms."
    }
    personality_instruction = personality_map.get(mode, personality_map["Professional"])

    # Incorporate the holistic narrative if available for better 'big picture' perspective
    holistic_context = f"Global Analysis Summary: {context_summary}\n" if context_summary else ""

    prompt = f"""
    {personality_instruction} 
    You are Vidhi (Indian Legal Assistant).
    
    ### CONTEXT:
    {holistic_context}
    {curated_context if curated_context else "No specific matching clauses found in the uploaded contract for this query."}
    
    ### USER QUESTION: 
    "{question}"
    
     ### INSTRUCTIONS:
    1. Be EXTREMELY CONCISE. Get straight to the point.
    2. USE NO REPETITIVE STATEMENTS.
    3. NO CONVERSATIONAL "FILLERS" or "OUTROS". Do not say "How can I help you?", "Is there anything else?", or "Ready to proceed?". 
    4. Provide the legal explanation and STOP. 
    5. Be helpful, concise, and professional. Use bullet points only for lists.
    
    Response:
    """

    try:
        answer = ai.generate(prompt, max_tokens=600)
        return answer.strip() if answer else "I apologize, but I couldn't generate a response for that."
    except Exception as e:
        return f"Local Assistant failed: {str(e)}"

def answer_from_contract_stream(clauses: List[Dict], question: str, mode: str = "Professional", context_summary: str = ""):
    """Yields chunks of text for a streaming response."""
    matches = find_relevant_clauses(clauses, question)
    curated_context = ""
    if matches:
        curated_context = "Relevant Contract Excerpts:\n" + "\n\n".join(
            [f"Article {c['clause_id']} - {c['title']}:\n{c['text'][:1000]}" for c in matches]
        )

    ai = get_local_ai()
    
    personality_map = {
        "Professional": "You are a senior legal consultant. Your tone is formal and precise.",
        "ELI5": "You are a friendly legal assistant explaining things to a child. Use simple analogies.",
        "Negotiator": "You are a savvy business negotiator. Help the user identify leverage."
    }
    personality_instruction = personality_map.get(mode, personality_map["Professional"])
    holistic_context = f"Global Analysis Summary: {context_summary}\n" if context_summary else ""

    prompt = f"""
    {personality_instruction} 
    You are Vidhi (Indian Legal Assistant).
    
    ### CONTEXT:
    {holistic_context}
    {curated_context if curated_context else "No specific matching clauses found in the contract."}
    
    ### USER QUESTION: 
    "{question}"
    
    ### STRICT INSTRUCTIONS:
    1. Be EXTREMELY CONCISE. Get straight to the point.
    2. {f'Start with "Simply put..."' if mode == 'ELI5' else ''}
    3. {f'Include exactly one "Negotiation Tip" at the end.' if mode == 'Negotiator' else ''}
    4. NO REPETITIVE STATEMENTS.
    5. NO CONVERSATIONAL "FILLERS" (e.g., "How can I help you?", "Is there anything else?").
    6. Provide the legal explanation and STOP.
    
    Response:
    """
    
    return ai.generate_stream(prompt, max_tokens=350)
