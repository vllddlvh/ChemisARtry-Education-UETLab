// src/components/ErrorState.tsx
// Shared error-state surface (task 13.5): message + "Thử lại" button wired to a
// retry callback. Reused by data surfaces during page polish.

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface ErrorStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  retry?: () => void;
  className?: string;
}

export function ErrorState({
  icon = "⚠️",
  title = "Đã xảy ra lỗi",
  message = "Không thể tải dữ liệu. Vui lòng thử lại.",
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 py-12 px-6 ${className ?? ""}`}
    >
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-display font-bold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {retry && (
        <Button onClick={retry} variant="secondary" className="mt-2 rounded-full gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Thử lại
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
