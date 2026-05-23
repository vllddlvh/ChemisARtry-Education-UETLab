// /lab — the full AR experience. Voice commands, education mode, progress sync.
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import ARScene from "@/components/ARScene";
import ControlPanel from "@/components/ControlPanel";
import SiteHeader from "@/components/SiteHeader";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { useVoiceCommands } from "@/hooks/use-voice-commands";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Molecule, Reaction } from "@/lib/chemistry";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

export const Route = createFileRoute("/lab/")({
  head: () => ({
    meta: [
      { title: "AR Lab — MoleLab AR" },
      { name: "description", content: "Interactive AR chemistry lab. Spawn 3D molecules with hand gestures and trigger reactions." },
      { property: "og:title", content: "AR Lab — MoleLab AR" },
      { property: "og:description", content: "Spawn 3D molecules, pinch to grab, combine to react." },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const { molecules, reactions, loading, error } = useChemistryData();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Molecule | null>(null);
  const [toSpawn, setToSpawn] = useState<Molecule | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [arOn, setArOn] = useState(false);
  const [education, setEducation] = useState(false);
  const [lastReaction, setLastReaction] = useState<Reaction | null>(null);

  const onSpawned = useCallback(() => setToSpawn(null), []);

  const handleSpawn = useCallback((m?: Molecule) => {
    const target = m ?? selected;
    if (!target) return;
    setToSpawn(target);
    toast.success(`Spawned ${target.formula}`, { description: target.name });
    recordProgress(target.formula, "spawn");
  }, [selected]);

  const handleReaction = useCallback((r: Reaction) => {
    setLastReaction(r);
    toast.success("⚗️ Reaction!", { description: r.equation });
    recordProgress(null, "reaction");
  }, []);

  // Voice commands
  const onVoice = useCallback((text: string) => {
    const t = text.toLowerCase();
    // "show <molecule name>"
    const show = t.match(/(?:show|spawn|create|make)\s+(.+)/);
    if (show) {
      const query = show[1].trim();
      const m = molecules.find((x) =>
        x.name.toLowerCase() === query ||
        x.formula.toLowerCase() === query.replace(/\s/g, "") ||
        x.name.toLowerCase().includes(query)
      );
      if (m) { setSelected(m); handleSpawn(m); toast.info(`🎙️ "${text}"`); return; }
      // If not found locally, notify user to check PubChem
      toast.info(`🎙️ "${query}" not in local library — try PubChem tab`);
      return;
    }
    if (/reset|clear|remove/.test(t)) {
      setResetSignal((v) => v + 1); setLastReaction(null);
      toast.info(`🎙️ Reset scene`); return;
    }
    if (/start ar|turn on|camera on/.test(t)) { setArOn(true); toast.info(`🎙️ AR on`); return; }
    if (/stop ar|turn off|camera off/.test(t)) { setArOn(false); toast.info(`🎙️ AR off`); return; }
    if (/education|labels/.test(t)) { setEducation((v) => !v); toast.info(`🎙️ Education toggled`); return; }
  }, [molecules, handleSpawn]);

  const voice = useVoiceCommands(onVoice);

  async function recordProgress(formula: string | null, kind: "spawn" | "reaction") {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("user_progress").select("*").eq("user_id", user.id).maybeSingle();
      if (existing) {
        await supabase.from("user_progress").update({
          molecules_spawned: existing.molecules_spawned + (kind === "spawn" ? 1 : 0),
          reactions_triggered: existing.reactions_triggered + (kind === "reaction" ? 1 : 0),
          last_molecule: formula ?? existing.last_molecule,
          updated_at: new Date().toISOString(),
        }).eq("user_id", user.id);
      } else {
        await supabase.from("user_progress").insert({
          user_id: user.id,
          molecules_spawned: kind === "spawn" ? 1 : 0,
          reactions_triggered: kind === "reaction" ? 1 : 0,
          last_molecule: formula,
        });
      }
    } catch { /* best-effort */ }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === " " && selected) { e.preventDefault(); handleSpawn(); }
      if (e.key === "r" || e.key === "R") { setResetSignal((v) => v + 1); setLastReaction(null); }
      if (e.key === "e" || e.key === "E") setEducation((v) => !v);
      if (e.key === "a" || e.key === "A") setArOn((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, handleSpawn]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-float-slow">⚗️</div>
          <p className="mt-4 text-muted-foreground">Loading chemistry...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 max-w-md">
          <h2 className="font-bold text-destructive">Couldn't load data</h2>
          <p className="text-sm mt-2 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <SiteHeader />
      <div className="flex-1 p-3 md:p-5">
        <div className="mx-auto max-w-[1500px] grid gap-4 lg:grid-cols-[360px_1fr] h-[calc(100vh-8rem)]">
          <ControlPanel
            molecules={molecules}
            reactions={reactions}
            selected={selected}
            onSelect={setSelected}
            onSpawn={() => handleSpawn()}
            onSpawnMolecule={(m) => handleSpawn(m)}
            onReset={() => { setResetSignal((v) => v + 1); setLastReaction(null); }}
            arOn={arOn}
            onToggleAr={() => setArOn((v) => !v)}
            education={education}
            onToggleEducation={setEducation}
            lastReaction={lastReaction}
          />
          <main className="relative rounded-3xl overflow-hidden bg-card shadow-panel border border-border">
            <ARScene
              molecules={molecules}
              reactions={reactions}
              toSpawn={toSpawn}
              onSpawned={onSpawned}
              resetSignal={resetSignal}
              educationMode={education}
              onReaction={handleReaction}
              arOn={arOn}
            />
            {/* Voice button */}
            {voice.supported && (
              <Button
                size="sm"
                variant={voice.listening ? "default" : "outline"}
                onClick={voice.toggle}
                className={`absolute top-3 right-3 rounded-full ${voice.listening ? "bg-primary animate-pulse-glow" : "bg-card/80 backdrop-blur"}`}
              >
                {voice.listening ? <Mic className="h-4 w-4 mr-1" /> : <MicOff className="h-4 w-4 mr-1" />}
                {voice.listening ? "Listening" : "Voice"}
              </Button>
            )}
            {/* Keyboard hint */}
            <div className="absolute bottom-3 left-3 text-[11px] text-card-foreground/70 bg-card/70 backdrop-blur rounded-full px-3 py-1.5 border border-border hidden md:block">
              <kbd className="font-mono">Space</kbd> spawn · <kbd className="font-mono">R</kbd> reset · <kbd className="font-mono">E</kbd> edu · <kbd className="font-mono">A</kbd> AR
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
