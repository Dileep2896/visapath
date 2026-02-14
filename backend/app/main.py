from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

app = FastAPI(title="VisaPath API", version="1.0.0")

# CORS: read allowed origins from env, fall back to permissive for local dev
_cors_raw = os.environ.get("CORS_ORIGINS", "")
_cors_origins = [o.strip() for o in _cors_raw.split(",") if o.strip()] if _cors_raw else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routes import timeline, chat, documents, auth, tax_guide

app.include_router(timeline.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(tax_guide.router, prefix="/api")


@app.on_event("startup")
def startup():
    from app.database import init_db
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}
