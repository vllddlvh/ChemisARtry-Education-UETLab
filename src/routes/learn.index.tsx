import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, FlaskConical, Trophy, ArrowRight } from "lucide-react";
import { ROAD1_LESSONS, ROAD2_LESSONS } from "@/lib/lessons-data";
import { useContentStore } from "@/hooks/use-content-store";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Lộ trình học — ChemisARtry" },
      {
        name: "description",
        content: "Học Hoá học theo lộ trình có cấu trúc: Nguyên tố → Liên kết → Phản ứng.",
      },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { roadProgress } = useContentStore();
  const road1 = roadProgress(1);
  const road2 = roadProgress(2);
  const road1Done = road1.percent === 100;

  return (
    <div className="h-full bg-background overflow-y-auto flex flex-col">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10 flex-1 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Lộ trình học của bạn</h1>
          <p className="text-muted-foreground mt-2">
            Học Hoá theo thứ tự — từ nền tảng đến nâng cao.
          </p>
        </div>

        <div className="space-y-6">
          {/* Road 1 */}
          <RoadCard
            roadId={1}
            icon="🧪"
            title="Road 1: Nguyên tố & Liên kết Hoá học"
            subtitle="Nền tảng — bắt đầu từ đây"
            lessonsCount={ROAD1_LESSONS.length}
            weeks={4}
            completed={road1.completed}
            percent={road1.percent}
            chapters={[
              "Cấu tạo nguyên tử",
              "Bảng tuần hoàn",
              "Liên kết hoá học",
              "Phân tử & Hình dạng",
            ]}
            softLocked={false}
          />

          {/* Road 2 — soft-locked cho tới khi xong Road 1, nhưng vẫn vào được */}
          <RoadCard
            roadId={2}
            icon="⚗️"
            title="Road 2: Phản ứng Hoá học"
            subtitle="Nâng cao — nên hoàn thành Road 1 trước"
            lessonsCount={ROAD2_LESSONS.length}
            weeks={3}
            completed={road2.completed}
            percent={road2.percent}
            chapters={["Phản ứng hoá học", "Phân loại phản ứng", "Acid & Base", "Cân bằng hoá học"]}
            softLocked={!road1Done}
          />
        </div>

        {/* Quick access tools */}
        <div className="mt-10 pt-8 border-t border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Công cụ hỗ trợ học tập
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <ToolCard
              href="/lab/sim"
              icon={<FlaskConical className="h-5 w-5" />}
              title="Phòng thí nghiệm"
              desc="Mô phỏng 3D không cần camera"
            />
            <ToolCard
              href="/tools/periodic-table"
              icon={<BookOpen className="h-5 w-5" />}
              title="Bảng tuần hoàn"
              desc="Tra cứu 118 nguyên tố"
            />
            <ToolCard
              href="/progress"
              icon={<Trophy className="h-5 w-5" />}
              title="Tiến độ"
              desc="Thành tích và lịch sử học"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RoadCard({
  roadId,
  icon,
  title,
  subtitle,
  lessonsCount,
  weeks,
  completed,
  percent,
  chapters,
  softLocked,
}: {
  roadId: 1 | 2;
  icon: string;
  title: string;
  subtitle: string;
  lessonsCount: number;
  weeks: number;
  completed: number;
  percent: number;
  chapters: string[];
  softLocked: boolean;
}) {
  const started = completed > 0;
  return (
    <div
      className={`rounded-3xl border p-6 transition ${softLocked ? "bg-muted/20 border-border" : "bg-card border-border hover:shadow-soft"}`}
    >
      <div className="flex items-start gap-4">
        <span className={`text-4xl ${softLocked ? "opacity-70" : ""}`}>{icon}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-display font-bold">{title}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>📖 {lessonsCount} bài học</span>
            <span>⏱ ~{weeks} tuần</span>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Tiến độ</span>
              <span>
                {completed}/{lessonsCount} bài · {percent}%
              </span>
            </div>
            <Progress value={percent} />
          </div>

          {/* Chapter list preview */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chapters.map((ch, i) => (
              <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${softLocked ? "bg-muted-foreground/30" : "bg-primary"}`}
                />
                {ch}
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <Button
              asChild
              className={softLocked ? "rounded-full" : "rounded-full bg-gradient-primary"}
              variant={softLocked ? "secondary" : "default"}
            >
              <Link to="/learn/road" search={{ roadId: roadId }}>
                {softLocked ? "Bỏ qua và học" : started ? "Tiếp tục" : `Bắt đầu Road ${roadId}`}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            {softLocked && (
              <span className="text-xs text-muted-foreground">🔒 Nên hoàn thành Road 1 trước</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={href}
      className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:-translate-y-0.5 transition flex items-start gap-3"
    >
      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </Link>
  );
}
