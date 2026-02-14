"""Tax guide API route."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.gemini_service import generate_structured_json_async
from app.services.rag_service import retrieve_context
from app.ai_rate_limit import check_ai_rate_limit, record_ai_request, mark_exhausted, AIRateLimitExceeded

router = APIRouter()


class TaxGuideRequest(BaseModel):
    visa_type: str
    country: str
    has_income: bool = True
    income_types: list[str] = []
    years_in_us: int = 1


TAX_SYSTEM_PROMPT = """\
You are a tax guidance assistant for international students in the United States.
You ONLY output valid JSON. Given a student's profile and reference tax documents,
produce personalized tax filing guidance. Do not provide legal or tax advice —
frame everything as general informational guidance. Use only the reference data provided."""


@router.post("/tax-guide")
async def tax_guide(request: TaxGuideRequest):
    try:
        check_ai_rate_limit()
    except AIRateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))

    # Build RAG query from user profile
    query = (
        f"Tax filing requirements for {request.visa_type} visa holder "
        f"from {request.country} with {request.years_in_us} years in US. "
        f"Income types: {', '.join(request.income_types) if request.income_types else 'none specified'}."
    )

    rag_context = await retrieve_context(query, k=6)

    # Determine residency and FICA status
    is_nonresident = request.years_in_us <= 5 if request.visa_type == "F-1" else request.years_in_us <= 2
    fica_exempt = is_nonresident

    prompt = f"""\
[STUDENT PROFILE]
- Visa type: {request.visa_type}
- Country of citizenship: {request.country}
- Years in US: {request.years_in_us}
- Has income: {request.has_income}
- Income types: {', '.join(request.income_types) if request.income_types else 'none'}
- Residency status: {"Nonresident Alien" if is_nonresident else "Resident Alien (Substantial Presence Test met)"}
- FICA exempt: {fica_exempt}

[REFERENCE DOCUMENTS]
{rag_context if rag_context else "No reference documents available."}

[TASK]
Based on the student profile and reference documents, produce a JSON object with this exact schema:
{{
  "filing_deadline": "April 15, 2026",
  "residency_status": "Nonresident Alien" or "Resident Alien",
  "required_forms": ["Form 8843", ...],
  "treaty_benefits": {{"country": "...", "benefit": "...", "form": "Form 8233"}} or null,
  "fica_exempt": true or false,
  "guidance": "<personalized guidance in MARKDOWN format. Use **bold** for key terms, ### headings for sections (e.g. ### Filing Requirements, ### Key Forms, ### Treaty Benefits, ### FICA Status, ### Recommended Tools). Use bullet lists for action items. Keep it 4-6 sections, concise and scannable.>",
  "disclaimer": "This is general guidance, not legal or tax advice. Consult a qualified tax professional for advice specific to your situation."
}}

Rules:
- Set treaty_benefits to null if the country does not have a known student tax treaty benefit with the US
- Include Form 8843 in required_forms for ALL nonresident aliens
- Include Form 1040-NR only if has_income is true and status is Nonresident Alien
- Include Form 1040 only if status is Resident Alien and has_income is true
- The guidance should be personalized and reference the student's specific country and visa type
- Mention Sprintax and Glacier Tax Prep as recommended filing tools for nonresidents

Return ONLY this JSON object — no markdown, no commentary."""

    try:
        result = await generate_structured_json_async(prompt, TAX_SYSTEM_PROMPT)
        record_ai_request()
    except Exception as e:
        detail = str(e)
        if "rate limit" in detail.lower() or "429" in detail:
            mark_exhausted()
            raise HTTPException(
                status_code=429,
                detail="AI rate limit reached (20 requests/day on free tier). Please wait and try again.",
            )
        raise HTTPException(status_code=502, detail="Failed to generate tax guide. Please try again.")

    # Ensure required fields exist with defaults
    result.setdefault("filing_deadline", "April 15, 2026")
    result.setdefault("residency_status", "Nonresident Alien" if is_nonresident else "Resident Alien")
    result.setdefault("required_forms", ["Form 8843"])
    result.setdefault("treaty_benefits", None)
    result.setdefault("fica_exempt", fica_exempt)
    result.setdefault("guidance", "")
    result.setdefault("disclaimer", "This is general guidance, not legal or tax advice. Consult a qualified tax professional for advice specific to your situation.")

    return result
