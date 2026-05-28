import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { getLessonsByRoad, type Lesson } from "@/lib/lessons-data";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Lock, X } from "lucide-react";

const searchSchema = z.object({ roadId: z.coerce.number().int().min(1).max(2).catch(1) });

export const Route = createFileRoute("/learn/road")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: `Road — ChemisARtry` }],
  }),
  component: RoadPage,
});

const ROAD_META = {
  1: {
    icon: "🧪",
    title: "Road 1: Nguyên tố & Liên kết Hoá học",
    color: "text-blue-600 dark:text-blue-400",
  },
  2: {
    icon: "⚗️",
    title: "Road 2: Phản ứng Hoá học",
    color: "text-purple-600 dark:text-purple-400",
  },
} as const;

function RoadPage() {
  const { roadId } = Route.useSearch();
  const id = (roadId === 2 ? 2 : 1) as 1 | 2;
  const meta = ROAD_META[id];
  const lessons = getLessonsByRoad(id);
  const navigate = useNavigate();

  // Group by chapter
  const chapters = lessons.reduce<Record<string, Lesson[]>>((acc, l) => {
    if (!acc[l.chapter]) acc[l.chapter] = [];
    acc[l.chapter].push(l);
    return acc;
  }, {});

  return (
    <div className="dark h-full bg-background text-foreground overflow-y-auto font-body flex flex-col relative">

      {/* Background noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />

      <div className="mx-auto max-w-3xl px-6 py-8 relative z-10 flex-1 w-full">
        {/* Header */}
        <div className="mb-6" />

        <div className="flex items-center gap-5 mb-10">
          <span className="text-5xl drop-shadow-md">{meta.icon}</span>
          <div>
            <h1 className="text-3xl font-display font-bold">{meta.title}</h1>
            <p className="text-muted-foreground mt-1 font-medium">{lessons.length} bài học</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-10 p-6 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-soft">
          <div className="flex justify-between text-sm font-bold text-muted-foreground mb-4">
            <span>Tiến độ hiện tại</span>
            <span>0 / {lessons.length} bài</span>
          </div>
          <div className="h-3 rounded-full bg-muted/80 shadow-inner overflow-hidden">
            <div className="h-full rounded-full bg-gradient-primary w-[0%]" />
          </div>
        </div>

        {/* Chapters */}
        <div className="space-y-10">
          {Object.entries(chapters).map(([chapter, chLessons]) => (
            <div key={chapter}>
              <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-4 ml-2">
                {chapter}
              </h2>
              <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden divide-y divide-border/50 shadow-soft">
                {chLessons.map((lesson, i) => {
                  // TODO: thay thế bằng progress thật từ Supabase
                  const status: "done" | "active" | "locked" = i === 0 ? "active" : "locked";
                  return <LessonRow key={lesson.id} lesson={lesson} status={status} roadId={id} />;
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <Button
            asChild
            size="lg"
            className="w-full rounded-full bg-gradient-primary hover:shadow-glow transition-all h-14 font-bold text-primary-foreground border-0 text-lg"
          >
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
  lesson,
  status,
  roadId,
}: {
  lesson: Lesson;
  status: "done" | "active" | "locked";
  roadId: 1 | 2;
}) {
  return (
    <div
      className={`flex items-center gap-5 px-6 py-5 transition-colors ${status === "locked" ? "opacity-40 grayscale pointer-events-none" : "hover:bg-card/60"}`}
    >
      <div className="shrink-0 mt-0.5">
        {status === "done" && (
          <CheckCircle2 className="size-6 text-primary drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
        )}
        {status === "active" && (
          <Circle className="size-6 text-primary drop-shadow-[0_0_8px_rgba(45,212,191,0.5)] fill-primary/20" />
        )}
        {status === "locked" && <Lock className="size-5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          {lesson.chapter.split(":")[0]?.trim()}
        </div>
        <div className="font-bold text-foreground text-[16px] truncate">
          Bài {lesson.order}: {lesson.title}
        </div>
      </div>
      {status !== "locked" && (
        <Link
          to="/learn/lesson"
          search={{ lessonId: lesson.id }}
          className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${status === "done"
            ? "text-muted-foreground bg-muted/50 hover:bg-muted"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            }`}
        >
          {status === "done" ? "Ôn tập" : "Học ngay"}
        </Link>
      )}
    </div>
  );
}
