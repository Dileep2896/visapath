"""AI Chat API route."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.services.gemini_service import chat_with_context
from app.services.rag_service import retrieve_context
from app.ai_rate_limit import check_ai_rate_limit, record_ai_request, mark_exhausted, AIRateLimitExceeded
from app.dependencies import get_current_user
from app.database import save_chat_message, get_chat_history, clear_chat_history

router = APIRouter()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
    user_context: dict | None = None


@router.post("/chat")
async def chat(request: ChatRequest, user: dict = Depends(get_current_user)):
    try:
        check_ai_rate_limit()
    except AIRateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))

    user_id = user["id"]

    # Fetch last 10 messages for multi-turn context
    recent = get_chat_history(user_id, limit=10)
    history = [{"role": m["role"], "content": m["content"]} for m in recent]

    # Retrieve relevant documents via RAG
    rag_context = await retrieve_context(request.message)

    # Get response from Gemini
    try:
        response = await chat_with_context(
            message=request.message,
            user_context=request.user_context,
            rag_context=rag_context if rag_context else None,
            history=history if history else None,
        )
        record_ai_request()
    except Exception as e:
        detail = str(e)
        if "rate limit" in detail.lower() or "429" in detail:
            mark_exhausted()
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached. Please wait and try again.",
            )
        raise HTTPException(status_code=502, detail="Failed to get AI response. Please try again.")

    has_sources = bool(rag_context)

    # Persist both messages
    save_chat_message(user_id, "user", request.message, has_sources=False)
    save_chat_message(user_id, "assistant", response, has_sources=has_sources)

    return {
        "response": response,
        "has_sources": has_sources,
    }


@router.get("/chat/history")
async def chat_history(user: dict = Depends(get_current_user)):
    messages = get_chat_history(user["id"], limit=50)
    return {"messages": messages}


@router.delete("/chat/history")
async def chat_history_clear(user: dict = Depends(get_current_user)):
    clear_chat_history(user["id"])
    return {"ok": True}
