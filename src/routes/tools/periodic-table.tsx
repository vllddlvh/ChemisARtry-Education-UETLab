// /periodic-table — interactive periodic table with 3D atom + AR view.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PeriodicTableGrid from "@/components/PeriodicTableGrid";
import ElementDetail from "@/components/ElementDetail";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Atom, X } from "lucide-react";
import { loadPeriodicTable, categoryStyle, type PTElement } from "@/lib/periodic-table-data";

const AtomARScene = lazy(() => import("@/components/AtomARScene"));

export const Route = createFileRoute("/tools/periodic-table")({
  head: () => ({
    meta: [
      { title: "Periodic Table 3D / AR — MoleLab" },
      { name: "description", content: "Explore all 118 elements with an interactive 3D Bohr atom and AR webcam interaction." },
      { property: "og:title", content: "Periodic Table 3D / AR — MoleLab" },
      { property: "og:description", content: "Click any element to see its electrons orbit in 3D, then jump into AR to manipulate the atom with your hands." },
    ],
  }),
  component: PeriodicTablePage,
});

function PeriodicTablePage() {
  const [elements, setElements] = useState<PTElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PTElement | null>(null);
  const [open, setOpen] = useState(false);
  const [arElement, setArElement] = useState<PTElement | null>(null);
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadPeriodicTable().then((els) => {
      if (cancelled) return;
      setElements(els);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const e of elements) set.add(e.category.toLowerCase());
    return Array.from(set).sort();
  }, [elements]);

  const handleSelect = (el: PTElement) => {
    setSelected(el);
    setOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 md:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-primary mb-1.5">
              <Atom className="h-3.5 w-3.5" /> Interactive 3D · AR ready
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Periodic Table</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base max-w-2xl">
              Click any element to see its electrons orbit in 3D, then launch <span className="text-primary font-medium">AR mode</span> to rotate the atom with your hands using your webcam.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, symbol, or atomic number…"
              className="pl-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <CategoryChip active={filterCat === null} onClick={() => setFilterCat(null)} label="All" />
            {categories.map((c) => {
              const s = categoryStyle(c);
              return (
                <CategoryChip
                  key={c}
                  active={filterCat === c}
                  onClick={() => setFilterCat(filterCat === c ? null : c)}
                  label={s.label}
                />
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <section className="mt-6 rounded-3xl border border-border bg-card p-3 md:p-5 shadow-soft overflow-x-auto">
          {loading ? (
            <div className="grid grid-cols-18 gap-1.5 animate-pulse" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
              {Array.from({ length: 18 * 7 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-md bg-muted" />
              ))}
            </div>
          ) : (
            <div className="min-w-[720px]">
              <PeriodicTableGrid
                elements={elements}
                selectedNumber={selected?.number ?? null}
                onSelect={handleSelect}
                highlightCategory={filterCat}
                query={query}
              />
            </div>
          )}
        </section>

        {/* CTA / hint */}
        <div className="mt-6 grid md:grid-cols-3 gap-3">
          <FeatureCard icon={<Atom className="h-4 w-4" />} title="3D Bohr model" desc="Real proton, neutron, and electron counts orbit in animated shells." />
          <FeatureCard icon={<Sparkles className="h-4 w-4" />} title="Hand-tracked AR" desc="Pinch to rotate, two hands to zoom — runs entirely in your browser." />
          <FeatureCard icon={<Search className="h-4 w-4" />} title="Search & filter" desc="Find any element by name, symbol, atomic number, or category." />
        </div>
      </main>

      <SiteFooter />

      {/* Detail sheet */}
      <ElementDetail
        element={selected}
        open={open}
        onOpenChange={setOpen}
        onLaunchAR={(el) => {
          setOpen(false);
          setArElement(el);
        }}
      />

      {/* AR overlay */}
      {arElement && (
        <Suspense fallback={null}>
          <AtomARScene element={arElement} onClose={() => setArElement(null)} />
        </Suspense>
      )}
    </div>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] md:text-xs transition border
        ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
    >
      {label}
    </button>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary mb-2">{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}
