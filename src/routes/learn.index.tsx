import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BookOpen, FlaskConical, Trophy, ArrowRight } from "lucide-react";
import { ROAD1_LESSONS, ROAD2_LESSONS } from "@/lib/lessons-data";

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
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-10">
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
            chapters={[
              "Cấu tạo nguyên tử",
              "Bảng tuần hoàn",
              "Liên kết hoá học",
              "Phân tử & Hình dạng",
            ]}
            locked={false}
          />

          {/* Road 2 */}
          <RoadCard
            roadId={2}
            icon="⚗️"
            title="Road 2: Phản ứng Hoá học"
            subtitle="Nâng cao — hoàn thành Road 1 trước"
            lessonsCount={ROAD2_LESSONS.length}
            weeks={3}
            chapters={["Phản ứng hoá học", "Phân loại phản ứng", "Acid & Base", "Cân bằng hoá học"]}
            locked={false}
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
  chapters,
  locked,
}: {
  roadId: 1 | 2;
  icon: string;
  title: string;
  subtitle: string;
  lessonsCount: number;
  weeks: number;
  chapters: string[];
  locked: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 transition ${locked ? "bg-muted/20 border-border opacity-70" : "bg-card border-border hover:shadow-soft"}`}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-display font-bold">{title}</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
          <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
            <span>📖 {lessonsCount} bài học</span>
            <span>⏱ ~{weeks} tuần</span>
          </div>

          {/* Chapter list preview */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {chapters.map((ch, i) => (
              <div key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${locked ? "bg-muted-foreground/30" : "bg-primary"}`}
                />
                {ch}
              </div>
            ))}
          </div>

          <div className="mt-5">
            {locked ? (
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                🔒 Hoàn thành Road 1 để mở khoá
                <Link
                  to="/learn/road"
                  search={{ roadId: 2 }}
                  className="underline text-primary text-xs ml-1"
                >
                  Bỏ qua và xem
                </Link>
              </div>
            ) : (
              <Button asChild className="rounded-full bg-gradient-primary">
                <Link to="/learn/road" search={{ roadId: roadId }}>
                  Bắt đầu Road {roadId} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
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
