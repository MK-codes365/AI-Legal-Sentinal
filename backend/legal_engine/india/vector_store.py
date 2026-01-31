import chromadb
from chromadb.utils import embedding_functions
import os
from typing import List, Dict, Optional

class StatutoryVectorStore:
    def __init__(self, db_path: str = "d:/vidhi setu/backend/db/chroma_db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Initialize persistent client
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Use local sentence-transformers for embeddings
        # 'all-MiniLM-L6-v2' is fast and effective for short legal clauses
        self.emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.collection_name = "indian_statutes"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.emb_fn,
            metadata={"hnsw:space": "cosine"} # Use cosine similarity for legal semantic matching
        )

    def add_statutes(self, statutes: List[Dict]):
        """
        Adds multiple statutes to the vector store.
        Statute dict should have: 'section', 'title', 'description', 'act', 'keywords'
        """
        ids = []
        documents = []
        metadatas = []
        
        for item in statutes:
            # ID is the section name (e.g., "Section 27")
            ids.append(item["section"])
            
            # We index the description and title for semantic search
            doc_content = f"{item['title']}. {item['description']}. Keywords: {', '.join(item.get('keywords', []))}"
            documents.append(doc_content)
            
            # Store everything else as metadata
            metadatas.append({
                "act": item["act"],
                "section": item["section"],
                "title": item["title"],
                "description": item["description"]
            })
            
        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

    def query_statute(self, clause_text: str, n_results: int = 3) -> List[Dict]:
        """
        Queries the vector store for the most semantically similar statutes.
        """
        results = self.collection.query(
            query_texts=[clause_text],
            n_results=n_results
        )
        
        formatted_results = []
        if results["ids"] and len(results["ids"][0]) > 0:
            for i in range(len(results["ids"][0])):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "score": 1 - results["distances"][0][i] # Convert distance to similarity score
                })
                
        return formatted_results

# Singleton instance
_vector_store_instance = None

def get_vector_store():
    global _vector_store_instance
    if _vector_store_instance is None:
        _vector_store_instance = StatutoryVectorStore()
    return _vector_store_instance
