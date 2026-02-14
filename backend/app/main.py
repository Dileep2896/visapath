# Patch sqlite3 for Azure App Service (ChromaDB requires >= 3.35.0)
try:
    import pysqlite3
    import sys
    sys.modules["sqlite3"] = pysqlite3
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import os
from pathlib import Path

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
    import threading
    def _ingest():
        try:
            from app.services.rag_service import ingest_documents
            ingest_documents()
        except Exception:
            pass
    threading.Thread(target=_ingest, daemon=True).start()


@app.get("/health")
def health():
    return {"status": "ok"}


# --- Serve frontend static files (only if built frontend exists) ---
_static_dir = Path(__file__).resolve().parent.parent / "static"

if _static_dir.is_dir():
    # Mount /assets so JS/CSS/images load correctly
    app.mount("/assets", StaticFiles(directory=_static_dir / "assets"), name="assets")

    @app.get("/{path:path}")
    def serve_spa(path: str):
        """Serve static files or fall back to index.html for SPA routing."""
        file_path = _static_dir / path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_static_dir / "index.html")
