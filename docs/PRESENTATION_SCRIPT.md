# VisaPath Presentation Script

Total time: ~4-5 minutes

---

## Slide 1: Title (20 sec)

"Hey everyone, I'm Dileep Kumar Sharma and this is VisaPath.

There are over a million international students in the US right now. Every single one of them has to navigate a maze of visa deadlines, filing windows, and immigration rules. Get one thing wrong, miss one deadline, and you can lose your legal status in this country.

Immigration lawyers charge $300 an hour for basic guidance. VisaPath does it for free, personalized to your exact situation."

---

## Slide 2: Problem (30 sec)

"Let me give you some real examples of what international students deal with.

The OPT application window is 90 days before graduation to 60 days after. That's it. Miss that window and you lose your work authorization. No second chance.

If you use more than 12 months of CPT during school, your OPT eligibility is permanently gone. Most students don't even know this rule exists until it's too late.

And if you're from India or China, you're looking at 10 to 30 plus year backlogs for a green card.

Right now students piece this together from USCIS.gov which is impossible to read, Reddit threads that are outdated, and DSO offices that have limited hours. There's no single place that gives you a clear, personalized answer."

---

## Slide 3: Solution (30 sec)

"VisaPath changes that. You enter your visa type, degree, country, graduation date, and career goal, and we generate a complete personalized timeline from OPT all the way to green card.

Every deadline is color coded by urgency. Red means act now, amber means coming up, teal means you have time.

We also have a risk engine that catches things like CPT overuse or country backlogs before they become problems.

There's an AI chat grounded in actual USCIS documents, not hallucinated answers. A document tracker with step by step filing checklists. A tax guide personalized to your visa type and country. And a what-if simulator where you can change one variable and see how your entire timeline shifts."

---

## Slide 4: Demo (10 sec)

"Let me show you how it actually works. The app is live right now at this URL. I'll walk through the full flow."

*[Switch to live demo or screen recording]*

---

## Slide 5: Architecture (35 sec)

"Here's what's happening under the hood.

When a student fills out the onboarding form, the backend doesn't just throw that data at an AI and hope for the best. We assemble a prompt that includes 56 hardcoded USCIS rules, current filing fees, H-1B lottery statistics from FY2024 through FY2027, and country specific green card backlog data.

All of that goes into the prompt alongside the student's profile. So when Gemini 2.5 Flash generates the timeline, it's grounded in real, up to date rules, not relying on training data that could be wrong.

For the AI chat, we built a RAG pipeline. 8 immigration documents split into 21 chunks, embedded into ChromaDB. When you ask a question, we retrieve the 4 most relevant chunks and feed them to the AI. So answers actually cite real rules."

---

## Slide 6: Tech Stack (15 sec)

"Quick overview of the stack. React 19 with TypeScript on the frontend, Python with FastAPI on the backend, Gemini 2.5 Flash for AI, ChromaDB for vector search, PostgreSQL for data, and it's all deployed on Azure App Service through GitHub Actions CI/CD.

Right now we're running on RIT's free Azure for Students subscription, which is why we're looking to upgrade the infrastructure."

---

## Slide 7: Challenges (30 sec)

"These are the real problems that 1.1 million international students in the US face every day.

Students miss critical deadlines because there's no centralized tracking. The OPT filing window is only 150 days and if you miss it by one day, that's it.

There are hidden rules buried in USCIS documentation that nobody tells you about. The CPT 12 month rule, the new wage level H-1B lottery that starts FY2027, cap exempt employer paths that let you skip the lottery entirely.

Getting professional advice costs $300 an hour and it's still generic. A lawyer gives you the same overview they give every client.

And the biggest thing is that every student's path is completely different. A STEM student from India has a totally different timeline than a non-STEM MBA from Brazil. VisaPath handles all of these cases."

---

## Slide 8: Traction (25 sec)

"We shared this with 15 classmates at RIT, all international students on F-1 visas. These aren't students who don't know about immigration. They know about OPT, they know about H-1B. But here's what happened.

Priya knew she had to file OPT before graduation, everyone knows that. But VisaPath calculated her exact window and showed her she only had 23 days left. She was planning to file next month. That would have been too late.

Ananya used the what-if simulator and discovered a cap-exempt employer path she didn't know existed, skipping the H-1B lottery entirely through a university research position.

Siddharth found out from the tax guide that India has a US tax treaty most students never claim. Even his CA friends had no idea.

5 star average rating across the board."

---

## Slide 9: Business Model (20 sec)

"For sustainability, we have three tiers.

Free tier gives you five timeline generations with basic risk alerts and document checklists. Good enough to see the value.

Pro at $9.99 a month unlocks unlimited timelines, the AI chat, what-if simulator, tax guide, and push notifications. This is where most students would land.

And for universities, $499 a year gives DSO advisors a dashboard to manage timelines for all their international students at once.

The total addressable market is over a million students in the US, with 400,000 new F-1 students every year. And right now there are zero direct competitors doing personalized AI immigration timelines."

---

## Slide 10: Prize Money (25 sec)

"Right now VisaPath runs on RIT's free Azure subscription. The app sleeps after 20 minutes of inactivity and wakes up with a cold start. That's fine for a prototype but not for real users.

If we win, here's how we'd invest the $5,000 like a real startup.

$2,000 goes to user acquisition. Campus ambassador programs at 10 universities, partnerships with international student organizations, and direct outreach to DSO offices at top F-1 schools.

$1,500 gets us 12 months of AWS production infrastructure. Always on, no cold starts, serving 1,000 plus users reliably.

$1,000 covers AI API costs for those first 1,000 users so we never have to rate limit the experience.

And $500 for a legal review, getting an immigration attorney to validate our 56 USCIS rules and add proper disclaimers.

That's a $5 cost per user to reach our first 1,000 users with 12 months of runway."

---

## Slide 11: Roadmap (15 sec)

"Looking ahead, we want to add push notifications for deadlines, support for J-1 L-1 and O-1 visas, a cap exempt employer database, live USCIS processing times, a university DSO dashboard, a mobile app, AWS migration, and partnerships with university international offices.

The foundation is built. Now it's about scaling."

---

## Slide 12: Closing (10 sec)

"VisaPath. Your immigration journey, one clear timeline. It's live right now with 15 active users at RIT. The app is at visapath-app.azurewebsites.net and the code is on GitHub.

Thank you."

---

## Tips

- Keep it conversational, not reading off a script
- During the demo slide, switch to the actual app or a screen recording
- Make eye contact with the camera
- The total should be under 5 minutes
- If time is tight, cut the Tech Stack slide (judges can read it)
- Pause briefly after each big number (1M+, $300/hr, 10-30 years) to let it land
