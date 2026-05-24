import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { usePubChemEnrichment } from "@/hooks/use-pubchem-enrichment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlaskConical, Loader2, ExternalLink, Zap } from "lucide-react";
import type { Reaction } from "@/lib/chemistry";
import { ALL_LESSONS } from "@/lib/lessons-data";

export const Route = createFileRoute("/tools/reactions")({
  head: () => ({
    meta: [
      { title: "Reactions — MoleLab AR" },
      {
        name: "description",
        content:
          "Browse the chemical reactions you can trigger in the AR lab, with equations and energy values.",
      },
      { property: "og:title", content: "Reactions — MoleLab AR" },
      {
        property: "og:description",
        content: "Balanced chemical equations for combustion, synthesis, and more.",
      },
    ],
  }),
  component: ReactionsPage,
});

function ReactionsPage() {
  const { reactions, loading } = useChemistryData();
  const [detailReaction, setDetailReaction] = useState<Reaction | null>(null);
  const enrichment = usePubChemEnrichment();

  const handleOpen = useCallback((r: Reaction) => {
    setDetailReaction(r);
    // Enrich with the first reactant for context
    if (r.reactants[0]) {
      enrichment.enrich(r.reactants[0], r.reactants[0]);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto max-w-5xl w-full px-6 py-10 flex-1">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-display font-bold">Reactions</h1>
            <p className="text-muted-foreground mt-1">
              Trigger these in the AR lab by bringing the reactants together.
            </p>
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
              <button
                key={r.id}
                onClick={() => handleOpen(r)}
                className="w-full text-left rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-panel hover:-translate-y-0.5 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-lg font-bold break-words">{r.equation}</div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {r.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Tag label={`Reactants: ${r.reactants.join(" + ")}`} />
                      <Tag label={`Products: ${r.products.join(" + ")}`} />
                      {r.energy_kj != null && (
                        <Tag
                          label={`ΔH ≈ ${r.energy_kj} kJ/mol`}
                          accent={r.energy_kj < 0 ? "warm" : "cool"}
                        />
                      )}
                      {(() => {
                        const lesson = ALL_LESSONS.find((l) =>
                          l.practice.missions.some(
                            (m) =>
                              m.completionKey.includes("react:") &&
                              r.reactants.every((re) => m.completionKey.includes(re)),
                          ),
                        );
                        return lesson ? (
                          <Tag label={`Bài học: ${lesson.title}`} accent="cool" />
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />

      {/* Reaction detail dialog with PubChem enrichment */}
      <Dialog open={!!detailReaction} onOpenChange={(v) => !v && setDetailReaction(null)}>
        <DialogContent className="max-w-lg">
          {detailReaction && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Chemical Reaction
                </DialogTitle>
              </DialogHeader>

              <div className="font-mono text-base font-bold mt-2 p-3 rounded-xl bg-muted text-center">
                {detailReaction.equation}
              </div>

              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {detailReaction.description}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Reactants
                  </div>
                  <div className="space-y-1">
                    {detailReaction.reactants.map((r) => (
                      <div key={r} className="font-mono text-sm font-semibold text-primary">
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-border p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Products
                  </div>
                  <div className="space-y-1">
                    {detailReaction.products.map((p) => (
                      <div key={p} className="font-mono text-sm font-semibold text-primary">
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {detailReaction.energy_kj != null && (
                <div
                  className={`mt-3 rounded-xl p-3 text-center ${
                    detailReaction.energy_kj < 0
                      ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800"
                      : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">Enthalpy change</div>
                  <div className="font-mono text-lg font-bold mt-0.5">
                    ΔH ≈ {detailReaction.energy_kj} kJ/mol
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {detailReaction.energy_kj < 0
                      ? "Exothermic (releases heat)"
                      : "Endothermic (absorbs heat)"}
                  </div>
                </div>
              )}

              {/* PubChem enrichment for first reactant */}
              {enrichment.loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading PubChem data...
                </div>
              )}
              {enrichment.pubchem && (
                <div className="mt-3 rounded-xl border border-border p-3 space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-2.5 w-2.5" /> PubChem — {detailReaction.reactants[0]}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      MW: {Number(enrichment.pubchem.molecularWeight).toFixed(2)}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      CID: {enrichment.pubchem.cid}
                    </Badge>
                  </div>
                  {enrichment.pubchem.canonicalSmiles && (
                    <div className="font-mono text-[10px] text-muted-foreground break-all">
                      SMILES: {enrichment.pubchem.canonicalSmiles}
                    </div>
                  )}
                  {enrichment.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {enrichment.description.description}
                    </p>
                  )}
                </div>
              )}

              <Button asChild className="w-full mt-4 rounded-full bg-gradient-primary">
                <Link to="/lab/sim" search={{ spawn: detailReaction.reactants.join(",") }}>
                  Thử trong Lab →
                </Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Tag({ label, accent }: { label: string; accent?: "warm" | "cool" }) {
  const cls =
    accent === "warm"
      ? "bg-accent/50 text-accent-foreground"
      : accent === "cool"
        ? "bg-secondary text-secondary-foreground"
        : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-3 py-1 font-mono ${cls}`}>{label}</span>;
}
