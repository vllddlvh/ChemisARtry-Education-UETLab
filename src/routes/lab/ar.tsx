// /lab/ar — AR mode (camera + hand tracking)
// Tương tự chế độ mô phỏng nhưng arOn mặc định = true
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useCallback, useEffect } from "react";
import { Check, Monitor } from "lucide-react";
import ARScene from "@/components/ARScene";
import ControlPanel from "@/components/ControlPanel";
import { useChemistryData } from "@/hooks/use-chemistry-data";
import { useVoiceCommands } from "@/hooks/use-voice-commands";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { createAtomMolecule, resolveLabSpawn } from "@/lib/lab-spawn";
import { reactionVisual } from "@/lib/reaction-data";
import { getLessonById, type Lesson, type Mission } from "@/lib/lessons-data";
import { appStore } from "@/store/app-store";
import { recordSpawn as contentRecordSpawn } from "@/lib/content-store";
import { toast } from "sonner";
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
  const { spawn: spawnParam, element: elementParam, lesson: lessonParam } = Route.useSearch();
  const { molecules, reactions, loading } = useChemistryData();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);

  const lesson = lessonParam ? getLessonById(lessonParam) : undefined;

  const [selected, setSelected] = useState<Molecule | null>(null);
  const [toSpawn, setToSpawn] = useState<Molecule | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [education, setEducation] = useState(false);
  const [arOn, setArOn] = useState(true);
  const [headTracking, setHeadTracking] = useState(false);
  const [lastReaction, setLastReaction] = useState<Reaction | null>(null);
  const [history, setHistory] = useState<Reaction[]>([]);
  // Theo dõi nhiệm vụ bài học đã hoàn thành (theo id mission).
  const [doneMissions, setDoneMissions] = useState<Set<string>>(new Set());
  const [spawnedFormulas, setSpawnedFormulas] = useState<Set<string>>(new Set());

  const handleVoice = useCallback((cmd: string) => {
    if (/reset|clear|remove/i.test(cmd)) setResetSignal((s) => s + 1);
    if (/education|label/i.test(cmd)) setEducation((v) => !v);
    if (/stop ar|camera off/i.test(cmd)) setArOn(false);
    if (/start ar|camera on/i.test(cmd)) setArOn(true);
    if (/3d|parallax|head|đầu/i.test(cmd)) setHeadTracking((v) => !v);
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
      setHistory((prev) => [r, ...prev].slice(0, 8));
      // Bridge → App_State_Store → Content_Store (đếm phản ứng, streak, thành tích).
      appStore.pushReaction(r);

      // Thông báo phản ứng với phân loại (toả/thu nhiệt, loại phản ứng).
      const v = reactionVisual(r);
      const heat =
        v.exothermic === true ? "Toả nhiệt 🔥" : v.exothermic === false ? "Thu nhiệt ❄️" : "";
      toast.success(`${v.icon} ${v.label}`, {
        description: `${r.equation}${
          r.energy_kj != null ? `  ·  ΔH ≈ ${r.energy_kj} kJ/mol` : ""
        }${heat ? `  ·  ${heat}` : ""}`,
      });

      // Kiểm tra hoàn thành nhiệm vụ bài học liên quan tới phản ứng.
      if (lesson) {
        setDoneMissions((prev) => {
          const next = new Set(prev);
          const reactedCount = history.length + 1;
          for (const m of lesson.practice.missions) {
            if (next.has(m.id)) continue;
            if (missionMatchesReaction(m, r, reactedCount)) {
              next.add(m.id);
              appStore.completeMission(m.id);
              toast(`🎯 Hoàn thành: ${m.description}`);
            }
          }
          return next;
        });
      }

      if (!user) return;
      await supabase
        .from("user_progress")
        .upsert({ user_id: user.id, reactions_triggered: 1 }, { onConflict: "user_id" });
    },
    [user, lesson, history.length],
  );

  // Preload phân tử mặc định của bài học (nếu mở từ tab Học tập).
  useEffect(() => {
    if (!lesson || molecules.length === 0) return;
    // Ghi nhận lesson context (mở bài, đếm streak) qua App_State_Store.
    appStore.enterLessonContext(lesson.id);
    const first = lesson.practice.defaultMolecules[0];
    if (!first) return;
    const m = resolveLabSpawn(molecules, first, undefined);
    if (m) setSelected(m);
    // Chỉ preload chọn chất đầu tiên, không tự spawn để tránh rối.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, molecules.length]);

  const markSpawned = useCallback(
    (formula: string) => {
      // Đếm phân tử đã tạo vào Content_Store (tiến độ/streak/thành tích).
      contentRecordSpawn(formula);
      setSpawnedFormulas((prev) => {
        const next = new Set(prev);
        next.add(formula);
        if (lesson) {
          setDoneMissions((dm) => {
            const nd = new Set(dm);
            for (const m of lesson.practice.missions) {
              if (nd.has(m.id)) continue;
              if (missionMatchesSpawn(m, formula, next.size)) {
                nd.add(m.id);
                appStore.completeMission(m.id);
                toast(`🎯 Hoàn thành: ${m.description}`);
              }
            }
            return nd;
          });
        }
        return next;
      });
    },
    [lesson],
  );

  const spawn = useCallback(() => {
    if (selected) {
      setToSpawn(selected);
      markSpawned(selected.formula);
    }
  }, [selected, markSpawned]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black flex flex-col">
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
            headTracking={headTracking}
          />
        )}
      </main>

      {/* UI Overlay Layer */}
      <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-10 flex flex-col p-4 md:p-6 justify-between">
        {/* Khuyến nghị dùng Mô phỏng 3D trên thiết bị di động (hiệu năng) */}
        {isMobile && !advisoryDismissed && (
          <div className="pointer-events-auto absolute inset-x-4 top-4 z-20 rounded-2xl border border-amber-500/40 bg-card/90 backdrop-blur-xl p-4 shadow-xl">
            <div className="text-sm font-bold text-foreground">📱 Mẹo cho thiết bị di động</div>
            <p className="text-xs text-muted-foreground mt-1">
              Chế độ AR cần nhiều tài nguyên. Trên điện thoại, chế độ Mô phỏng 3D thường mượt hơn.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Link
                to="/lab/sim"
                search={lessonParam ? { lesson: lessonParam } : {}}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold px-4 py-2 shadow-glow"
              >
                <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> Chuyển sang Mô phỏng 3D
              </Link>
              <button
                onClick={() => setAdvisoryDismissed(true)}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-2"
              >
                Vẫn dùng AR
              </button>
            </div>
          </div>
        )}

        {/* Reaction banner (Floating Top Center) */}
        {lastReaction && <ReactionBanner reaction={lastReaction} />}

        {/* Lesson objectives panel (top-left) */}
        {lesson && <LessonObjectives lesson={lesson} done={doneMissions} />}

        {/* Chuyển sang chế độ mô phỏng 3D (không cần camera) */}
        <Link
          to="/lab/sim"
          search={lessonParam ? { lesson: lessonParam } : {}}
          className="pointer-events-auto absolute top-4 right-4 inline-flex items-center gap-2 rounded-full bg-card/80 backdrop-blur-xl border border-white/10 px-4 py-2 text-sm font-medium shadow-xl hover:border-primary/50 transition-colors"
        >
          <Monitor className="h-4 w-4" aria-hidden="true" />
          Mô phỏng 3D
        </Link>

        {/* Reaction history log (top-right) */}
        {history.length > 0 && (
          <div className="pointer-events-auto absolute top-16 right-4 w-64 rounded-2xl border border-white/10 bg-card/70 backdrop-blur-xl p-3 shadow-xl hidden lg:block">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 px-1">
              Nhật ký phản ứng
            </div>
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {history.map((r, i) => {
                const v = reactionVisual(r);
                return (
                  <div
                    key={`${r.id}-${i}`}
                    className={`rounded-xl border px-2.5 py-1.5 text-[11px] ${v.accentClass}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{v.icon}</span>
                      <span className="font-mono font-semibold text-foreground truncate">
                        {r.equation}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
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
            headTracking={headTracking}
            onToggleHeadTracking={() => setHeadTracking((v) => !v)}
            lastReaction={lastReaction}
            onSpawnElement={(symbol) => {
              const toSelect = createAtomMolecule(symbol);
              if (toSelect) {
                setSelected(toSelect);
                setToSpawn(toSelect);
                markSpawned(toSelect.formula);
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

// ── Lesson objectives ────────────────────────────────────────────────────

function LessonObjectives({ lesson, done }: { lesson: Lesson; done: Set<string> }) {
  const total = lesson.practice.missions.length;
  const completed = lesson.practice.missions.filter((m) => done.has(m.id)).length;
  const allDone = total > 0 && completed === total;
  return (
    <div className="pointer-events-auto absolute top-4 left-4 w-72 rounded-2xl border border-white/10 bg-card/70 backdrop-blur-xl p-3.5 shadow-xl hidden md:block">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-primary font-bold">
          Bài {lesson.order}: {lesson.title}
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
      <div className="space-y-1.5">
        {lesson.practice.missions.map((m) => {
          const ok = done.has(m.id);
          return (
            <div key={m.id} className="flex items-start gap-2 text-[11px]">
              <span
                className={`mt-0.5 size-4 shrink-0 rounded-full border flex items-center justify-center ${
                  ok
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {ok && <Check className="size-3" />}
              </span>
              <span className={ok ? "text-muted-foreground line-through" : "text-foreground"}>
                {m.description}
              </span>
            </div>
          );
        })}
      </div>
      {allDone && (
        <Link
          to="/learn/lesson"
          search={{ lessonId: lesson.id }}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold py-2 shadow-glow"
        >
          🎉 Hoàn thành — quay lại bài học
        </Link>
      )}
    </div>
  );
}

// ── Mission matching helpers ──────────────────────────────────────────────

// Khớp nhiệm vụ dạng phản ứng: "react:H2+O2", "react:NaCl", "react:1", "react:5"...
function missionMatchesReaction(m: Mission, r: Reaction, reactedCount: number): boolean {
  const key = m.completionKey;
  if (!key.startsWith("react:") && !key.startsWith("balance:")) return false;
  const target = key.split(":")[1] ?? "";

  // Dạng đếm số phản ứng: "react:5"
  const asNum = Number(target);
  if (Number.isFinite(asNum) && target.trim() !== "") {
    return reactedCount >= asNum;
  }

  // Dạng theo chất tham gia: "react:H2+O2"
  if (target.includes("+")) {
    const needed = target.split("+").map((s) => s.trim());
    return needed.every((n) => r.reactants.includes(n));
  }

  // Dạng theo sản phẩm hoặc 1 chất: "react:NaCl", "balance:H2O"
  return r.products.includes(target) || r.reactants.includes(target);
}

// Khớp nhiệm vụ dạng spawn: "spawn:Na", "spawn:3"...
function missionMatchesSpawn(m: Mission, formula: string, spawnedCount: number): boolean {
  const key = m.completionKey;
  if (!key.startsWith("spawn:")) return false;
  const target = key.split(":")[1] ?? "";
  const asNum = Number(target);
  if (Number.isFinite(asNum) && target.trim() !== "") {
    return spawnedCount >= asNum;
  }
  return formula === target;
}
