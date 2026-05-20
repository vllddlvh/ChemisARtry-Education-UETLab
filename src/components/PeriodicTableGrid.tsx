// Periodic table grid (18 columns × 7 main periods + lanthanide/actinide rows).
import { useMemo } from "react";
import ElementCard from "./ElementCard";
import { categoryStyle, type PTElement } from "@/lib/periodic-table-data";

type Props = {
  elements: PTElement[];
  selectedNumber?: number | null;
  onSelect: (el: PTElement) => void;
  highlightCategory?: string | null;
  query?: string;
};

export default function PeriodicTableGrid({
  elements, selectedNumber, onSelect, highlightCategory, query,
}: Props) {
  const byPos = useMemo(() => {
    const main = new Map<string, PTElement>();
    const lanth: PTElement[] = [];
    const actin: PTElement[] = [];
    for (const e of elements) {
      // Lanthanides 57-71, Actinides 89-103
      if (e.number >= 57 && e.number <= 71) { lanth.push(e); continue; }
      if (e.number >= 89 && e.number <= 103) { actin.push(e); continue; }
      if (e.xpos && e.ypos) main.set(`${e.xpos},${e.ypos}`, e);
    }
    lanth.sort((a, b) => a.number - b.number);
    actin.sort((a, b) => a.number - b.number);
    return { main, lanth, actin };
  }, [elements]);

  const isMatch = (e: PTElement) => {
    if (highlightCategory && e.category.toLowerCase() !== highlightCategory.toLowerCase()) return false;
    if (query) {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        e.symbol.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        String(e.number) === q
      );
    }
    return true;
  };

  const renderCell = (e: PTElement | undefined, key: string) => {
    if (!e) return <div key={key} className="aspect-square" />;
    const dim = !isMatch(e);
    return (
      <div key={key} className={dim ? "opacity-25 transition" : "transition"}>
        <ElementCard
          element={e}
          selected={selectedNumber === e.number}
          onClick={onSelect}
        />
      </div>
    );
  };

  // Build 7×18 main grid
  const cells: React.ReactNode[] = [];
  for (let y = 1; y <= 7; y++) {
    for (let x = 1; x <= 18; x++) {
      cells.push(renderCell(byPos.main.get(`${x},${y}`), `${x}-${y}`));
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="grid gap-1 md:gap-1.5"
        style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}
        role="grid"
        aria-label="Periodic table"
      >
        {cells}
      </div>

      {/* Lanthanide / Actinide rows */}
      <div className="space-y-1 md:space-y-1.5">
        <LanthActinRow label="La–Lu" leadingCols={2} items={byPos.lanth} renderCell={(e, k) => renderCell(e, k)} />
        <LanthActinRow label="Ac–Lr" leadingCols={2} items={byPos.actin} renderCell={(e, k) => renderCell(e, k)} />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.keys((function () {
          const m: Record<string, true> = {};
          for (const e of elements) m[e.category.toLowerCase()] = true;
          return m;
        })()).slice(0, 12).map((cat) => {
          const s = categoryStyle(cat);
          return (
            <div key={cat} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${s.bg} ${s.text} ring-1 ${s.ring}`}>
              <span className="h-2 w-2 rounded-full bg-current opacity-70" />
              {s.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LanthActinRow({
  label, leadingCols, items, renderCell,
}: {
  label: string;
  leadingCols: number;
  items: PTElement[];
  renderCell: (e: PTElement | undefined, key: string) => React.ReactNode;
}) {
  return (
    <div className="grid gap-1 md:gap-1.5" style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}>
      <div className="col-span-2 flex items-center justify-end pr-2 text-[10px] md:text-xs text-muted-foreground font-mono">
        {label}
      </div>
      {items.map((e) => renderCell(e, `extra-${e.number}`))}
      {Array.from({ length: Math.max(0, 18 - leadingCols - items.length) }).map((_, i) => (
        <div key={`pad-${i}`} className="aspect-square" />
      ))}
    </div>
  );
}
