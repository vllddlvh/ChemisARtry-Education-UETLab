// src/components/LessonStatusBadge.tsx
// Shared lesson-status badge (task 13.2).
//
// Built on the Shadcn `ui/badge.tsx` and the single source of truth in
// `src/lib/lesson-status.ts`. Consumed identically by the Learn overview, Road
// page, and Lesson page so the status reads the same everywhere. The accessible
// name (`iconLabel`) is exposed via `aria-label` + an `sr-only` span so meaning
// is never conveyed by color/emoji alone (AC 23.3).

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusVisual, toDisplayStatus, type ContentLessonStatus } from "@/lib/lesson-status";

export interface LessonStatusBadgeProps {
  /** Accepts the Content_Store status; "in-progress" is shown as "current". */
  status: ContentLessonStatus;
  /** Hide the text label and show only the icon (label still read by AT). */
  iconOnly?: boolean;
  className?: string;
}

export function LessonStatusBadge({ status, iconOnly = false, className }: LessonStatusBadgeProps) {
  const visual = statusVisual(toDisplayStatus(status));
  return (
    <Badge
      variant="outline"
      aria-label={visual.iconLabel}
      className={cn("gap-1.5 font-medium", visual.colorClass, className)}
    >
      <span aria-hidden="true">{visual.icon}</span>
      {iconOnly ? <span className="sr-only">{visual.iconLabel}</span> : <span>{visual.label}</span>}
    </Badge>
  );
}

export default LessonStatusBadge;
