import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict

# Comprehensive sections of the Indian Contract Act, 1872 and Copyright Act, 1957
LEGAL_KNOWLEDGE_BASE = [
    {
        "id": "ICA_S27",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 27",
        "text": "Agreement in restraint of trade void: Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void."
    },
    {
        "id": "ICA_S23",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 23",
        "text": "What consideration and objects are lawful: The consideration or object of an agreement is lawful, unless it is forbidden by law; or is of such a nature that, if permitted, it would defeat the provisions of any law; or is fraudulent; or involves or implies, injury to the person or property of another; or the Court regards it as immoral, or opposed to public policy."
    },
    {
        "id": "ICA_S74",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 74",
        "text": "Compensation for breach of contract where penalty stipulated for: When a contract has been broken, if a sum is named in the contract as the amount to be paid in case of such breach, or if the contract contains any other stipulation by way of penalty, the party complaining of the breach is entitled, whether or not actual damage or loss is proved to have been caused thereby, to receive from the party who has broken the contract reasonable compensation not exceeding the amount so named."
    },
    {
        "id": "CR_S19",
        "act": "The Copyright Act, 1957",
        "section": "Section 19",
        "text": "Mode of assignment: No assignment of the copyright in any work shall be valid unless it is in writing signed by the assignor or by his duly authorised agent. The assignment shall indicate the royalties and other consideration payable to the author."
    },
    {
        "id": "ICA_S28",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 28",
        "text": "Agreements in restraint of legal proceedings void: Every agreement, by which any party thereto is restricted absolutely from enforcing his rights under or in respect of any contract, by the usual legal proceedings in the ordinary tribunals, or which limits the time within which he may thus enforce his rights, is void to that extent."
    },
    {
        "id": "ICA_S14",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 14",
        "text": "Free consent defined: Consent is said to be free when it is not caused by— (1) coercion, (2) undue influence, (3) fraud, (4) misrepresentation, or (5) mistake."
    },
    {
        "id": "ICA_S16",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 16",
        "text": "Undue influence defined: A contract is said to be induced by 'undue influence' where the relations subsisting between the parties are such that one of the parties is in a position to dominate the will of the other and uses that position to obtain an unfair advantage over the other."
    },
    {
        "id": "ICA_S73",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 73",
        "text": "Compensation for loss or damage caused by breach of contract: When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach."
    },
    {
        "id": "ICA_S55",
        "act": "The Indian Contract Act, 1872",
        "section": "Section 55",
        "text": "Effect of failure to perform at a fixed time, in contract in which time is essential: When a party to a contract promises to do a certain thing at or before a specified time, and fails to do any such thing at or before the specified time, the contract, or so much of it as has not been performed, becomes voidable at the option of the promisee, if the intention of the parties was that time should be of the essence of the contract."
    },
    {
        "id": "CR_S18",
        "act": "The Copyright Act, 1957",
        "section": "Section 18",
        "text": "Assignment of copyright: The owner of the copyright in an existing work or the prospective owner of the copyright in a future work may assign to any person the copyright either wholly or partially and either generally or subject to limitations and either for the whole term of the copyright or any part thereof."
    }
]

class RAGEngine:
    def __init__(self):
        print("Initializing local embedding model for RAG...")
        # Small and efficient model for local use
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.knowledge_base = LEGAL_KNOWLEDGE_BASE
        
        # Pre-compute embeddings for the knowledge base
        texts = [f"{item['act']} {item['section']}: {item['text']}" for item in self.knowledge_base]
        self.embeddings = self.model.encode(texts)

    def find_relevant_context(self, query: str, top_k: int = 2) -> str:
        query_embedding = self.model.encode([query])
        
        # Calculate cosine similarity
        similarities = np.dot(self.embeddings, query_embedding.T).flatten()
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        relevant_texts = []
        for idx in top_indices:
            item = self.knowledge_base[idx]
            relevant_texts.append(f"Act: {item['act']}\nSection: {item['section']}\nProvision: {item['text']}")
        
        return "\n\n".join(relevant_texts)

# Singleton instance
rag_instance = None

def get_rag_engine():
    global rag_instance
    if rag_instance is None:
        rag_instance = RAGEngine()
    return rag_instance
