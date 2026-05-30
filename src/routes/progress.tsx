import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, FlaskConical, Atom, Flame, BookCheck, Beaker, Target } from "lucide-react";
import { useContentStore } from "@/hooks/use-content-store";
import { LAB_CHALLENGES } from "@/lib/lab-challenges";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Tiến độ của bạn — ChemisARtry" },
      {
        name: "description",
        content:
          "Theo dõi phân tử đã tạo, phản ứng đã kích hoạt, tiến độ học và thành tích đạt được.",
      },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { state, roadProgress, streak, achievements, lessonsCompleted } = useContentStore();
  const road1 = roadProgress(1);
  const road2 = roadProgress(2);
  const totalLessons = road1.total + road2.total;
  const unlocked = achievements.filter((a) => a.obtained);
  const challengesDone = state.wetChallengesCompleted.length;

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto">
      <div className="mx-auto max-w-5xl w-full px-6 py-10 flex-1">
        <h1 className="text-4xl font-display font-bold">Nhật ký phòng thí nghiệm</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan tiến độ học tập và hoạt động thí nghiệm của bạn.
        </p>

        {/* Overview stats */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BookCheck className="h-5 w-5" />}
            label="Bài học hoàn thành"
            value={`${lessonsCompleted}/${totalLessons}`}
          />
          <StatCard
            icon={<Flame className="h-5 w-5" />}
            label="Chuỗi ngày học"
            value={`${streak} ngày`}
          />
          <StatCard
            icon={<Atom className="h-5 w-5" />}
            label="Phân tử đã tạo"
            value={state.moleculesSpawned}
          />
          <StatCard
            icon={<FlaskConical className="h-5 w-5" />}
            label="Phản ứng đã kích hoạt"
            value={state.reactionsTriggered}
          />
        </div>

        {/* Wet-lab stats */}
        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <StatCard
            icon={<Beaker className="h-5 w-5" />}
            label="Phản ứng Lab ướt"
            value={state.wetReactionsTriggered}
          />
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Thử thách hoàn thành"
            value={`${challengesDone}/${LAB_CHALLENGES.length}`}
          />
        </div>

        {/* Road progress */}
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold">Road 1: Nguyên tố & Liên kết</h3>
              <span className="text-sm text-muted-foreground">{road1.percent}%</span>
            </div>
            <Progress value={road1.percent} />
            <div className="text-xs text-muted-foreground mt-2">
              {road1.completed}/{road1.total} bài hoàn thành
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold">Road 2: Phản ứng Hoá học</h3>
              <span className="text-sm text-muted-foreground">{road2.percent}%</span>
            </div>
            <Progress value={road2.percent} />
            <div className="text-xs text-muted-foreground mt-2">
              {road2.completed}/{road2.total} bài hoàn thành
            </div>
          </Card>
        </div>

        {/* Achievements */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-display font-bold">Thành tích</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              {unlocked.length} / {achievements.length}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={`rounded-3xl p-5 border transition ${
                  a.obtained
                    ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <div className={`text-3xl ${a.obtained ? "" : "grayscale opacity-50"}`}>
                  {a.icon}
                </div>
                <div className="mt-2 font-bold">{a.label}</div>
                <div className={`text-xs mt-1 ${a.obtained ? "text-primary-foreground/80" : ""}`}>
                  {a.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <Button asChild size="lg" className="rounded-full bg-gradient-primary shadow-glow">
            <Link to="/lab/ar">Quay lại Phòng thí nghiệm AR →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-5 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-foreground">{value}</div>
    </Card>
  );
}
