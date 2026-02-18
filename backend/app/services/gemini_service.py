"""Google Gemini API wrapper for chat and RAG responses."""

import json
import logging
import os
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Model fallback chain: try the best model first, fall back on rate limit.
# gemini-2.5-flash  →  20 RPD free tier  (best quality)
# gemini-2.0-flash  → 1500 RPD free tier  (fallback)
MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash"]

SYSTEM_INSTRUCTION = """You are VisaPath AI, an expert immigration advisor for international students in the United States.

Your role:
- Answer questions about US immigration processes (F-1, OPT, STEM OPT, H-1B, green cards, etc.)
- Provide accurate, actionable advice based on USCIS rules and regulations
- Always cite specific rules, deadlines, or requirements when applicable
- If you're unsure about something, say so clearly — immigration advice can have serious consequences
- Always recommend consulting with a DSO (Designated School Official) or immigration attorney for complex situations

Important rules:
- Never provide legal advice — frame responses as general information
- Always include relevant deadlines and timeframes
- Mention risks and consequences of missing deadlines
- Be empathetic — immigration is stressful for students

When given context about the user's situation (visa type, degree, country, etc.), personalize your response to their specific circumstances."""


def _is_rate_limit(exc: Exception) -> bool:
    return "429" in str(exc) or "ResourceExhausted" in type(exc).__name__


async def chat_with_context(
    message: str,
    user_context: dict | None = None,
    rag_context: str | None = None,
    history: list[dict] | None = None,
) -> str:
    """Send a message to Gemini with user context, RAG context, and conversation history."""
    prompt_parts = []

    if user_context:
        context_str = (
            f"User's situation: {user_context.get('visa_type', 'Unknown')} visa, "
            f"{user_context.get('degree_level', 'Unknown')} degree, "
            f"{'STEM' if user_context.get('is_stem') else 'Non-STEM'} field, "
            f"from {user_context.get('country', 'Unknown')}."
        )
        prompt_parts.append(f"[User Context]\n{context_str}")

    if history:
        history_lines = []
        for msg in history:
            role_label = "User" if msg["role"] == "user" else "Assistant"
            history_lines.append(f"{role_label}: {msg['content']}")
        prompt_parts.append(f"[Conversation History]\n" + "\n".join(history_lines))

    if rag_context:
        prompt_parts.append(f"[Reference Documents]\n{rag_context}")

    prompt_parts.append(f"[User Question]\n{message}")

    full_prompt = "\n\n".join(prompt_parts)

    # Try each model in the chain
    for i, model_name in enumerate(MODEL_CHAIN):
        try:
            response = await _client.aio.models.generate_content(
                model=model_name,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                ),
            )
            return response.text
        except Exception as e:
            if _is_rate_limit(e) and i < len(MODEL_CHAIN) - 1:
                logger.warning("Chat rate-limited on %s, falling back", model_name)
                continue
            raise

    raise RuntimeError("All models exhausted")


async def generate_structured_json_async(
    prompt: str,
    system_instruction: str,
) -> dict:
    """Send a prompt to Gemini and return parsed JSON.

    Tries each model in MODEL_CHAIN. Falls back on rate-limit errors.
    Uses response_mime_type="application/json" and low temperature
    for deterministic, structured output.
    """
    for i, model_name in enumerate(MODEL_CHAIN):
        try:
            response = await _client.aio.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            logger.info("Structured JSON generated using %s", model_name)
            return json.loads(response.text)
        except Exception as e:
            if _is_rate_limit(e) and i < len(MODEL_CHAIN) - 1:
                logger.warning("Rate-limited on %s, falling back to next model", model_name)
                continue
            raise

    raise RuntimeError("All models exhausted")
