"""RAG pipeline using LangChain + ChromaDB for immigration document retrieval."""

import logging
import os
import threading
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "rag", "chroma_db")
DOCS_DIR = os.path.join(os.path.dirname(__file__), "..", "rag", "documents")

_vectorstore = None
_vectorstore_lock = threading.Lock()


def get_embeddings():
    """Get Google Generative AI embeddings model."""
    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        google_api_key=os.getenv("GEMINI_API_KEY"),
    )


def get_vectorstore() -> Chroma:
    """Get or initialize the ChromaDB vector store (thread-safe)."""
    global _vectorstore
    if _vectorstore is None:
        with _vectorstore_lock:
            if _vectorstore is None:
                _vectorstore = Chroma(
                    persist_directory=CHROMA_DIR,
                    embedding_function=get_embeddings(),
                    collection_name="immigration_docs",
                )
    return _vectorstore


async def retrieve_context(query: str, k: int = 4) -> str:
    """Retrieve relevant document chunks for a query."""
    vectorstore = get_vectorstore()

    try:
        results = vectorstore.similarity_search(query, k=k)
        if not results:
            return ""
        context_parts = []
        for doc in results:
            source = doc.metadata.get("source", "Unknown")
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")
        return "\n\n---\n\n".join(context_parts)
    except Exception as e:
        logger.warning("RAG retrieval failed: %s", e)
        return ""


def ingest_documents():
    """Ingest all documents from the documents directory into ChromaDB.

    Uses a fresh collection to avoid the empty-window problem:
    builds into a temp collection then swaps atomically.
    """
    if not os.path.exists(DOCS_DIR):
        return 0

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    all_chunks = []
    all_metadatas = []

    for filename in os.listdir(DOCS_DIR):
        if not filename.endswith(".txt"):
            continue
        filepath = os.path.join(DOCS_DIR, filename)
        with open(filepath, "r") as f:
            text = f.read()

        chunks = text_splitter.split_text(text)
        for chunk in chunks:
            all_chunks.append(chunk)
            all_metadatas.append({"source": filename})

    if not all_chunks:
        return 0

    # Build into the main vectorstore, but add first then delete old docs
    # to avoid empty window
    vectorstore = get_vectorstore()
    existing = vectorstore.get()
    old_ids = existing['ids'] if existing and existing['ids'] else []

    # Add new documents
    vectorstore.add_texts(texts=all_chunks, metadatas=all_metadatas)

    # Delete old documents (now that new ones exist)
    if old_ids:
        vectorstore.delete(ids=old_ids)

    return len(all_chunks)
