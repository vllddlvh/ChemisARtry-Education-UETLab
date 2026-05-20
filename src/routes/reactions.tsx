import { createFileRoute, Link } from "@tanstack/react-router";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";

export const Route = createFileRoute("/reactions")({
  head: () => ({
    meta: [
      { title: "Reactions — MoleLab AR" },
      { name: "description", content: "Browse the chemical reactions you can trigger in the AR lab, with equations and energy values." },
      { property: "og:title", content: "Reactions — MoleLab AR" },
      { property: "og:description", content: "Balanced chemical equations for combustion, synthesis, and more." },
    ],
  }),
  component: ReactionsPage,
});

function ReactionsPage() {
  const { reactions, loading } = useChemistryData();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto max-w-5xl w-full px-6 py-10 flex-1">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold">Reactions</h1>
            <p className="text-muted-foreground mt-1">Trigger these in the AR lab by bringing the reactants together.</p>
          </div>
          <Button asChild className="rounded-full bg-gradient-primary">
            <Link to="/lab">Open AR Lab</Link>
          </Button>
        </div>

        {loading ? (
          <div className="mt-10 text-muted-foreground">Loading…</div>
        ) : (
          <div className="mt-8 space-y-4">
            {reactions.map((r) => (
              <div key={r.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-panel transition">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-lg font-bold break-words">{r.equation}</div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Tag label={`Reactants: ${r.reactants.join(" + ")}`} />
                      <Tag label={`Products: ${r.products.join(" + ")}`} />
                      {r.energy_kj != null && (
                        <Tag label={`ΔH ≈ ${r.energy_kj} kJ/mol`} accent={r.energy_kj < 0 ? "warm" : "cool"} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function Tag({ label, accent }: { label: string; accent?: "warm" | "cool" }) {
  const cls = accent === "warm"
    ? "bg-accent/50 text-accent-foreground"
    : accent === "cool"
    ? "bg-secondary text-secondary-foreground"
    : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-3 py-1 font-mono ${cls}`}>{label}</span>;
}
