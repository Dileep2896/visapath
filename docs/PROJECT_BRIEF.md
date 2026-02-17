# VisaPath: Project Brief

## The Problem

There are over 1 million international students in the US, and every one of them has to navigate a complicated web of visa deadlines, work authorization rules, and immigration paperwork. The consequences of missing a single deadline can be devastating: loss of legal status, inability to work, or even deportation.

Right now, students piece together information from USCIS.gov, Reddit threads, university DSO offices, and immigration lawyers who charge $300+ per hour. There is no single tool that takes a student's specific situation and gives them a clear picture of what they need to do and when.

## The Solution

VisaPath is an AI powered web app that generates a personalized immigration timeline for each student. After a short onboarding (visa type, program details, career goals), the app builds a complete roadmap covering:

**Timeline** with every critical deadline and milestone, color coded by urgency and grouped by month. Each event expands to show detailed descriptions and action items.

**Risk Alerts** that flag things like CPT overuse (which kills OPT eligibility), India/China green card backlogs with 10-30+ year waits, and H-1B lottery odds based on wage level.

**AI Chat** grounded in actual USCIS documentation through RAG (Retrieval Augmented Generation). We embedded 8 immigration knowledge base documents into a vector database so answers cite real sources instead of hallucinating.

**Document Tracker** with step by step checklists for OPT, STEM OPT, H-1B, and Green Card filings.

**Tax Guide** personalized to your visa type, country, treaty benefits, and residency status.

**What-If Simulator** to explore how changing one variable (graduation date, STEM status, country) shifts your entire timeline.

## Architecture

```
React 19 + TypeScript + Tailwind CSS v4
    |  REST API (JSON)
    v
Python 3.13 + FastAPI
    |
    |-- 56 hardcoded USCIS rules + filing fees --> Gemini 2.5 Flash --> Structured JSON timeline
    |-- 8 immigration docs --> ChromaDB (21 chunks) --> RAG chat
    |-- Risk analyzer --> Country backlogs + lottery stats
    |-- JWT auth --> SQLite (dev) / PostgreSQL (prod)
```

Key technical decisions:
- 56 hardcoded USCIS rules ensure the AI prompt has accurate, up to date information instead of relying on the model's training data
- RAG grounds chat answers in official documentation so the AI cites real sources
- Client side date recalculation means cached timelines never show stale urgency levels
- The frontend navigates to the timeline immediately and shows an animated loading screen while AI generates in the background

## Impact

- Prevents missed deadlines that could end a student's legal status
- Makes immigration planning accessible to students who can't afford lawyers
- Reduces anxiety by giving a clear visual roadmap of what's ahead
- Saves hours of research that students currently spend across 10+ different sources

## Team

| Name | Role |
|------|------|
| Dileep Kumar Sharma | Full stack development, AI integration, deployment |

## AI Disclosure

**In the product:** Google Gemini 2.5 Flash (timeline, chat, tax guide) and gemini-embedding-001 (RAG vectors)

**During development:** Claude Code (Anthropic) was used as a coding assistant

All immigration guidance includes disclaimers that it's general information, not legal advice.

## Tech Stack

React 19 / TypeScript / Vite 7 / Tailwind CSS v4 / FastAPI / Python 3.13 / Google Gemini 2.5 Flash / LangChain / ChromaDB / SQLite + PostgreSQL / Azure App Service / GitHub Actions

## Links

- Live: [visapath-app.azurewebsites.net](https://visapath-app.azurewebsites.net)
- Repo: [github.com/dileep-kumar-sharma/visapath](https://github.com/dileep-kumar-sharma/visapath)
- Video: _[coming soon]_
