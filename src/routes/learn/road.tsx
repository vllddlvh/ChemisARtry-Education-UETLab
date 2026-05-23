import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { getLessonsByRoad, type Lesson } from "@/lib/lessons-data";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2, Circle, Lock } from "lucide-react";

const searchSchema = z.object({ roadId: z.coerce.number().int().min(1).max(2).catch(1) });

export const Route = createFileRoute("/learn/road")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: `Road — ChemisARtry` }],
  }),
  component: RoadPage,
});

const ROAD_META = {
  1: { icon: "🧪", title: "Road 1: Nguyên tố & Liên kết Hoá học", color: "text-blue-600 dark:text-blue-400" },
  2: { icon: "⚗️", title: "Road 2: Phản ứng Hoá học", color: "text-purple-600 dark:text-purple-400" },
} as const;

function RoadPage() {
  const { roadId } = Route.useSearch();
  const id = (roadId === 2 ? 2 : 1) as 1 | 2;
  const meta = ROAD_META[id];
  const lessons = getLessonsByRoad(id);

  // Group by chapter
  const chapters = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
    if (!acc[l.chapter]) acc[l.chapter] = [];
    acc[l.chapter].push(l);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 md:px-6 py-8">
        {/* Back */}
        <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6">
          <ChevronLeft className="h-4 w-4" /> Lộ trình học
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{meta.icon}</span>
          <div>
            <h1 className="text-2xl font-display font-bold">{meta.title}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{lessons.length} bài học</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Tiến độ</span>
            <span>0 / {lessons.length} bài</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: "0%" }} />
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-6">
          {Object.entries(chapters).map(([chapter, chLessons]) => (
            <div key={chapter}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {chapter}
              </h2>
              <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
                {chLessons.map((lesson, i) => {
                  // TODO: thay thế bằng progress thật từ Supabase
                  const status: "done" | "active" | "locked" = i === 0 ? "active" : "locked";
                  return (
                    <LessonRow key={lesson.id} lesson={lesson} status={status} roadId={id} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex gap-3">
          <Button asChild variant="outline" className="rounded-full flex-1">
            <Link to="/learn">← Tất cả lộ trình</Link>
          </Button>
          <Button asChild className="rounded-full bg-gradient-primary flex-1">
            <Link to="/learn/lesson" search={{ lessonId: `road${id}-lesson1` }}>
              Bắt đầu bài 1 →
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LessonRow({
  lesson, status, roadId,
}: {
  lesson: Lesson; status: "done" | "active" | "locked"; roadId: 1 | 2;
}) {
  return (
    <div className={`flex items-center gap-4 px-4 py-3.5 transition ${status === "locked" ? "opacity-50 pointer-events-none" : "hover:bg-muted/30"}`}>
      <div className="shrink-0">
        {status === "done" && <CheckCircle2 className="h-5 w-5 text-primary" />}
        {status === "active" && <Circle className="h-5 w-5 text-primary" />}
        {status === "locked" && <Lock className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{lesson.chapter.split(":")[0]?.trim()}</div>
        <div className="font-medium text-sm truncate">
          Bài {lesson.order}: {lesson.title}
        </div>
      </div>
      {status !== "locked" && (
        <Link
          to="/learn/lesson"
          search={{ lessonId: lesson.id }}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition ${
            status === "done"
              ? "text-muted-foreground border border-border hover:border-primary/40"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {status === "done" ? "Xem lại" : "Học"}
        </Link>
      )}
    </div>
  );
}
