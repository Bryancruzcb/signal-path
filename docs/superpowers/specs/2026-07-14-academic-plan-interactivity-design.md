# Academic plan update + interactivity pass — design

Date: 2026-07-14 · Approved verbally by Bryan in session.

## Context

Bryan finished all math requirements and all lower-division GE. Remaining GE: upper-division
Areas R, S, V — all three taken online in Fall 2026 alongside CS 149 and CS 158A. CS 100W
moves to Spring 2027. He also reported: YouTube sources missing from course prep (originals
only exist on his Mac; rebuild with verified links), awkward white space on wide screens,
and confusing `#/data-science/dashboard` URLs.

## Changes

### 1. Plan data (`src/data/sjsuData.ts`)
- Fall 2026: CS 149, CS 158A, GE Area R/S/V (online). Math-gap course removed.
- Spring 2027: CS 147, CS 157A, CS 152, CS 100W (CS 133 vacates to Fall 2027).
- Fall 2027: CS 160, CS 154, CS 171, CS 133. Spring 2028 filler = remaining electives only.
- KNOWN_COURSES: drop MATH 39/161A; add CS 149, CS 158A, GE R/S/V as checkable items.
- ELECTIVES: MATH 161A relabeled "Optional elective · math requirement met".
- Every course-prep module (8 OS + 8 networks) gains one YouTube resource, each URL
  verified live via YouTube oEmbed. Three flagship videos/playlists also added to
  Evidence-shelf SOURCES.

### 2. Interactivity (`src/App.tsx`, `src/App.css`)
- Roadmap course pills become toggle buttons sharing state with the "what the planner
  knows" checkboxes (strikethrough + ✓ when complete); each term shows a remaining count.
- Pills link out (↗) to the SJSU catalog / GE pages.
- Skill constellation cards clickable: Systems → Course prep; others scroll to the
  elective table.

### 3. Layout (`src/App.css`)
- `.app-main` centered in the space beside the fixed sidebar via
  `margin-left: max(var(--sidebar-width), calc((100% - 1540px + var(--sidebar-width)) / 2))`.

### 4. Routing (`src/App.tsx`)
- Hash format becomes `#/<view>`; the career path stays in localStorage only.
- Legacy `#/<path>/<view>` URLs still parse (path segment recognized and honored).

## Verification

Playwright sweep of all views at wide viewport: toggles update the roadmap, YouTube links
render in module dialogs, URLs show the new format, legacy URL redirects, layout centered.
