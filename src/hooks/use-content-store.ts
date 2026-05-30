// src/hooks/use-content-store.ts
// React binding for the Content_Store (task 2.5).
//
// Wraps the external store via `useSyncExternalStore` so every consuming page
// re-renders consistently when the store changes. Exposes the raw `state` plus
// the derived selectors and the mutation callbacks. (Requirement 10.5)

import { useCallback, useSyncExternalStore } from "react";
import {
  subscribe,
  getSnapshot,
  getServerSnapshot,
  setOnboarding as _setOnboarding,
  markLessonOpened as _markLessonOpened,
  completeMission as _completeMission,
  markLessonCompleted as _markLessonCompleted,
  recordSpawn as _recordSpawn,
  recordReaction as _recordReaction,
  getRoadProgress,
  getLessonStatus,
  getCurrentLesson,
  getStreak,
  getAchievements,
  getLessonsCompleted,
  type ContentState,
  type GradeLevel,
  type StartingRoad,
  type RoadProgress,
  type AchievementView,
  type DerivedLessonStatus,
} from "@/lib/content-store";

export interface UseContentStore {
  state: ContentState;
  // Derived selectors (bound to the live snapshot)
  roadProgress: (roadId: 1 | 2) => RoadProgress;
  lessonStatus: (id: string) => DerivedLessonStatus;
  getLessonStatus: (id: string) => DerivedLessonStatus;
  currentLesson: ReturnType<typeof getCurrentLesson>;
  streak: number;
  achievements: AchievementView[];
  lessonsCompleted: number;
  // Mutations
  setOnboarding: (grade: GradeLevel, road: StartingRoad) => void;
  markLessonOpened: (id: string) => void;
  completeMission: (lessonId: string, missionId: string) => void;
  markLessonCompleted: (id: string) => void;
  recordSpawn: (formula?: string) => void;
  recordReaction: () => void;
}

export function useContentStore(): UseContentStore {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const roadProgress = useCallback((roadId: 1 | 2) => getRoadProgress(roadId, state), [state]);
  const lessonStatus = useCallback((id: string) => getLessonStatus(id, state), [state]);

  return {
    state,
    roadProgress,
    lessonStatus,
    getLessonStatus: lessonStatus,
    currentLesson: getCurrentLesson(state),
    streak: getStreak(state),
    achievements: getAchievements(state),
    lessonsCompleted: getLessonsCompleted(state),
    setOnboarding: _setOnboarding,
    markLessonOpened: _markLessonOpened,
    completeMission: _completeMission,
    markLessonCompleted: _markLessonCompleted,
    recordSpawn: _recordSpawn,
    recordReaction: _recordReaction,
  };
}

export default useContentStore;
