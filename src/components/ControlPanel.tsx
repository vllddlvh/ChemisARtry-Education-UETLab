import { useEffect, useState } from "react";
import type { Molecule, Reaction } from "@/lib/chemistry";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Camera,
  CameraOff,
  RotateCcw,
  GraduationCap,
  Search,
  Loader2,
  ExternalLink,
  ChevronRight,
  Library,
  Sparkles,
  X
} from "lucide-react";
import PubChemSearch from "@/components/PubChemSearch";
import { usePubChemEnrichment } from "@/hooks/use-pubchem-enrichment";
import { motion, AnimatePresence } from "motion/react";

import { translateToVietnamese } from "@/lib/translate";

type Props = {
  molecules: Molecule[];
  reactions: Reaction[];
  selected: Molecule | null;
  onSelect: (m: Molecule | null) => void;
  onSpawn: () => void;
  onSpawnMolecule?: (m: Molecule) => void;
  onReset: () => void;
  arOn: boolean;
  onToggleAr: () => void;
  education: boolean;
  onToggleEducation: (v: boolean) => void;
  lastReaction: Reaction | null;
};

export default function ControlPanel({
  molecules,
  reactions,
  selected,
  onSelect,
  onSpawn,
  onSpawnMolecule,
  onReset,
  arOn,
  onToggleAr,
  education,
  onToggleEducation,
  lastReaction,
}: Props) {
  const [activeTab, setActiveTab] = useState("library");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [translatedDesc, setTranslatedDesc] = useState<string>("");
  const enrichment = usePubChemEnrichment();

  // Auto-enrich when a molecule is selected
  useEffect(() => {
    if (selected) {
      enrichment.enrich(selected.formula, selected.name);
      // Translate local description
      if (selected.description) {
        translateToVietnamese(selected.description).then((viDesc) => setTranslatedDesc(viDesc));
      } else {
        setTranslatedDesc("");
      }
    } else {
      enrichment.clear();
      setTranslatedDesc("");
    }
  }, [selected?.id]);

  return (
    <>
      {/* Floating Toolbar (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-full bg-card/60 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto z-50">
        <Button
          onClick={() => setDrawerOpen((o) => !o)}
          variant={drawerOpen ? "default" : "secondary"}
          className="rounded-full shadow-sm"
        >
          <Library className="h-4 w-4 mr-2" /> Thư viện
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          onClick={onToggleAr}
          variant={arOn ? "default" : "ghost"}
          size="icon"
          className="rounded-full"
          title={arOn ? "Tắt AR" : "Bật AR"}
        >
          {arOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
        </Button>
        <Button
          onClick={onReset}
          variant="ghost"
          size="icon"
          className="rounded-full"
          title="Reset cảnh"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          onClick={() => onToggleEducation(!education)}
          variant={education ? "default" : "ghost"}
          size="icon"
          className="rounded-full"
          title="Chế độ giáo dục"
        >
          <GraduationCap className="h-4 w-4" />
        </Button>
      </div>

      {/* Floating Library Drawer (Left) */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.aside
            initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-0 top-24 bottom-24 w-[340px] flex flex-col p-4 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl pointer-events-auto z-40 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-bold flex items-center gap-2">
                <span className="inline-block animate-float-slow">⚗️</span>
                Quản lý hóa chất
              </h2>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setDrawerOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full grid grid-cols-2 bg-background/50">
                <TabsTrigger value="library" className="text-xs rounded-full">
                  Thư viện
                </TabsTrigger>
                <TabsTrigger value="pubchem" className="text-xs rounded-full">
                  <Search className="h-3 w-3 mr-1" /> PubChem
                </TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mt-4 space-y-2 pr-1">
                {molecules.map((m) => {
                  const active = selected?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => onSelect(m)}
                      className={`w-full text-left rounded-2xl border p-3 transition-all ${
                        active
                          ? "border-primary bg-primary/20 shadow-glow"
                          : "border-white/5 bg-background/40 hover:border-primary/40 hover:bg-background/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono text-sm font-bold tracking-wider">{m.formula}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{m.name}</div>
                        </div>
                        {active && <ChevronRight className="h-4 w-4 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </TabsContent>

              <TabsContent value="pubchem" className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] mt-4">
                <PubChemSearch compact onSpawn={onSpawnMolecule} />
              </TabsContent>
            </Tabs>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Floating Context Card (Right) */}
      <AnimatePresence>
        {selected && (
          <motion.aside
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute right-0 top-24 bottom-24 w-[340px] flex flex-col p-5 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl pointer-events-auto z-40 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-1">
                  Đã chọn
                </div>
                <div className="font-display text-2xl font-bold leading-tight pr-8">{selected.name}</div>
                <div className="font-mono text-sm text-primary mt-1 bg-primary/10 inline-block px-2 py-0.5 rounded-md tabular-nums">
                  {selected.formula}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full shrink-0 -mr-2" 
                onClick={() => onSelect(null)}
                title="Đóng thẻ"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              {translatedDesc || selected.description}
            </p>

            <Button
              onClick={onSpawn}
              className="w-full mt-4 rounded-full bg-gradient-primary text-primary-foreground shadow-glow h-12"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Đưa vào không gian XR
            </Button>

            {/* PubChem enrichment */}
            {enrichment.loading && (
              <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground bg-background/40 p-3 rounded-2xl">
                <Loader2 className="h-4 w-4 animate-spin" /> Tải dữ liệu PubChem...
              </div>
            )}

            {enrichment.pubchem && (
              <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Dữ liệu PubChem
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                  <div className="rounded-xl bg-background/50 px-3 py-2 border border-white/5">
                    <span className="text-muted-foreground block text-[10px] mb-0.5">Khối lượng</span>
                    <span className="font-mono text-foreground font-medium">
                      {Number(enrichment.pubchem.molecularWeight).toFixed(2)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-background/50 px-3 py-2 border border-white/5">
                    <span className="text-muted-foreground block text-[10px] mb-0.5">CID</span>
                    <span className="font-mono text-foreground font-medium">{enrichment.pubchem.cid}</span>
                  </div>
                </div>
                {enrichment.pubchem.canonicalSmiles && (
                  <div className="rounded-xl bg-background/50 p-3 border border-white/5 font-mono text-[10px] break-all leading-relaxed text-muted-foreground">
                    {enrichment.pubchem.canonicalSmiles}
                  </div>
                )}
                {enrichment.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4 mt-2">
                    {enrichment.description.description}
                  </p>
                )}
              </div>
            )}

            {education && (
              <div className="mt-6 bg-primary/10 rounded-2xl p-4 border border-primary/20">
                <h3 className="text-[10px] uppercase tracking-widest text-primary font-semibold mb-2">
                  Dữ liệu cấu trúc
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs tabular-nums">
                  <div>
                    <span className="text-muted-foreground">Nguyên tử:</span>{" "}
                    <span className="font-bold text-foreground">{selected.atoms.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Liên kết:</span>{" "}
                    <span className="font-bold text-foreground">{selected.bonds.length}</span>
                  </div>
                </div>
              </div>
            )}

            {reactions.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-3">
                  Phản ứng đã biết
                </h3>
                <div className="space-y-2">
                  {reactions.map((r) => (
                    <div
                      key={r.id}
                      className={`rounded-xl border p-3 text-sm transition-all ${
                        lastReaction?.id === r.id
                          ? "border-primary bg-primary/20 shadow-glow"
                          : "border-white/5 bg-background/40"
                      }`}
                    >
                      <div className="font-mono font-semibold tracking-wide text-primary-foreground">{r.equation}</div>
                      <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{r.description}</div>
                      {education && r.energy_kj != null && (
                        <div className="text-[10px] font-mono text-primary mt-2 bg-primary/10 inline-block px-1.5 py-0.5 rounded">
                          ΔH ≈ {r.energy_kj} kJ/mol
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
