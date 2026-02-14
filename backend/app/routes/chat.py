"""AI Chat API route."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import chat_with_context
from app.services.rag_service import retrieve_context
from app.ai_rate_limit import check_ai_rate_limit, record_ai_request, mark_exhausted, AIRateLimitExceeded

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    user_context: dict | None = None


@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        check_ai_rate_limit()
    except AIRateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))

    # Retrieve relevant documents via RAG
    rag_context = await retrieve_context(request.message)

    # Get response from Gemini
    try:
        response = await chat_with_context(
            message=request.message,
            user_context=request.user_context,
            rag_context=rag_context if rag_context else None,
        )
        record_ai_request()
    except Exception as e:
        detail = str(e)
        if "rate limit" in detail.lower() or "429" in detail:
            mark_exhausted()
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached (20 requests/day on free tier). Please wait and try again.",
            )
        raise HTTPException(status_code=502, detail="Failed to get AI response. Please try again.")

    return {
        "response": response,
        "has_sources": bool(rag_context),
    }
