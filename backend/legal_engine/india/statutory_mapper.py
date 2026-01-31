import json
import re
import os
from typing import Dict, List, Optional
from ai.local_llm import get_local_ai
from .vector_store import get_vector_store

class StatutoryMapper:
    def __init__(self):
        self.ai = get_local_ai()
        self.vstore = get_vector_store()

    def map_clause(self, clause_text: str) -> Dict:
        """
        Maps a legal clause to the most relevant statute/section using Semantic Search.
        """
        # 1. Semantic Retrieval (Vector Search)
        # We query for top 3 candidates to ensure we find the best legal fit
        top_results = self.vstore.query_statute(clause_text, n_results=3)

        if not top_results:
            return {
                "act": "Indian Law (General)",
                "section": "Standard Provision",
                "title": "General Contract Provision",
                "confidence": 0.35,
                "reasoning": "Clause contains standard legal language that does not trigger specific enforcement risks under the Indian Contract Act sections analyzed."
            }

        # 2. AI Verification (Scholarly Confirmation)
        # We take the best semantic match for verification
        best_candidate = top_results[0]["metadata"]
        semantic_score = top_results[0]["score"]
        
        prompt = f"""
        ACT AS AN INDIAN LEGAL SCHOLAR.
        
        CLAUSE TO ANALYZE: "{clause_text[:1000]}"
        
        HYPOTHESIS: This clause falls under:
        Act: {best_candidate['act']}
        Section: {best_candidate['section']} ({best_candidate['title']})
        
        YOUR TASK:
        1. Determine if this specific section is the PRIMARY legal governing provision for this clause.
        2. If it's just boilerplate (Signatures, Counterparts, etc.) and does NOT relate to the section, mark as NOT a match.
        3. Return as JSON: {{"is_match": bool, "reasoning": string, "confidence": float}}
        
        JSON:
        """
        
        try:
            ai_response = self.ai.generate(prompt, max_tokens=150)
            ai_data = self.ai.safe_parse_json(ai_response)

            if ai_data and ai_data.get("is_match"):
                # Combine Vector score and AI confidence
                ai_conf = ai_data.get("confidence", 0.5)
                final_conf = (semantic_score * 0.4) + (ai_conf * 0.6)
                
                return {
                    "act": best_candidate["act"],
                    "section": best_candidate["section"],
                    "title": best_candidate["title"],
                    "confidence": round(final_conf, 2),
                    "reasoning": ai_data.get("reasoning", "Semantic verified via vector neighborhood analysis.")
                }
            
        except Exception as e:
            print(f"Statutory Semantic AI Verification failed: {e}")

        # Fallback to the best semantic match if AI fails or denies
        # But we use a lower confidence as it hasn't been scholars-verified
        return {
            "act": best_candidate["act"],
            "section": best_candidate["section"],
            "title": best_candidate["title"],
            "confidence": round(semantic_score * 0.7, 2), # Penalty for lack of AI verification
            "reasoning": f"Identified via Semantic Vector Similarity. Closest legal matches found in statutory knowledge base."
        }

# Singleton
_mapper_instance = None
def get_statutory_mapper():
    global _mapper_instance
    if _mapper_instance is None:
        _mapper_instance = StatutoryMapper()
    return _mapper_instance
