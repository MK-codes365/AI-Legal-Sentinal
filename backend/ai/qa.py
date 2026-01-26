import os
from openai import OpenAI
from typing import List, Dict

def get_ai_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

def find_relevant_clauses(clauses: List[Dict], query_text: str) -> List[Dict]:
    normalized_query = query_text.lower()
    matches = []

    for item in clauses:
        if (
            normalized_query in item["text"].lower()
            or normalized_query in item["title"].lower()
        ):
            matches.append(item)

    return matches

def answer_from_contract(clauses: List[Dict], question: str) -> str:
    matches = find_relevant_clauses(clauses, question)

    if not matches:
        return "The document does not appear to contain an answer to this specific inquiry."

    curated_context = "\n\n".join(
        [
            f"Article {c['clause_id']} - {c['title']}:\n{c['text'][:700]}"
            for c in matches
        ]
    )

    ai_client = get_ai_client()

    if not ai_client:
        return "Legal QA is currently unavailable (API key not configured)."

    result = ai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional legal assistant. "
                    "Use the provided contract excerpts to answer the question concisely. "
                    "If the answer isn't in the text, clearly state that. "
                    "Do not synthesize information from outside the provided excerpts."
                ),
            },
            {
                "role": "user",
                "content": f"Document Snippets:\n{curated_context}\n\nSearch Query: {question}",
            },
        ],
        temperature=0.2,
    )

    return result.choices[0].message.content.strip()
