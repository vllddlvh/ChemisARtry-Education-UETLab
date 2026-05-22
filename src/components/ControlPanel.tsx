import { useEffect, useState } from "react";
import type { Molecule, Reaction } from "@/lib/chemistry";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Camera, CameraOff, RotateCcw, GraduationCap, Search, Loader2, ExternalLink } from "lucide-react";
import PubChemSearch from "@/components/PubChemSearch";
import { usePubChemEnrichment } from "@/hooks/use-pubchem-enrichment";

type Props = {
  molecules: Molecule[];
  reactions: Reaction[];
  selected: Molecule | null;
  onSelect: (m: Molecule) => void;
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
  molecules, reactions, selected, onSelect, onSpawn, onSpawnMolecule, onReset,
  arOn, onToggleAr, education, onToggleEducation, lastReaction,
}: Props) {
  const [activeTab, setActiveTab] = useState("library");
  const enrichment = usePubChemEnrichment();

  // Auto-enrich when a molecule is selected
  useEffect(() => {
    if (selected) {
      enrichment.enrich(selected.formula, selected.name);
    } else {
      enrichment.clear();
    }
  }, [selected?.id]);

  return (
    <aside className="flex flex-col gap-4 p-5 h-full overflow-y-auto bg-panel shadow-panel rounded-3xl border border-border">
      <div>
        <h2 className="text-xl font-display font-bold flex items-center gap-2">
          <span className="inline-block animate-float-slow">⚗️</span>
          Lab Controls
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pinch to grab. Bring two molecules together to react.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={onToggleAr} variant={arOn ? "default" : "secondary"} className="flex-1 rounded-full">
          {arOn ? <CameraOff className="mr-2 h-4 w-4" /> : <Camera className="mr-2 h-4 w-4" />}
          {arOn ? "AR On" : "Start AR"}
        </Button>
        <Button onClick={onReset} variant="outline" className="rounded-full" aria-label="Reset scene">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-accent/40 px-4 py-3">
        <Label htmlFor="edu" className="flex items-center gap-2 cursor-pointer">
          <GraduationCap className="h-4 w-4" /> Education mode
        </Label>
        <Switch id="edu" checked={education} onCheckedChange={onToggleEducation} />
      </div>

      {/* Tabs: Library vs PubChem Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="library" className="text-xs">Library</TabsTrigger>
          <TabsTrigger value="pubchem" className="text-xs">
            <Search className="h-3 w-3 mr-1" /> PubChem
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="flex-1 overflow-y-auto mt-3 space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Molecule library
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {molecules.map((m) => {
                const active = selected?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelect(m)}
                    className={`text-left rounded-2xl border p-3 transition-all ${
                      active
                        ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
                        : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="font-mono text-sm font-bold">{m.formula}</div>
                    <div className={`text-xs mt-0.5 ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {m.name}
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              disabled={!selected}
              onClick={onSpawn}
              className="w-full mt-3 rounded-full bg-gradient-primary text-primary-foreground"
            >
              ✨ Spawn {selected?.formula ?? "molecule"}
            </Button>
          </div>

          {selected && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">About</div>
              <div className="font-display text-lg font-bold">{selected.name}</div>
              <div className="font-mono text-sm text-primary">{selected.formula}</div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {selected.description}
              </p>

              {/* PubChem enrichment */}
              {enrichment.loading && (
                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading PubChem data...
                </div>
              )}
              {enrichment.pubchem && (
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="h-2.5 w-2.5" /> PubChem
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    <div className="rounded-lg bg-muted/60 px-2 py-1">
                      <span className="text-muted-foreground">MW: </span>
                      <span className="font-mono">{Number(enrichment.pubchem.molecularWeight).toFixed(2)}</span>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-2 py-1">
                      <span className="text-muted-foreground">CID: </span>
                      <span className="font-mono">{enrichment.pubchem.cid}</span>
                    </div>
                  </div>
                  {enrichment.pubchem.canonicalSmiles && (
                    <div className="rounded-lg bg-muted/60 px-2 py-1 font-mono text-[10px] break-all leading-relaxed">
                      {enrichment.pubchem.canonicalSmiles}
                    </div>
                  )}
                  {enrichment.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                      {enrichment.description.description}
                    </p>
                  )}
                </div>
              )}

              {education && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <span className="font-semibold">Atoms:</span> {selected.atoms.length} &nbsp;·&nbsp;
                  <span className="font-semibold">Bonds:</span> {selected.bonds.length}
                </div>
              )}
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Known reactions
            </h2>
            <div className="space-y-2">
              {reactions.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-xl border p-3 text-sm transition ${
                    lastReaction?.id === r.id
                      ? "border-primary bg-primary/10 animate-pulse-glow"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="font-mono font-semibold">{r.equation}</div>
                  <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
                  {education && r.energy_kj != null && (
                    <div className="text-xs font-mono text-primary mt-1">ΔH ≈ {r.energy_kj} kJ/mol</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pubchem" className="flex-1 overflow-y-auto mt-3">
          <div className="mb-2">
            <p className="text-xs text-muted-foreground">
              Search 100M+ compounds from PubChem. Load 3D structures and spawn them into your AR scene.
            </p>
          </div>
          <PubChemSearch
            compact
            onSpawn={onSpawnMolecule}
          />
        </TabsContent>
      </Tabs>

      <footer className="mt-auto text-xs text-muted-foreground pt-3 border-t border-border">
        Gestures: <span className="font-mono">pinch</span> grab ·{" "}
        <span className="font-mono">move</span> translate ·{" "}
        <span className="font-mono">rotate wrist</span> spin ·{" "}
        <span className="font-mono">two hands</span> scale
      </footer>
    </aside>
  );
}
