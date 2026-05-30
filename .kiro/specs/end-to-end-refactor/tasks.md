# Implementation Plan: End-to-End Refactor (ChemisARtry)

## Overview

This plan closes the genuine gaps identified in the design while preserving the already-working tree. Work is ordered so the foundation lands first (build gate → Content_Store → App_State_Store), then the shared 3D rendering dedup/scene work, then page wiring. Language is **TypeScript/TSX**, matching the existing codebase.

Per scope, testing is intentionally light: the **build gate** (`bun run build`) is the primary verification, plus one optional Content_Store smoke check. No exhaustive test suite is created.

## Tasks

- [x] 1. Build gate and regression guard (foundation)
  - [x] 1.1 Verify build is green and guard against regression
    - Run `bun run build`; confirm it exits `0` and emits `dist/` (client + server bundles)
    - Regression guard for `src/lib/pubchem-api.ts`: confirm the module parses with no "Unexpected end of file" (PUG-View type block `PugViewResponse`/`PugViewSection` terminated) and that the consumed named exports resolve (`searchPubChem`, `autocompletePubChemCompound`, `fetchMolecule3D`, `fetchCompoundDescription`, `PubChemNotFoundError`, and the `PubChem*` types)
    - Regression guard for single `/lab` registration: confirm `src/routes/lab.tsx` is the `<Outlet/>` layout and `src/routes/lab.index.tsx` is the redirect, so `/lab` resolves to exactly one handler in `routeTree.gen.ts`
    - Fix any blocker found before proceeding
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2. Content_Store (local seed + localStorage learning state)
  - [x] 2.1 Create `src/lib/content-store.ts` core: schema, read/write, subscribe
    - Define `ContentState` (onboardingComplete, gradeLevel, startingRoad, lessons map, activityDates, moleculesSpawned, reactionsTriggered)
    - Single namespaced key `chemisartry.content.v1`; `readContent()` returns defaults on absent/corrupt JSON (try/catch); `writeContent()` persists + no-ops on quota failure (try/catch)
    - `subscribe(cb)` + internal notify for `useSyncExternalStore`; internal `touchToday()` helper for activity dates
    - _Requirements: 10.2, 10.5_

  - [x] 2.2 Implement Content_Store mutations
    - `setOnboarding(grade, road)`, `markLessonOpened(id)`, `completeMission(lessonId, missionId)`, `markLessonCompleted(id)`, `recordSpawn(formula)`, `recordReaction()`
    - Each mutation persists, calls `touchToday()`, and notifies subscribers
    - Seed lesson/road definitions come from existing `src/lib/lessons-data.ts` (`ROAD1_LESSONS`, `ROAD2_LESSONS`, `getLessonById`, `getLessonsByRoad`) — store only state about lessons, never duplicate content
    - _Requirements: 5.2, 5.3, 9.6, 9.7, 10.1_

  - [x] 2.3 Implement Content_Store derived selectors
    - `getRoadProgress(roadId)` → `{ completed, total, percent }` (total 12/10, percent = round(completed/total*100), other road never affects result)
    - `getLessonStatus(id)` → `locked | current | completed | in-progress` (lowest-order non-completed = current; Road 2 soft-lock is presentational only and never blocks navigation)
    - `getCurrentLesson()` (first in-progress, else first incomplete), `getStreak()` (consecutive days ending today/yesterday), `getAchievements()` (existing 6 lab achievements + learning achievements, each `{ id, label, desc, icon, obtained }`)
    - _Requirements: 7.2, 8.2, 10.3, 10.4, 15.2, 15.3, 15.4_

  - [ ]* 2.4 Optional Content_Store smoke check (pure logic only)
    - Minimal checks for the most logic-dense selectors; skip-able for MVP
    - **Property 1: Content state persistence round-trip** — write→read equality. **Validates: Requirements 5.2, 5.3, 10.2**
    - **Property 3: Road progress derivation** — completed/total/percent correct, cross-road isolation. **Validates: Requirements 7.2, 15.2**
    - **Property 8: Streak equals consecutive activity run.** **Validates: Requirements 10.3**
    - **Property 9: Achievements unlock monotonically by threshold.** **Validates: Requirements 10.4, 15.3, 15.4**

  - [x] 2.5 Create `src/hooks/use-content-store.ts`
    - Wrap the store with `useSyncExternalStore(subscribe, snapshot)`; expose `state` plus selectors (`roadProgress`, `currentLesson`, `streak`, `achievements`, `getLessonStatus`) and mutation callbacks
    - All consuming pages re-render consistently when the store changes
    - _Requirements: 10.5_

- [ ] 3. App_State_Store (dependency-free global lab/session state)
  - [x] 3.1 Create `src/store/app-store.ts`
    - Define `LabSession` + `AppState`; implement `appStore` with `getSnapshot`, `subscribe`, and actions (`setSelected`, `requestSpawn`, `clearSpawn`, `resetScene`, `toggleEducation`, `setArOn`, `toggleHeadTracking`, `pushReaction`, `enterLessonContext`, `completeMission`)
    - Expose `useAppStore(selector)` via `useSyncExternalStore` — no new dependency
    - Bridge to Content_Store: `requestSpawn`→`recordSpawn`, `pushReaction`→`recordReaction`, `completeMission`→`content-store.completeMission` so persistent progress/streak/achievements update
    - _Requirements: 16.1, 16.2_

- [x] 4. Checkpoint - Foundation
  - Ensure `bun run build` is green with the new stores wired (even before consumers), ask the user if questions arise.

- [ ] 5. Lab_Scene_Renderer dedup and split (behavior-preserving)
  - [x] 5.1 Unify `buildMoleculeGroup` in `src/lib/three-helpers.ts`
    - Attach `mesh.userData = { isAtom: true, el: a.el }` to atom meshes so hover/raycast works for all callers
    - Keep `makeBond`, `makeTextSprite`, `spawnBurst`, `createChemistryLights`, `SpawnedMol` as the canonical shared exports
    - _Requirements: 16.3_

  - [x] 5.2 Make `src/components/ARScene.tsx` consume the shared util
    - Import `buildMoleculeGroup`, `makeBond`, `makeTextSprite`, `spawnBurst` from `three-helpers.ts`; delete the in-file duplicate implementations
    - Verify hover tooltips still work via the unified `userData`
    - _Requirements: 16.4_

  - [~] 5.3 Extract `src/lib/ar-effects.ts` (AR-only effects)
    - Move `spawnShockwave`, `spawnEquationSprite`, `roundRect`, and the off-axis projection helper out of `ARScene.tsx` into `ar-effects.ts`; re-import them
    - Incremental and behavior-preserving; ARScene props stay compatible
    - _Requirements: 16.4_

  - [~] 5.4 Extract `src/hooks/use-hand-controls.ts`
    - Encapsulate per-frame hand→world mapping, grab/pinch, two-hand scale, and the proximity reaction loop currently inline in `ARScene.tsx`
    - Keep the public `ARScene` interface compatible so `ar.tsx` keeps working
    - _Requirements: 12.3, 12.4_

- [ ] 6. Sim_Mode real no-camera scene (replace stub)
  - [x] 6.1 Replace the redirect stub in `src/routes/lab/sim.tsx` with a real scene
    - Render `<ARScene arOn={false} ... />` so `getUserMedia`/MediaPipe are never requested
    - Read/update shared session via `useAppStore` (toSpawn, resetSignal, education, reactions); wire spawn/reset/reaction handlers
    - `validateSearch` (Zod) for `lesson`/`spawn`/`element`; render `ControlPanel` with a "Chuyển sang AR" link to `/lab/ar`
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6_

  - [x] 6.2 Ensure scroll-zoom for the non-AR scene
    - If wheel zoom is not already wired for `arOn=false`, add a `wheel` listener adjusting `camera.position.z` (mouse drag rotate already supported by ARScene pointer handlers)
    - _Requirements: 11.3_

- [ ] 7. AR_Mode integration
  - [x] 7.1 Wire `src/routes/lab/ar.tsx` to App_State_Store
    - Replace local `useState` prop-drilling (selected, toSpawn, resetSignal, education, arOn, headTracking, lastReaction, history, doneMissions, spawnedFormulas) with `useAppStore`/`appStore` actions
    - Pass a minimal interface to `ControlPanel`/`ARScene` instead of a long prop chain
    - _Requirements: 12.1, 16.2_

  - [x] 7.2 Camera-denied path → toast, remain operable
    - In `ARScene.tsx` camera init `catch`, surface a `sonner` toast and keep the scene operable (molecules still spawn/drag via mouse, degrades to sim behavior); no unhandled rejection
    - _Requirements: 12.6_

  - [x] 7.3 Switch-to-Sim control
    - Add/verify a control in `ar.tsx` that links to `/lab/sim`
    - _Requirements: 12.7_

- [ ] 8. Wet_Lab hardening
  - [x] 8.1 Ensure `src/components/WetLabScene.tsx` initializes without runtime error
    - Guard renderer/scene refs, clean up on unmount, avoid unhandled rejection in the animation loop; confirm control interactions in `src/routes/lab/wet.tsx` update the rendered scene
    - _Requirements: 13.1, 13.2, 13.3_

- [~] 9. Checkpoint - Lab modes
  - Ensure `bun run build` is green and `/lab/sim`, `/lab/ar`, `/lab/wet` load without console errors, ask the user if questions arise.

- [ ] 10. Pages wiring (consume Content_Store + App_State_Store)
  - [x] 10.1 Landing (`src/routes/index.tsx`)
    - Primary CTA → `/auth?mode=signup`; secondary guest CTA → `/lab/sim` (update any links currently pointing to `/lab/ar`); roads preview + 3 highlighted capabilities; authed users redirect to `/dashboard`
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 10.2 Auth (`src/routes/auth.tsx`) verification + routing
    - Confirm email/password + Google OAuth; sign-up→`/onboarding`, sign-in→`/dashboard`, failure→toast + stay, submit disabled while busy
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 10.3 Onboarding (`src/routes/onboarding.tsx`)
    - Rewire finish handler to call `setOnboarding(grade, road)` instead of ad-hoc keys, then navigate to `/dashboard`; guard re-entry in `beforeLoad` (if `onboardingComplete`, redirect to `/dashboard`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.4 Dashboard (`src/routes/dashboard.tsx`)
    - Replace hardcoded `progress={0}` with `useContentStore()`: continue-learning card from `getCurrentLesson()` (no road started → first lesson of Road 1; Road 1 complete → surface Road 2); quick stats (lessons completed, reactions triggered, streak); recent achievements from `getAchievements()`; quick-access links to `/lab/ar`, periodic table, explorer
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 10.5 Learn overview (`src/routes/learn.index.tsx`)
    - Show both roads with real per-road progress from `getRoadProgress`; continue/start navigates to the road page; Road 2 soft-locked but enterable
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 10.6 Road page (`src/routes/learn/road.tsx`)
    - Replace the `status = i===0 ? active : locked` TODO with `getLessonStatus(lesson.id)`; keep chapter grouping; accessible lessons navigate to the lesson page; back link to `/learn`; progress bar from `getRoadProgress`
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 10.7 Lesson page (`src/routes/learn/lesson.tsx`)
    - On open call `markLessonOpened(lessonId)`; when all missions complete call `markLessonCompleted`; Thực hành practice cards link to `/lab/sim?lesson=…` / `/lab/ar?lesson=…` preloaded with `practice.defaultMolecules` and call `appStore.enterLessonContext(lessonId)` on entry; verify theory/3D/quiz tabs and prev/next within road
    - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 10.8 Tools pages + lab spawn links (`src/routes/tools/{periodic-table,explorer,molecules,reactions}.tsx`)
    - Verify periodic table grid+detail, explorer PubChem search + 3D preview, molecules library (category filter + search), reactions list + detail; results that link into the lab navigate to the practice mode with `?spawn=`/`?element=` (via existing `src/lib/lab-spawn.ts`)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 10.9 Progress page (`src/routes/progress.tsx`)
    - Read Content_Store: lessons completed out of 22, streak, molecules spawned, reactions triggered; Road 1/Road 2 percentages from `getRoadProgress`; achievement set with obtained/locked from `getAchievements()`; fix the stray legacy `<Link to="/lab">` → `/lab/ar`
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ] 11. Navigation alignment
  - [x] 11.1 SiteHeader (`src/components/SiteHeader.tsx`)
    - Authenticated/app-route menu: Học (`/learn`), Thực hành (`/lab/sim`), Tools dropdown, Tiến độ (`/progress`), avatar menu; unauthenticated: sign-in + trial entry points; Tools dropdown links to all four utility pages; confirm all 15 routes resolve and links navigate via TanStack `<Link>`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 12. Final checkpoint
  - Ensure `bun run build` exits 0 and emits `dist/`, and do a manual route smoke (each of the 15 routes loads without console errors), ask the user if questions arise.

- [ ] 13. UI/UX foundation — design-system single sources of truth (shared primitives)
  - [x] 13.1 Create `src/lib/lesson-status.ts` (single source of truth for lesson status visuals)
    - Define `LessonStatus = "completed" | "current" | "locked"` and `StatusVisual { icon; label; colorClass; iconLabel }`
    - Export `LESSON_STATUS_VISUAL: Record<LessonStatus, StatusVisual>` (completed = ✅ emerald, current = ▶ primary, locked = 🔒 muted) using Tailwind token classes, plus a total/deterministic `statusVisual(status)` accessor; `iconLabel` carries the accessible name so meaning is not color/emoji-only; treat Content_Store's `in-progress` as `current` for display
    - _Requirements: 17.4, 23.3_

  - [x] 13.2 Create shared `LessonStatusBadge` component
    - Add `src/components/LessonStatusBadge.tsx` built on the shared Shadcn `ui/badge.tsx`, consuming `statusVisual()` from `src/lib/lesson-status.ts`; render icon + label with `aria-label`/`sr-only` set to `iconLabel`
    - This single badge is consumed by the Learn overview, Road page, and Lesson page so all three render the status identically
    - _Requirements: 17.4, 23.3_

  - [x] 13.3 Standardize design tokens in `src/styles.css` and bake in baseline a11y
    - Confirm `src/styles.css` (`:root` CSS variables + Tailwind v4 `@theme inline`) is the single source for color/typography/spacing/radius/shadow; document the convention that pages read tokens via Tailwind classes (`bg-background`, `text-foreground`, `text-primary`, `rounded-2xl`, `shadow-soft/panel/glow`) instead of hardcoded values, and standardize page titles on `text-3xl`/`text-4xl font-display font-bold`
    - Darken any documented foreground/background token pair below 4.5:1 (likely `muted-foreground` and status-chip text) until it passes; forbid `outline-none` without a replacement `focus-visible:ring-2 focus-visible:ring-ring`
    - _Requirements: 17.1, 17.2, 23.1, 23.2_

  - [x] 13.4 Create `src/lib/motion.ts` motion presets
    - Define reusable presets (e.g., `fadeUp`, `popIn`) for the installed `motion` library with `duration` ≤ 0.4s and gentle easing for page/section entrances
    - Respect reduced motion: gate non-essential animation via `useReducedMotion` (from `motion`) so durations collapse to ~0 / opacity-only when the system requests reduced motion
    - _Requirements: 21.3, 21.4_

  - [x] 13.5 Create shared UI-state components
    - Add `src/components/EmptyState.tsx` (icon + Vietnamese message + next-action button) and `src/components/ErrorState.tsx` (message + "Thử lại" button wired to a `retry` callback); standardize the loading convention on Shadcn `ui/skeleton.tsx` placeholders (full-page spinner with "Đang tải…" only for whole-page waits)
    - These are reused by data surfaces (Molecules/Reactions/Explorer/Progress) during page polish; controls also adopt the disabled-while-processing convention (`disabled` bound to an in-flight flag)
    - _Requirements: 20.1, 20.2, 20.3, 20.5_

  - [ ]* 13.6 Optional smoke test for pure UI logic (skip-able for MVP)
    - Minimal pure-function checks only; no rendering/integration tests
    - **Property 13: Lesson status visual mapping is total, deterministic, and distinct** — `statusVisual` defined for all three statuses, stable on repeat calls, three pairwise-distinct visuals. **Validates: Requirements 17.4, 23.3**
    - **Property 14: Design-token color pairs meet the contrast minimum** — documented foreground/background pairs compute WCAG contrast ≥ 4.5:1. **Validates: Requirements 23.1**

- [ ] 14. Responsive layout across viewports
  - [x] 14.1 Add mobile hamburger menu to `src/components/SiteHeader.tsx`
    - The primary `<nav>` is currently `hidden md:flex` with no mobile menu; below `md` add a hamburger `Button` (Menu icon, with accessible name) that opens a `ui/sheet.tsx` drawer listing the same destinations (Học, Phòng thí nghiệm, Lab ướt, Bảng tuần hoàn, Tools items, Tiến độ) plus auth/avatar actions; keep the desktop `<nav>` `hidden md:flex`
    - _Requirements: 19.2, 19.1_

  - [x] 14.2 AR mobile advisory in `src/routes/lab/ar.tsx`
    - When the viewport is `< md` (via `matchMedia`), render an advisory banner recommending Mô phỏng 3D (performance advisory) with a prominent button to `/lab/sim`, shown before/over the camera-enable control; AR stays usable but Sim is the recommended path
    - _Requirements: 19.3_

  - [x] 14.3 Periodic table horizontal scroll in `src/routes/tools/periodic-table.tsx`
    - Wrap the grid in an `overflow-x-auto` container and keep a min cell width so the table scrolls horizontally on mobile instead of squashing
    - _Requirements: 19.4, 19.1_

- [ ] 15. Shared component reuse and per-page layout polish
  - [x] 15.1 Landing layout (`src/routes/index.tsx`)
    - Lay out the five UX-spec sections (hero with two CTAs, problem framing, roads preview, three capability cards, closing CTA) using shared `ui/card.tsx`/`ui/button.tsx`; apply `motion.ts` entrance presets
    - _Requirements: 18.1, 17.3, 21.3_

  - [x] 15.2 Auth split layout (`src/routes/auth.tsx`)
    - Present a `md:grid-cols-2` split with a preview panel (`hidden md:block`) beside the auth `Card`; single column on mobile; keep submit `disabled` while busy
    - _Requirements: 18.2, 17.3, 20.5_

  - [x] 15.3 Dashboard layout (`src/routes/dashboard.tsx`)
    - Arrange greeting + `grid md:grid-cols-[2fr_1fr]` (left: continue-learning + next-road cards; right: quick-stats + recent achievements) + quick-access row, all from shared `Card`/`Button`
    - _Requirements: 18.3, 17.3_

  - [x] 15.4 Learn overview road cards (`src/routes/learn.index.tsx`)
    - Render Road 1 and Road 2 as two `Card`s, each with title/subtitle, a Shadcn `Progress` bar from `getRoadProgress`, and a start/continue `Button`; Road 2 rendered soft-locked (muted styling + "Bỏ qua và học")
    - _Requirements: 18.4, 17.3_

  - [x] 15.5 Road page chapter groups + status rows (`src/routes/learn/road.tsx`)
    - Group lesson rows under chapter headings; each row renders the shared `LessonStatusBadge` (from task 13.2) using `getLessonStatus`; back link to `/learn`; progress bar from `getRoadProgress`
    - _Requirements: 18.5, 17.3, 17.4_

  - [x] 15.6 Lesson page header + breadcrumb + tabs + prev/next (`src/routes/learn/lesson.tsx`)
    - Render header with `ui/breadcrumb.tsx` trail (`Dashboard › Học tập › Road n › Bài k: <title>`), the three `ui/tabs.tsx` tabs (Lý thuyết / Khám phá 3D / Thực hành), and prev/next lesson controls in the footer
    - _Requirements: 18.6, 21.1, 17.3_

  - [x] 15.7 Sim/AR sidebar + scene layout (`src/routes/lab/sim.tsx`, `src/routes/lab/ar.tsx`)
    - Apply `grid md:grid-cols-[320px_1fr]` with `ControlPanel` sidebar beside the `ARScene` area + reaction banner; on mobile the sidebar collapses above/over the scene (Sheet or stacked)
    - _Requirements: 18.7, 17.3, 19.1_

  - [x] 15.8 Progress page Card markup + Vietnamese (`src/routes/progress.tsx`)
    - Replace hand-rolled stat/achievement markup with shared `Card` (overview stats, per-road `Progress` bars, achievements grid); convert all English labels to Vietnamese ("Nhật ký phòng thí nghiệm", "Phân tử đã tạo", "Phản ứng đã kích hoạt", "Phân tử gần nhất", "Thành tích", "Đang tải…", "Quay lại Phòng thí nghiệm AR →"); fix the legacy `<Link to="/lab">` → `/lab/ar`
    - _Requirements: 18.8, 17.3, 22.2_

- [ ] 16. Feedback and language consistency (final pass)
  - [x] 16.1 Toast consistency via `sonner`
    - Route all transient feedback through the global `ui/sonner.tsx` Toaster (`toast.success/error/info`) with Vietnamese copy; standardize spawn/reaction/save notices and verify the AR camera-permission outcome toast (implemented in task 7.2) reads in Vietnamese
    - _Requirements: 21.2, 22.3_

  - [x] 16.2 Vietnamese label + accessible-name audit across remaining surfaces
    - Audit labels, headings, and messages on surfaces not already converted and replace any English with Vietnamese; ensure icon-only controls (reset, education toggle, AR toggle, status icons) carry an `aria-label`/`sr-only` accessible name and informative images have `alt`
    - _Requirements: 22.1, 23.3_

- [x] 17. UI/UX final checkpoint
  - Ensure `bun run build` exits 0 and emits `dist/`, and do a manual responsive smoke (desktop + mobile widths render usable layouts, hamburger opens, status badges render consistently across Learn/Road/Lesson), ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP. The optional test sub-tasks are 2.4 (Content_Store pure selectors) and 13.6 (lesson-status mapping + token contrast) — both pure-function smoke checks, no heavy/integration testing per scope.
- The build gate (`bun run build`) is the primary, end-to-end verification (Requirement 1) and gates each checkpoint, including the new UI/UX checkpoint (task 17).
- Each task references specific requirement clauses for traceability and points at concrete existing files.
- Foundation (Content_Store, App_State_Store) lands before consumers, so page wiring tasks have a stable API to call.
- UI/UX foundation (task 13: `lesson-status.ts`, `LessonStatusBadge`, design tokens, `motion.ts`, shared UI-state components) lands early so the per-page polish (task 15) and responsive/feedback tasks (14, 16) can reuse the single sources of truth instead of re-skinning per page.
- The Lab_Scene_Renderer split (5.2–5.4) and the lab routes (6.x/7.x) touch shared files; the dependency graph schedules same-file tasks into different waves to avoid conflicts.
- Same-file UI tasks are also separated across waves: `SiteHeader.tsx` (11.1 then 14.1), `progress.tsx` (10.9 then 15.8), `learn/road.tsx` (10.6 then 15.5), `learn/lesson.tsx` (10.7 then 15.6), `lab/ar.tsx` (7.1 → 14.2 → 15.7), `lab/sim.tsx` (6.1/6.2 → 15.7), and `tools/periodic-table.tsx` (10.8 then 14.3) run in different waves so polish builds on wired pages without conflict.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "5.1", "13.1", "13.3", "13.4"] },
    { "id": 1, "tasks": ["2.2", "5.2", "13.2", "13.5"] },
    { "id": 2, "tasks": ["2.3", "5.3", "13.6"] },
    { "id": 3, "tasks": ["2.4", "2.5", "5.4", "8.1"] },
    { "id": 4, "tasks": ["3.1", "7.2"] },
    { "id": 5, "tasks": ["6.1", "7.1"] },
    { "id": 6, "tasks": ["6.2", "7.3", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "10.8", "10.9", "11.1"] },
    { "id": 7, "tasks": ["14.1", "14.2", "14.3", "15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.8"] },
    { "id": 8, "tasks": ["15.7"] },
    { "id": 9, "tasks": ["16.1"] },
    { "id": 10, "tasks": ["16.2"] }
  ]
}
```


