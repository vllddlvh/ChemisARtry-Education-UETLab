// /lab/ar — AR mode (camera + hand tracking)
// Tương tự chế độ mô phỏng nhưng arOn mặc định = true
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import SiteHeader from "@/components/SiteHeader";
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

export const Route = createFileRoute("/lab/ar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "AR Lab — ChemisARtry" },
      {
        name: "description",
        content: "Thí nghiệm hoá học AR: điều khiển phân tử bằng tay, kích hoạt phản ứng thật.",
      },
    ],
  }),
  component: LabARPage,
});

function LabARPage() {
  const { spawn: spawnParam, element: elementParam } = Route.useSearch();
  const { molecules, reactions, loading } = useChemistryData();
  const { user } = useAuth();

  const [selected, setSelected] = useState<Molecule | null>(null);
  const [toSpawn, setToSpawn] = useState<Molecule | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [education, setEducation] = useState(false);
  const [arOn, setArOn] = useState(true);
  const [lastReaction, setLastReaction] = useState<Reaction | null>(null);

  const handleVoice = useCallback((cmd: string) => {
    if (/reset|clear|remove/i.test(cmd)) setResetSignal((s) => s + 1);
    if (/education|label/i.test(cmd)) setEducation((v) => !v);
    if (/stop ar|camera off/i.test(cmd)) setArOn(false);
    if (/start ar|camera on/i.test(cmd)) setArOn(true);
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
    <div className="relative w-full min-h-screen overflow-hidden bg-black flex flex-col">
      <SiteHeader />

      {/* 3D / AR Scene Layer */}
      <main className="relative flex-1 z-0">
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
            arOn={arOn}
          />
        )}
      </main>

      {/* UI Overlay Layer */}
      <div className="absolute inset-x-0 bottom-0 top-16 pointer-events-none z-10 flex flex-col p-4 md:p-6 justify-between">
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
            arOn={arOn}
            onToggleAr={() => setArOn((v) => !v)}
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
