// src/lib/lesson-status.ts
//
// Single source of truth for lesson status visuals (AC 17.4).
//
// The Content_Store derives a lesson's state via `getLessonStatus`, which can
// return one of "locked" | "current" | "completed" | "in-progress". For display
// purposes the visual language only distinguishes three states — "in-progress"
// is presented as "current". `toDisplayStatus` normalizes the store value to a
// `LessonStatus`, and `statusVisual` maps that to the shared icon/color/label
// consumed identically by the Learning_Path_Overview, Road_Page, and Lesson_Page.
//
// `iconLabel` carries the accessible name so the meaning is never conveyed by
// color or emoji alone (AC 23.3).

/** The three display states for a lesson. */
export type LessonStatus = "completed" | "current" | "locked";

/**
 * The status type stored/derived by the Content_Store. It adds "in-progress",
 * which is treated as "current" for display.
 */
export type ContentLessonStatus = LessonStatus | "in-progress";

export interface StatusVisual {
  /** Emoji glyph. */
  icon: string;
  /** Vietnamese label. */
  label: string;
  /** Tailwind token classes (text + bg/border). */
  colorClass: string;
  /** Accessible name for the icon (AC 23.3). */
  iconLabel: string;
}

export const LESSON_STATUS_VISUAL: Record<LessonStatus, StatusVisual> = {
  completed: {
    icon: "✅",
    label: "Hoàn thành",
    colorClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
    iconLabel: "Đã hoàn thành",
  },
  current: {
    icon: "▶",
    label: "Đang học",
    colorClass: "text-primary bg-primary/10 border-primary/30",
    iconLabel: "Bài hiện tại",
  },
  locked: {
    icon: "🔒",
    label: "Đã khoá",
    colorClass: "text-muted-foreground bg-muted/50 border-border",
    iconLabel: "Đã khoá",
  },
};

/**
 * Total, deterministic accessor used by every page. Returns the shared visual
 * for the given display status.
 */
export function statusVisual(status: LessonStatus): StatusVisual {
  return LESSON_STATUS_VISUAL[status];
}

/**
 * Normalize a Content_Store status to a display `LessonStatus`. The store's
 * extra "in-progress" maps to "current"; the other values pass through. Total
 * and deterministic so pages can call `statusVisual(toDisplayStatus(s))`.
 */
export function toDisplayStatus(status: ContentLessonStatus): LessonStatus {
  return status === "in-progress" ? "current" : status;
}
