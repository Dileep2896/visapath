"""Script to ingest immigration documents into ChromaDB."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))

from app.services.rag_service import ingest_documents

if __name__ == "__main__":
    print("Ingesting immigration documents into ChromaDB...")
    count = ingest_documents()
    print(f"Done! Ingested {count} text chunks.")
