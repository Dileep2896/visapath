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
                "url": "https://www.uscis.gov/i-765",
                "tip": "You can file online with a USCIS account — it's faster than mailing. Your DSO can walk you through this.",
            },
            {
                "name": "Updated I-20",
                "description": "With OPT recommendation from your DSO on page 2",
                "where_to_get": "Your university DSO office",
                "tip": "Schedule an appointment with your DSO early — they need to update your SEVIS record and print a new I-20 with the OPT recommendation.",
            },
            {
                "name": "Passport Photos",
                "description": "2 passport-style photos (2x2 inches, white background)",
                "where_to_get": "CVS, Walgreens, or online passport photo service",
                "tip": "Most CVS/Walgreens locations do passport photos for ~$15. Online services like ePassportPhoto are cheaper.",
            },
            {
                "name": "I-94 Record",
                "description": "Most recent arrival/departure record",
                "where_to_get": "i94.cbp.dhs.gov",
                "url": "https://i94.cbp.dhs.gov/",
                "tip": "Print your most recent I-94 — it's free and takes 2 minutes. You'll need your passport info.",
            },
            {
                "name": "Passport Copy",
                "description": "Photo page and US visa stamp page",
                "where_to_get": "Your passport",
                "tip": "Make clear color copies of your photo page and the page with your most recent US visa stamp.",
            },
            {
                "name": "Previous EAD Cards",
                "description": "Copies of any previous Employment Authorization Documents",
                "where_to_get": "Your records",
                "tip": "If this is your first OPT, you can skip this. Otherwise, include copies of all previous EADs.",
            },
            {
                "name": "All Previous I-20s",
                "description": "Copies of all I-20 forms from current and previous programs",
                "where_to_get": "Your records",
                "tip": "Include every I-20 you've ever received, including from previous schools or programs.",
            },
            {
                "name": "Filing Fee",
                "description": "I-765 filing fee ($410 as of 2024, check current amount)",
                "where_to_get": "USCIS fee schedule page",
                "url": "https://www.uscis.gov/forms/filing-fees",
                "tip": "Check the current fee before filing — it changes. You can pay by check, money order, or credit card (online).",
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
                "url": "https://www.uscis.gov/i-765",
                "tip": "Select category (c)(3)(C) for STEM OPT extension. File up to 90 days before your current OPT expires.",
            },
            {
                "name": "Form I-983",
                "description": "Training Plan for STEM OPT Students — completed with employer",
                "where_to_get": "ICE.gov (Study in the States)",
                "url": "https://www.ice.gov/sevis/stemopt",
                "tip": "You and your employer fill this out together. Your supervisor needs to describe how the job relates to your STEM degree.",
            },
            {
                "name": "Updated I-20",
                "description": "With STEM OPT extension recommendation from DSO",
                "where_to_get": "Your university DSO office",
                "tip": "Bring your completed I-983 to your DSO. They'll update SEVIS and issue a new I-20 with the STEM extension.",
            },
            {
                "name": "Degree Certificate/Transcript",
                "description": "Proof of STEM degree completion",
                "where_to_get": "Your university registrar",
                "tip": "Your degree must be on the STEM Designated Degree Program List. Check with your DSO if unsure.",
            },
            {
                "name": "Current EAD Card",
                "description": "Copy of your current OPT EAD",
                "where_to_get": "Your records",
                "tip": "Make a clear copy of both sides of your current EAD card.",
            },
            {
                "name": "Passport Photos",
                "description": "2 passport-style photos (2x2 inches)",
                "where_to_get": "CVS, Walgreens, or online service",
                "tip": "Same requirements as OPT photos — 2x2 inches, white background, recent.",
            },
            {
                "name": "E-Verify Confirmation",
                "description": "Proof that employer is enrolled in E-Verify",
                "where_to_get": "Your employer's HR department",
                "url": "https://www.e-verify.gov/",
                "tip": "Your employer MUST be E-Verify enrolled for STEM OPT. Ask HR for the company's E-Verify number.",
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
                "url": "https://flag.dol.gov/",
                "tip": "Your employer or their attorney files this — you don't need to do anything. It certifies your wage and working conditions.",
            },
            {
                "name": "Form I-129",
                "description": "Petition for Nonimmigrant Worker",
                "where_to_get": "Filed by employer/attorney",
                "url": "https://www.uscis.gov/i-129",
                "tip": "This is filed by your employer, not you. But you'll need to provide supporting documents (degree, resume, etc.).",
            },
            {
                "name": "Degree Certificate",
                "description": "Bachelor's or higher degree relevant to the position",
                "where_to_get": "Your university",
                "tip": "The degree must be related to your job role. If your degree is from outside the US, you'll also need a credential evaluation.",
            },
            {
                "name": "Transcripts",
                "description": "Official transcripts from your degree program",
                "where_to_get": "Your university registrar",
                "tip": "Order official sealed transcripts. Some universities let you order online — check your registrar's website.",
            },
            {
                "name": "Resume/CV",
                "description": "Updated resume showing qualifications for the position",
                "where_to_get": "You prepare this",
                "tip": "Make sure your resume clearly shows how your education and experience relate to the H-1B job requirements.",
            },
            {
                "name": "Passport Copy",
                "description": "Valid passport with at least 6 months validity",
                "where_to_get": "Your passport / consulate for renewal",
                "tip": "If your passport expires within 6 months, renew it ASAP through your country's consulate.",
            },
            {
                "name": "Previous Approval Notices",
                "description": "Any previous I-797 approval notices",
                "where_to_get": "Your records",
                "tip": "Include any I-797 notices from previous visa approvals (OPT EAD, prior H-1B, etc.).",
            },
            {
                "name": "Credential Evaluation",
                "description": "If degree is from outside the US, need credential evaluation",
                "where_to_get": "WES, ECE, or other NACES member",
                "url": "https://www.wes.org/",
                "tip": "WES and ECE are the most popular. Processing takes 2-3 weeks, so start early.",
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
                "url": "https://flag.dol.gov/",
                "tip": "Your employer's attorney handles this entirely. The process includes recruitment steps that take 2-6 months before filing.",
            },
            {
                "name": "Resume/CV",
                "description": "Detailed resume matching the job requirements",
                "where_to_get": "You prepare this",
                "tip": "Your resume must exactly match the job requirements on the PERM application. Work closely with the attorney on this.",
            },
            {
                "name": "Experience Letters",
                "description": "Letters from previous employers verifying job duties and dates",
                "where_to_get": "Previous employers' HR departments",
                "tip": "Each letter should be on company letterhead, signed by a supervisor or HR, and list your title, dates, and duties.",
            },
            {
                "name": "Degree Certificates",
                "description": "All degree certificates and transcripts",
                "where_to_get": "Your universities",
                "tip": "Include certificates and transcripts for all degrees. Official copies are preferred.",
            },
            {
                "name": "Credential Evaluation",
                "description": "Foreign degree evaluation if applicable",
                "where_to_get": "WES, ECE, or other NACES member",
                "url": "https://www.wes.org/",
                "tip": "Only needed if your degree is from outside the US. A course-by-course evaluation is typically required for PERM.",
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
