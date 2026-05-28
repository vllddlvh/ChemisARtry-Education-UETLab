import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MoleculePreview from "@/components/MoleculePreview";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import {
  usePubChemSearch,
  usePubChemMolecule,
  usePubChemDescription,
} from "@/hooks/use-pubchem-search";
import type { PubChemCompoundSummary } from "@/lib/pubchem-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Molecule } from "@/lib/chemistry";
import { Search, Loader2, Globe, Atom, ExternalLink, Sparkles, Box } from "lucide-react";
import { ALL_LESSONS } from "@/lib/lessons-data";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/tools/molecules")({
  head: () => ({
    meta: [
      { title: "Molecules — MoleLab AR" },
      {
        name: "description",
        content: "Browse the 3D molecule library and search 100M+ compounds from PubChem.",
      },
      { property: "og:title", content: "Molecule Library — MoleLab AR" },
      {
        property: "og:description",
        content: "Interactive 3D library of common molecules with PubChem integration.",
      },
    ],
  }),
  component: MoleculesPage,
});

const BASE_CATEGORIES = ["common", "organic", "ionic", "element"] as const;

function MoleculesPage() {
  const { molecules, loading } = useChemistryData();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState<Molecule | null>(null);

  // PubChem integration — auto-search when user types
  const pubchem = usePubChemSearch(600);
  const mol3d = usePubChemMolecule();
  const desc = usePubChemDescription();
  const [pubchemDetail, setPubchemDetail] = useState<PubChemCompoundSummary | null>(null);
  const [pubchemDetailOpen, setPubchemDetailOpen] = useState(false);

  // Sync search query to PubChem
  useEffect(() => {
    pubchem.setQuery(q);
  }, [q]);

  const categories = useMemo(() => {
    const fromData = molecules
      .map((m) => m.category)
      .filter(Boolean)
      .map((c) => c.trim().toLowerCase())
      .filter((c) => c && c !== "all");
    const unique = Array.from(new Set(fromData));
    const extras = unique
      .filter((c) => !BASE_CATEGORIES.includes(c as (typeof BASE_CATEGORIES)[number]))
      .sort((a, b) => a.localeCompare(b));
    return ["all", ...BASE_CATEGORIES, ...extras];
  }, [molecules]);

  useEffect(() => {
    if (!categories.includes(cat)) setCat("all");
  }, [categories, cat]);

  const filtered = useMemo(
    () =>
      molecules.filter((m) => {
        const matchesCat = cat === "all" || m.category === cat;
        const qLow = q.trim().toLowerCase();
        const matchesQ =
          !qLow || m.name.toLowerCase().includes(qLow) || m.formula.toLowerCase().includes(qLow);
        return matchesCat && matchesQ;
      }),
    [molecules, q, cat],
  );

  // Show PubChem section when searching and local results are few
  const showPubChem = q.trim().length >= 2;

  function handlePubChemSelect(compound: PubChemCompoundSummary) {
    setPubchemDetail(compound);
    setPubchemDetailOpen(true);
    mol3d.load(compound.cid);
    desc.load(compound.cid);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto max-w-7xl w-full px-6 py-10 flex-1">
        <h1 className="text-4xl font-display font-bold">Molecule Library</h1>
        <p className="text-muted-foreground mt-1">
          Browse local molecules or search 100M+ compounds from PubChem.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search water, caffeine, C6H12O6..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 rounded-full"
            />
            {pubchem.loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`text-xs px-3 py-1.5 rounded-full border transition capitalize ${cat === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
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
          <>
            {/* Local molecules */}
            {filtered.length > 0 && (
              <section className="mt-8">
                {showPubChem && (
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Local library ({filtered.length})
                  </h2>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                          {m.category}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {m.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* PubChem results — shown automatically when searching */}
            {showPubChem && (
              <section className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    PubChem results
                  </h2>
                  {pubchem.loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                  {!pubchem.loading && pubchem.total > 0 && (
                    <span className="text-xs text-muted-foreground">({pubchem.total} found)</span>
                  )}
                </div>

                {pubchem.error && <p className="text-xs text-destructive">{pubchem.error}</p>}

                {pubchem.results.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {pubchem.results.map((c) => (
                      <button
                        key={c.cid}
                        onClick={() => handlePubChemSelect(c)}
                        className="text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all shadow-soft"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {c.iupacName || c.molecularFormula}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-primary text-xs font-bold">
                                {c.molecularFormula}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                              <span>MW: {Number(c.molecularWeight).toFixed(1)}</span>
                              <span>·</span>
                              <span>CID: {c.cid}</span>
                            </div>
                          </div>
                          <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 grid place-items-center">
                            <Atom className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!pubchem.loading && pubchem.results.length === 0 && !pubchem.error && (
                  <p className="text-xs text-muted-foreground py-3">
                    No compounds found on PubChem for "{q}".
                  </p>
                )}
              </section>
            )}

            {/* Empty state when no local results and not searching */}
            {filtered.length === 0 && !showPubChem && (
              <div className="mt-10 text-center text-muted-foreground">
                <p>No molecules match your filter. Try a different category or search term.</p>
              </div>
            )}
          </>
        )}
      </div>
      <SiteFooter />

      {/* Local molecule detail dialog */}
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

              {(() => {
                const relatedLessons = ALL_LESSONS.filter(
                  (l) =>
                    l.explore3D.molecules.includes(open.formula) ||
                    l.practice.defaultMolecules.includes(open.formula),
                );
                if (relatedLessons.length === 0) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                      Xuất hiện trong bài học
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {relatedLessons.map((l) => (
                        <Link
                          key={l.id}
                          to="/learn/lesson"
                          search={{ lessonId: l.id }}
                          className="block p-3 rounded-xl border border-border bg-muted/40 hover:border-primary/50 transition"
                        >
                          <div className="text-[10px] font-semibold text-primary">{l.chapter}</div>
                          <div className="font-bold text-sm">{l.title}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <Button asChild className="w-full mt-4 rounded-full bg-gradient-primary">
                <Link to="/lab/ar" search={{ spawn: open.formula }}>
                  <Box className="mr-2 h-4 w-4" />
                  Dùng trong Lab
                </Link>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PubChem compound detail dialog */}
      <Dialog open={pubchemDetailOpen} onOpenChange={setPubchemDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {pubchemDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <Atom className="h-5 w-5 text-primary" />
                  {pubchemDetail.iupacName || pubchemDetail.molecularFormula}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="font-mono">
                  {pubchemDetail.molecularFormula}
                </Badge>
                <Badge variant="outline">
                  MW: {Number(pubchemDetail.molecularWeight).toFixed(2)} g/mol
                </Badge>
                <Badge variant="outline">CID: {pubchemDetail.cid}</Badge>
                {Number(pubchemDetail.hBondDonorCount) > 0 && (
                  <Badge variant="outline">HBD: {pubchemDetail.hBondDonorCount}</Badge>
                )}
                {Number(pubchemDetail.hBondAcceptorCount) > 0 && (
                  <Badge variant="outline">HBA: {pubchemDetail.hBondAcceptorCount}</Badge>
                )}
              </div>

              {pubchemDetail.canonicalSmiles && (
                <div className="mt-3 rounded-lg bg-muted p-2.5 font-mono text-xs break-all">
                  <span className="text-muted-foreground">SMILES: </span>
                  {pubchemDetail.canonicalSmiles}
                </div>
              )}

              {desc.loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading description...
                </div>
              )}
              {desc.description && (
                <div className="mt-3 rounded-xl border border-border bg-card p-4">
                  <p className="text-sm leading-relaxed">{desc.description.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Source: {desc.description.source}
                  </p>
                </div>
              )}

              {mol3d.loading && (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading 3D structure...</span>
                </div>
              )}
              {mol3d.error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {mol3d.error}
                </div>
              )}
              {mol3d.molecule && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                  <MoleculePreview molecule={mol3d.molecule} height={300} />
                  <div className="p-3 bg-card flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {mol3d.molecule.atoms.length} atoms · {mol3d.molecule.bonds.length} bonds
                    </div>
                  </div>
                </div>
              )}

              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemDetail.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-3"
              >
                <ExternalLink className="h-3 w-3" /> View full data on PubChem
              </a>
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
