// /lab/sim — Simulation mode (không cần camera)
// Giữ toàn bộ chức năng ARScene nhưng arOn mặc định = false
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ARScene from "@/components/ARScene";
import ControlPanel from "@/components/ControlPanel";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { useVoiceCommands } from "@/hooks/use-voice-commands";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createAtomMolecule, resolveLabSpawn } from "@/lib/lab-spawn";
import type { Molecule, Reaction } from "@/lib/chemistry";

const searchSchema = z.object({
  lesson: z.string().optional(),
  spawn: z.string().optional(),
  element: z.string().optional(),
});

export const Route = createFileRoute("/lab/sim")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Phòng thí nghiệm 3D — ChemisARtry" },
      {
        name: "description",
        content: "Mô phỏng 3D tương tác — kéo thả phân tử, quan sát phản ứng. Không cần camera.",
      },
    ],
  }),
  component: LabSimPage,
});

function LabSimPage() {
  const { lesson, spawn: spawnParam, element: elementParam } = Route.useSearch();
  const { molecules, reactions, loading } = useChemistryData();
  const { user } = useAuth();

  const [selected, setSelected] = useState<Molecule | null>(null);
  const [toSpawn, setToSpawn] = useState<Molecule | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [education, setEducation] = useState(false);
  const [lastReaction, setLastReaction] = useState<Reaction | null>(null);

  const handleVoice = useCallback((cmd: string) => {
    if (/reset|clear|remove/i.test(cmd)) setResetSignal((s) => s + 1);
  }, []);
  useVoiceCommands(handleVoice);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pendingSpawn = window.sessionStorage.getItem("chemisartry.pendingSpawn");
    if (!pendingSpawn || molecules.length === 0) return;

    try {
      const parsed = JSON.parse(pendingSpawn) as Molecule;
      if (parsed && Array.isArray(parsed.atoms) && Array.isArray(parsed.bonds)) {
        const toSelect = {
          ...parsed,
          id: parsed.id || `pubchem-${parsed.formula}`,
          formula: parsed.formula.trim(),
          name: parsed.name?.trim() || parsed.formula,
          description: parsed.description?.trim() || "",
          category: parsed.category?.trim() || "pubchem",
        } satisfies Molecule;

        setSelected(toSelect);
        setToSpawn(toSelect);
        window.sessionStorage.removeItem("chemisartry.pendingSpawn");
        return;
      }
    } catch {
      window.sessionStorage.removeItem("chemisartry.pendingSpawn");
    }
  }, [molecules]);

  useEffect(() => {
    if (spawnParam === "pubchem") return;

    const toSelect = resolveLabSpawn(molecules, spawnParam, elementParam);
    if (toSelect) {
      setSelected(toSelect);
      setToSpawn(toSelect); // auto-trigger spawn
    }
  }, [spawnParam, elementParam, molecules]);

  const handleReaction = useCallback(
    async (r: Reaction) => {
      setLastReaction(r);
      if (!user) return;
      await supabase
        .from("user_progress")
        .upsert({ user_id: user.id, reactions_triggered: 1 }, { onConflict: "user_id" });
    },
    [user],
  );

  const spawn = useCallback(() => {
    if (selected) setToSpawn(selected);
  }, [selected]);

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-black">
      {/* 3D Scene Layer */}
      <main className="absolute inset-0 z-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white/70">Đang tải dữ liệu hoá học…</div>
          </div>
        ) : (
          <ARScene
            molecules={molecules}
            reactions={reactions}
            toSpawn={toSpawn}
            onSpawned={() => setToSpawn(null)}
            resetSignal={resetSignal}
            educationMode={education}
            onReaction={handleReaction}
            arOn={false}
          />
        )}
      </main>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 md:p-6 justify-between">
        {/* Close Button */}
        <div className="pointer-events-auto absolute top-6 right-6 z-50">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full bg-background/60 backdrop-blur-md border-border text-foreground hover:bg-background/80 shadow-lg w-12 h-12"
          >
            <Link to={lesson ? "/learn/lesson" : "/dashboard"} search={lesson ? { lessonId: lesson } : { tab: "lab" }}>
              <X className="h-6 w-6" />
            </Link>
          </Button>
        </div>

        {/* Reaction banner (Floating Top Center or Bottom) */}
        {lastReaction && (
          <div className="pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 rounded-full border border-primary/20 bg-card/80 backdrop-blur-xl px-6 py-2.5 text-sm flex items-center justify-between gap-4 shadow-xl animate-in fade-in slide-in-from-top-4">
            <span>
              ✨ <span className="font-mono font-semibold text-primary">{lastReaction.equation}</span>
              {lastReaction.energy_kj != null && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ΔH = {lastReaction.energy_kj} kJ
                </span>
              )}
            </span>
            <Link to="/tools/reactions" className="text-xs text-primary hover:underline shrink-0 font-medium">
              Xem chi tiết →
            </Link>
          </div>
        )}

        {/* Main Control Panel (takes remaining space and pointer-events-auto internally) */}
        <div className="flex-1 mt-4 relative">
          <ControlPanel
            molecules={molecules}
            reactions={reactions}
            selected={selected}
            onSelect={setSelected}
            onSpawn={spawn}
            onReset={() => setResetSignal((s) => s + 1)}
            education={education}
            onToggleEducation={setEducation}
            arOn={false}
            onToggleAr={() => { }}
            lastReaction={lastReaction}
            onSpawnElement={(symbol) => {
              const toSelect = createAtomMolecule(symbol);
              if (toSelect) {
                setSelected(toSelect);
                setToSpawn(toSelect);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
