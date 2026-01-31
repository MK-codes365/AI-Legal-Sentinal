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

def answer_from_contract(clauses: List[Dict], question: str) -> str:
    matches = find_relevant_clauses(clauses, question)

    # Use found clauses as context, but don't block the AI if none are found
    curated_context = ""
    if matches:
        curated_context = "Relevant Contract Excerpts:\n" + "\n\n".join(
            [f"Article {c['clause_id']} - {c['title']}:\n{c['text'][:1000]}" for c in matches]
        )

    ai = get_local_ai()

    prompt = f"""
    You are Vidhi, a powerful and helpful Indian Legal Assistant. 
    You are currently chatting with a user who has uploaded a contract.
    
    Current Contract Context (if relevant to the question):
    {curated_context if curated_context else "No specific matching clauses found in the uploaded contract for this query."}
    
    User Question: {question}
    
    Instructions:
    1. If the question is about the contract, use the provided excerpts to answer accurately.
    2. If the question is general (legal or otherwise), answer it using your general knowledge, but keep it professional and safe.
    3. Always prioritize Indian legal context when answering legal questions.
    4. If referencing the contract, mention the specific Article or Section.
    5. Be helpful, concise, and professional. Use bullet points for lists.
    
    Response:
    """

    try:
        answer = ai.generate(prompt, max_tokens=600)
        return answer.strip() if answer else "I apologize, but I couldn't generate a response for that."
    except Exception as e:
        return f"Local Assistant failed: {str(e)}"
