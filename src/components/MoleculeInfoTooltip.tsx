import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { loadPeriodicTable, type PTElement } from "@/lib/periodic-table-data";
import { ExternalLink, Atom } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  elementSymbol: string | null;
  x: number;
  y: number;
  onClose?: () => void;
};

export default function MoleculeInfoTooltip({ elementSymbol, x, y, onClose }: Props) {
  const [element, setElement] = useState<PTElement | null>(null);

  useEffect(() => {
    if (!elementSymbol) {
      setElement(null);
      return;
    }
    let cancelled = false;
    loadPeriodicTable().then((els) => {
      if (cancelled) return;
      const el = els.find((e) => e.symbol === elementSymbol);
      setElement(el || null);
    });
    return () => {
      cancelled = true;
    };
  }, [elementSymbol]);

  return (
    <AnimatePresence>
      {elementSymbol && element && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 pointer-events-auto shadow-2xl"
          style={{
            left: Math.min(x + 15, window.innerWidth - 260),
            top: Math.min(y + 15, window.innerHeight - 150),
            width: 240,
          }}
          onMouseLeave={onClose}
        >
          <div className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary grid place-items-center font-display font-bold text-lg shadow-inner">
                {element.symbol}
              </div>
              <div>
                <div className="font-bold text-sm text-foreground">{element.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  p: {element.number} · n: {Math.max(0, Math.round(element.atomic_mass) - element.number)}
                </div>
              </div>
            </div>
            
            <div className="bg-background/50 rounded-lg p-2 mb-3 border border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">
                Electron
              </div>
              <div className="font-mono text-[11px] text-foreground break-all">
                {element.electron_configuration_semantic || element.electron_configuration || "—"}
              </div>
            </div>

            <Link
              to="/tools/periodic-table"
              className="flex items-center justify-center w-full gap-1.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold"
            >
              Xem chi tiết <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
