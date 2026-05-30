// src/components/EmptyState.tsx
// Shared empty-state surface (task 13.5): icon + Vietnamese message + optional
// next-action button. Reused by data surfaces (Molecules/Reactions/Explorer).

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "🔍",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 py-12 px-6 ${className ?? ""}`}
    >
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-display font-bold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary" className="mt-2 rounded-full">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
