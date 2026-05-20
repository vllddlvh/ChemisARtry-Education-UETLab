import type { Molecule, Reaction } from "@/lib/chemistry";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Camera, CameraOff, RotateCcw, GraduationCap } from "lucide-react";

type Props = {
  molecules: Molecule[];
  reactions: Reaction[];
  selected: Molecule | null;
  onSelect: (m: Molecule) => void;
  onSpawn: () => void;
  onReset: () => void;
  arOn: boolean;
  onToggleAr: () => void;
  education: boolean;
  onToggleEducation: (v: boolean) => void;
  lastReaction: Reaction | null;
};

export default function ControlPanel({
  molecules, reactions, selected, onSelect, onSpawn, onReset,
  arOn, onToggleAr, education, onToggleEducation, lastReaction,
}: Props) {
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

      <footer className="mt-auto text-xs text-muted-foreground pt-3 border-t border-border">
        Gestures: <span className="font-mono">pinch</span> grab ·{" "}
        <span className="font-mono">move</span> translate ·{" "}
        <span className="font-mono">rotate wrist</span> spin ·{" "}
        <span className="font-mono">two hands</span> scale
      </footer>
    </aside>
  );
}
