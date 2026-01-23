from openai import OpenAI
from typing import List, Dict

client = OpenAI()

# -------------------------
# Clause Search Utility
# -------------------------
def search_clauses(clauses: List[Dict], query: str) -> List[Dict]:
    """
    Searches relevant clauses based on keyword matching.
    This is deterministic and avoids hallucination.
    """
    query_lower = query.lower()
    matched_clauses = []

    for clause in clauses:
        if (
            query_lower in clause["text"].lower()
            or query_lower in clause["title"].lower()
        ):
            matched_clauses.append(clause)

    return matched_clauses


# -------------------------
# Contract Question Answering
# -------------------------
def answer_from_contract(clauses: List[Dict], question: str) -> str:
    """
    Answers user questions strictly using contract content.
    No external knowledge is allowed here.
    """

    # 1. Retrieve relevant clauses
    matched_clauses = search_clauses(clauses, question)

    # 2. If nothing relevant found
    if not matched_clauses:
        return (
            "I could not find any section in the contract that directly "
            "answers this question."
        )

    # 3. Build context from matched clauses (limit size)
    context = "\n\n".join(
        [
            f"Clause {c['clause_id']} ({c['title']}):\n{c['text'][:700]}"
            for c in matched_clauses
        ]
    )

    # 4. Ask LLM to answer ONLY from provided text
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a contract assistant. "
                    "Answer ONLY using the provided contract text. "
                    "If the answer is not present, say so clearly. "
                    "Do not use external knowledge."
                ),
            },
            {
                "role": "user",
                "content": f"""
Contract Text:
{context}

Question:
{question}
""",
            },
        ],
        temperature=0.2,
    )

    return response.choices[0].message.content.strip()
