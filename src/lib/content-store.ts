// src/lib/content-store.ts
// Content_Store — local seed + localStorage learning state (backend-free).
//
// This module centralizes all learning-path state (onboarding, grade, road,
// lesson progress, activity streak, lab counters) in a single namespaced
// localStorage key. It exposes a tiny read/write/subscribe surface designed for
// React's `useSyncExternalStore` (see `src/hooks/use-content-store.ts`, task 2.5).
//
// Scope of THIS module section: the core (schema + read/write + subscribe +
// touchToday helper + stable snapshot). Mutations (task 2.2) and derived
// selectors (task 2.3) are added below in their marked sections of this file.
//
// Requirements: 10.2 (persist learning state in localStorage), 10.5 (reads
// return synchronously without a backend request).

import { ROAD1_LESSONS, ROAD2_LESSONS, ALL_LESSONS, getLessonById } from "@/lib/lessons-data";

// ── Schema ────────────────────────────────────────────────────────────────

export type GradeLevel = "10" | "11" | "12" | "self";
export type StartingRoad = 1 | 2 | "free";
export type LessonProgressStatus = "in-progress" | "completed";

export interface LessonProgress {
  status: LessonProgressStatus;
  /** Completed mission ids for the lesson. */
  missions: string[];
}

export interface ContentState {
  onboardingComplete: boolean;
  gradeLevel: GradeLevel | null;
  startingRoad: StartingRoad | null;
  /** lessonId -> progress; "in-progress" on open, "completed" when missions done. */
  lessons: Record<string, LessonProgress>;
  /** ISO date strings (yyyy-mm-dd) of days with recorded activity, for streak. */
  activityDates: string[];
  /** Lab counters mirrored locally so achievements work offline / for guests. */
  moleculesSpawned: number;
  reactionsTriggered: number;
  /** Số phản ứng đã kích hoạt trong Phòng thí nghiệm ướt 3D. */
  wetReactionsTriggered: number;
  /** Id các phản ứng wet-lab đã khám phá (duy nhất). */
  wetReactionsDiscovered: string[];
  /** Id các thử thách wet-lab đã hoàn thành. */
  wetChallengesCompleted: string[];
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Single namespaced key for the whole Content_Store payload. */
export const CONTENT_STORAGE_KEY = "chemisartry.content.v1";

/** Factory so each caller gets an isolated, mutable defaults object. */
export function defaultContentState(): ContentState {
  return {
    onboardingComplete: false,
    gradeLevel: null,
    startingRoad: null,
    lessons: {},
    activityDates: [],
    moleculesSpawned: 0,
    reactionsTriggered: 0,
    wetReactionsTriggered: 0,
    wetReactionsDiscovered: [],
    wetChallengesCompleted: [],
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/** True when a browser localStorage is reachable (false during SSR). */
function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Today's local calendar date as an ISO `yyyy-mm-dd` string. */
function todayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Coerce an arbitrary parsed value into a valid ContentState, filling any
 * missing/invalid fields from defaults. Keeps `readContent` resilient to
 * partial or older payloads without throwing.
 */
function normalize(raw: unknown): ContentState {
  const base = defaultContentState();
  if (raw === null || typeof raw !== "object") return base;
  const data = raw as Partial<ContentState>;

  if (typeof data.onboardingComplete === "boolean") {
    base.onboardingComplete = data.onboardingComplete;
  }
  if (
    data.gradeLevel === "10" ||
    data.gradeLevel === "11" ||
    data.gradeLevel === "12" ||
    data.gradeLevel === "self"
  ) {
    base.gradeLevel = data.gradeLevel;
  }
  if (data.startingRoad === 1 || data.startingRoad === 2 || data.startingRoad === "free") {
    base.startingRoad = data.startingRoad;
  }
  if (data.lessons && typeof data.lessons === "object") {
    for (const [id, value] of Object.entries(data.lessons)) {
      if (!value || typeof value !== "object") continue;
      const entry = value as Partial<LessonProgress>;
      const status: LessonProgressStatus =
        entry.status === "completed" ? "completed" : "in-progress";
      const missions = Array.isArray(entry.missions)
        ? entry.missions.filter((m): m is string => typeof m === "string")
        : [];
      base.lessons[id] = { status, missions };
    }
  }
  if (Array.isArray(data.activityDates)) {
    base.activityDates = data.activityDates.filter((d): d is string => typeof d === "string");
  }
  if (typeof data.moleculesSpawned === "number" && Number.isFinite(data.moleculesSpawned)) {
    base.moleculesSpawned = data.moleculesSpawned;
  }
  if (typeof data.reactionsTriggered === "number" && Number.isFinite(data.reactionsTriggered)) {
    base.reactionsTriggered = data.reactionsTriggered;
  }
  if (
    typeof data.wetReactionsTriggered === "number" &&
    Number.isFinite(data.wetReactionsTriggered)
  ) {
    base.wetReactionsTriggered = data.wetReactionsTriggered;
  }
  if (Array.isArray(data.wetReactionsDiscovered)) {
    base.wetReactionsDiscovered = data.wetReactionsDiscovered.filter(
      (d): d is string => typeof d === "string",
    );
  }
  if (Array.isArray(data.wetChallengesCompleted)) {
    base.wetChallengesCompleted = data.wetChallengesCompleted.filter(
      (d): d is string => typeof d === "string",
    );
  }
  return base;
}

/**
 * Return a new ContentState with today's date appended to `activityDates` if it
 * is not already present. Pure transform — callers persist the result.
 * Used by mutations (task 2.2) to record daily activity for the streak.
 */
function touchToday(state: ContentState): ContentState {
  const today = todayISO();
  if (state.activityDates.includes(today)) return state;
  return { ...state, activityDates: [...state.activityDates, today] };
}

// ── Subscription + cached snapshot (for useSyncExternalStore) ─────────────────

const subscribers = new Set<() => void>();

/**
 * Cached snapshot reference. `useSyncExternalStore` requires `getSnapshot` to
 * return a stable reference between renders; we only swap this reference when
 * `writeContent` mutates the store, which prevents render loops.
 */
let cachedSnapshot: ContentState | null = null;

/** Stable defaults reference for the server snapshot (no localStorage on SSR). */
const serverSnapshot: ContentState = defaultContentState();

function notify(): void {
  for (const cb of subscribers) cb();
}

/**
 * Subscribe to store changes. Returns an unsubscribe function.
 * Intended for `useSyncExternalStore(subscribe, getSnapshot)`.
 */
export function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

// ── Read / write ──────────────────────────────────────────────────────────────

/**
 * Read the persisted ContentState. Returns defaults when storage is absent or
 * the stored JSON is missing/corrupt (parse failures are swallowed). Never
 * issues a backend request. (Requirements 10.2, 10.5)
 */
export function readContent(): ContentState {
  if (!hasStorage()) return defaultContentState();
  try {
    const raw = window.localStorage.getItem(CONTENT_STORAGE_KEY);
    if (raw === null) return defaultContentState();
    return normalize(JSON.parse(raw) as unknown);
  } catch {
    // Corrupt JSON or storage access error -> safe defaults.
    return defaultContentState();
  }
}

/**
 * Persist the next ContentState and notify subscribers. Persistence is a no-op
 * when storage is unavailable or a quota error is thrown; the in-memory snapshot
 * still updates so the UI stays consistent within the session. (Requirement 10.2)
 */
export function writeContent(next: ContentState): void {
  if (hasStorage()) {
    try {
      window.localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota exceeded or storage disabled — keep the in-memory snapshot only.
    }
  }
  cachedSnapshot = next;
  notify();
}

/**
 * Stable snapshot for `useSyncExternalStore`. Lazily hydrates from localStorage
 * on first access, then returns the same reference until `writeContent` swaps it.
 */
export function getSnapshot(): ContentState {
  if (cachedSnapshot === null) {
    cachedSnapshot = readContent();
  }
  return cachedSnapshot;
}

/** Server snapshot for SSR — always defaults (no localStorage on the server). */
export function getServerSnapshot(): ContentState {
  return serverSnapshot;
}

// ── Mutations (task 2.2) ──────────────────────────────────────────────────────
// Each mutation reads the current snapshot, applies an immutable change, records
// today's activity via `touchToday`, then persists + notifies via `writeContent`.

/** Persist onboarding answers and mark onboarding complete. (Req 5.2, 5.3) */
export function setOnboarding(grade: GradeLevel, road: StartingRoad): void {
  const current = getSnapshot();
  const next: ContentState = touchToday({
    ...current,
    onboardingComplete: true,
    gradeLevel: grade,
    startingRoad: road,
  });
  writeContent(next);
}

/** Mark a lesson as opened (in-progress) without overwriting a completed state. (Req 9.6) */
export function markLessonOpened(id: string): void {
  const current = getSnapshot();
  const existing = current.lessons[id];
  if (existing?.status === "completed") {
    // Already done — still record activity, but keep the completed status.
    writeContent(touchToday(current));
    return;
  }
  const next: ContentState = touchToday({
    ...current,
    lessons: {
      ...current.lessons,
      [id]: { status: "in-progress", missions: existing?.missions ?? [] },
    },
  });
  writeContent(next);
}

/** Record completion of a single mission within a lesson. (Req 9.7, 10.1) */
export function completeMission(lessonId: string, missionId: string): void {
  const current = getSnapshot();
  const existing = current.lessons[lessonId];
  const missions = existing?.missions ?? [];
  if (missions.includes(missionId) && existing) {
    writeContent(touchToday(current));
    return;
  }
  const status: LessonProgressStatus =
    existing?.status === "completed" ? "completed" : "in-progress";
  const next: ContentState = touchToday({
    ...current,
    lessons: {
      ...current.lessons,
      [lessonId]: { status, missions: [...missions, missionId] },
    },
  });
  writeContent(next);
}

/** Mark a lesson fully completed. (Req 9.7) */
export function markLessonCompleted(id: string): void {
  const current = getSnapshot();
  const existing = current.lessons[id];
  const next: ContentState = touchToday({
    ...current,
    lessons: {
      ...current.lessons,
      [id]: { status: "completed", missions: existing?.missions ?? [] },
    },
  });
  writeContent(next);
}

/** Increment the molecules-spawned counter. (Req 10.1) */
export function recordSpawn(_formula?: string): void {
  const current = getSnapshot();
  const next: ContentState = touchToday({
    ...current,
    moleculesSpawned: current.moleculesSpawned + 1,
  });
  writeContent(next);
}

/** Increment the reactions-triggered counter. (Req 10.1) */
export function recordReaction(): void {
  const current = getSnapshot();
  const next: ContentState = touchToday({
    ...current,
    reactionsTriggered: current.reactionsTriggered + 1,
  });
  writeContent(next);
}

/** Increment the wet-lab reactions counter (also counts as a general reaction). */
export function recordWetReaction(reactionId?: string): void {
  const current = getSnapshot();
  const discovered =
    reactionId && !current.wetReactionsDiscovered.includes(reactionId)
      ? [...current.wetReactionsDiscovered, reactionId]
      : current.wetReactionsDiscovered;
  const next: ContentState = touchToday({
    ...current,
    reactionsTriggered: current.reactionsTriggered + 1,
    wetReactionsTriggered: current.wetReactionsTriggered + 1,
    wetReactionsDiscovered: discovered,
  });
  writeContent(next);
}

/** Đánh dấu một thử thách wet-lab đã hoàn thành (idempotent). */
export function completeChallenge(challengeId: string): void {
  const current = getSnapshot();
  if (current.wetChallengesCompleted.includes(challengeId)) return;
  const next: ContentState = touchToday({
    ...current,
    wetChallengesCompleted: [...current.wetChallengesCompleted, challengeId],
  });
  writeContent(next);
}

// ── Derived selectors (task 2.3) ──────────────────────────────────────────────
// Pure computations over ContentState + lessons-data. Never mutate; safe to call
// during render. They read the live snapshot so hooks stay consistent.

export type DerivedLessonStatus = "locked" | "current" | "completed" | "in-progress";

export interface RoadProgress {
  completed: number;
  total: number;
  percent: number;
}

export interface AchievementView {
  id: string;
  label: string;
  desc: string;
  icon: string;
  obtained: boolean;
}

function roadLessons(roadId: 1 | 2) {
  return (roadId === 1 ? ROAD1_LESSONS : ROAD2_LESSONS).slice().sort((a, b) => a.order - b.order);
}

/** Per-road completion. Other road never affects the result. (Req 7.2, 15.2) */
export function getRoadProgress(roadId: 1 | 2, state: ContentState = getSnapshot()): RoadProgress {
  const lessons = roadLessons(roadId);
  const total = lessons.length;
  const completed = lessons.filter((l) => state.lessons[l.id]?.status === "completed").length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent };
}

/**
 * Lesson display status. Completed/in-progress come straight from stored state;
 * otherwise the lowest-order non-completed lesson in its road is "current" and
 * the rest are "locked" (presentational only). (Req 8.2)
 */
export function getLessonStatus(
  id: string,
  state: ContentState = getSnapshot(),
): DerivedLessonStatus {
  const lesson = getLessonById(id);
  const progress = state.lessons[id];
  if (progress?.status === "completed") return "completed";
  if (progress?.status === "in-progress") return "in-progress";
  if (!lesson) return "locked";
  const lessons = roadLessons(lesson.roadId);
  const firstNonCompleted = lessons.find((l) => state.lessons[l.id]?.status !== "completed");
  return firstNonCompleted?.id === id ? "current" : "locked";
}

/** First in-progress lesson, else first non-completed lesson, else undefined. (Req 6.2) */
export function getCurrentLesson(state: ContentState = getSnapshot()) {
  const ordered = ALL_LESSONS;
  const inProgress = ordered.find((l) => state.lessons[l.id]?.status === "in-progress");
  if (inProgress) return inProgress;
  const incomplete = ordered.find((l) => state.lessons[l.id]?.status !== "completed");
  return incomplete;
}

/** Consecutive days of activity ending today or yesterday. (Req 10.3) */
export function getStreak(state: ContentState = getSnapshot()): number {
  if (state.activityDates.length === 0) return 0;
  const days = new Set(state.activityDates);
  const oneDay = 24 * 60 * 60 * 1000;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const iso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Determine the anchor: today if active today, else yesterday if active then.
  let cursor = new Date(startOfToday);
  if (!days.has(iso(cursor))) {
    cursor = new Date(startOfToday.getTime() - oneDay);
    if (!days.has(iso(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(iso(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - oneDay);
  }
  return streak;
}

/** Number of lessons completed across both roads. */
export function getLessonsCompleted(state: ContentState = getSnapshot()): number {
  return Object.values(state.lessons).filter((l) => l.status === "completed").length;
}

/**
 * The 6 existing lab achievements plus learning achievements, each annotated
 * with whether it's obtained. (Req 10.4, 15.3, 15.4)
 */
export function getAchievements(state: ContentState = getSnapshot()): AchievementView[] {
  const lessonsDone = getLessonsCompleted(state);
  const streak = getStreak(state);
  const defs: Array<Omit<AchievementView, "obtained"> & { obtained: boolean }> = [
    {
      id: "first-spawn",
      label: "Tia lửa đầu tiên",
      desc: "Tạo phân tử đầu tiên của bạn",
      icon: "✨",
      obtained: state.moleculesSpawned >= 1,
    },
    {
      id: "alchemist",
      label: "Nhà giả kim tập sự",
      desc: "Tạo 10 phân tử",
      icon: "⚗️",
      obtained: state.moleculesSpawned >= 10,
    },
    {
      id: "chemist",
      label: "Nhà hoá học bàn thí nghiệm",
      desc: "Tạo 50 phân tử",
      icon: "🧪",
      obtained: state.moleculesSpawned >= 50,
    },
    {
      id: "first-reaction",
      label: "Phản ứng!",
      desc: "Kích hoạt phản ứng đầu tiên",
      icon: "💥",
      obtained: state.reactionsTriggered >= 1,
    },
    {
      id: "reactor",
      label: "Lõi phản ứng",
      desc: "Kích hoạt 10 phản ứng",
      icon: "☢️",
      obtained: state.reactionsTriggered >= 10,
    },
    {
      id: "nobel",
      label: "Ứng viên Nobel",
      desc: "Kích hoạt 25 phản ứng",
      icon: "🏆",
      obtained: state.reactionsTriggered >= 25,
    },
    // ── Learning achievements ──
    {
      id: "first-lesson",
      label: "Bước chân đầu tiên",
      desc: "Hoàn thành bài học đầu tiên",
      icon: "📘",
      obtained: lessonsDone >= 1,
    },
    {
      id: "road1-done",
      label: "Chinh phục Road 1",
      desc: "Hoàn thành toàn bộ Road 1",
      icon: "🧭",
      obtained: getRoadProgress(1, state).percent === 100,
    },
    {
      id: "scholar",
      label: "Học giả",
      desc: "Hoàn thành 22 bài học",
      icon: "🎓",
      obtained: lessonsDone >= 22,
    },
    {
      id: "streak-3",
      label: "Kiên trì",
      desc: "Học 3 ngày liên tiếp",
      icon: "🔥",
      obtained: streak >= 3,
    },
    // ── Wet-lab achievements ──
    {
      id: "wetlab-first",
      label: "Nhà thí nghiệm ướt",
      desc: "Kích hoạt phản ứng đầu tiên ở Lab ướt",
      icon: "🧫",
      obtained: state.wetReactionsTriggered >= 1,
    },
    {
      id: "wetlab-10",
      label: "Bậc thầy ống nghiệm",
      desc: "Kích hoạt 10 phản ứng ở Lab ướt",
      icon: "⚗️",
      obtained: state.wetReactionsTriggered >= 10,
    },
    {
      id: "wetlab-challenges-5",
      label: "Thợ săn thử thách",
      desc: "Hoàn thành 5 thử thách Lab ướt",
      icon: "🎯",
      obtained: state.wetChallengesCompleted.length >= 5,
    },
  ];
  return defs;
}
