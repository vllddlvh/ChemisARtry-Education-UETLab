import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MoleculePreview from "@/components/MoleculePreview";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Molecule } from "@/lib/chemistry";
import { Search } from "lucide-react";

export const Route = createFileRoute("/molecules")({
  head: () => ({
    meta: [
      { title: "Molecules — MoleLab AR" },
      { name: "description", content: "Browse the 3D molecule library: water, methane, ammonia, salt and more." },
      { property: "og:title", content: "Molecule Library — MoleLab AR" },
      { property: "og:description", content: "Interactive 3D library of common molecules with structure and CPK colors." },
    ],
  }),
  component: MoleculesPage,
});

const CATEGORIES = ["all", "common", "organic", "ionic", "element"] as const;

function MoleculesPage() {
  const { molecules, loading } = useChemistryData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [open, setOpen] = useState<Molecule | null>(null);

  const filtered = useMemo(() => molecules.filter((m) => {
    const matchesCat = cat === "all" || m.category === cat;
    const qLow = q.trim().toLowerCase();
    const matchesQ = !qLow || m.name.toLowerCase().includes(qLow) || m.formula.toLowerCase().includes(qLow);
    return matchesCat && matchesQ;
  }), [molecules, q, cat]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto max-w-7xl w-full px-6 py-10 flex-1">
        <h1 className="text-4xl font-display font-bold">Molecule Library</h1>
        <p className="text-muted-foreground mt-1">Click any molecule to explore its 3D structure.</p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search water, H2O..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 rounded-full"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition capitalize ${
                  cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-10 text-muted-foreground">Loading…</div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => setOpen(m)}
                className="text-left rounded-3xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-panel transition shadow-soft"
              >
                <MoleculePreview molecule={m} height={200} />
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-display font-bold text-lg">{m.name}</div>
                    <div className="font-mono text-primary font-bold">{m.formula}</div>
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{m.category}</div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{m.description}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <SiteFooter />

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {open.name} <span className="font-mono text-primary ml-2">{open.formula}</span>
                </DialogTitle>
              </DialogHeader>
              <MoleculePreview molecule={open} height={320} />
              <p className="text-sm text-muted-foreground leading-relaxed">{open.description}</p>
              <div className="grid grid-cols-3 gap-3 text-center mt-2">
                <Stat label="Atoms" value={open.atoms.length} />
                <Stat label="Bonds" value={open.bonds.length} />
                <Stat label="Category" value={open.category} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-muted py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display font-bold text-lg capitalize">{value}</div>
    </div>
  );
}
