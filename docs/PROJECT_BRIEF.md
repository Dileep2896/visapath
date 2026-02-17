# VisaPath — Project Brief

**One-page overview for Nexora Hacks 2026**

---

## The Problem

Over 1 million international students in the US face a complex web of visa deadlines, employment authorization windows, and immigration milestones. A single missed deadline — like the 90-day OPT application window or H-1B registration period — can end their legal status in the country.

Currently, students piece together information from USCIS.gov, Reddit threads, university DSO offices, and expensive immigration lawyers. There is no single tool that provides a clear, personalized view of their entire immigration journey.

## The Solution

**VisaPath** is an AI-powered web app that generates a personalized, interactive immigration timeline for each student. After a brief onboarding (visa type, program details, career goals), students receive:

- A color-coded timeline with every critical deadline and milestone
- Risk alerts for potential issues (CPT overuse, country backlogs, H-1B lottery odds)
- Actionable to-do checklists for each event
- Document preparation checklists for OPT, STEM OPT, H-1B, and Green Card
- An AI-powered Q&A chat grounded in official USCIS documentation (RAG)
- A personalized tax filing guide
- A What-If simulator for exploring alternative scenarios

## How It Works

1. **Onboarding** — Student inputs visa type, degree, STEM status, graduation date, country, and career goal
2. **AI Generation** — Backend sends 56 hardcoded USCIS rules + student profile to Google Gemini 2.5 Flash, which generates a structured JSON timeline
3. **Risk Analysis** — Risk engine flags CPT overuse, country backlogs, lottery odds, and approaching deadlines
4. **Interactive Dashboard** — Frontend renders a beautiful, interactive timeline with expandable cards, urgency color-coding, and staggered animations
5. **RAG Chat** — 8 immigration documents embedded in ChromaDB; user questions are matched via cosine similarity and answered with grounded citations

## Architecture

```
React 19 + TypeScript + Tailwind CSS v4 (Frontend)
        ↕ REST API (JSON)
Python 3.13 + FastAPI (Backend)
        ↕
Google Gemini 2.5 Flash + ChromaDB (RAG) + SQLite/PostgreSQL
```

**Key technical decisions:**
- 56 hardcoded USCIS rules ensure accuracy (not relying solely on AI hallucination)
- RAG grounds chat answers in official documentation
- Client-side date recalculation prevents stale cached timelines
- Fire-and-forget navigation shows an animated loading screen during AI generation

## Impact

- **Prevents missed deadlines** that could end a student's legal status
- **Democratizes access** to immigration planning (normally requires $300+/hr lawyers)
- **Reduces anxiety** by providing a clear, visual roadmap of what's coming and when
- **Saves time** — no more piecing together info from 10+ different sources

## Team

| Name | Role |
|------|------|
| **Dileep Kumar Sharma** | Full-Stack Developer — Backend, AI, Frontend, Deployment |

## AI Disclosure

- **Google Gemini 2.5 Flash** — Runtime AI for timeline generation, chat, tax guide
- **Google gemini-embedding-001** — Vector embeddings for RAG
- **Claude Code (Anthropic)** — Development assistant for code generation and iteration

## Tech Stack

React 19 | TypeScript | Vite 7 | Tailwind CSS v4 | FastAPI | Python 3.13 | Google Gemini 2.5 Flash | LangChain | ChromaDB | SQLite/PostgreSQL | Azure App Service | GitHub Actions

## Links

- **Live Demo:** [visapath-app.azurewebsites.net](https://visapath-app.azurewebsites.net)
- **Repository:** [github.com/dileep-kumar-sharma/visapath](https://github.com/dileep-kumar-sharma/visapath)
- **Demo Video:** _[YouTube link — coming soon]_
