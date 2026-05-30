# Design Document

## Overview

This design covers the end-to-end refactor of **ChemisARtry**, a high-school chemistry learning app. The work is two-layered, mirroring the requirements:

1. **Build restoration** — make the production build green so everything else is unblocked.
2. **Learning-path realization** — finish the migration to the learning-first route/UX structure (dashboard, two roads, 22 lessons, onboarding, progress, new navigation), backed by local seed data + localStorage for learning content while keeping Supabase for molecules/reactions/auth.

The design is deliberately anchored to the **current state of the repository**, not a greenfield. A direct build run shows the codebase has already advanced well past the "broken" snapshot captured in `build_error.txt`:

- `npx vite build` currently **succeeds** (`✓ built in ~13s`, client + server bundles emitted).
- `src/lib/pubchem-api.ts` is **already syntactically complete** (444→~470+ lines, all PUG-View types terminated) and exports the consumed symbols.
- The new route tree already exists: `routes/lab/{ar,sim,wet}.tsx`, `routes/learn/{road,lesson}.tsx`, `routes/learn.index.tsx`, `routes/tools/{periodic-table,explorer,molecules,reactions}.tsx`, plus `dashboard.tsx`, `onboarding.tsx`, `progress.tsx`.
- `routes/lab.tsx` is a layout `Outlet` and `routes/lab.index.tsx` is a redirect — so `/lab` resolves to exactly one handler.

Because of this, the design focuses on **closing the genuine gaps** rather than rebuilding what works:

| Area | Status today | Design action |
| --- | --- | --- |
| PubChem_Adapter completeness | Complete, build green | Guard against regression (build gate) |
| `/lab` duplicate route | Resolved (layout + redirect) | Keep; document the pattern |
| Route/navigation structure | Present | Verify all 15 routes resolve; align nav labels |
| Content_Store (local seed + localStorage) | **Missing** — progress is hardcoded to `0`, achievements read only Supabase counters | **Build it** |
| App_State_Store (global, no prop drilling) | **Missing** — lab state lives in `ar.tsx` local `useState` | **Build it** |
| Lab_Scene_Renderer shared util | Partial — `three-helpers.ts` exists but `ARScene.tsx` still has its **own** `buildMoleculeGroup` | Make ARScene consume the shared util |
| Sim_Mode (no camera) | **Stub** — `/lab/sim` redirects to `/lab/ar` | Render a real no-camera scene |
| AR_Mode | Working | Refactor to consume store + shared util |
| Wet_Lab | Working | Keep; ensure store integration where relevant |

## Detected Stack

React 19, TanStack Router/Start 1.16x (file-based routing), Vite 7, Three.js 0.184, MediaPipe Tasks-Vision 0.10, Supabase JS 2.x, Radix/Shadcn UI, Tailwind v4, Zod 3, `motion`, `sonner`. Build/runtime: Bun + `@cloudflare/vite-plugin` (Wrangler). No global state library is installed (only React Context in `components/ui`). Code examples below use **TypeScript/TSX**.

---

## Architecture

### High-level layers

```
┌──────────────────────────────────────────────────────────────┐
│ Routes (TanStack file-based)                                  │
│  /  /auth  /onboarding  /dashboard                            │
│  /learn  /learn/road  /learn/lesson                           │
│  /lab/{ar,sim,wet}                                            │
│  /tools/{periodic-table,explorer,molecules,reactions}         │
│  /progress                                                    │
└───────────────┬───────────────────────────┬──────────────────┘
                │                           │
     ┌──────────▼──────────┐     ┌──────────▼───────────┐
     │ App_State_Store      │     │ Content_Store         │
     │ (lab + session UI)   │     │ (lessons/roads/       │
     │  store/app-store.ts  │     │  progress/streak/     │
     └──────────┬──────────┘     │  achievements)        │
                │                │  lib/content-store.ts │
                │                │  hook useContentStore  │
                │                └──────────┬───────────┘
                │                           │
     ┌──────────▼───────────────────────────▼──────────┐
     │ Domain libs                                       │
     │  lessons-data.ts (22 lessons seed)                │
     │  three-helpers.ts (buildMoleculeGroup, burst…)    │
     │  reaction-engine.ts (rule matching)               │
     │  pubchem-api.ts (search/3D/description)           │
     │  chemistry.ts / chemistry-api.ts                  │
     └──────────┬───────────────────────────┬──────────┘
                │                           │
     ┌──────────▼──────────┐     ┌──────────▼──────────┐
     │ Supabase             │     │ Browser localStorage │
     │ molecules/reactions/ │     │ chemisartry.* keys   │
     │ auth/user_progress   │     │ (learning content)   │
     └─────────────────────┘     └─────────────────────┘
```

### Data ownership boundary

- **Supabase owns**: authentication, `molecules`, `reactions`, and the existing `user_progress` counters (`molecules_spawned`, `reactions_triggered`, `last_molecule`). No schema changes, no new SQL.
- **localStorage owns** (via Content_Store): lesson progress, mission completion, grade level, starting road, onboarding completion, streak, and derived achievements for learning.
- **Chemistry_Data_Service** (`useChemistryData`) remains the only reader of Supabase chemistry data and is untouched by Content_Store.

---

## Components and Interfaces

### 1. Build Restoration (Requirement 1)

The foundational requirement is already satisfied by the current tree, so the design's job is to **keep it green and prevent regression**.

- **PubChem_Adapter (`src/lib/pubchem-api.ts`)** — verified complete: exported types (`PubChemCompoundSummary`, `PubChemSearchResult`, `PubChemAutocompleteResult`, `PubChemMolecule3D`, `PubChemDescription`) and exported functions (`searchPubChem`, `autocompletePubChemCompound`, `fetchMolecule3D`, `fetchCompoundDescription`) plus error class `PubChemNotFoundError`. The PUG-View type block (`PugViewResponse`, `PugViewSection`) is terminated. All consumers resolve:
  - `hooks/use-pubchem-search.ts` → `searchPubChem`, `autocompletePubChemCompound`, `fetchMolecule3D`, `fetchCompoundDescription`, types.
  - `hooks/use-pubchem-enrichment.ts`, `hooks/use-element-compounds.ts`, `components/PubChemSearch.tsx`, `components/ElementDetail.tsx`, `routes/tools/{molecules,explorer}.tsx` → `searchPubChem`, `PubChemCompoundSummary`.
  - Dependency `src/lib/translate.ts` (`translateToVietnamese`) exists and is complete.
- **`/lab` single registration** — `routes/lab.tsx` renders `<Outlet/>` (layout for `/lab/*`); `routes/lab.index.tsx` (`/lab/`) is a `<Navigate to="/dashboard" search={{ tab: "lab" }} />`. The generated `routeTree.gen.ts` confirms exactly one `LabRoute` parent with children `ar/sim/wet/index`.
- **Build gate** — the canonical verification is `bun run build` (equivalently `npx vite build`), which must exit `0` and emit `dist/`. This is the acceptance check for AC 1.5.

**Design rule going forward:** any module that imports a symbol from `pubchem-api.ts` must have that symbol exported (AC 1.6). New PubChem needs are added as named exports; no default export is introduced.

### 2. Routing and Navigation (Requirement 2)

The route set is complete in `routeTree.gen.ts`. Design specifies the canonical mapping and the navigation contract.

**Route resolution table (AC 2.4):**

| URL | File | Component role |
| --- | --- | --- |
| `/` | `routes/index.tsx` | Landing (redirects authed → `/dashboard`) |
| `/auth` | `routes/auth.tsx` | Sign in/up |
| `/onboarding` | `routes/onboarding.tsx` | 3-step first run |
| `/dashboard` | `routes/dashboard.tsx` | Post-login home |
| `/learn` | `routes/learn.tsx` (Outlet) + `routes/learn.index.tsx` | Roads overview |
| `/learn/road?roadId=1\|2` | `routes/learn/road.tsx` | Road lessons by chapter |
| `/learn/lesson?lessonId=…` | `routes/learn/lesson.tsx` | Lesson (3 tabs) |
| `/lab/ar` | `routes/lab/ar.tsx` | AR mode |
| `/lab/sim` | `routes/lab/sim.tsx` | Sim mode (no camera) |
| `/lab/wet` | `routes/lab/wet.tsx` | Wet lab |
| `/tools/periodic-table` | `routes/tools/periodic-table.tsx` | Periodic table |
| `/tools/explorer` | `routes/tools/explorer.tsx` | PubChem explorer |
| `/tools/molecules` | `routes/tools/molecules.tsx` | Molecule library |
| `/tools/reactions` | `routes/tools/reactions.tsx` | Reactions list |
| `/progress` | `routes/progress.tsx` | Progress + achievements |

> Note on params: the project models `:roadId` / `:lessonId` from the UX spec as **search params** (`/learn/road?roadId=1`, `/learn/lesson?lessonId=road1-lesson3`) rather than path params, validated with Zod (`validateSearch`). This satisfies the intent of Requirement 2.4/8/9 (each road/lesson resolves to its page) and matches the existing, building implementation. The design keeps this convention to avoid churn; path-param URLs are not required by acceptance criteria as long as each road/lesson resolves.

**Navigation_Bar (`components/SiteHeader.tsx`)** contract:

- Authenticated **or** on an app route (`showAppMenu`): primary links Học (`/learn`), Phòng thí nghiệm (`/lab/ar`), Bảng tuần hoàn (`/tools/periodic-table`), Tools dropdown, Tiến độ (`/progress`), and avatar menu (Dashboard, Tiến độ, sign-out). (AC 2.1)
- Unauthenticated landing: Đăng nhập + Thử miễn phí entry points. (AC 2.2)
- Tools dropdown links to all four utility pages: Explorer, Molecules, Reactions (and Periodic Table is also a top-level link). (AC 2.3)
- Selecting a destination navigates via TanStack `<Link>`. (AC 2.6)

Legacy paths (`/periodic-table`, `/molecules`, `/reactions`, `/search`, `/lab`) are migrated; `/lab` redirects to dashboard, and any remaining legacy deep-links are handled by adding thin redirect routes only if discovered during implementation (AC 2.5). No legacy route files remain in `routes/`.

### 3. Content_Store (Requirements 5, 7, 8, 9, 10, 15) — **new module**

The single biggest gap. Today, road/lesson progress is hardcoded (`progress={0}`, `status = i === 0 ? "active" : "locked"`), onboarding writes ad-hoc `localStorage` keys, and achievements read only Supabase counters. The Content_Store centralizes all learning state in localStorage with a typed, backend-free API.

**Files:**
- `src/lib/content-store.ts` — pure read/write/compute logic over `localStorage`.
- `src/hooks/use-content-store.ts` — React hook wrapping the store with reactive state (via `useSyncExternalStore`).

**Storage schema (single namespaced key, JSON):**

```ts
// localStorage key: "chemisartry.content.v1"
interface ContentState {
  onboardingComplete: boolean;
  gradeLevel: "10" | "11" | "12" | "self" | null;
  startingRoad: 1 | 2 | "free" | null;
  // lessonId -> status; "in-progress" set on open, "completed" set when missions done
  lessons: Record<string, { status: "in-progress" | "completed"; missions: string[] /* completed mission ids */ }>;
  // ISO date strings (yyyy-mm-dd) of days with recorded activity, for streak
  activityDates: string[];
  // lab counters mirrored locally so achievements work offline / for guests
  moleculesSpawned: number;
  reactionsTriggered: number;
}
```

**Public API (`content-store.ts`):**

```ts
export function readContent(): ContentState;            // returns defaults if absent/corrupt
export function writeContent(next: ContentState): void; // persists + notifies subscribers
export function subscribe(cb: () => void): () => void;   // for useSyncExternalStore

// Mutations (each persists + records activity date + recomputes derived values)
export function setOnboarding(grade: ContentState["gradeLevel"], road: ContentState["startingRoad"]): void;
export function markLessonOpened(lessonId: string): void;      // AC 9.6 -> in-progress
export function completeMission(lessonId: string, missionId: string): void; // AC 9.7 contributor
export function markLessonCompleted(lessonId: string): void;   // when all missions done
export function recordSpawn(formula: string): void;            // local mirror of lab activity
export function recordReaction(): void;

// Derived selectors (pure, computed from ContentState + lessons-data seed)
export function getRoadProgress(roadId: 1 | 2): { completed: number; total: number; percent: number };
export function getLessonStatus(lessonId: string): "locked" | "current" | "completed" | "in-progress";
export function getCurrentLesson(): Lesson | null;             // first in-progress, else first incomplete
export function getStreak(): number;                           // consecutive days ending today
export function getAchievements(): AchievementView[];          // obtained/locked from activity
```

**Seed data** comes from existing `src/lib/lessons-data.ts` (`ROAD1_LESSONS` 12, `ROAD2_LESSONS` 10, `ALL_LESSONS`, `getLessonById`, `getLessonsByRoad`). The Content_Store does **not** duplicate lesson content; it stores only *state about* lessons. (AC 10.1)

**Lesson status derivation (AC 8.2):** within a road, lessons are ordered by `order`. A lesson is:
- `completed` if `lessons[id].status === "completed"`.
- `current` if it is the lowest-order non-completed lesson in the road (or it is explicitly `in-progress`).
- `locked` otherwise (higher than current). Road 2 is **soft-locked**: still navigable even while Road 1 is incomplete (AC 7.4) — locking is presentational only; `getLessonStatus` never blocks navigation, the UI shows lock styling but allows "Bỏ qua và học".

**Streak (AC 10.3):** `getStreak` counts consecutive calendar days with an entry in `activityDates`, ending today (or yesterday to tolerate timezone). Any mutation calls an internal `touchToday()` that adds today's date.

**Achievements (AC 10.4, 15.3, 15.4):** computed from `moleculesSpawned`, `reactionsTriggered`, and lessons-completed count. The existing six lab achievements (First Spark, Apprentice Alchemist, Bench Chemist, Reaction!, Reactor Core, Nobel Nominee) are retained and extended with learning achievements (e.g., "First Lesson", "Road 1 Complete"). Each returns `{ id, label, desc, icon, obtained }`.

**Backend independence (AC 10.5):** all selectors read synchronously from the in-memory snapshot hydrated from localStorage; no `fetch`/Supabase call is issued on the learning-data path. `useChemistryData` remains the separate Supabase path (AC 10.6) and is unchanged.

**Hook usage:**

```tsx
const { state, roadProgress, currentLesson, streak, achievements,
        markLessonOpened, completeMission } = useContentStore();
```

`use-content-store.ts` uses `useSyncExternalStore(subscribe, () => snapshotRef)` so all pages re-render consistently when the store changes (e.g., completing a mission in the lab updates the dashboard).

### 4. App_State_Store (Requirement 16) — **new module**

Today `routes/lab/ar.tsx` holds ~10 `useState` values (selected, toSpawn, resetSignal, education, arOn, headTracking, lastReaction, history, doneMissions, spawnedFormulas) and threads them into `ARScene` and `ControlPanel`. The Sim mode will need the same. To avoid duplicating this and prop-drilling, a lightweight global store holds the **shared lab/learning session state**.

**Implementation:** a dependency-free store using `useSyncExternalStore` (no new package). File `src/store/app-store.ts`.

```ts
interface LabSession {
  selected: Molecule | null;
  toSpawn: Molecule | null;
  resetSignal: number;
  education: boolean;
  arOn: boolean;
  headTracking: boolean;
  lastReaction: Reaction | null;
  history: Reaction[];          // recent reactions (capped)
  activeLessonId: string | null; // lesson context when entering lab from a lesson
  doneMissions: string[];
  spawnedFormulas: string[];
}

interface AppState { lab: LabSession; }

export const appStore = {
  getSnapshot(): AppState,
  subscribe(cb: () => void): () => void,
  // actions
  setSelected(m: Molecule | null): void,
  requestSpawn(m: Molecule): void,        // sets toSpawn + records spawn
  clearSpawn(): void,                      // onSpawned
  resetScene(): void,                      // bumps resetSignal, clears history
  toggleEducation(): void,
  setArOn(v: boolean): void,
  toggleHeadTracking(): void,
  pushReaction(r: Reaction): void,         // sets lastReaction, prepends history
  enterLessonContext(lessonId: string | null): void,
  completeMission(missionId: string): void,
};

export function useAppStore<T>(selector: (s: AppState) => T): T; // useSyncExternalStore + selector
```

**Consumption rules (AC 16.1, 16.2):**
- `routes/lab/ar.tsx`, `routes/lab/sim.tsx`, and `routes/learn/lesson.tsx` read/update shared session state via `useAppStore`/`appStore` actions instead of local `useState` + props.
- `ControlPanel` and `ARScene` receive a minimal interface (or read from the store directly) rather than a long prop chain.
- Lesson → lab handoff (currently `?lesson=` search param + `sessionStorage.pendingSpawn`) is replaced/augmented by `enterLessonContext` so mission completion in the lab flows back to Content_Store via `completeMission` → `content-store.completeMission`.

**Bridge to Content_Store:** lab actions that constitute learning activity (`requestSpawn`, `pushReaction`, `completeMission`) also call the corresponding Content_Store mutation so progress, streak, and achievements update. The App_State_Store is ephemeral session state; the Content_Store is the persistent record.

### 5. Lab_Scene_Renderer (Requirement 16.3, 16.4) — **dedup**

`src/lib/three-helpers.ts` already exports the canonical shared utilities: `buildMoleculeGroup(m, withLabels)`, `makeBond`, `makeTextSprite`, `spawnBurst`, `createChemistryLights`, and the `SpawnedMol` type. However, `components/ARScene.tsx` still defines its **own** `buildMoleculeGroup`, `makeBond`, `makeTextSprite`, and `spawnBurst`.

**Design action:** make `ARScene` (and the new Sim scene) import these from `three-helpers.ts`, deleting the in-file duplicates. ARScene's local `buildMoleculeGroup` adds `mesh.userData = { isAtom, el }` for hover tooltips; the shared util is updated to attach that `userData` too, so a single implementation serves both.

```ts
// three-helpers.ts buildMoleculeGroup — add atom userData so hover/raycast works everywhere
mesh.userData = { isAtom: true, el: a.el };
```

ARScene's richer reaction-animation sprites (`spawnShockwave`, `spawnEquationSprite`, `roundRect`, head-coupled `applyOffAxisProjection`) are AR-specific and stay in ARScene (or move to a dedicated `lib/ar-effects.ts`), but the **molecule-group building** is unified (AC 16.3, 16.4).

**ARScene split (size reduction):** `ARScene.tsx` (~1000+ lines) is decomposed for maintainability:
- `lib/three-helpers.ts` — molecule group + generic effects (shared). *(exists)*
- `lib/ar-effects.ts` — `spawnShockwave`, `spawnEquationSprite`, off-axis projection helpers (AR-only).
- `hooks/use-hand-controls.ts` — encapsulates the per-frame hand→world mapping, grab/pinch, two-hand scale, proximity reaction loop.
- `components/ARScene.tsx` — thin orchestrator: sets up renderer/scene/camera, wires the loop, renders overlay HUD.

This split is incremental and behavior-preserving; the public `ARScene` props stay compatible so `ar.tsx` keeps working during refactor.

### 6. Sim_Mode (Requirement 11) — **replace the stub**

Currently `/lab/sim` throws `redirect({ to: "/lab/ar" })`. The design makes it a **real no-camera scene**.

The cleanest approach reuses `ARScene` with `arOn={false}` because ARScene already supports mouse interaction independent of the camera: it has `pointerdown/move/up` handlers that raycast and drag molecules on the `z=0` plane, mouse-rotates grabbed molecules, and runs the same proximity reaction check. With `arOn=false`, no `getUserMedia` is requested and no MediaPipe is loaded.

**`routes/lab/sim.tsx` design:**

```tsx
function LabSimPage() {
  const { lesson: lessonParam, spawn, element } = Route.useSearch();
  const { molecules, reactions, loading } = useChemistryData();
  // shared session via App_State_Store
  const arOn = false; // never request camera (AC 11.1)
  // ...same spawn/reset/reaction handlers as AR, but arOn fixed false...
  return (
    <ARScene
      molecules={molecules} reactions={reactions}
      toSpawn={toSpawn} onSpawned={clearSpawn}
      resetSignal={resetSignal} educationMode={education}
      onReaction={handleReaction} arOn={false}
    />
    /* + ControlPanel with a "Chuyển sang AR" control (AC 11.6) */
  );
}
```

- AC 11.2: spawning adds the molecule via `buildMoleculeGroup` (shared util).
- AC 11.3: drag rotates / scroll zooms — handled by ARScene pointer handlers + camera; if scroll-zoom is not yet wired for non-AR, add a `wheel` listener adjusting `camera.position.z`.
- AC 11.4: two reactants meeting within `PROXIMITY_THRESHOLD` triggers `findMatchingReaction`, removes reactants, spawns products, shows the reaction banner.
- AC 11.5: Reset removes all spawned molecules (`resetSignal`).
- AC 11.6: a button links to `/lab/ar`.

`ar.tsx` provides the AC 12.7 reverse control (link to `/lab/sim`).

### 7. AR_Mode (Requirement 12)

`routes/lab/ar.tsx` is functional. Design changes are integration-only:
- Source shared session state from App_State_Store (AC 16.2).
- Use the unified `buildMoleculeGroup` via the de-duplicated ARScene (AC 16.4).
- Confirmed behaviors retained: enabling AR requests camera + initializes MediaPipe `HandLandmarker`, then renders the Three.js overlay (AC 12.2); pinch within grab range moves a molecule (AC 12.3); two-hand pinch scales by inter-hand distance (AC 12.4); proximity reaction removes reactants/spawns products/shows result (AC 12.5); switch-to-Sim control present (AC 12.7).
- **Camera-denied path (AC 12.6):** ARScene's camera `catch` sets a status string today. Design upgrades this to a `toast` notification and keeps the scene operable without the overlay (molecules still spawn/drag via mouse, `arOn` effectively degrades to sim behavior). No unhandled rejection.

### 8. Wet_Lab (Requirement 13)

`routes/lab/wet.tsx` + `components/WetLabScene.tsx` exist and render. Design keeps them, ensures the Three.js scene initializes without unhandled runtime error (AC 13.2) and that control interactions update the scene (AC 13.3). Wet lab is largely independent; only the "first-run tutorial" localStorage key is left as-is (it is orthogonal to Content_Store).

### 9. Reaction_Engine (Requirement 11.4, 12.5)

`src/lib/reaction-engine.ts` is unchanged in behavior:
- `findMatchingReaction(formulasPresent, reactions)` returns the first reaction whose `reactants` multiset is a subset of the formulas currently present (order-independent, consuming matches).
- `PROXIMITY_THRESHOLD = 1.8` world units governs when two molecules are "close enough" in the scenes.

Both Sim and AR scenes call this identically, so reaction behavior is consistent across modes.

### 10. Pages (Requirements 3, 4, 5, 6, 7, 8, 9, 14, 15)

**Landing (`/`, R3):** static; redirects authed users to `/dashboard`. Primary CTA → `/auth?mode=signup` (AC 3.2); secondary guest CTA → `/lab/sim` (AC 3.3 — update existing links that point to `/lab/ar` so the guest entry is the no-camera mode); roads preview + 3 highlighted capabilities (AC 3.4).

**Auth (`/auth`, R4):** Supabase email/password sign-in/up (AC 4.1) + Google OAuth (AC 4.2); sign-up with session → `/onboarding` (AC 4.3); sign-in → `/dashboard` (AC 4.4); failure → `toast.error` and stay (AC 4.5); submit disabled while `busy` (AC 4.6). Already implemented; design keeps it.

**Onboarding (`/onboarding`, R5):** 3 steps (grade, starting road, intro) (AC 5.1). Rewire the finish handler to call `contentStore.setOnboarding(grade, road)` (AC 5.2, 5.3) instead of ad-hoc keys, then navigate to `/dashboard` (AC 5.4). Guard re-entry: if `readContent().onboardingComplete`, redirect to `/dashboard` in `beforeLoad` (AC 5.5).

**Dashboard (`/dashboard`, R6):** authed home. Replace hardcoded `progress={0}` with `useContentStore()` data:
- Continue-learning card from `getCurrentLesson()` → navigates to that lesson (AC 6.2); if no road started, card → first lesson of Road 1 (AC 6.3); if Road 1 complete, surface Road 2 (AC 6.4).
- Quick stats: lessons completed, reactions triggered, streak (AC 6.5) — streak/⭐ counters currently show `0`, wired to `getStreak()` and counters.
- Recent achievements from `getAchievements()` (AC 6.6).
- Quick-access links to AR (`/lab/ar`), Periodic Table, Explorer (AC 6.7).

**Learning overview (`/learn`, R7):** `learn.index.tsx` shows both roads. Add real progress per road from `getRoadProgress` (AC 7.1, 7.2); continue/start navigates to the road page (AC 7.3); Road 2 soft-locked but enterable (AC 7.4).

**Road page (`/learn/road`, R8):** group lessons by `chapter` (already done). Replace the TODO `status = i===0 ? active : locked` with `getLessonStatus(lesson.id)` (AC 8.2); accessible lessons navigate to the lesson page (AC 8.3); back link to `/learn` (AC 8.4); progress bar from `getRoadProgress`.

**Lesson page (`/learn/lesson`, R9):** three tabs already present (Lý thuyết / Khám phá 3D / Thực hành). Wire:
- Content from `lessons-data` seed (AC 9.2) — already.
- Khám phá 3D renders `AtomViewer3D` for selected element (AC 9.3) — already; molecules link to tools.
- Thực hành lists missions and launches Sim/AR pre-loaded with `practice.defaultMolecules` and lesson context (AC 9.4): the practice cards link to `/lab/sim?lesson=…` and `/lab/ar?lesson=…`; on entry the lab calls `appStore.enterLessonContext(lessonId)` and preloads default molecules.
- Inline quiz indicates correct/incorrect on answer (AC 9.5) — already.
- On open, `markLessonOpened(lessonId)` → in-progress (AC 9.6); when all missions complete, `markLessonCompleted` (AC 9.7).
- Prev/next navigation within road (AC 9.8) — already.

**Tools (R14):** Periodic table grid + detail (AC 14.1); Explorer searches PubChem via adapter with 3D preview (AC 14.2); Molecules library from `useChemistryData` with category filter + search (AC 14.3); Reactions list from `useChemistryData` with detail (AC 14.4). Lab links: selecting a tool result that links into the lab navigates to the practice mode with `?spawn=` / `?element=` (AC 14.5), resolved by `resolveLabSpawn`.

**Progress (`/progress`, R15):** currently English-labeled and Supabase-only. Redesign to read Content_Store:
- Lessons completed out of 22, streak, molecules spawned, reactions triggered (AC 15.1).
- Road 1 / Road 2 percentages from `getRoadProgress` (AC 15.2).
- Achievement set with obtained/locked from `getAchievements()` (AC 15.3); unlock conditions evaluated from activity (AC 15.4).
- Fix the stray `<Link to="/lab">` (legacy) → `/lab/ar`.

---

## UI/UX Design System & Layout

This section addresses Requirements 17–23. The audience is **Vietnamese high-school students**, so the bar is: coherent visual language, predictable layouts that match the UX spec, readable on phones, clear feedback, and Vietnamese throughout. The stack is already in place — **Radix/Shadcn** components in `src/components/ui`, **Tailwind v4** theme tokens in `src/styles.css`, the **`motion`** library, and **`sonner`** for toasts — so the design reuses what exists rather than introducing new systems. The principle is *reuse and centralize, do not re-skin per page*.

### 11. Design tokens (Requirement 17)

All tokens already live in **one place**: `src/styles.css` (`:root` CSS variables + the Tailwind v4 `@theme inline` block). The design's rule is that no page hardcodes raw colors/sizes — every surface reads these tokens through Tailwind classes (`bg-background`, `text-foreground`, `text-primary`, `rounded-2xl`, etc.). (AC 17.1, 17.2)

**Color palette (existing `:root`, oklch):**

| Token | Value (light) | Role |
| --- | --- | --- |
| `--background` / `--foreground` | `oklch(0.985 …)` / `oklch(0.22 …)` | page bg / body text |
| `--card` / `--card-foreground` | white / `oklch(0.22 …)` | surfaces |
| `--primary` / `--primary-foreground` | `oklch(0.62 0.17 220)` teal-blue / near-white | primary actions, "current" accent |
| `--secondary`, `--muted`, `--muted-foreground` | soft teal / grey | secondary surfaces, "locked" text |
| `--accent` | `oklch(0.88 0.12 85)` warm sun | highlights |
| `--destructive` | `oklch(0.62 0.22 25)` red | errors |
| `--border`, `--input`, `--ring` | grey-blue / primary | outlines, focus ring |
| `--lab-sky / -mint / -sun / -coral / -lavender` | accent set | lab/status accents (mint = success/completed) |

A `.dark` override block exists; the design keeps light as default and does not add new color primitives — it composes existing ones.

**Typography scale:** three font families are defined as tokens — `--font-display` (Space Grotesk, used by `h1–h4` via the base layer), `--font-body` (Inter, body), `--font-mono` (JetBrains Mono). Size/weight come from Tailwind's default type scale (`text-sm…text-4xl`, `font-medium/bold`). Headings use `font-display` automatically; the design standardizes page titles on `text-3xl`/`text-4xl font-display font-bold` (matching Dashboard/Progress today). (AC 17.1)

**Spacing & radius scale:** Tailwind's 4px spacing scale is the single scale (`gap-1…gap-10`, `p-4…p-10`). Radius derives from one base token `--radius: 1rem` (`rounded-2xl`/`rounded-3xl` are the standard surface radii already used across cards). Shadows are tokenized: `shadow-soft`, `shadow-panel`, `shadow-glow`. (AC 17.1)

**Lesson status mapping — single source of truth (AC 17.4):** today the status visuals are ad-hoc (Road page uses a TODO `i === 0 ? "active" : "locked"`, and `styles.css` has `node-*` classes). The design adds **`src/lib/lesson-status.ts`** as the one definition consumed by the Learning_Path_Overview, the Road_Page, and the Lesson_Page:

```ts
// src/lib/lesson-status.ts
export type LessonStatus = "completed" | "current" | "locked";

export interface StatusVisual {
  icon: string;        // emoji glyph
  label: string;       // Vietnamese label
  colorClass: string;  // Tailwind token classes (text + bg/border)
  iconLabel: string;   // accessible name for the icon (AC 23.3)
}

export const LESSON_STATUS_VISUAL: Record<LessonStatus, StatusVisual> = {
  completed: { icon: "✅", label: "Hoàn thành", colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200", iconLabel: "Đã hoàn thành" },
  current:   { icon: "▶",  label: "Đang học",   colorClass: "text-primary bg-primary/10 border-primary/30",     iconLabel: "Bài hiện tại" },
  locked:    { icon: "🔒", label: "Đã khoá",    colorClass: "text-muted-foreground bg-muted/50 border-border",  iconLabel: "Đã khoá" },
};

// total, deterministic accessor used by every page
export function statusVisual(status: LessonStatus): StatusVisual {
  return LESSON_STATUS_VISUAL[status];
}
```

`getLessonStatus` (Content_Store) returns the status; `statusVisual` maps it to the shared icon/color/label. The three pages render a single `<LessonStatusBadge status=… />` built on the shared Shadcn `Badge`, so completed = green ✅, current = primary ▶, locked = grey 🔒 everywhere. The Content_Store's extra `in-progress` is treated as `current` for display. Color choice maps onto existing tokens (emerald/mint for success, `--primary` for current, `--muted-foreground` for locked). (AC 17.4)

### 12. Shared component reuse (Requirement 17.3)

The shared set already exists under `src/components/ui` (Radix/Shadcn). The design's convention: **common elements are always imported from this set**, never re-implemented per page.

| Element | Shared module | Standard usage |
| --- | --- | --- |
| Button | `ui/button.tsx` | all actions/CTAs; variants `default` (gradient/primary), `outline`, `ghost`; sizes `sm/default/lg`; `rounded-full` for pills |
| Card | `ui/card.tsx` | every panel/surface (dashboard cards, road cards, stat cards, achievement tiles) |
| Input / Label | `ui/input.tsx`, `ui/label.tsx` | auth form, search fields |
| Badge | `ui/badge.tsx` | lesson status badge, tags ("Thuộc bài học X") |
| Dialog | `ui/dialog.tsx` | molecule/reaction detail, reaction-occurred modal |
| Tabs | `ui/tabs.tsx` | Lesson_Page 3 tabs (Lý thuyết / Khám phá 3D / Thực hành) |
| Dropdown / Popover | `ui/dropdown-menu.tsx`, `ui/popover.tsx` | nav Tools menu, avatar menu (already used in SiteHeader) |
| Sheet | `ui/sheet.tsx` | mobile hamburger drawer (Requirement 19.2) |
| Skeleton | `ui/skeleton.tsx` | loading states (Requirement 20.1) |
| Breadcrumb | `ui/breadcrumb.tsx` | Lesson_Page trail (Requirement 21.1) |
| Sonner Toaster | `ui/sonner.tsx` | global toasts (Requirement 21.2) |

Audit action during implementation: replace any page-local button/card/input markup with the shared component (e.g., Progress page's hand-rolled stat/achievement tiles become `Card`-based). (AC 17.3)

### 13. Page layouts aligned to the UX spec (Requirement 18)

Layouts mirror the wireframes in `chemisartry-ux-spec.md`. Component structure (not full code):

**Landing `/` — five sections (AC 18.1):**
```
<SiteHeader/>            (unauth variant: Đăng nhập + Thử miễn phí)
1 Hero        — headline + 2 CTA (primary → /auth?mode=signup, secondary → /lab/sim) + hero image
2 Problem     — SGK 2D  →  ChemisARtry 3D framing
3 Roads preview — Road 1 / Road 2 cards + "Xem toàn bộ lộ trình"
4 Capabilities — 3 highlight cards (🧪 AR · 📚 Bài học · 🏆 Thành tích)
5 Closing CTA — "Tạo tài khoản miễn phí"
<SiteFooter/>
```

**Auth `/auth` — split two columns on desktop (AC 18.2):**
```
md:grid-cols-2  →  [ preview panel (mini AR loop + social proof) | auth Card (Google · email/password · switch sign-in/up) ]
mobile: single column, preview panel hidden (hidden md:block)
```

**Dashboard `/dashboard` (AC 18.3):**
```
Greeting "Chào …, <tên>! 👋"
grid md:grid-cols-[2fr_1fr]:
  left  → Continue-learning Card  +  "Chưa bắt đầu / Road tiếp theo" Card
  right → Quick stats Card (bài đã học · phản ứng · streak 🔥) + Recent achievements
Quick access row → [🔬 AR Lab] [📊 Bảng tuần hoàn] [🔍 Khám phá]
```

**Learn overview `/learn` — two road cards (AC 18.4):** each `Card` shows title, subtitle (số bài · thời lượng), a Shadcn `Progress` bar from `getRoadProgress`, and a start/continue `Button`. Road 2 rendered soft-locked (muted styling + "Bỏ qua và học").

**Road page `/learn/road?roadId=` — lessons grouped by chapter (AC 18.5):**
```
back link → /learn      +  road title + Progress bar
for each chapter:
  <h2> CHƯƠNG n: … </h2>
  Card → list of lesson rows:  [LessonStatusBadge] Bài k — title           [Xem/Học/Khoá]
```
Each row's status comes from `getLessonStatus` → `statusVisual` (shared mapping from §11).

**Lesson page `/learn/lesson?lessonId=` (AC 18.6):**
```
Header: back-to-road · breadcrumb · "k/total"
<Tabs> Lý thuyết | Khám phá 3D | Thực hành </Tabs>
footer: [← Bài trước]            [Bài tiếp theo →]
```

**Sim/AR `/lab/sim` · `/lab/ar` — control sidebar + scene (AC 18.7):**
```
grid md:grid-cols-[320px_1fr]:
  left  → ControlPanel (chọn phân tử · đã spawn · Reset · Education · chuyển Sim↔AR)
  right → 3D scene (ARScene)  + reaction banner
mobile: sidebar collapses above/over the scene (Sheet or stacked)
```

**Progress `/progress` (AC 18.8):**
```
Overview stats (bài đã học /22 · streak · phân tử · phản ứng)
Per-road Progress bars (Road 1 / Road 2 %)
Achievements grid (obtained/locked tiles)
```

### 14. Responsive strategy (Requirement 19)

Use Tailwind's default breakpoints — `sm 640 · md 768 · lg 1024 · xl 1280`. The design treats **`md` (768px)** as the desktop/mobile divide for navigation and split layouts.

- **Navigation collapse (AC 19.2):** `SiteHeader.tsx` currently renders the primary `<nav>` as `hidden md:flex` with **no mobile menu** — a gap. The design adds a mobile hamburger using the existing `ui/sheet.tsx`: below `md`, show a hamburger `Button` (Menu icon) that opens a `Sheet` drawer listing the same destinations (Học tập, Phòng thí nghiệm, Lab ướt, Bảng tuần hoàn, Công cụ items, Tiến độ) and the auth/avatar actions. The desktop `<nav>` stays `hidden md:flex`.
- **AR on mobile (AC 19.3):** in `routes/lab/ar.tsx`, when viewport `< md` (matchMedia), render an advisory banner ("AR cần nhiều tài nguyên — khuyến nghị dùng Mô phỏng 3D trên điện thoại") with a prominent button to `/lab/sim`, before/over the camera-enable control. AR remains usable but Sim is the recommended path.
- **Periodic table on mobile (AC 19.4):** `routes/tools/periodic-table.tsx` grid wraps in an `overflow-x-auto` container (with `.no-scrollbar` optional) so the grid scrolls horizontally instead of squashing; element cells keep a min width.
- **General (AC 19.1):** split layouts use `grid md:grid-cols-…` that collapse to single column on mobile; tap targets ≥ 40px; container max-widths (`max-w-5xl/6xl`) with `px-4 md:px-6`.

### 15. UI states (Requirement 20)

Shared, reusable patterns (not per-page bespoke):

- **Loading (AC 20.1):** prefer Shadcn `Skeleton` placeholders for content regions; a centered spinner/`"Đang tải…"` only for full-page waits. Replace bare `"Loading…"` text (e.g., Progress page) with this pattern.
- **Empty (AC 20.2):** a small shared `EmptyState` (icon + Vietnamese message + next-action button), e.g., Molecules/Reactions/Explorer with no results → "Không có kết quả — thử từ khoá khác".
- **Error + retry (AC 20.3):** a shared `ErrorState` (message + "Thử lại" button) wired to the hook's refetch; used where `useChemistryData`/PubChem hooks expose `error`.
- **Hover/active (AC 20.4):** buttons/links use the Design_System hover/active utilities already baked into `ui/button.tsx` variants and `NavLink` (`hover:bg-muted/50`, active `bg-primary/10`); no page-specific hover colors.
- **Disabled while processing (AC 20.5):** controls take a `disabled` bound to an in-flight flag (the Auth submit already does `disabled={busy}`); the convention extends to spawn/reset/save actions so a control is disabled until its action resolves.

### 16. Navigation feedback & motion (Requirement 21)

- **Breadcrumb (AC 21.1):** the Lesson_Page renders the existing `ui/breadcrumb.tsx` as `Dashboard › Học tập › Road n › Bài k: <title>` (links to `/dashboard`, `/learn`, the road page; current lesson is `BreadcrumbPage`). A small helper builds the trail from `(roadId, lessonId)` + lesson title.
- **Toasts (AC 21.2):** all transient feedback goes through `sonner` (`toast.success/error/info`) via the global `ui/sonner.tsx` Toaster. Standard cases: auth success/failure (already), spawn/reaction notices, and the **camera-permission outcome** in AR (`toast.error("Không truy cập được camera…")` / `toast.info`). This replaces the current inline status string in ARScene.
- **Motion ≤ 400ms (AC 21.3):** animations use the installed `motion` library. The design centralizes presets in a small `src/lib/motion.ts` (e.g., `fadeUp`, `popIn`) with `duration: 0.3` (≤ 0.4s) and gentle easing, reused across page/section entrances. Existing CSS keyframe utilities (`animate-node-pop` 0.4s, `animate-star-fly` 0.7s for celebratory moments) remain for non-essential flourishes but page-level transitions stay ≤ 400ms.
- **Reduced motion (AC 21.4):** presets read `prefers-reduced-motion`; when reduced, durations collapse to ~0 / opacity-only (no transform/parallax). A `useReducedMotion` (from `motion`) guard wraps non-essential animations; essential state changes still render instantly.

### 17. Vietnamese consistency (Requirement 22)

Most surfaces are already Vietnamese (SiteHeader, auth, lesson data). The known offender is **`routes/progress.tsx`**, which still uses English: page `head` title, `"Your lab journal"`, `"Molecules spawned"`, `"Reactions triggered"`, `"Last molecule"`, `"Achievements"`, `"Loading…"`, and `"Back to the AR Lab →"`, plus English achievement labels/descriptions. The design converts all of these to Vietnamese (e.g., "Nhật ký phòng thí nghiệm", "Phân tử đã tạo", "Phản ứng đã kích hoạt", "Phân tử gần nhất", "Thành tích", "Đang tải…", "Quay lại Phòng thí nghiệm AR →") and fixes the legacy `<Link to="/lab">` → `/lab/ar`. (AC 22.1–22.3) Toast messages are authored in Vietnamese (AC 22.3). Achievement label/desc strings centralized in Content_Store's achievement definitions are authored in Vietnamese.

### 18. Basic accessibility (Requirement 23)

- **Contrast ≥ 4.5:1 (AC 23.1):** the palette is chosen so documented foreground/background token pairs meet WCAG AA for body text and control foregrounds — notably `foreground` on `background`, `foreground`/`card-foreground` on `card`, `primary-foreground` on `primary`, `muted-foreground` on `background`/`card`, and `destructive-foreground` on `destructive`. Any pair below 4.5:1 (a likely risk for `muted-foreground` and for status text on tinted chips) is darkened until it passes. This pair-set is the verifiable surface (see Property 14). Full WCAG conformance still requires manual testing with assistive technology and expert review.
- **Focus indicator (AC 23.2):** rely on Tailwind `focus-visible:ring-2 focus-visible:ring-ring` (already present in `ui/button.tsx` and friends); the design forbids `outline-none` without a replacement ring, so every interactive control shows a visible focus ring on keyboard focus.
- **Text alternatives / accessible names (AC 23.3):** informative images get `alt`; **icon-only controls** (hamburger, reset, education toggle, AR toggle, status icons) get an `aria-label` or `sr-only` text. The lesson status badge exposes `iconLabel` from the shared mapping as `aria-label`/`sr-only`, so the meaning is not color/emoji-only.

---

## Data Models

```ts
// Existing (chemistry.ts) — unchanged
type Atom = { el: string; x: number; y: number; z: number };
type Bond = { a: number; b: number; order: number };
type Molecule = { id: string; formula: string; name: string; description: string; category: string; atoms: Atom[]; bonds: Bond[] };
type Reaction = { id: string; reactants: string[]; products: string[]; equation: string; description: string; energy_kj: number | null };

// Existing (lessons-data.ts) — seed, unchanged
interface Lesson { id: string; roadId: 1|2; order: number; chapter: string; title: string;
  theory: string; explore3D: { elements: string[]; molecules: string[] };
  practice: { missions: Mission[]; recommendedMode: "sim"|"ar"|"both"; defaultMolecules: string[] };
  quiz: QuizQuestion[]; }

// New (content-store.ts)
interface ContentState { /* see Content_Store section */ }
interface AchievementView { id: string; label: string; desc: string; icon: string; obtained: boolean }

// New (app-store.ts)
interface LabSession { /* see App_State_Store section */ }

// New (lesson-status.ts) — single source of truth for lesson status visuals
type LessonStatus = "completed" | "current" | "locked";
interface StatusVisual { icon: string; label: string; colorClass: string; iconLabel: string }
```

**Supabase tables (read/write as today, no changes):** `molecules`, `reactions`, `user_progress(user_id, molecules_spawned, reactions_triggered, last_molecule, updated_at)`.

---

## Error Handling

| Scenario | Handling |
| --- | --- |
| Production build fails | CI/local gate: `bun run build` must exit 0; treat any esbuild "Unexpected end of file" or unresolved import as a blocker (R1). |
| PubChem request fails / 404 | `pubchem-api` already maps 404 → `PubChemNotFoundError` and falls back (name→formula→autocomplete); hooks surface `error` strings; UI shows empty/error state. |
| Supabase chemistry unavailable | `useChemistryData` already degrades to built-in molecules/reactions and sets a non-fatal `error`; lab stays usable. |
| Camera permission denied (AR) | Catch in ARScene camera init → `toast` notification; scene stays operable without overlay (AC 12.6). |
| localStorage unavailable / corrupt JSON | `readContent()` wraps `JSON.parse` in try/catch and returns defaults; `writeContent` wraps in try/catch (quota) and no-ops on failure, so learning UI never throws (R10). |
| Unknown lessonId / roadId | Zod `.catch()` defaults (`road1-lesson1`, `roadId=1`); lesson page shows "not found" with link back to `/learn`. |
| Three.js init failure (Wet/AR/Sim) | Guard renderer/scene refs; cleanup on unmount; avoid unhandled rejections in animation loop (AC 13.2). |

---

## Testing Strategy

Per scope, testing is intentionally light — the priority is correct core functionality. The minimum bar:

1. **Build gate (primary):** `bun run build` succeeds and emits `dist/` (validates R1 end-to-end).
2. **Manual route smoke:** each of the 15 routes loads without console errors.
3. **Content_Store unit-level checks** (a few example tests if a runner is added): progress derivation, streak counting, achievement unlocks, localStorage round-trip. These are pure functions and are the most logic-dense new code.

The Correctness Properties below capture the invariants worth verifying for the pure logic layer (Content_Store, Reaction_Engine, PubChem parsing). Property-based tests are optional given scope but the properties document the intended contracts.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — a formal statement about what the system should do. Properties bridge human-readable specs and machine-verifiable guarantees.*

### Property 1: Content state persistence round-trip

For any valid `ContentState` (any onboarding flag, grade level, starting road, set of lesson statuses, mission completions, activity dates, and counters), writing it via `writeContent` and then reading it back via `readContent` yields a state equal to the original.

**Validates: Requirements 5.2, 5.3, 10.2**

### Property 2: Lesson status reflects recorded mutations

For any lesson id, after `markLessonOpened(id)` the lesson's status is `in-progress` (unless already `completed`); and for any lesson, completing all of its missions marks the lesson `completed`, while completing any strict subset of its missions leaves it not `completed`.

**Validates: Requirements 9.6, 9.7**

### Property 3: Road progress derivation

For any subset of completed lessons within a road, `getRoadProgress(roadId)` returns `completed` equal to the number of that road's lessons marked completed, `total` equal to the road's lesson count (12 for Road 1, 10 for Road 2), and `percent` equal to `round(completed / total * 100)`; lessons from the other road never affect the result.

**Validates: Requirements 7.2, 15.2**

### Property 4: Road has at most one current lesson

For any completion state, within a single road `getLessonStatus` marks at most one lesson as `current`, every lesson ordered before the current is `completed` or `in-progress`, and every lesson ordered after the current (and not completed) is `locked`.

**Validates: Requirements 8.2**

### Property 5: Soft-lock never blocks navigation into Road 2

For any completion state of Road 1, Road 2 and its lessons remain navigable — `getLessonStatus` never returns a value that prevents opening a Road 2 lesson (locking is presentational only).

**Validates: Requirements 7.4**

### Property 6: Quiz answer correctness

For any quiz question and any selected option index, the lesson page indicates the answer as correct if and only if the selected index equals the question's `answer` index.

**Validates: Requirements 9.5**

### Property 7: Chapter grouping preserves all lessons

For any road, grouping its lessons by `chapter` produces a structure in which every lesson of that road appears exactly once and only under its own `chapter`, with no lesson omitted or duplicated.

**Validates: Requirements 8.1**

### Property 8: Streak equals the consecutive activity run

For any set of recorded activity dates, `getStreak` equals the number of consecutive calendar days, ending at today (or yesterday), for which an activity date is present; a gap day terminates the run.

**Validates: Requirements 10.3**

### Property 9: Achievements unlock monotonically by threshold

For any learning/lab activity, an achievement is reported as obtained if and only if its threshold predicate over the activity (molecules spawned, reactions triggered, lessons completed) holds; and increasing any activity counter never changes an obtained achievement back to locked.

**Validates: Requirements 10.4, 15.3, 15.4**

### Property 10: Reaction matching is sub-multiset membership

For any set of formulas present in the scene and any reaction list, `findMatchingReaction` returns a reaction if and only if that reaction's `reactants` form a sub-multiset of the present formulas (order-independent, counting duplicates); when triggered, the matched reactants are consumed and the products are produced.

**Validates: Requirements 11.4, 12.5**

### Property 11: Molecule-group construction is deterministic and structure-faithful

For any molecule, `buildMoleculeGroup` builds a `THREE.Group` containing one atom mesh per atom and the correct number of bond cylinders per bond (1, 2, or 3 by bond order), and produces the same structure regardless of the caller (Sim_Mode or AR_Mode), since both build from the single shared utility.

**Validates: Requirements 11.2, 16.3, 16.4**

### Property 12: Molecule library filtering matches query and category

For any molecule list and any active category and search query, every molecule returned by the Molecules_Page filter belongs to the active category (or "all") and satisfies the search predicate (name or formula contains the query), and no matching molecule is omitted.

**Validates: Requirements 14.3**

### Property 13: Lesson status visual mapping is total, deterministic, and distinct

For any lesson status in {`completed`, `current`, `locked`}, `statusVisual(status)` returns a defined visual (non-empty icon, label, color class, and accessible icon label), returns the same visual on repeated calls (determinism), and the three statuses map to three pairwise-distinct icon/color visuals — so the same mapping renders identically on the Learning_Path_Overview, the Road_Page, and the Lesson_Page.

**Validates: Requirements 17.4, 23.3**

### Property 14: Design-token color pairs meet the contrast minimum

For any documented foreground/background token pair used by the Design_System for body text or interactive-control foregrounds, the computed WCAG contrast ratio between the two colors is at least 4.5 to 1.

**Validates: Requirements 23.1**
