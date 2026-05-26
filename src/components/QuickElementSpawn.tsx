import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Atom } from "lucide-react";
import { loadPeriodicTable, categoryStyle, type PTElement } from "@/lib/periodic-table-data";
import { Loader2 } from "lucide-react";

type Props = {
  onSpawn: (symbol: string) => void;
};

export default function QuickElementSpawn({ onSpawn }: Props) {
  const [elements, setElements] = useState<PTElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadPeriodicTable().then((els) => {
      if (!cancelled) {
        setElements(els);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = query
    ? elements.filter(
        (e) =>
          e.name.toLowerCase().includes(query.toLowerCase()) ||
          e.symbol.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 20)
    : elements.slice(0, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tải bảng tuần hoàn...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm nguyên tố (vd: H, O)..."
          className="pl-8 h-9 text-xs bg-background/50 border-white/10"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-1 pr-1">
        {filtered.length > 0 ? (
          filtered.map((el) => {
            const s = categoryStyle(el.category);
            return (
              <button
                key={el.number}
                onClick={() => onSpawn(el.symbol)}
                className="w-full flex items-center justify-between p-2 rounded-xl border border-white/5 bg-background/40 hover:bg-background/60 hover:border-primary/40 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg grid place-items-center font-display font-bold text-sm ${s.bg} ${s.text} shadow-sm`}>
                    {el.symbol}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{el.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{s.label}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  #{el.number}
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center text-xs text-muted-foreground py-8">
            Không tìm thấy nguyên tố nào.
          </div>
        )}
      </div>
    </div>
  );
}
