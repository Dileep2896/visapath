# VisaPath — Project Status & Notes

**Last Updated:** February 16, 2026
**Hackathon:** DevDash 2026 (Deadline: Feb 20)
**Live URL:** https://visapath-app.azurewebsites.net
**GitHub:** https://github.com/Dileep2896/visapath

---

## What's Done

### Core Features
- **AI Timeline Generation** — Gemini 2.5 Flash (fallback to 2.0 Flash) generates personalized immigration timelines from 15+ profile fields
- **RAG-Augmented Chat** — 8 knowledge-base docs embedded in ChromaDB, top-k=4 retrieval, sourced responses
- **Risk Analysis Engine** — CPT overuse, country backlog, OPT deadline, unemployment limits, H-1B uncertainty, cap-gap expiration
- **What-If Simulator** — Modify profile inputs and re-run timeline without consuming a credit
- **Tax Guide** — AI-generated tax filing guide with residency/FICA determination
- **Document Tracker** — Checklists for OPT, STEM OPT, H-1B, Green Card steps
- **Action Items** — Urgency-sorted checklist derived from timeline events

### Auth & Admin
- Email/password registration with bcrypt hashing + JWT auth
- Per-IP rate limiting on auth endpoints (10 req/min)
- Per-user AI credit system (default limit: 5, admin-overridable)
- Admin dashboard: user CRUD, credit management, limit overrides
- Demo account seeded: `demo@visapath.com` / `demo123`
- Admin account seeded via env vars

### Frontend
- React 19 + TypeScript + Vite + Tailwind CSS v4
- Dark theme with teal accents, smooth animations
- 4-step onboarding form with draft save/resume
- Vertical timeline with expandable cards, staggered animations, urgency color-coding
- Mobile-responsive layout with hamburger menu
- Skeleton loaders, toast notifications, empty states
- Admin skips onboarding — goes straight to admin dashboard

### Backend
- Python FastAPI with Gunicorn + Uvicorn (2 workers)
- Dual database: SQLite (dev) / PostgreSQL (prod via DATABASE_URL)
- Schema auto-migration on startup
- pysqlite3 patch for Azure's old SQLite (ChromaDB compat)
- Security headers: nosniff, DENY framing, HSTS, strict referrer

### Deployment
- Azure App Service (Free F1, East US, Python 3.11)
- Monolith: FastAPI serves built React SPA from `backend/static/`
- GitHub Actions CI/CD on push to `main`
- Environment vars configured in Azure App Settings

---

## What's NOT Done / Improvements

### High Priority (before submission)
- [ ] Record demo video (3 min — see plan in `VisaPath_Build_Plan.md`)
- [ ] Write Devpost submission text
- [ ] Final testing pass across all features
- [ ] Mobile responsiveness polish pass

### Known Issues
- [ ] Document tracker checkbox state is NOT persisted (client-side only, resets on refresh)
- [ ] Rate limiting is in-memory only — resets on server restart, not shared between Gunicorn workers
- [ ] Legacy `timeline_generator.py` (rule-based) still exists alongside `ai_timeline_generator.py` — can be deleted
- [ ] `eslint-disable` type escape in TaxGuidePage callback typing

### Missing Features (from build plan)
- [ ] Saved timeline history UI — backend endpoint (`GET /api/auth/my-timelines`) exists but no frontend page
- [ ] Calendar export — export deadlines to Google Calendar (.ics)
- [ ] Email/push reminders for upcoming deadlines
- [ ] PDF export of timeline and checklist
- [ ] Employer E-Verify lookup
- [ ] Community mode (anonymized stats)

### Partial Implementations
- [ ] H-4 EAD — selectable in form but no dedicated timeline logic
- [ ] L-1 visa — selectable but no specific rules/risk analysis
- [ ] J-1 academic training — selectable but minimal pathway coverage
- [ ] Tax treaty coverage — relies on Gemini knowledge, no hardcoded treaty database
- [ ] "Other" countries — only India, China, Rest of World have specific backlog data

### Nice-to-Have Improvements
- [ ] Persist document tracker checkbox state to DB
- [ ] Shared rate limiting (Redis or DB-backed) across workers
- [ ] Stripe/payment integration for premium credits
- [ ] Dark/light mode toggle
- [ ] Accessibility audit (ARIA labels, keyboard navigation)
- [ ] E2E tests (Playwright/Cypress)
- [ ] API integration tests

---

## Key Files Reference

| Purpose | Path |
|---|---|
| FastAPI entry point | `backend/app/main.py` |
| Database schema + CRUD | `backend/app/database.py` |
| AI timeline generator | `backend/app/services/ai_timeline_generator.py` |
| Gemini wrapper (new google.genai) | `backend/app/services/gemini_service.py` |
| Risk analyzer | `backend/app/services/risk_analyzer.py` |
| RAG pipeline | `backend/app/services/rag_service.py` |
| Auth service | `backend/app/services/auth_service.py` |
| Immigration rules data | `backend/app/data/immigration_rules.py` |
| RAG knowledge base (8 docs) | `backend/app/rag/documents/` |
| React app + routes | `frontend/src/App.tsx` |
| Auth context (global state) | `frontend/src/contexts/AuthContext.tsx` |
| TypeScript types | `frontend/src/types/index.ts` |
| API client | `frontend/src/utils/api.ts` |
| CI/CD pipeline | `.github/workflows/deploy.yml` |
| Azure config | `backend/.azure/config` |
| Startup command | `backend/startup.sh` |

---

## Environment Variables (Azure App Settings)

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | JWT signing secret |
| `DATABASE_URL` | PostgreSQL connection string (omit for SQLite) |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `ADMIN_EMAIL` | Admin account email (seeded on startup) |
| `ADMIN_PASSWORD` | Admin account password (seeded on startup) |

---

## Recent Changes (Feb 16)
- Migrated from deprecated `google.generativeai` to new `google.genai` SDK
- Removed `google-generativeai` from requirements.txt
- Admin now skips onboarding — redirected to `/admin` on login and on direct navigation
