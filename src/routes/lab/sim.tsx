// /lab/sim — Chế độ mô phỏng 3D (KHÔNG dùng camera).
// Dựng <ARScene arOn={false} /> nên getUserMedia / MediaPipe không bao giờ được
// gọi. Tương tác bằng chuột: kéo-thả phân tử, cuộn để zoom, hover xem thông tin.
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import { Camera } from "lucide-react";
import ARScene from "@/components/ARScene";
import ControlPanel from "@/components/ControlPanel";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { createAtomMolecule, resolveLabSpawn } from "@/lib/lab-spawn";
import { reactionVisual } from "@/lib/reaction-data";
import { getLessonById } from "@/lib/lessons-data";
import { appStore } from "@/store/app-store";
import { toast } from "sonner";
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
      { title: "Mô phỏng 3D — ChemisARtry" },
      {
        name: "description",
        content:
          "Mô phỏng phân tử 3D tương tác, không cần camera. Kéo-thả bằng chuột, cuộn để zoom.",
      },
    ],
  }),
  component: LabSimPage,
});

function LabSimPage() {
  const { spawn: spawnParam, element: elementParam, lesson: lessonParam } = Route.useSearch();
  const { molecules, reactions, loading } = useChemistryData();

  const lesson = lessonParam ? getLessonById(lessonParam) : undefined;

  const [selected, setSelected] = useState<Molecule | null>(null);
  const [toSpawn, setToSpawn] = useState<Molecule | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [education, setEducation] = useState(false);
  const [lastReaction, setLastReaction] = useState<Reaction | null>(null);

  // Khi mở từ tab Học tập: ghi nhận lesson context (mở bài, đếm streak).
  useEffect(() => {
    if (lesson) appStore.enterLessonContext(lesson.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // Spawn từ query (?spawn=/?element=) hoặc preload phân tử mặc định của bài học.
  useEffect(() => {
    if (molecules.length === 0) return;
    const fromQuery = resolveLabSpawn(molecules, spawnParam, elementParam);
    if (fromQuery) {
      setSelected(fromQuery);
      setToSpawn(fromQuery);
      appStore.requestSpawn(fromQuery);
      return;
    }
    const first = lesson?.practice.defaultMolecules[0];
    if (first) {
      const m = resolveLabSpawn(molecules, first, undefined);
      if (m) setSelected(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spawnParam, elementParam, molecules.length, lesson?.id]);

  const handleReaction = useCallback((r: Reaction) => {
    setLastReaction(r);
    appStore.pushReaction(r);
    const v = reactionVisual(r);
    const heat =
      v.exothermic === true ? "Toả nhiệt 🔥" : v.exothermic === false ? "Thu nhiệt ❄️" : "";
    toast.success(`${v.icon} ${v.label}`, {
      description: `${r.equation}${
        r.energy_kj != null ? `  ·  ΔH ≈ ${r.energy_kj} kJ/mol` : ""
      }${heat ? `  ·  ${heat}` : ""}`,
    });
  }, []);

  const spawn = useCallback(() => {
    if (selected) {
      setToSpawn(selected);
      appStore.requestSpawn(selected);
    }
  }, [selected]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-background flex flex-col">
      <main className="relative flex-1 z-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-muted-foreground">Đang tải dữ liệu hoá học…</div>
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

      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col p-4 md:p-6 justify-between">
        {lastReaction && <ReactionBanner reaction={lastReaction} />}

        {/* Chuyển sang AR */}
        <Link
          to="/lab/ar"
          search={lessonParam ? { lesson: lessonParam } : {}}
          className="pointer-events-auto absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-xl border border-border px-4 py-2 text-sm font-medium shadow-soft hover:border-primary/50 transition-colors"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Chuyển sang AR
        </Link>

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
            onToggleAr={() => {
              // Bật AR = điều hướng sang /lab/ar (sim không yêu cầu camera).
              window.location.assign("/lab/ar");
            }}
            lastReaction={lastReaction}
            onSpawnElement={(symbol) => {
              const toSelect = createAtomMolecule(symbol);
              if (toSelect) {
                setSelected(toSelect);
                setToSpawn(toSelect);
                appStore.requestSpawn(toSelect);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ReactionBanner({ reaction }: { reaction: Reaction }) {
  const v = reactionVisual(reaction);
  const heatLabel =
    v.exothermic === true ? "Toả nhiệt" : v.exothermic === false ? "Thu nhiệt" : null;
  return (
    <div
      key={reaction.id}
      className={`pointer-events-auto absolute top-20 left-1/2 -translate-x-1/2 rounded-2xl border bg-card/85 backdrop-blur-xl px-5 py-3 text-sm flex items-center gap-4 shadow-xl animate-in fade-in slide-in-from-top-4 ${v.accentClass}`}
    >
      <span className="text-xl shrink-0">{v.icon}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-semibold text-foreground">{reaction.equation}</span>
          {heatLabel && (
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-90">
              {heatLabel}
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
          <span>{v.label}</span>
          {reaction.energy_kj != null && (
            <span className="font-mono">ΔH ≈ {reaction.energy_kj} kJ/mol</span>
          )}
        </div>
      </div>
      <Link
        to="/tools/reactions"
        className="text-xs text-primary hover:underline shrink-0 font-medium self-start"
      >
        Chi tiết →
      </Link>
    </div>
  );
}
