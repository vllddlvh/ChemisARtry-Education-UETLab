// src/store/app-store.ts
// App_State_Store — dependency-free global lab/session state (task 3.1).
//
// A tiny external store (getSnapshot + subscribe + actions) exposed to React via
// `useSyncExternalStore` — no extra dependency. It centralizes the lab session
// state that was previously prop-drilled through `ar.tsx`/`sim.tsx`, and bridges
// the persistent counters into the Content_Store so progress/streak/achievements
// stay in sync. (Requirements 16.1, 16.2)

import { useSyncExternalStore } from "react";
import type { Molecule, Reaction } from "@/lib/chemistry";
import {
  recordSpawn as contentRecordSpawn,
  recordReaction as contentRecordReaction,
  completeMission as contentCompleteMission,
  markLessonOpened as contentMarkLessonOpened,
} from "@/lib/content-store";

export interface LabSession {
  /** Currently highlighted molecule in the control panel. */
  selected: Molecule | null;
  /** Molecule queued to spawn into the scene (consumed by the renderer). */
  toSpawn: Molecule | null;
  /** Monotonic counter; incrementing it triggers a scene reset. */
  resetSignal: number;
  /** Education / label overlay toggle. */
  education: boolean;
  /** Whether the camera/AR passthrough is active. */
  arOn: boolean;
  /** Head-tracking (parallax) toggle — AR only. */
  headTracking: boolean;
  /** Most recent reaction (for the banner). */
  lastReaction: Reaction | null;
  /** Recent reaction history (most-recent first, capped). */
  history: Reaction[];
  /** Lesson context the lab was entered from (if any). */
  lessonId: string | null;
  /** Mission ids completed in the current lesson context. */
  doneMissions: string[];
  /** Formulas spawned this session. */
  spawnedFormulas: string[];
}

export type AppState = {
  lab: LabSession;
};

function initialState(): AppState {
  return {
    lab: {
      selected: null,
      toSpawn: null,
      resetSignal: 0,
      education: false,
      arOn: true,
      headTracking: false,
      lastReaction: null,
      history: [],
      lessonId: null,
      doneMissions: [],
      spawnedFormulas: [],
    },
  };
}

let state: AppState = initialState();
const listeners = new Set<() => void>();

function emit(): void {
  for (const cb of listeners) cb();
}

function setLab(patch: Partial<LabSession>): void {
  state = { ...state, lab: { ...state.lab, ...patch } };
  emit();
}

export const appStore = {
  getSnapshot(): AppState {
    return state;
  },
  subscribe(cb: () => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },

  // ── Actions ──────────────────────────────────────────────────────────────

  setSelected(m: Molecule | null): void {
    setLab({ selected: m });
  },

  /** Queue a molecule to spawn and record it in the Content_Store. */
  requestSpawn(m: Molecule | null): void {
    if (!m) return;
    const spawned = state.lab.spawnedFormulas.includes(m.formula)
      ? state.lab.spawnedFormulas
      : [...state.lab.spawnedFormulas, m.formula];
    setLab({ toSpawn: m, selected: m, spawnedFormulas: spawned });
    contentRecordSpawn(m.formula);
  },

  /** Clear the spawn queue once the renderer has consumed it. */
  clearSpawn(): void {
    setLab({ toSpawn: null });
  },

  resetScene(): void {
    setLab({ resetSignal: state.lab.resetSignal + 1 });
  },

  toggleEducation(value?: boolean): void {
    setLab({ education: value ?? !state.lab.education });
  },

  setArOn(value: boolean): void {
    setLab({ arOn: value });
  },

  toggleHeadTracking(value?: boolean): void {
    setLab({ headTracking: value ?? !state.lab.headTracking });
  },

  /** Record a triggered reaction (banner + history + Content_Store counter). */
  pushReaction(r: Reaction): void {
    setLab({
      lastReaction: r,
      history: [r, ...state.lab.history].slice(0, 8),
    });
    contentRecordReaction();
  },

  /** Enter a lesson context; resets per-lesson mission tracking. */
  enterLessonContext(lessonId: string): void {
    setLab({ lessonId, doneMissions: [] });
    contentMarkLessonOpened(lessonId);
  },

  /** Mark a lesson mission complete (session + persistent Content_Store). */
  completeMission(missionId: string): void {
    const lessonId = state.lab.lessonId;
    if (state.lab.doneMissions.includes(missionId)) return;
    setLab({ doneMissions: [...state.lab.doneMissions, missionId] });
    if (lessonId) contentCompleteMission(lessonId, missionId);
  },

  /** Full reset (e.g. when leaving the lab). */
  reset(): void {
    state = initialState();
    emit();
  },
};

/**
 * Subscribe to a slice of the app state. Selector must return a stable value
 * (primitive or memoized object) to avoid extra renders.
 */
export function useAppStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    appStore.subscribe,
    () => selector(appStore.getSnapshot()),
    () => selector(initialState()),
  );
}

export default appStore;
