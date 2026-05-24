import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trophy, FlaskConical, Sparkles, Atom } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your Progress — MoleLab AR" },
      {
        name: "description",
        content:
          "Track the molecules you've spawned, reactions triggered, and achievements earned.",
      },
    ],
  }),
  component: ProgressPage,
});

type ProgressRow = {
  molecules_spawned: number;
  reactions_triggered: number;
  last_molecule: string | null;
  updated_at: string;
};

const ACHIEVEMENTS = [
  {
    id: "first-spawn",
    label: "First Spark",
    desc: "Spawn your first molecule",
    icon: "✨",
    need: (p: ProgressRow) => p.molecules_spawned >= 1,
  },
  {
    id: "alchemist",
    label: "Apprentice Alchemist",
    desc: "Spawn 10 molecules",
    icon: "⚗️",
    need: (p: ProgressRow) => p.molecules_spawned >= 10,
  },
  {
    id: "chemist",
    label: "Bench Chemist",
    desc: "Spawn 50 molecules",
    icon: "🧪",
    need: (p: ProgressRow) => p.molecules_spawned >= 50,
  },
  {
    id: "first-reaction",
    label: "Reaction!",
    desc: "Trigger your first reaction",
    icon: "💥",
    need: (p: ProgressRow) => p.reactions_triggered >= 1,
  },
  {
    id: "reactor",
    label: "Reactor Core",
    desc: "Trigger 10 reactions",
    icon: "☢️",
    need: (p: ProgressRow) => p.reactions_triggered >= 10,
  },
  {
    id: "nobel",
    label: "Nobel Nominee",
    desc: "Trigger 25 reactions",
    icon: "🏆",
    need: (p: ProgressRow) => p.reactions_triggered >= 25,
  },
];

function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const [row, setRow] = useState<ProgressRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setRow(data as ProgressRow | null);
      setLoading(false);
    })();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 grid place-items-center text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 grid place-items-center px-6">
          <div className="max-w-md text-center rounded-3xl bg-card border border-border p-8 shadow-panel">
            <div className="text-4xl">🔒</div>
            <h1 className="mt-3 text-2xl font-display font-bold">Sign in to see your progress</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Track molecules, reactions, and unlock chemistry achievements.
            </p>
            <Button asChild className="mt-5 rounded-full bg-gradient-primary">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const p: ProgressRow = row ?? {
    molecules_spawned: 0,
    reactions_triggered: 0,
    last_molecule: null,
    updated_at: new Date().toISOString(),
  };
  const unlocked = ACHIEVEMENTS.filter((a) => a.need(p));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto max-w-5xl w-full px-6 py-10 flex-1">
        <h1 className="text-4xl font-display font-bold">Your lab journal</h1>
        <p className="text-muted-foreground mt-1">
          Signed in as <span className="font-mono">{user.email}</span>
        </p>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <StatCard
            icon={<Atom className="h-5 w-5" />}
            label="Molecules spawned"
            value={p.molecules_spawned}
          />
          <StatCard
            icon={<FlaskConical className="h-5 w-5" />}
            label="Reactions triggered"
            value={p.reactions_triggered}
          />
          <StatCard
            icon={<Sparkles className="h-5 w-5" />}
            label="Last molecule"
            value={p.last_molecule ?? "—"}
          />
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-display font-bold">Achievements</h2>
            <span className="ml-auto text-sm text-muted-foreground">
              {unlocked.length} / {ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ACHIEVEMENTS.map((a) => {
              const got = a.need(p);
              return (
                <div
                  key={a.id}
                  className={`rounded-3xl p-5 border transition ${
                    got
                      ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <div className={`text-3xl ${got ? "" : "grayscale opacity-50"}`}>{a.icon}</div>
                  <div className="mt-2 font-bold">{a.label}</div>
                  <div className={`text-xs mt-1 ${got ? "text-primary-foreground/80" : ""}`}>
                    {a.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <Button asChild size="lg" className="rounded-full bg-gradient-primary shadow-glow">
            <Link to="/lab">Back to the AR Lab →</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
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
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
