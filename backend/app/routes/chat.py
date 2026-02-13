"""AI Chat API route."""

from fastapi import APIRouter
from pydantic import BaseModel
from app.services.gemini_service import chat_with_context
from app.services.rag_service import retrieve_context

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_context: dict | None = None


@router.post("/chat")
async def chat(request: ChatRequest):
    # Retrieve relevant documents via RAG
    rag_context = await retrieve_context(request.message)

    # Get response from Gemini
    response = await chat_with_context(
        message=request.message,
        user_context=request.user_context,
        rag_context=rag_context if rag_context else None,
    )

    return {
        "response": response,
        "has_sources": bool(rag_context),
    }
