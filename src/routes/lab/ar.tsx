// /lab/ar — AR mode (camera + hand tracking)
// Tương tự lab/sim nhưng arOn mặc định = true
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Monitor } from "lucide-react";
import ARScene from "@/components/ARScene";
import ControlPanel from "@/components/ControlPanel";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { useVoiceCommands } from "@/hooks/use-voice-commands";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Molecule, Reaction } from "@/lib/chemistry";

const searchSchema = z.object({
  lesson: z.string().optional(),
  spawn: z.string().optional(),
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
  const { lesson } = Route.useSearch();
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

  // Auto-spawn molecule from query string
  const { spawn: spawnParam } = Route.useSearch();
  useEffect(() => {
    if (spawnParam && molecules.length > 0) {
      // spawnParam can be a comma-separated list or a single formula
      const formulas = spawnParam.split(",");
      const toSelect = molecules.find(
        (m) => formulas.includes(m.formula) || formulas.includes(m.id),
      );
      if (toSelect) {
        setSelected(toSelect);
        setToSpawn(toSelect); // auto-trigger spawn
      }
    }
  }, [spawnParam, molecules]);

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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Sub-header */}
      <div className="border-b border-border bg-card/60 backdrop-blur h-11 flex items-center px-4 gap-4 shrink-0">
        {lesson && (
          <Link
            to="/learn/lesson"
            search={{ lessonId: lesson }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại bài học
          </Link>
        )}
        <span className="font-medium text-sm">AR Lab</span>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="ml-auto rounded-full text-xs gap-1.5"
        >
          <Link to="/lab/sim">
            <Monitor className="h-3.5 w-3.5" /> Chuyển sang Sim 3D
          </Link>
        </Button>
      </div>

      {/* Main layout */}
      <div className="flex-1 overflow-hidden p-3 md:p-5">
        <div className="mx-auto w-full max-w-[1500px] grid gap-4 lg:grid-cols-[360px_1fr] h-full">
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
          />
          <main className="relative rounded-3xl overflow-hidden bg-card shadow-panel border border-border">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-muted-foreground">Đang tải dữ liệu…</div>
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
        </div>
      </div>

      {/* Reaction banner */}
      {lastReaction && (
        <div className="border-t border-border bg-card/90 backdrop-blur px-6 py-2.5 text-sm flex items-center justify-between gap-4">
          <span>
            ✨ <span className="font-mono font-semibold">{lastReaction.equation}</span>
            {lastReaction.energy_kj != null && (
              <span className="ml-2 text-xs text-muted-foreground">
                ΔH = {lastReaction.energy_kj} kJ
              </span>
            )}
          </span>
          <Link to="/tools/reactions" className="text-xs text-primary hover:underline shrink-0">
            Xem chi tiết →
          </Link>
        </div>
      )}
    </div>
  );
}
