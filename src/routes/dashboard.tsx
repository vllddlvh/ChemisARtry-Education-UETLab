import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, FlaskConical, Sparkles, Atom, BookOpen, Zap } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — ChemisARtry" },
      { name: "description", content: "Trang chính sau đăng nhập — theo dõi lộ trình học và tiến độ." },
    ],
  }),
  component: DashboardPage,
});

type ProgressRow = {
  molecules_spawned: number;
  reactions_triggered: number;
  last_molecule: string | null;
  updated_at: string;
};

function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressRow | null>(null);

  // Cho phép guest truy cập để test
  // useEffect(() => {
  //   if (!authLoading && !user) navigate({ to: "/auth" });
  // }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProgress(data as ProgressRow | null));
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Đang tải…</div>
      </div>
    );
  }

  const p = progress ?? {
    molecules_spawned: 0,
    reactions_triggered: 0,
    last_molecule: null,
    updated_at: new Date().toISOString(),
  };

  const greeting = getGreeting();
  const displayName = user?.email?.split("@")[0] ?? "Khách";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* TODO: thay bằng SiteHeader mới khi rebuild nav */}
      <div className="mx-auto max-w-6xl w-full px-4 md:px-6 py-8 flex-1">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">
            {greeting}, {displayName}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Hôm nay bạn muốn học gì?</p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Lộ trình học */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Tiếp tục học
            </h2>

            {/* Road 1 card */}
            <RoadCard
              icon="🧪"
              title="Road 1: Nguyên tố & Liên kết Hoá học"
              subtitle="Nền tảng · 12 bài học"
              progress={0}
              total={12}
              href="/learn/road"
              search={{ roadId: 1 }}
              ctaLabel="Bắt đầu Road 1 →"
            />

            {/* Road 2 card */}
            <RoadCard
              icon="⚗️"
              title="Road 2: Phản ứng Hoá học"
              subtitle="Nâng cao · 10 bài học"
              progress={0}
              total={10}
              href="/learn/road"
              search={{ roadId: 2 }}
              ctaLabel="Bắt đầu Road 2 →"
            />

            {/* Quick access */}
            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Truy cập nhanh
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <QuickLink href="/lab/sim" icon={<FlaskConical className="h-5 w-5" />} label="Phòng thí nghiệm" />
                <QuickLink href="/tools/periodic-table" icon={<Atom className="h-5 w-5" />} label="Bảng tuần hoàn" />
                <QuickLink href="/tools/explorer" icon={<Sparkles className="h-5 w-5" />} label="Tìm kiếm" />
              </div>
            </div>
          </div>

          {/* Right: Thống kê */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Thống kê
            </h2>
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <StatRow icon={<Atom className="h-4 w-4" />} label="Phân tử đã spawn" value={p.molecules_spawned} />
              <StatRow icon={<Zap className="h-4 w-4" />} label="Phản ứng đã thực hiện" value={p.reactions_triggered} />
              <StatRow icon={<BookOpen className="h-4 w-4" />} label="Phân tử gần nhất" value={p.last_molecule ?? "—"} />
            </div>

            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Thành tích gần đây
            </h2>
            <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <AchievementRow icon="✨" label="First Spark" unlocked={p.molecules_spawned >= 1} />
              <AchievementRow icon="⚗️" label="Apprentice Alchemist" unlocked={p.molecules_spawned >= 10} />
              <AchievementRow icon="💥" label="Reaction!" unlocked={p.reactions_triggered >= 1} />
            </div>

            <Button asChild className="w-full rounded-full bg-gradient-primary">
              <Link to="/progress">Xem toàn bộ tiến độ →</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function RoadCard({
  icon, title, subtitle, progress, total, href, search, ctaLabel, locked = false,
}: {
  icon: string; title: string; subtitle: string;
  progress: number; total: number; href: any; search?: any;
  ctaLabel: string; locked?: boolean;
}) {
  const pct = Math.round((progress / total) * 100);
  return (
    <div className={`rounded-2xl border p-5 transition ${locked ? "border-border bg-muted/30 opacity-70" : "border-border bg-card hover:shadow-soft"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold">{title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
          <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">{progress}/{total} bài hoàn thành</div>
          <Link to={href} search={search} className={`inline-flex mt-3 text-sm font-medium ${locked ? "text-muted-foreground pointer-events-none" : "text-primary hover:underline"}`}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={href} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center hover:border-primary/40 hover:-translate-y-0.5 transition">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon} {label}
      </div>
      <div className="font-display font-bold">{value}</div>
    </div>
  );
}

function AchievementRow({ icon, label, unlocked }: { icon: string; label: string; unlocked: boolean }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
      <span className={unlocked ? "" : "grayscale opacity-40"}>{icon}</span>
      {label}
      {unlocked && <span className="ml-auto text-xs text-primary font-medium">Đạt ✓</span>}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}
