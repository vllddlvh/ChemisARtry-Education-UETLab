import { createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { FlaskConical, Sparkles, Atom, Zap, LogOut, Home, BarChart2, Camera, Monitor } from "lucide-react";
import { z } from "zod";
import { motion } from "motion/react";

const searchSchema = z.object({
  tab: z.enum(["learning", "lab"]).optional().default("learning"),
});

export const Route = createFileRoute("/dashboard")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Dashboard — ChemisARtry" },
      {
        name: "description",
        content: "Trang chính sau đăng nhập — theo dõi lộ trình học và tiến độ.",
      },
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
  const location = useLocation();
  const { tab } = Route.useSearch();
  const [progress, setProgress] = useState<ProgressRow | null>(null);

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
      <div className="dark min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-muted-foreground animate-pulse">Đang tải…</div>
      </div>
    );
  }

  const p = progress ?? {
    molecules_spawned: 0,
    reactions_triggered: 0,
    last_molecule: null,
    updated_at: new Date().toISOString(),
  };

  const displayName = user?.email?.split("@")[0] ?? "Khách";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="dark min-h-screen w-full flex flex-col bg-background text-foreground overflow-hidden font-body relative">
      <SiteHeader />

      {/* Background noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />

      <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto relative scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="w-[90%] mx-auto px-6 py-12 min-h-full flex flex-col items-center">
            <div className="w-full space-y-8 pb-24">
              {tab === "learning" ? (
                <>
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
                </>
              ) : (
                <div className="grid md:grid-cols-2 gap-6 w-full">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      to="/lab/ar"
                      className="group relative flex flex-col h-full p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/50 hover:bg-card/60 transition-all duration-500 overflow-hidden shadow-soft hover:-translate-y-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Camera className="w-8 h-8" />
                      </div>

                      <h2 className="text-2xl font-bold mb-3 font-display">Thí nghiệm AR</h2>
                      <p className="text-muted-foreground leading-relaxed flex-1 text-sm">
                        Sử dụng Camera nhận diện cử chỉ. Gắp thả phân tử và ghép chúng lại trong không gian thực.
                      </p>

                      <div className="mt-8 inline-flex px-5 py-2 rounded-xl text-sm font-bold transition-colors text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm w-max">
                        Truy cập ngay →
                      </div>
                    </Link>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Link
                      to="/lab/ar"
                      className="group relative flex flex-col h-full p-8 rounded-3xl bg-card/40 backdrop-blur-xl border border-border/50 hover:border-teal-500/50 hover:bg-card/60 transition-all duration-500 overflow-hidden shadow-soft hover:-translate-y-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="bg-teal-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-teal-500 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <Monitor className="w-8 h-8" />
                      </div>

                      <h2 className="text-2xl font-bold mb-3 font-display">Phòng thí nghiệm 3D</h2>
                      <p className="text-muted-foreground leading-relaxed flex-1 text-sm">
                        Mô phỏng 3D tương tác. Kéo thả phân tử bằng chuột, không yêu cầu thiết bị Camera.
                      </p>

                      <div className="mt-8 inline-flex px-5 py-2 rounded-xl text-sm font-bold transition-colors text-white bg-teal-500 hover:bg-teal-600 shadow-sm w-max">
                        Truy cập ngay →
                      </div>
                    </Link>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[340px] border-l border-border/50 bg-background/50 backdrop-blur-xl flex flex-col z-10 shrink-0 p-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Top Header Row */}
          <div className="flex items-center justify-between mb-10 mt-2 px-2">
            <div className="flex items-center gap-2 font-display font-bold text-lab-coral cursor-pointer hover:scale-110 transition-transform">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">🔥</span> 0
            </div>
            <div className="flex items-center gap-2 font-display font-bold text-lab-sun cursor-pointer hover:scale-110 transition-transform">
              <span className="text-2xl drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]">⭐</span> 0
            </div>
            <Link
              to="/progress"
              className="size-10 rounded-full bg-primary/20 text-primary grid place-items-center font-display font-bold border-2 border-primary/50 cursor-pointer hover:scale-110 hover:shadow-glow transition-all"
            >
              {userInitial}
            </Link>
          </div>

          {/* Stats / Nhiệm vụ */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="font-display font-bold text-lg text-foreground">Nhiệm vụ hôm nay</h3>
              <Link
                to="/progress"
                className="text-xs text-primary font-bold hover:underline uppercase tracking-wider"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 space-y-6 shadow-soft">
              <TaskRow
                icon={<Zap className="size-6 text-lab-sun" />}
                title="Phản ứng thực hiện"
                progress={p.reactions_triggered}
                max={5}
              />
              <TaskRow
                icon={<Atom className="size-6 text-primary" />}
                title="Phân tử đã tạo"
                progress={p.molecules_spawned}
                max={10}
              />
            </div>
          </div>

          {/* Promo / Thành tích */}
          <div>
            <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card/80 to-card/20 backdrop-blur-xl p-6 shadow-soft text-center group">
              <h3 className="font-display font-bold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
                Xem báo cáo chi tiết?
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Theo dõi toàn bộ tiến trình học, điểm số và thành tích của bạn.
              </p>
              <Button
                asChild
                size="lg"
                className="w-full rounded-full bg-foreground hover:bg-primary text-background hover:text-primary-foreground font-bold h-12 transition-colors border-0"
              >
                <Link to="/progress">Xem toàn bộ báo cáo</Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

function TaskRow({
  icon,
  title,
  progress,
  max,
}: {
  icon: React.ReactNode;
  title: string;
  progress: number;
  max: number;
}) {
  const pct = Math.min(100, Math.round((progress / max) * 100));
  const done = progress >= max;
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[15px] font-bold text-foreground">{title}</div>
          <div className="text-sm font-bold text-muted-foreground">
            {progress}
            <span className="opacity-50">/{max}</span>
          </div>
        </div>
        <div className="h-3 rounded-full bg-muted/80 overflow-hidden relative shadow-inner">
          <div
            className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-700 ${done ? "bg-primary" : "bg-lab-sun"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RoadCard({
  icon,
  title,
  subtitle,
  progress,
  total,
  href,
  search,
  ctaLabel,
  locked = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  progress: number;
  total: number;
  href: any;
  search?: any;
  ctaLabel: string;
  locked?: boolean;
}) {
  const pct = Math.round((progress / total) * 100);
  return (
    <div
      className={`group rounded-3xl border p-7 transition-all duration-300 ${locked ? "border-border/40 bg-card/20 opacity-60" : "border-border/50 bg-card/40 backdrop-blur-xl hover:bg-card/60 hover:border-primary/50 hover:shadow-soft hover:-translate-y-2"}`}
    >
      <div className="flex items-start gap-5">
        <div
          className={`size-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-inner ${locked ? "bg-muted" : "bg-primary/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"}`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0 py-1">
          <div className="font-display font-bold text-xl text-foreground truncate">{title}</div>
          <div className="text-sm text-muted-foreground mt-1.5">{subtitle}</div>
          <div className="mt-5 h-2.5 rounded-full bg-muted/50 overflow-hidden relative shadow-inner">
            <div
              className="absolute top-0 bottom-0 left-0 bg-gradient-primary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium text-muted-foreground">
              {progress}/{total} bài hoàn thành
            </span>
            <Link
              to={href}
              search={search}
              className={`inline-flex px-5 py-2 rounded-xl text-sm font-bold transition-colors ${locked ? "text-muted-foreground bg-muted pointer-events-none" : "text-primary-foreground bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md"}`}
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
