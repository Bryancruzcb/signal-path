# Signal Path

Signal Path is a private, browser-local career workspace for a rising third-year SDSU computer science student targeting Summer 2027 internships.

It now treats six career routes as first-class paths:

- Data Science (product analytics and experimentation)
- Data Engineering
- Software Engineering
- Java Backend
- Cybersecurity
- Machine Learning Engineering

Each path has a separate dashboard, curriculum, resource stack, two portfolio briefs, role-title bank, recruiting signals, and application tracker. Progress persists independently in local storage and can be exported as JSON.

## Product decisions

- Apply while learning. Summer 2027 recruiting is already active as of July 2026.
- Prefer one primary learning spine over stacked courses.
- Finish one defensible flagship project before collecting tutorial projects.
- Track tests, recovery behavior, trade-offs, and measurable outcomes—not only features.
- Treat referrals as visibility leverage for a prepared candidate, never as a substitute for fit.
- Keep cybersecurity practice inside owned systems, authorized scopes, and deliberately vulnerable labs.

## Run locally

Prerequisite: Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

```bash
npm run lint
npm run build
npm run preview
```

## Project structure

- `src/data/careerPaths.ts` — six path profiles, curricula, resources, projects, and market signals
- `src/App.tsx` — navigation, local persistence, trackers, filters, and workspace views
- `src/App.css` — responsive visual system and component styling
- `PRODUCT.md` — product intent and design principles

All checked tasks, resource states, project milestones, and applications stay in the browser. The app has no account, backend, analytics, or cloud sync.

Research was reviewed on July 11, 2026. Course access and recruiting links can change; source links are included so details can be verified before acting.
