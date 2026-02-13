"""Document requirements API route."""

from fastapi import APIRouter

router = APIRouter()

DOCUMENT_REQUIREMENTS = {
    "opt_application": {
        "step": "OPT Application",
        "documents": [
            {
                "name": "Form I-765",
                "description": "Application for Employment Authorization",
                "where_to_get": "USCIS website (file online or by mail)",
            },
            {
                "name": "Updated I-20",
                "description": "With OPT recommendation from your DSO on page 2",
                "where_to_get": "Your university DSO office",
            },
            {
                "name": "Passport Photos",
                "description": "2 passport-style photos (2x2 inches, white background)",
                "where_to_get": "CVS, Walgreens, or online passport photo service",
            },
            {
                "name": "I-94 Record",
                "description": "Most recent arrival/departure record",
                "where_to_get": "i94.cbp.dhs.gov",
            },
            {
                "name": "Passport Copy",
                "description": "Photo page and US visa stamp page",
                "where_to_get": "Your passport",
            },
            {
                "name": "Previous EAD Cards",
                "description": "Copies of any previous Employment Authorization Documents",
                "where_to_get": "Your records",
            },
            {
                "name": "All Previous I-20s",
                "description": "Copies of all I-20 forms from current and previous programs",
                "where_to_get": "Your records",
            },
            {
                "name": "Filing Fee",
                "description": "I-765 filing fee ($410 as of 2024, check current amount)",
                "where_to_get": "USCIS fee schedule page",
            },
        ],
    },
    "stem_opt_extension": {
        "step": "STEM OPT Extension",
        "documents": [
            {
                "name": "Form I-765",
                "description": "Application for Employment Authorization (STEM extension)",
                "where_to_get": "USCIS website",
            },
            {
                "name": "Form I-983",
                "description": "Training Plan for STEM OPT Students — completed with employer",
                "where_to_get": "ICE.gov (Study in the States)",
            },
            {
                "name": "Updated I-20",
                "description": "With STEM OPT extension recommendation from DSO",
                "where_to_get": "Your university DSO office",
            },
            {
                "name": "Degree Certificate/Transcript",
                "description": "Proof of STEM degree completion",
                "where_to_get": "Your university registrar",
            },
            {
                "name": "Current EAD Card",
                "description": "Copy of your current OPT EAD",
                "where_to_get": "Your records",
            },
            {
                "name": "Passport Photos",
                "description": "2 passport-style photos (2x2 inches)",
                "where_to_get": "CVS, Walgreens, or online service",
            },
            {
                "name": "E-Verify Confirmation",
                "description": "Proof that employer is enrolled in E-Verify",
                "where_to_get": "Your employer's HR department",
            },
        ],
    },
    "h1b_petition": {
        "step": "H-1B Petition",
        "documents": [
            {
                "name": "Labor Condition Application (LCA)",
                "description": "Filed by employer with DOL before H-1B petition",
                "where_to_get": "Employer/attorney handles this",
            },
            {
                "name": "Form I-129",
                "description": "Petition for Nonimmigrant Worker",
                "where_to_get": "Filed by employer/attorney",
            },
            {
                "name": "Degree Certificate",
                "description": "Bachelor's or higher degree relevant to the position",
                "where_to_get": "Your university",
            },
            {
                "name": "Transcripts",
                "description": "Official transcripts from your degree program",
                "where_to_get": "Your university registrar",
            },
            {
                "name": "Resume/CV",
                "description": "Updated resume showing qualifications for the position",
                "where_to_get": "You prepare this",
            },
            {
                "name": "Passport Copy",
                "description": "Valid passport with at least 6 months validity",
                "where_to_get": "Your passport / consulate for renewal",
            },
            {
                "name": "Previous Approval Notices",
                "description": "Any previous I-797 approval notices",
                "where_to_get": "Your records",
            },
            {
                "name": "Credential Evaluation",
                "description": "If degree is from outside the US, need credential evaluation",
                "where_to_get": "WES, ECE, or other NACES member",
            },
        ],
    },
    "green_card_perm": {
        "step": "Green Card — PERM Labor Certification",
        "documents": [
            {
                "name": "ETA Form 9089",
                "description": "PERM labor certification application",
                "where_to_get": "Employer/attorney handles filing",
            },
            {
                "name": "Resume/CV",
                "description": "Detailed resume matching the job requirements",
                "where_to_get": "You prepare this",
            },
            {
                "name": "Experience Letters",
                "description": "Letters from previous employers verifying job duties and dates",
                "where_to_get": "Previous employers' HR departments",
            },
            {
                "name": "Degree Certificates",
                "description": "All degree certificates and transcripts",
                "where_to_get": "Your universities",
            },
            {
                "name": "Credential Evaluation",
                "description": "Foreign degree evaluation if applicable",
                "where_to_get": "WES, ECE, or other NACES member",
            },
        ],
    },
}

ALL_STEPS = list(DOCUMENT_REQUIREMENTS.keys())


@router.get("/required-documents")
async def get_required_documents(step: str | None = None):
    if step and step in DOCUMENT_REQUIREMENTS:
        return DOCUMENT_REQUIREMENTS[step]

    return {
        "available_steps": ALL_STEPS,
        "documents": DOCUMENT_REQUIREMENTS,
    }
