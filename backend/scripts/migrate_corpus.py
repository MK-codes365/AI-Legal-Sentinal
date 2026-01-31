import json
import os
import sys

# Add backend directory to path so we can import our modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from legal_engine.india.vector_store import get_vector_store

def run_migration():
    corpus_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "legal_engine", "india", "statutory_corpus.json"))
    
    if not os.path.exists(corpus_path):
        print(f"❌ Corpus file not found at {corpus_path}")
        return

    print(f"📂 Reading statutory corpus from {corpus_path}...")
    with open(corpus_path, "r") as f:
        statutes = json.load(f)

    print(f"🧠 Initializing ChromaDB Vector Store...")
    vstore = get_vector_store()

    print(f"🚀 Migrating {len(statutes)} sections to Vector Store...")
    vstore.add_statutes(statutes)

    print("✅ Migration Complete! Your statutory brain is now semantic.")

if __name__ == "__main__":
    run_migration()
