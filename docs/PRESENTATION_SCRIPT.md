# VisaPath Presentation Script

Total time: ~5 minutes (strict)

Breakdown: ~2.5 min slides + ~1.5 min live demo + ~1 min closing slides

---

## Slide 1: Title (20 sec)

"Hey everyone, I'm Dileep Kumar Sharma and this is VisaPath.

There are over a million international students in the US. Every single one has to navigate a maze of visa deadlines and immigration rules. Miss one deadline and you lose your legal status.

Immigration lawyers charge $300 an hour. VisaPath does it for free, personalized to your exact situation."

---

## Slide 2: Problem (25 sec)

"Quick examples. The OPT application window is 90 days before graduation to 60 days after. Miss it and you lose work authorization. No second chance.

If you use more than 12 months of CPT, your OPT eligibility is permanently gone. Most students don't know this exists.

And if you're from India or China, you're looking at 10 to 30 year green card backlogs.

Right now students piece this together from USCIS.gov, Reddit, and DSO offices. There's no single personalized source."

---

## Slide 3: Solution (20 sec)

"VisaPath changes that. You enter your visa type, degree, country, and graduation date, and we generate a personalized timeline from OPT all the way to green card.

Color coded by urgency. A risk engine that catches CPT overuse and country backlogs. AI chat grounded in real USCIS documents. Document checklists. A tax guide. And a what-if simulator to see how changing one variable shifts your entire path.

Let me show you."

---

## Slide 4: Demo Intro (5 sec)

"The app is live right now. Let me walk you through it."

*[Switch to browser — app should already be open on the login page]*

---

## LIVE DEMO (80-90 sec)

Walk through this flow at a steady pace:

**Login (10 sec)**
- Show the login screen: "Here's the landing page. Judges, there's a Try Demo button so you can try it without signing up."
- Click "Try Demo" or log in

**Timeline (25 sec)**
- "This is the timeline dashboard. Every event is personalized to this student's profile — a STEM CS Masters from India."
- Scroll through the timeline slowly. Point out: "Events are grouped by month and color coded. Red means act now. This OPT deadline is coming up in a few weeks."
- Click to expand one card: "Each event has specific action items."

**Risk Alerts (15 sec)**
- Click Alerts in sidebar: "The risk engine flagged 4 issues for this student. Country backlog warning, CPT usage, the new wage-level H-1B lottery. These are things most students don't find until it's too late."

**AI Chat (15 sec)**
- Click AI Chat: "You can ask any immigration question. Let me ask one."
- Type or click a suggestion: "What happens if I exceed 90 days of unemployment on OPT?"
- While it loads: "This is RAG powered — 8 USCIS documents embedded in ChromaDB. Answers cite real rules, not hallucinations."

**Document Tracker (10 sec)**
- Click Documents: "Step by step checklists for each immigration step. Track which documents you've gathered."

**Quick mentions (10 sec)**
- Click Tax Guide: "Tax guide personalized to your visa type and country."
- Click back to Timeline, briefly show What-If panel: "And the what-if simulator — change graduation date or STEM status and see how the whole timeline shifts."

*[Switch back to slides]*

---

## Slide 5: Architecture (25 sec)

"Quick look under the hood. We don't just throw data at an AI. The backend injects 56 hardcoded USCIS rules, filing fees, H-1B lottery stats, and country backlogs into every prompt. Gemini generates a timeline grounded in real rules.

For chat, 8 immigration documents are chunked and embedded into ChromaDB. Every question retrieves the 4 most relevant chunks via cosine similarity."

---

## Slide 6: Tech Stack (10 sec)

"React 19, TypeScript, Tailwind on the frontend. Python, FastAPI on the backend. Gemini 2.5 Flash, ChromaDB for RAG, PostgreSQL, deployed on Azure with GitHub Actions CI/CD."

---

## Slide 7: Challenges (20 sec)

"The real problems: students miss deadlines because there's no centralized tracking. Hidden rules no one tells you about. Professional advice costs $300 an hour and is still generic. And every student's path is completely different. STEM from India versus non-STEM MBA from Brazil — totally different timelines. VisaPath handles all of it."

---

## Slide 8: Traction (20 sec)

"We shared this with 15 classmates at RIT, all F-1 students who already know immigration basics. Priya found out she only had 23 days left in her OPT window — she was planning to file next month. Ananya discovered a cap-exempt employer path to skip the H-1B lottery. Siddharth found an India tax treaty most students never claim. 5 star average."

---

## Slide 9: Business Model (15 sec)

"Three tiers. Free gives you 5 timeline generations. Pro at $9.99 a month unlocks everything. University tier at $499 a year gives DSO advisors a dashboard. TAM is a million plus students, 400K new F-1s each year, zero direct competitors."

---

## Slide 10: Prize Money (15 sec)

"If we win: $2,000 for user acquisition at 10 universities. $1,500 for AWS production hosting. $1,000 for AI API costs. $500 for legal review. That's $5 per user to reach 1,000 users with 12 months of runway."

---

## Slide 11: Roadmap (10 sec)

"Next up: push notifications, J-1 and O-1 visa support, cap-exempt employer database, mobile app, university DSO dashboard. The foundation is built. Now it's about scaling."

---

## Slide 12: Closing (5 sec)

"VisaPath. Your immigration journey, one clear timeline. It's live now at visapath-app.azurewebsites.net. Thank you."

---

## Tips

- **Before recording**: Open the app in the browser and log in. Have it ready on the timeline page so there's no cold start delay during the demo.
- Keep a steady pace — don't rush the demo, it's the most impressive part.
- The demo should feel natural, like you're showing a friend. Don't narrate every click.
- If the AI chat takes too long to respond, just say "it's generating a grounded response" and move on.
- Total should be 4:30-5:00. If running long, trim Tech Stack (judges can read it) and Roadmap.
- Pause briefly after big numbers (1M+, $300/hr, 10-30 years) to let them land.
