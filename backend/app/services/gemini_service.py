"""Google Gemini API wrapper for chat and RAG responses."""

import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

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

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=SYSTEM_INSTRUCTION,
)


async def chat_with_context(
    message: str,
    user_context: dict | None = None,
    rag_context: str | None = None,
) -> str:
    """Send a message to Gemini with user context and RAG context."""
    prompt_parts = []

    if user_context:
        context_str = (
            f"User's situation: {user_context.get('visa_type', 'Unknown')} visa, "
            f"{user_context.get('degree_level', 'Unknown')} degree, "
            f"{'STEM' if user_context.get('is_stem') else 'Non-STEM'} field, "
            f"from {user_context.get('country', 'Unknown')}."
        )
        prompt_parts.append(f"[User Context]\n{context_str}")

    if rag_context:
        prompt_parts.append(f"[Reference Documents]\n{rag_context}")

    prompt_parts.append(f"[User Question]\n{message}")

    full_prompt = "\n\n".join(prompt_parts)

    response = await model.generate_content_async(full_prompt)
    return response.text
