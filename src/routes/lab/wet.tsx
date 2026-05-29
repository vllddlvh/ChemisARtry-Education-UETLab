// /lab/wet — Phòng thí nghiệm ướt 3D (ống nghiệm, thuốc thử, phản ứng quan sát).
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlaskConical,
  RotateCcw,
  Flame,
  X,
  Beaker,
  BookOpen,
  HelpCircle,
  MousePointerClick,
  Hand,
  Sparkles,
  ChevronRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import WetLabScene, { type TubeView } from "@/components/WetLabScene";
import { REAGENTS, type LabReaction, type Reagent } from "@/lib/lab-experiments";
import { setAudioEnabled } from "@/lib/lab-audio";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/lab/wet")({
  head: () => ({
    meta: [
      { title: "Phòng thí nghiệm ướt 3D — ChemisARtry" },
      {
        name: "description",
        content:
          "Làm thí nghiệm hoá học 3D: rót thuốc thử vào ống nghiệm, quan sát kết tủa, sủi khí, đổi màu.",
      },
    ],
  }),
  component: WetLabPage,
});

type LogEntry = {
  id: string;
  tube: number;
  reaction: LabReaction;
};

const HAZARD_LABEL: Record<Reagent["hazard"], { text: string; cls: string }> = {
  low: { text: "An toàn", cls: "text-emerald-400" },
  corrosive: { text: "Ăn mòn", cls: "text-orange-400" },
  flammable: { text: "Dễ cháy", cls: "text-amber-400" },
  toxic: { text: "Độc", cls: "text-rose-400" },
};

const CATEGORY_LABEL: Record<Reagent["category"], string> = {
  acid: "Axit",
  base: "Bazơ",
  salt: "Muối",
  metal: "Kim loại",
  indicator: "Chất chỉ thị",
  oxidizer: "Chất oxi hoá",
  other: "Khác",
};

const CATEGORY_ORDER: Reagent["category"][] = [
  "acid",
  "base",
  "salt",
  "metal",
  "oxidizer",
  "indicator",
  "other",
];

const TUTORIAL_STORAGE_KEY = "chemisartry.wetlab.tutorialSeen";

function WetLabPage() {
  const [selectedReagent, setSelectedReagent] = useState<string | null>(null);
  const [activeTube, setActiveTube] = useState<number | null>(null);
  const [heatedTube, setHeatedTube] = useState<number | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [tubes, setTubes] = useState<TubeView[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [lastReaction, setLastReaction] = useState<LabReaction | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
      setShowTutorial(true);
    }
  }, []);

  const closeTutorial = () => {
    setShowTutorial(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
    }
  };

  const handleReaction = useCallback((tube: number, reaction: LabReaction) => {
    setLastReaction(reaction);
    setLog((prev) =>
      [{ id: `${reaction.id}-${Date.now()}`, tube, reaction }, ...prev].slice(0, 12),
    );
    toast.success("🧪 Phản ứng xảy ra!", { description: reaction.observation });
  }, []);

  const reset = () => {
    setResetSignal((s) => s + 1);
    setLastReaction(null);
    setHeatedTube(null);
  };

  const selectedReagentObj = REAGENTS.find((r) => r.id === selectedReagent);

  const grouped = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: REAGENTS.filter((r) => r.category === cat),
    })).filter((g) => g.items.length > 0);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-foreground dark">
      {/* Scene */}
      <div className="absolute inset-0">
        <WetLabScene
          tubeCount={5}
          selectedReagent={selectedReagent}
          selectedReagentColor={selectedReagentObj?.color ?? null}
          heatedTube={heatedTube}
          activeTube={activeTube}
          onSelectTube={setActiveTube}
          onReaction={handleReaction}
          onTubesChange={setTubes}
          resetSignal={resetSignal}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-card/70 backdrop-blur-xl border border-white/10 px-4 py-2 shadow-xl">
          <Beaker className="h-4 w-4 text-primary" />
          <span className="font-display font-bold text-sm">Phòng thí nghiệm ướt 3D</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setAudioEnabled(next);
            }}
            variant="secondary"
            size="icon"
            className="rounded-full bg-card/70 backdrop-blur-xl border border-white/10"
            title={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setShowTutorial(true)}
            variant="secondary"
            size="sm"
            className="rounded-full bg-card/70 backdrop-blur-xl border border-white/10"
          >
            <HelpCircle className="h-4 w-4 mr-1.5" /> Hướng dẫn
          </Button>
          <Button
            onClick={reset}
            variant="secondary"
            size="sm"
            className="rounded-full bg-card/70 backdrop-blur-xl border border-white/10"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" /> Rửa ống
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-full bg-card/70 backdrop-blur-xl border border-white/10"
          >
            <Link to="/dashboard" search={{ tab: "lab" }}>
              <X className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Reagent shelf (left) */}
      <aside className="absolute left-4 top-20 bottom-4 w-64 rounded-2xl bg-card/70 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
        <div className="px-3 pt-3 pb-2 border-b border-white/10">
          <div className="text-[10px] uppercase tracking-widest text-primary font-bold">
            Kệ hoá chất
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Chọn 1 chất → bấm vào ống để rót
          </div>
        </div>
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-3 space-y-3">
          {grouped.map((group) => (
            <div key={group.cat}>
              <div className="text-[9px] uppercase tracking-wider text-muted-foreground/70 font-bold mb-1.5 px-1">
                {CATEGORY_LABEL[group.cat]}
              </div>
              <div className="space-y-1.5">
                {group.items.map((r) => {
                  const active = selectedReagent === r.id;
                  const hz = HAZARD_LABEL[r.hazard];
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedReagent(active ? null : r.id)}
                      className={`w-full flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/20 shadow-glow"
                          : "border-white/5 bg-background/40 hover:border-primary/40 hover:bg-background/60"
                      }`}
                    >
                      <span
                        className="h-7 w-7 rounded-lg shrink-0 border border-white/20 shadow-inner"
                        style={{ background: r.color }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold truncate">{r.name}</span>
                        <span className="block text-[10px] font-mono text-muted-foreground">
                          {r.formula} · <span className={hz.cls}>{hz.text}</span>
                        </span>
                      </span>
                      {active && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* "Đang cầm" chip (floating, follows selection) */}
      {selectedReagentObj && (
        <div className="absolute left-72 top-24 z-20 pointer-events-none">
          <div className="rounded-2xl bg-primary/15 border border-primary/40 backdrop-blur-xl p-3 shadow-glow w-56 animate-in fade-in slide-in-from-left-2">
            <div className="flex items-center gap-2">
              <span
                className="h-9 w-9 rounded-lg border border-white/20 shadow-inner shrink-0"
                style={{ background: selectedReagentObj.color }}
              />
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-primary font-bold">
                  Đang cầm
                </div>
                <div className="text-sm font-bold truncate">{selectedReagentObj.name}</div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {selectedReagentObj.formula}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
              {selectedReagentObj.description}
            </div>
            <div className="text-[10px] text-primary mt-1.5 flex items-center gap-1 font-medium">
              <MousePointerClick className="h-3 w-3" /> Bấm vào ống nghiệm để rót
            </div>
          </div>
        </div>
      )}

      {/* Tubes status + heat controls (bottom center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-end gap-2.5 rounded-2xl bg-card/70 backdrop-blur-xl border border-white/10 px-4 py-3 shadow-2xl">
          {tubes.map((t) => {
            const isActive = activeTube === t.index;
            return (
              <div key={t.index} className="flex flex-col items-center gap-1.5 w-24">
                <button
                  onClick={() => setActiveTube(isActive ? null : t.index)}
                  className={`w-full rounded-lg border px-2 py-1.5 text-center transition-all ${
                    isActive
                      ? "border-primary bg-primary/15 shadow-glow"
                      : "border-white/10 bg-background/40 hover:border-primary/40"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Ống {t.index + 1}
                  </div>
                  <div
                    className={`text-[11px] font-mono font-semibold truncate h-4 ${
                      t.label ? "text-foreground" : "text-muted-foreground/40"
                    }`}
                  >
                    {t.label || "trống"}
                  </div>
                </button>
                <button
                  onClick={() => setHeatedTube(heatedTube === t.index ? null : t.index)}
                  className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium transition-all ${
                    heatedTube === t.index
                      ? "bg-orange-500/30 text-orange-300 border border-orange-400/40 animate-pulse-glow"
                      : "bg-background/40 text-muted-foreground border border-white/10 hover:border-orange-400/30"
                  }`}
                  title="Đun nóng bằng đèn cồn"
                >
                  <Flame className="h-3 w-3" /> {heatedTube === t.index ? "Đang đun" : "Đun"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Observation panel (right) */}
      <aside className="absolute right-4 top-20 bottom-4 w-72 rounded-2xl bg-card/70 backdrop-blur-xl border border-white/10 shadow-2xl p-4 flex flex-col pointer-events-auto">
        <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3 flex items-center gap-1.5">
          <BookOpen className="h-3 w-3" /> Quan sát & giải thích
        </div>

        {lastReaction ? (
          <div className="rounded-xl bg-background/50 border border-white/10 p-3">
            <div className="font-mono text-sm font-bold text-primary break-words">
              {lastReaction.equation}
            </div>
            <div className="mt-2 text-xs leading-relaxed">
              <span className="text-primary font-semibold">Hiện tượng: </span>
              {lastReaction.observation}
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Giải thích: </span>
              {lastReaction.explanation}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-muted-foreground">
            Chọn một hoá chất ở kệ trái, rồi bấm vào ống nghiệm để rót và quan sát phản ứng.
          </div>
        )}

        {/* Experiment log */}
        <div className="mt-4 flex-1 min-h-0 flex flex-col">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Nhật ký thí nghiệm ({log.length})
          </div>
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] space-y-1.5">
            {log.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg bg-background/40 border border-white/5 px-2.5 py-1.5"
              >
                <div className="text-[11px] font-mono font-semibold text-foreground break-words">
                  {entry.reaction.equation}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Ống {entry.tube + 1} · {entry.reaction.observation}
                </div>
              </div>
            ))}
            {log.length === 0 && (
              <div className="text-[11px] text-muted-foreground/60 italic">
                Chưa có phản ứng nào.
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-white/10 text-[10px] text-muted-foreground leading-relaxed">
          💡 Gợi ý: HCl + đá vôi (CaCO₃) → sủi bọt; CuSO₄ + NaOH → kết tủa xanh; Pb(NO₃)₂ + KI →
          "mưa vàng"; iốt + hồ tinh bột → xanh tím.
        </div>
      </aside>

      {/* Empty-state hint */}
      {!showTutorial && tubes.every((t) => t.contents.length === 0) && log.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center opacity-60">
          <FlaskConical className="h-10 w-10 mx-auto text-primary mb-2 animate-float-slow" />
          <div className="text-sm font-medium">Chọn hoá chất rồi bấm vào ống nghiệm</div>
        </div>
      )}

      {/* Tutorial overlay */}
      {showTutorial && <TutorialOverlay onClose={closeTutorial} />}
    </div>
  );
}

// ── Tutorial ────────────────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    icon: MousePointerClick,
    title: "1 · Chọn hoá chất",
    text: "Ở kệ bên trái, bấm vào một hoá chất (vd HCl, CuSO₄). Chất đang cầm hiện ở góc trên.",
  },
  {
    icon: Beaker,
    title: "2 · Rót vào ống nghiệm",
    text: "Bấm vào một ống nghiệm 3D để rót. Nhãn nổi phía trên ống cho biết ống đang chứa chất gì.",
  },
  {
    icon: Sparkles,
    title: "3 · Quan sát phản ứng",
    text: "Khi hai chất phản ứng, bạn sẽ thấy đổi màu, sủi bọt, kết tủa hoặc khói. Bảng bên phải giải thích hiện tượng.",
  },
  {
    icon: Flame,
    title: "4 · Đun nóng",
    text: "Bấm nút 'Đun' dưới ống để bật đèn cồn — một số phản ứng (vd phân huỷ H₂O₂) cần nhiệt mới xảy ra.",
  },
  {
    icon: Hand,
    title: "5 · Xoay & phóng to",
    text: "Kéo chuột để xoay góc nhìn quanh bàn, lăn chuột để phóng to. Bấm 'Rửa ống' để làm sạch tất cả.",
  },
];

function TutorialOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-card border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-gradient-primary px-6 py-5 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-white/20 grid place-items-center text-white shrink-0">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/80 font-bold">
              Hướng dẫn sử dụng
            </div>
            <div className="text-lg font-display font-bold text-white">{current.title}</div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-muted-foreground leading-relaxed min-h-[60px]">
            {current.text}
          </p>

          {/* dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 gap-3">
            <button
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Bỏ qua
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Trước
                </Button>
              )}
              {isLast ? (
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-primary"
                  onClick={onClose}
                >
                  Bắt đầu thí nghiệm
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="rounded-full bg-gradient-primary"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Tiếp →
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
