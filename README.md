# The Pressroom — Frontend

React + TypeScript + Vite single-page app implementing the pupil, teacher, and
parent experiences described in `Newsroom_Game_Scope.md`. Talks to the Worker
in `../worker` over plain `fetch`.

## Verified working

- `tsc -b` — clean, strict-mode type-check across the whole project.
- `npm run build` — clean production build (~93KB gzipped JS, ~200KB illustration).
- Screenshot-tested with Playwright:
  - All three login screens (pupil/teacher/parent) render with zero console errors,
    cross-links between them navigate correctly.
  - **Pressroom hotspot alignment verified directly against the illustration** —
    rendered the exact CSS/percentage overlay used in `PressroomPage.tsx` on top of
    `public/pressroom-scene.jpg` and confirmed all four zones (Think & Respond,
    Published Articles, Comprehension, Vocabulary) tightly wrap their corresponding
    board/desk/cabinets with no meaningful overlap or gap.
- Not screenshot-tested past login with a live backend this session (environment
  instability with long-running local dev servers) — see the Worker's README for
  the full authenticated-flow test that *was* completed (teacher login, article
  import, task shuffle/grading, reflect soft-block) against a real local D1.
  The pressroom/task/wall/thumbnail code added this session type-checks and builds
  clean but hasn't been re-run through that same live end-to-end pass — worth doing
  before considering it production-verified.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your deployed/local Worker
npm run dev
```

## Structure

- `src/api/` — typed API client (`client.ts`), response types (`types.ts`), localStorage session storage (`session.ts`).
- `src/auth/` — `AuthContext` + `RequireSession` route guard.
- `src/pages/` — one file per screen, plus `teacherTabs/` for the dashboard's four tabs.
- `src/components/` — `SplitPane`, `Modal`, `PupilHeader`, `ThumbnailImage` (fetches a thumbnail as an authenticated blob rather than a plain `<img src>`, since the API requires a Bearer token a plain image tag can't send).
- `public/pressroom-scene.jpg` — the illustrated pressroom hub background.

## What's implemented

- **Full pupil journey**: login → **illustrated Pressroom hub** (the uploaded scene
  with four clickable hotspots, hover labels, and live incomplete-task badges) →
  per-zone article picker → Task screen (comprehension with clickable evidence
  chunks, vocabulary with inline word highlighting, reflect with the
  check→warn→resubmit flow) → results screen → Published Wall (now showing real
  thumbnail images with a CSS "PUBLISHED" ribbon, falling back to a placeholder
  icon when no thumbnail's been uploaded) → Rankings.
- **Full teacher journey**: login → class selector → Breaking News (copy prompt →
  paste JSON → validation → draft review → **optional thumbnail upload** →
  publish) → Roster → Review Queue → Settings.
- **Parent journey**: login → read-only class table.

### Pressroom hotspot coordinates

`PressroomPage.tsx` positions four `<button>` hotspots over the illustration
using percentages measured directly against `pressroom-scene.jpg`'s actual
pixel dimensions — see the comment block above the `HOTSPOTS` constant. If the
illustration is ever replaced or re-cropped, re-measure against the new file
rather than assuming the layout carries over; the alignment test described
above is a quick way to check (a small standalone HTML file with colored
overlay boxes at the same percentages, viewed directly — no backend needed).

## Deliberately NOT implemented yet

- No article-editing UI (matches the Worker not having that endpoint yet).
- No offline/PWA support, no loading skeletons beyond plain "Loading…" text,
  no toast notifications (errors show as inline banners).
- No automated test suite (Jest/Vitest/Playwright component tests) — verification
  so far is type-checking, production builds, and manual/scripted testing as
  described above.
