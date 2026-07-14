# Signal Path

A private, browser-local academic and career workspace for an SJSU computer science student: course-prep labs for waitlisted systems courses, a four-term academic plan, six first-class career tracks, a curated learning-resource stack, and a Summer 2027 internship application tracker. Everything persists in the browser's local storage — no account, no backend, no analytics.

## How this app came to be

Signal Path is the merge of three separately built dashboards into one workspace, keeping the best of each:

- **third-year-lab** — SJSU CS 149 / CS 158A waitlist-prep modules, the Focus Bench timer, the four-term academic roadmap, and the oklch design system (Figtree / Newsreader / IBM Plex Mono) the whole app now uses.
- **Signal Path v1** — SDSU career-services portals, San Diego open-data resources, and the original three-track roadmap. Retained as the secondary "SDSU Portal" campus view.
- **Signal Path v2** — six career tracks (Data Science, Data Engineering, Software Engineering, Java Backend, Cybersecurity, ML Engineering), each with a dated curriculum, curated resources, two flagship project briefs, role-title banks, and the application tracker.

## Views

- **This week** — weekly systems sprint, Focus Bench timer, course readiness, and the active career lane at a glance
- **Course prep** — CS 149 (Operating Systems) and CS 158A (Computer Networks) module explorer with runnable labs and mastery tracking
- **Academic plan** — known-courses checklist, four-term timeline, skill constellation, and an electives decision table
- **Campus resources** — SJSU portal (primary: MyProgress, catalog, prerequisites, career center, Handshake) with an SDSU portal toggle (secondary/transfer resources and events)
- **Career paths** — six lanes with verdicts, roadmap phases, milestones, and flagship project briefs
- **Career resources** — searchable, filterable resource stack with per-resource progress
- **Applications** — recruiting signals, a local job tracker, weekly outreach cadence, and referral strategy
- **Evidence shelf** — the research behind the course claims, labeled by evidence strength (official / syllabus / student / inferred)

Progress switches lanes without losing state: tasks, resource progress, milestones, and applications are stored per path and can be exported as JSON from the sidebar.

## Run locally

Prerequisite: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

```bash
npm run lint     # oxlint
npm run build    # tsc + vite build
npm run preview  # serve the production build
```

## Project structure

- `src/App.tsx` — all eight views, sidebar navigation, hash routing, and local persistence
- `src/App.css` — the oklch design system and responsive layout
- `src/data/careerPaths.ts` — six path profiles, curricula, resources, projects, and market signals
- `src/data/sjsuData.ts` — SJSU course-prep modules, academic roadmap, electives, and evidence sources
- `src/data/roadmap.ts` — SDSU campus resources and career events (secondary campus view)
- `PRODUCT.md` / `PROJECT_BRIEF.md` — product intent and design principles

Research was last reviewed in July 2026. Course access and recruiting links change; the Evidence shelf keeps sources labeled so details can be re-verified before acting.
