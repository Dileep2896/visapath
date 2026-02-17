## Inspiration

I'm an international student on an F-1 visa, and I've lived through the stress of tracking OPT deadlines, H-1B lottery registration windows, and cap-gap extensions. Last semester I watched a friend nearly miss their OPT application window because they miscounted the 90-day pre-graduation filing period. That would have ended their work authorization in the US.

The information you need is out there, but it's scattered across USCIS.gov, Reddit threads, university DSO offices, and immigration lawyers charging $300+ an hour. I wanted to build something that takes your specific situation and just tells you: here's what you need to do, and here's when you need to do it.

## What it does

VisaPath takes a student's visa type, program details, and career goals, and generates a personalized immigration timeline covering every deadline from OPT application all the way to green card.

The **Timeline Dashboard** is the core feature. It's an interactive, color coded vertical timeline where every event is tagged by urgency (critical in red, high in amber, medium in teal, low in slate). Events are grouped by month, and each card expands to show a detailed description and specific action items. Past events collapse automatically, and there's an "Up Next" badge on whatever deadline is coming soonest.

The **Risk Engine** runs alongside timeline generation and flags things most students don't think about until it's too late: using 12+ months of CPT kills your OPT eligibility, India and China nationals face 10-30+ year green card backlogs, and the H-1B lottery now uses wage-level weighting starting FY2027 that changes your odds depending on your salary level.

The **AI Chat** lets you ask any immigration question and get an answer grounded in actual USCIS documentation. We built a RAG (Retrieval Augmented Generation) pipeline that embeds 8 immigration knowledge base documents into ChromaDB, retrieves the most relevant chunks for each question, and feeds them into the AI alongside your visa context. This means answers cite real rules instead of hallucinating.

There's also a **Document Tracker** (step-by-step checklists for OPT, STEM OPT, H-1B, and Green Card filings), a **Tax Guide** (personalized to your visa type, country, treaty benefits, and residency status), and a **What-If Simulator** that lets you change one variable and instantly see how your entire timeline shifts.

## How we built it

**Frontend:** React 19 with TypeScript, Vite 7, and Tailwind CSS v4 with a custom dark theme (navy and teal palette). React Router v7 handles navigation with three layers of route guards: RequireAuth, RequireOnboarded, and RequireAdmin. The timeline has staggered fade-in animations, expandable cards with CSS grid transitions, and a pulsing glow effect on the current event marker.

**Backend:** Python 3.13 with FastAPI. JWT authentication with bcrypt password hashing. SQLite for local development, PostgreSQL on Azure for production. Per-IP rate limiting on auth endpoints and a daily AI request tracker to manage API costs.

**AI Timeline Generation:** This is where the interesting engineering is. We don't just throw the user's data at an LLM and hope for the best. The backend assembles a prompt that includes 56 hardcoded USCIS rules (OPT windows, STEM OPT extensions, H-1B cap-gap, unemployment limits), current filing fees ($580 for I-765, $780 for I-129, $2,805 premium processing), H-1B lottery statistics from FY2024 through FY2027, and country-specific green card backlog data. All of this goes into the prompt alongside the student's profile, so Gemini 2.5 Flash generates a timeline grounded in accurate, up-to-date rules rather than relying on its training data.

**RAG Pipeline:** 8 immigration documents (OPT rules, STEM OPT extension rules, H-1B visa, CPT rules, green card process, F-1 general rules, wage-level selection, tax filing) are split into 21 chunks using LangChain's RecursiveCharacterTextSplitter, embedded with Google's gemini-embedding-001 (768-dimensional vectors), and stored in ChromaDB. Each chat query retrieves the top 4 most relevant chunks via cosine similarity.

**Stale-proof dates:** One problem we ran into is that the AI generates the timeline once, but a student might not open it again for days. The urgency levels and "days until deadline" counts would be wrong. We solved this by having the frontend recalculate is_past and urgency from the browser's local date on every single render using React's useMemo. The timeline always shows accurate urgency levels no matter when it was generated.

**Deployment:** Azure App Service with GitHub Actions CI/CD. The frontend builds to static files that the backend serves. ChromaDB runs embedded inside the backend process, so there's no separate vector database to manage.

## Challenges we ran into

The biggest challenge was accuracy. Immigration rules have real consequences if you get them wrong. We couldn't just rely on the AI model's training data because USCIS fees, processing times, and lottery statistics change every fiscal year. That's why we hardcoded 56 rules and injected them directly into every prompt. The AI uses them as ground truth rather than guessing.

Another tricky problem was the loading experience. Timeline generation takes 10-15 seconds because of the Gemini API call. Originally, the user just sat on the onboarding form watching a button spinner. We changed it so the form fires off the API call and immediately navigates to the timeline page, which shows a full-screen animated loading experience with progress steps, a mini timeline preview that fills in as you wait, and rotating "Did you know?" facts about immigration. It turns the wait into something engaging.

Date handling was surprisingly complex. The server runs in UTC on Azure, but a student in California at 11pm on February 16th should see February 16th dates, not February 17th. We solved this by having the frontend send its local date (user_today) with every request, and the backend uses that for all date calculations.

## Accomplishments that we're proud of

The timeline genuinely works for real scenarios. We tested it with F-1 STEM students from India (the hardest case: OPT + STEM OPT + H-1B lottery with country backlog), non-STEM students from China, OPT holders from Brazil, and H-1B holders filing for green cards. Each one produces a different, accurate timeline with the right deadlines and risks.

The RAG chat actually cites sources and gives correct answers. Ask it "Can I work for two employers on STEM OPT?" and it pulls the right E-Verify requirements from the STEM OPT knowledge base document.

The risk engine catches things that trip up real students: CPT overuse killing OPT eligibility, the new wage-level weighted H-1B lottery system, and cap-exempt employer paths that let you skip the lottery entirely.

## What we learned

Building with LLMs for high-stakes domains (immigration, legal, medical) requires a fundamentally different approach than building a chatbot. You can't just prompt and pray. The 56 hardcoded rules, the RAG grounding, and the structured JSON output with validation are all guardrails that make the AI output trustworthy enough to actually use.

We also learned that the UX around AI wait times matters as much as the AI output itself. A 15-second spinner feels broken. A 15-second animated experience with progress indicators feels fast.

## What's next for VisaPath

1. Push notifications for upcoming deadlines (email + browser)
2. Support for J-1, L-1, and O-1 visa types
3. A cap-exempt employer database so students can look up which companies skip the H-1B lottery
4. Live USCIS processing time data pulled from the USCIS API
5. A university DSO dashboard so advisors can manage immigration timelines for all their students at once
6. Mobile app (React Native) for on-the-go deadline tracking
