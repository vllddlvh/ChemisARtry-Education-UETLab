// /periodic-table — interactive periodic table with 3D atom + AR view.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import PeriodicTableGrid from "@/components/PeriodicTableGrid";
import ElementDetail from "@/components/ElementDetail";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
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
    <div className="dark h-dvh w-full flex bg-background text-foreground overflow-hidden font-body relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />
      
      {/* Nút X đóng trang và trở về dashboard */}
      <Link 
        to="/dashboard"
        className="absolute top-6 right-6 z-50 h-12 w-12 rounded-full bg-card/40 backdrop-blur-xl border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all hover:scale-110 hover:shadow-lg"
        aria-label="Đóng bảng tuần hoàn"
      >
        <X className="h-6 w-6" />
      </Link>

      <main className="flex-1 relative z-10 flex flex-col min-h-0 w-full px-4 md:px-8 py-4">
        <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col lg:flex-row gap-6 min-h-0">
          
          {/* Left Column: Grid */}
          <section className="flex-[3] order-2 lg:order-1 min-h-0 rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl p-2 md:p-6 shadow-soft flex flex-col items-center justify-center overflow-hidden">
            {loading ? (
              <div className="grid grid-cols-18 gap-1.5 animate-pulse w-full max-w-[1200px]" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
                {Array.from({ length: 18 * 7 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-md bg-muted" />
                ))}
              </div>
            ) : (
              <div className="w-full h-full flex flex-col justify-center max-w-[calc((100dvh-80px)*1.8)]">
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

          {/* Right Column: Search & Filters */}
          <aside className="w-full lg:w-[260px] xl:w-[280px] order-1 lg:order-2 flex-none flex flex-col gap-6 overflow-y-auto pr-12 lg:pr-2 pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-primary mb-1">
                <Atom className="h-3.5 w-3.5" /> Tương tác 3D · Hỗ trợ AR
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-balance">Bảng tuần hoàn</h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed hidden lg:block">
                Nhấn vào ô nguyên tố để xem cấu hình electron 3D, hoặc dùng công cụ để tìm kiếm và lọc.
              </p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm nguyên tố..."
                className="pl-9 h-10 bg-card/40 backdrop-blur-md border-border/50 text-foreground shadow-soft focus-visible:ring-primary/50"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Nhóm chất</div>
              <div className="flex flex-wrap gap-2">
                <CategoryChip active={filterCat === null} onClick={() => setFilterCat(null)} label="Tất cả" />
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
          </aside>

        </div>
      </main>

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
      className={`rounded-full px-3 py-1.5 text-[11px] md:text-xs font-medium transition-all border
        ${active ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(45,212,191,0.2)]" : "bg-card/40 backdrop-blur-md text-muted-foreground border-border/50 hover:bg-card hover:text-foreground"}`}
    >
      {label}
    </button>
  );
}

