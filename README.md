# VisaPath

### AI Immigration Timeline Planner | Nexora Hacks 2026

An AI powered web app that helps international students in the US track every visa deadline, risk, and milestone in one personalized timeline.

**Live Demo:** [visapath-app.azurewebsites.net](https://visapath-app.azurewebsites.net)
**Demo Video:** _[YouTube link coming soon]_

## Screenshots

| Login | Timeline Dashboard |
|---|---|
| ![Login](screenshots/login.png) | ![Timeline](screenshots/timeline.png) |

| Risk Alerts | Action Items |
|---|---|
| ![Risk Alerts](screenshots/risk-alerts.png) | ![Action Items](screenshots/action-items.png) |

| AI Chat | Document Tracker |
|---|---|
| ![AI Chat](screenshots/ai-chat.png) | ![Documents](screenshots/documents.png) |

| Tax Guide | Profile |
|---|---|
| ![Tax Guide](screenshots/tax-guide.png) | ![Profile](screenshots/profile.png) |

## Problem

There are over 1 million international students in the US right now, and every single one of them deals with a confusing mess of visa deadlines, work authorization windows, and immigration paperwork. The information they need is spread across USCIS.gov, Reddit, university DSO offices, and $300/hr immigration lawyers.

Miss one deadline and you could lose your legal status in the country.

There's no tool out there that gives a student a clear, personalized picture of their entire immigration path, from OPT application all the way to green card.

## What VisaPath Does

You fill out a short onboarding form with your visa type, program details, and career goals. VisaPath then builds you a complete immigration roadmap:

**Timeline Dashboard** - An interactive, color coded timeline showing every deadline and milestone specific to your situation. Events are grouped by month, urgency coded (critical/high/medium/low), and expandable with detailed action items.

**Risk Alerts** - The system flags things you might not think about: CPT overuse that kills your OPT eligibility, India/China green card backlogs (10-30+ year waits), H-1B lottery odds based on your wage level, approaching deadlines you haven't prepared for.

**AI Chat (RAG)** - Ask any immigration question and get answers grounded in actual USCIS documentation, not hallucinated responses. We embedded 8 immigration knowledge base documents into ChromaDB and retrieve the most relevant chunks for every query.

**Document Tracker** - Step by step checklists for OPT, STEM OPT, H-1B, and Green Card filings. Track which documents you've gathered, which ones you still need.

**Tax Guide** - AI generated tax filing guidance personalized to your visa type, country of origin, treaty benefits, and residency status.

**What-If Simulator** - Change one variable (like graduation date or STEM status) and instantly see how your entire timeline shifts.

## How It Works

1. Student fills out the onboarding form (visa type, degree, STEM status, graduation date, country, career goal)
2. The backend builds a detailed prompt with 56 hardcoded USCIS rules, current filing fees, H-1B lottery statistics, and country backlog data
3. Gemini 2.5 Flash generates a structured JSON timeline tailored to that student's exact situation
4. A separate risk analyzer flags potential issues (CPT overuse, backlog warnings, wage level lottery odds)
5. The frontend renders an interactive timeline with expandable cards, urgency colors, and month grouping
6. All results are cached so returning users see their timeline instantly

For the chat feature, 8 immigration documents are chunked and embedded into ChromaDB. When a user asks a question, we find the 4 most relevant chunks via cosine similarity and feed them alongside the user's visa context into Gemini for a grounded answer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| Backend | Python 3.13, FastAPI |
| Auth | JWT + bcrypt |
| Database | SQLite (dev) / PostgreSQL (prod) |
| AI | Google Gemini 2.5 Flash |
| Embeddings | gemini-embedding-001 (768 dim) |
| Vector DB | ChromaDB |
| RAG | LangChain |
| Hosting | Azure App Service (Azure for Students) |
| CI/CD | GitHub Actions |

## Architecture

Full architecture docs with Mermaid diagrams and API reference: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

```
React Frontend (SPA)
    |
    | REST API (JSON over HTTPS)
    v
FastAPI Backend
    |
    |-- Timeline Generator --> 56 USCIS Rules + Fees + Backlogs --> Gemini 2.5 Flash
    |-- Chat Service --------> ChromaDB RAG (21 chunks) ---------> Gemini 2.5 Flash
    |-- Tax Guide Service ---> RAG Context ---------------------> Gemini 2.5 Flash
    |-- Auth Service --------> SQLite / PostgreSQL
    |-- Risk Analyzer -------> Immigration Rules + Country Data
```

## Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Google Gemini API key (free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### Clone and configure

```bash
git clone https://github.com/dileep-kumar-sharma/visapath.git
cd visapath
cp .env.example .env
```

Edit `.env`:
```
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=sqlite:///./visapath.db
```

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/rag/ingest.py   # one time: embed docs into ChromaDB
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

API available at `http://localhost:8000` (Swagger docs at `/docs`).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. Vite proxies `/api` to the backend automatically.

### Production build

```bash
cd frontend
npm run build   # outputs to frontend/dist/
```

## Project Structure

```
visapath/
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py                      # FastAPI entry, CORS, routers
│       ├── database.py                  # SQLite/PostgreSQL, schema, CRUD
│       ├── dependencies.py              # JWT validation middleware
│       ├── ai_rate_limit.py             # Daily AI request tracker
│       ├── rate_limit.py                # Per-IP rate limiting
│       ├── routes/
│       │   ├── auth.py                  # Register, login, profile, caching
│       │   ├── timeline.py              # POST /api/generate-timeline
│       │   ├── chat.py                  # POST /api/chat
│       │   ├── tax_guide.py             # POST /api/tax-guide
│       │   └── documents.py             # GET /api/required-documents
│       ├── services/
│       │   ├── ai_timeline_generator.py # Gemini prompt + JSON parsing
│       │   ├── timeline_generator.py    # Rule based timeline calc
│       │   ├── risk_analyzer.py         # Risk detection + severity
│       │   ├── gemini_service.py        # Gemini API wrapper
│       │   ├── rag_service.py           # RAG embed/search/retrieve
│       │   └── auth_service.py          # Registration, login, JWT
│       ├── data/
│       │   ├── immigration_rules.py     # 56 USCIS rules + filing fees
│       │   ├── stem_cip_codes.py        # 60+ STEM CIP codes
│       │   └── country_backlogs.py      # Green card waits + H-1B stats
│       └── rag/
│           ├── ingest.py                # Embed docs into ChromaDB
│           ├── documents/               # 8 knowledge base text files
│           └── chroma_db/               # Vector store (generated)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                      # Route tree with auth guards
│       ├── index.css                    # Tailwind + custom dark theme
│       ├── contexts/AuthContext.tsx      # Global auth + data state
│       ├── utils/api.ts                 # API client
│       ├── types/index.ts               # TypeScript interfaces
│       ├── pages/                       # Route wrappers
│       └── components/                  # All UI components
│
├── docs/
│   ├── ARCHITECTURE.md                  # Full architecture + API docs
│   ├── PROJECT_BRIEF.md                 # One page project brief
│   └── SUBMISSION_CHECKLIST.md          # Submission requirements tracker
│
├── .env.example
└── .gitignore
```

## Deployment

Hosted on Azure using Azure for Students credits:

| Component | Service | Tier |
|-----------|---------|------|
| Backend + Frontend | Azure App Service | Free (F1) |
| Database | PostgreSQL on Azure | Basic |
| AI | Google Gemini API | Free tier |
| Vector DB | ChromaDB (embedded) | Runs inside backend |
| CI/CD | GitHub Actions | Auto deploy on push to main |

## Team

| Name | Role |
|------|------|
| Dileep Kumar Sharma | Full stack dev: backend, AI integration, frontend, deployment |

## AI Disclosure

**Runtime AI (in the product):**
- Google Gemini 2.5 Flash powers timeline generation, the chat Q&A, and tax guide generation
- Google gemini-embedding-001 creates the vector embeddings used for RAG retrieval

**Development AI (building the product):**
- Claude Code (Anthropic) was used as a coding assistant during the hackathon for code generation, debugging, and iteration

All immigration guidance in the app includes disclaimers that it's general information, not legal advice. Users are always told to consult their DSO or an immigration attorney for their specific situation.

## Future Roadmap

1. Push notifications for upcoming deadlines (email + browser)
2. Support for more visa types: J-1, L-1, O-1
3. Cap-exempt employer lookup and E-Verify verification database
4. Anonymous community Q&A forum for international students
5. React Native mobile app for on the go deadline tracking
6. Live USCIS processing time data integration
7. University DSO dashboard for advising students at scale

## License

Built for Nexora Hacks 2026. All rights reserved.
