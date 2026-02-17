# VisaPath — AI Immigration Timeline Planner

> **Nexora Hacks 2026 Submission**

An AI-powered web app that gives international students in the US a personalized, interactive immigration roadmap — so they never miss a critical visa deadline again.

**Live Demo:** [visapath-app.azurewebsites.net](https://visapath-app.azurewebsites.net)
**Demo Video:** _[YouTube link — coming soon]_

---

## Problem

Over **1 million international students** in the US navigate a confusing maze of visa deadlines, employment authorization windows, and immigration milestones every year. Information is scattered across USCIS pages, Reddit threads, university DSO offices, and expensive immigration lawyers.

**A single missed deadline can end your legal status in the US.**

There is no single tool that gives students a clear, personalized view of their entire immigration journey — from OPT application to green card.

## Solution

VisaPath generates a **personalized, interactive immigration timeline** based on each student's specific situation. Students complete a brief onboarding form (visa type, program details, career goals) and receive:

- **AI-generated interactive timeline** with every critical deadline, color-coded by urgency
- **Risk alerts** flagging potential issues (CPT overuse, country backlogs, lottery odds)
- **Actionable to-do checklists** extracted from each timeline event
- **Document preparation tracker** with step-by-step checklists for OPT, STEM OPT, H-1B, and Green Card
- **AI-powered Q&A chat** grounded in official USCIS documentation via RAG (Retrieval-Augmented Generation)
- **Personalized tax filing guide** for international students
- **What-If Simulator** to explore alternative immigration scenarios (e.g., "what if I switch to a non-STEM program?")
- **Full authentication** with profile persistence and cached AI results

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Smart Timeline** | AI generates a chronological roadmap of every visa deadline and milestone, personalized to your exact situation |
| **Risk Engine** | Flags critical issues like CPT overuse (kills OPT eligibility), India/China green card backlogs, H-1B lottery odds by wage level |
| **RAG-Powered Chat** | Ask any immigration question — answers are grounded in 8 official USCIS knowledge base documents, not hallucinated |
| **Document Tracker** | Step-by-step document checklists for OPT, STEM OPT, H-1B, and Green Card filings |
| **Tax Guide** | AI-generated tax filing guidance based on visa type, country, treaty benefits, and residency status |
| **What-If Simulator** | Change one variable (graduation date, STEM status, country) and instantly see how your timeline shifts |
| **Stale-Proof Dates** | Timeline recalculates urgency and deadlines from your browser's local date on every visit — never shows stale data |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | UI components and state management |
| **Routing** | React Router v7 | URL-based navigation with auth/onboarding guards |
| **Build Tool** | Vite 7 | Fast dev server and production builds |
| **Styling** | Tailwind CSS v4 | Custom dark theme (navy/teal palette) |
| **Backend** | Python 3.13 + FastAPI | REST API server |
| **Auth** | JWT + bcrypt | Stateless authentication with hashed passwords |
| **Database** | SQLite (dev) / PostgreSQL (prod) | User accounts, profiles, cached AI results |
| **AI Model** | Google Gemini 2.5 Flash | Timeline generation, tax guide, contextual Q&A |
| **Embeddings** | gemini-embedding-001 | 768-dim vector embeddings for RAG |
| **Vector DB** | ChromaDB | Local vector storage and cosine similarity search |
| **RAG Framework** | LangChain | Document processing, text splitting, embedding orchestration |
| **Hosting** | Azure App Service + Static Web Apps | Backend API + frontend (Azure for Students) |
| **CI/CD** | GitHub Actions | Automated deployment on push to main |

---

## Architecture

> For detailed architecture diagrams, API documentation, and technical deep-dives, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  Onboarding → Timeline → Chat → Documents → Tax Guide   │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼────────────────────────────────┐
│                  FastAPI Backend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Timeline │  │   Chat   │  │ Tax Guide│  │  Auth  │  │
│  │Generator │  │ Service  │  │ Service  │  │Service │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │             │             │             │        │
│  ┌────▼─────┐  ┌────▼─────┐      │        ┌───▼────┐   │
│  │56 USCIS  │  │ ChromaDB │      │        │SQLite/ │   │
│  │  Rules   │  │ RAG (21  │      │        │Postgres│   │
│  │+ Fees +  │  │ chunks)  │      │        └────────┘   │
│  │ Backlogs │  └──────────┘      │                      │
│  └──────────┘                    │                      │
│       │             │            │                      │
│  ┌────▼─────────────▼────────────▼──────┐               │
│  │      Google Gemini 2.5 Flash API     │               │
│  │   + gemini-embedding-001 (vectors)   │               │
│  └──────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

**How Timeline Generation Works:**
1. Student fills onboarding form (visa type, degree, STEM status, graduation date, country, career goal)
2. Backend assembles a detailed prompt with 56 hardcoded USCIS rules, filing fees, H-1B lottery stats, and country backlogs
3. Gemini 2.5 Flash generates a structured JSON timeline tailored to the student's exact situation
4. Risk analyzer flags potential issues (CPT overuse, backlog warnings, lottery odds by wage level)
5. Frontend renders an interactive, color-coded timeline with expandable cards and action items

**How RAG Chat Works:**
1. 8 immigration knowledge base documents are split into 21 chunks and embedded into ChromaDB
2. User's question is embedded and matched against stored chunks via cosine similarity (top-k=4)
3. Retrieved context + user's visa profile + question are sent to Gemini for a grounded answer

---

## Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API key ([get one free](https://aistudio.google.com/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/dileep-kumar-sharma/visapath.git
cd visapath
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=sqlite:///./visapath.db
```

### 3. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Ingest RAG documents into ChromaDB (one-time)
python app/rag/ingest.py

# Start the backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. You can test it at `http://localhost:8000/docs` (Swagger UI).

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` requests to `http://localhost:8000`.

### 5. Production Build

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

---

## Deployment

Deployed on **Azure** using Azure for Students ($100 credits):

| Service | Azure Resource | Tier |
|---------|---------------|------|
| Backend API | Azure App Service (`visapath-app`) | Free (F1) |
| Frontend | Bundled with backend (static files) | — |
| Database | PostgreSQL on Azure | Basic |
| AI Model | Google Gemini API (external) | Free tier |
| Vector DB | ChromaDB (embedded in backend) | No separate service |
| CI/CD | GitHub Actions | Auto-deploy on push to `main` |

---

## Project Structure

```
visapath/
├── .env.example                # Environment variable template
├── README.md                   # This file
├── docs/                       # Hackathon submission documents
│   ├── ARCHITECTURE.md         # Detailed architecture & API docs
│   ├── PROJECT_BRIEF.md        # One-page project brief
│   └── SUBMISSION_CHECKLIST.md # Nexora Hacks submission checklist
│
├── backend/
│   ├── requirements.txt        # Python dependencies
│   └── app/
│       ├── main.py             # FastAPI entry point, CORS, router setup
│       ├── database.py         # Dual-mode DB (SQLite/PostgreSQL)
│       ├── dependencies.py     # JWT token validation
│       ├── ai_rate_limit.py    # Daily AI request tracker
│       ├── rate_limit.py       # Per-IP rate limiting
│       ├── routes/             # API endpoints
│       │   ├── auth.py         # Auth + profile + caching
│       │   ├── timeline.py     # POST /api/generate-timeline
│       │   ├── chat.py         # POST /api/chat
│       │   ├── tax_guide.py    # POST /api/tax-guide
│       │   └── documents.py    # GET /api/required-documents
│       ├── services/           # Business logic
│       │   ├── auth_service.py         # Registration, login, JWT
│       │   ├── ai_timeline_generator.py # AI timeline with Gemini
│       │   ├── timeline_generator.py   # Rule-based timeline engine
│       │   ├── risk_analyzer.py        # Risk detection & scoring
│       │   ├── gemini_service.py       # Gemini API wrapper
│       │   └── rag_service.py          # RAG pipeline
│       ├── data/               # Hardcoded immigration data
│       │   ├── immigration_rules.py    # 56 USCIS rules + filing fees
│       │   ├── stem_cip_codes.py       # 60+ STEM CIP codes
│       │   └── country_backlogs.py     # Green card wait times + H-1B stats
│       └── rag/                # RAG knowledge base
│           ├── ingest.py       # Document embedding script
│           ├── documents/      # 8 immigration knowledge base files
│           └── chroma_db/      # ChromaDB vector store (generated)
│
└── frontend/
    ├── package.json
    ├── vite.config.ts          # Vite + React + Tailwind + API proxy
    └── src/
        ├── main.tsx            # React root with BrowserRouter
        ├── App.tsx             # Route tree with auth guards
        ├── index.css           # Tailwind + custom dark theme
        ├── types/index.ts      # TypeScript interfaces
        ├── utils/api.ts        # API client
        ├── contexts/AuthContext.tsx  # Global auth + data state
        ├── pages/              # Route page wrappers
        └── components/         # UI components
            ├── OnboardingForm.tsx     # 4-step intake form
            ├── TimelineDashboard.tsx  # Interactive timeline
            ├── StatusBadge.tsx        # Visa status + countdown
            ├── RiskAlerts.tsx         # Risk alert cards
            ├── AIChatPanel.tsx        # RAG-powered chat
            ├── DocumentTracker.tsx    # Document checklist
            ├── TaxGuidePage.tsx       # Tax filing guide
            ├── WhatIfPanel.tsx        # What-If simulator
            └── ...
```

---

## Team

| Name | Role | Contributions |
|------|------|---------------|
| **Dileep Kumar Sharma** | Full-Stack Developer | Backend architecture, AI integration, frontend UI, deployment |

---

## AI Disclosure

This project uses AI in the following ways:

- **Google Gemini 2.5 Flash** — Powers timeline generation, chat Q&A, and tax guide generation at runtime
- **Google gemini-embedding-001** — Creates vector embeddings for the RAG knowledge base
- **Claude Code (Anthropic)** — Used as a development assistant during the hackathon for code generation, debugging, and iteration

All AI-generated immigration guidance includes disclaimers that it is general information, not legal advice, and users should consult a DSO or immigration attorney for their specific situation.

---

## Future Roadmap

- **Push notifications** for upcoming deadlines (email + browser)
- **Multi-visa support** — J-1, L-1, O-1 visa pathways
- **Employer database** — Cap-exempt employer lookup and E-Verify verification
- **Community features** — Anonymous Q&A forum for international students
- **Mobile app** — React Native version for on-the-go deadline tracking
- **USCIS processing time integration** — Live processing time data from USCIS API
- **DSO collaboration** — University DSO dashboard for advising students at scale

---

## License

Built for Nexora Hacks 2026. All rights reserved.
