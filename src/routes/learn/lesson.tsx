import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect } from "react";
import { getLessonById, type Lesson } from "@/lib/lessons-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Box, FlaskConical, X, Play } from "lucide-react";
import AtomViewer3D from "@/components/AtomViewer3D";
import { FALLBACK_ELEMENTS } from "@/lib/lesson-element-map";
import { getChallengeForLesson } from "@/lib/lab-challenges";
import { useContentStore } from "@/hooks/use-content-store";
import { appStore } from "@/store/app-store";

const searchSchema = z.object({ lessonId: z.string().catch("road1-lesson1") });

export const Route = createFileRoute("/learn/lesson")({
  validateSearch: searchSchema,
  head: () => {
    return { meta: [{ title: "Bài học — ChemisARtry" }] };
  },
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useSearch();
  const lesson = getLessonById(lessonId);
  const { markLessonOpened, markLessonCompleted, state } = useContentStore();

  // Mở bài → đánh dấu in-progress (ghi nhận hoạt động cho streak).
  useEffect(() => {
    if (lesson) markLessonOpened(lesson.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // Hoàn thành tất cả nhiệm vụ (đã làm trong lab) → đánh dấu bài hoàn thành.
  useEffect(() => {
    if (!lesson) return;
    const totalMissions = lesson.practice.missions.length;
    if (totalMissions === 0) return;
    const done = state.lessons[lesson.id]?.missions.length ?? 0;
    const already = state.lessons[lesson.id]?.status === "completed";
    if (done >= totalMissions && !already) {
      markLessonCompleted(lesson.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id, state.lessons]);

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center dark bg-background text-foreground">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-xl font-bold">Không tìm thấy bài học</h1>
          <Button asChild className="mt-4 rounded-full" variant="outline">
            <Link to="/learn">← Quay lại lộ trình</Link>
          </Button>
        </div>
      </div>
    );
  }

  const prevLesson = getLessonById(`road${lesson.roadId}-lesson${lesson.order - 1}`);
  const nextLesson = getLessonById(`road${lesson.roadId}-lesson${lesson.order + 1}`);

  return (
    <div className="dark h-screen bg-background text-foreground fixed inset-0 z-50 flex flex-col font-body overflow-hidden">
      {/* Background noise */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none z-0" />

      {/* Header: left pill, centered title+chapter, exit on right */}
      <div className="shrink-0 px-4 md:px-6 py-4 flex items-center justify-between pointer-events-none relative z-20">
        <div className="pointer-events-auto">
          <div className="bg-card/40 border border-border/50 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-soft">
            Bài {lesson.order}{" "}
            <span className="text-muted-foreground">/ {lesson.roadId === 1 ? 12 : 10}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex-1 flex justify-center">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground drop-shadow-md">
              Bài {lesson.order}: {lesson.title}
            </h1>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary drop-shadow-sm mt-1">
              {lesson.chapter}
            </div>
          </div>
        </div>

        <Link
          to="/learn/road"
          search={{ roadId: lesson.roadId }}
          className="size-12 rounded-full bg-card/40 border border-border/50 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all cursor-pointer pointer-events-auto shadow-soft backdrop-blur-xl"
        >
          <X className="size-6" />
        </Link>
      </div>

      {/* Content Container */}
      <div className="mx-auto max-w-5xl px-4 md:px-6 relative z-10 flex-1 w-full flex flex-col min-h-0 pb-6">
        <Tabs defaultValue="theory" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid h-auto grid-cols-3 mb-2 bg-card/40 border border-border/50 backdrop-blur-xl rounded-2xl shadow-soft shrink-0 relative z-20">
            <TabsTrigger
              value="theory"
              className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all py-2.5"
            >
              <BookOpen className="size-4" />{" "}
              <span className="font-bold hidden sm:inline">Lý thuyết</span>
              <span className="font-bold sm:hidden">Lý thuyết</span>
            </TabsTrigger>
            <TabsTrigger
              value="explore"
              className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all py-2.5"
            >
              <Box className="size-4" />{" "}
              <span className="font-bold hidden sm:inline">Khám phá 3D</span>
              <span className="font-bold sm:hidden">3D</span>
            </TabsTrigger>
            <TabsTrigger
              value="practice"
              className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all py-2.5"
            >
              <FlaskConical className="size-4" />{" "}
              <span className="font-bold hidden sm:inline">Thực hành</span>
              <span className="font-bold sm:hidden">Lab</span>
            </TabsTrigger>
          </TabsList>

          {/* Tabs Content */}
          <div className="flex-1 min-h-0 relative mb-6">
            {/* Tab 1: Lý thuyết */}
            <TabsContent value="theory" className="absolute inset-0 m-0 outline-none">
              <div className="bg-card/40 border border-border/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-soft h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <TheoryTab lesson={lesson} />
              </div>
            </TabsContent>

            {/* Tab 2: Khám phá 3D */}
            <TabsContent value="explore" className="absolute inset-0 m-0 outline-none">
              <div className="bg-card/40 border border-border/50 backdrop-blur-xl rounded-3xl p-5 md:p-6 shadow-soft h-full flex flex-col">
                <ExploreTab lesson={lesson} />
              </div>
            </TabsContent>

            {/* Tab 3: Thực hành */}
            <TabsContent value="practice" className="absolute inset-0 m-0 outline-none">
              <div className="bg-card/40 border border-border/50 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-soft h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <PracticeTab lesson={lesson} />
              </div>
            </TabsContent>
          </div>

          {/* Bottom nav */}
          <div className="shrink-0 flex items-center justify-between gap-4 relative z-20">
            {prevLesson ? (
              <Button
                asChild
                variant="outline"
                className="rounded-full h-11 px-5 bg-card/60 backdrop-blur-xl border-border/50 shadow-soft hover:bg-card/80 text-foreground font-bold transition-all text-sm"
              >
                <Link to="/learn/lesson" search={{ lessonId: prevLesson.id }}>
                  <ChevronLeft className="size-4 mr-1.5" />{" "}
                  <span className="hidden sm:inline">Bài trước</span>
                </Link>
              </Button>
            ) : (
              <div />
            )}
            {nextLesson ? (
              <Button
                asChild
                className="rounded-full h-11 px-6 bg-gradient-primary shadow-glow hover:shadow-glow-lg text-primary-foreground font-bold transition-all border-0 text-sm"
              >
                <Link to="/learn/lesson" search={{ lessonId: nextLesson.id }}>
                  <span className="hidden sm:inline">Bài tiếp theo</span>
                  <span className="sm:hidden">Tiếp</span> <ChevronRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                className="rounded-full h-11 px-6 bg-gradient-primary shadow-glow hover:shadow-glow-lg text-primary-foreground font-bold transition-all border-0 text-sm"
              >
                <Link to="/learn/road" search={{ roadId: lesson.roadId }}>
                  Hoàn thành 🎉
                </Link>
              </Button>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

// ── Theory Tab ────────────────────────────────────────────────────────────
function TheoryTab({ lesson }: { lesson: Lesson }) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-4">
      {lesson.theory ? (
        <div
          className="prose dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.theory }}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-border/50 bg-muted/20 p-12 text-center text-muted-foreground">
          <div className="text-4xl mb-4 drop-shadow-sm">📝</div>
          <p className="font-bold text-lg text-foreground">
            Nội dung lý thuyết đang được biên soạn.
          </p>
          <p className="text-sm mt-2">
            Chuyển sang tab <strong>Khám phá 3D</strong> hoặc <strong>Thực hành</strong> để học
            ngay.
          </p>
        </div>
      )}

      {/* Inline Quiz */}
      {lesson.quiz.length > 0 && (
        <div className="rounded-3xl border border-border/50 bg-card/60 p-6 shadow-sm mt-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <span className="text-primary">✨</span> Quiz nhanh
          </h3>
          <div className="space-y-8">
            {lesson.quiz.map((q) => (
              <div key={q.id}>
                <p className="font-bold text-base mb-4">{q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => {
                    const chosen = quizAnswers[q.id];
                    const isChosen = chosen === i;
                    const isCorrect = i === q.answer;
                    const showResult = chosen !== undefined;
                    return (
                      <button
                        key={i}
                        disabled={showResult}
                        onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: i }))}
                        className={`rounded-2xl border p-4 text-sm font-bold text-left transition-all ${
                          showResult
                            ? isCorrect
                              ? "border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                              : isChosen
                                ? "border-red-400 bg-red-400/10 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.1)]"
                                : "border-border/50 opacity-50 bg-card/40"
                            : "border-border/50 bg-card/40 hover:border-primary/50 hover:bg-card/60"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Explore 3D Tab ────────────────────────────────────────────────────────
function ExploreTab({ lesson }: { lesson: Lesson }) {
  const elements = lesson.explore3D.elements;
  const [selected, setSelected] = useState(elements[0] ?? "");
  const elData = selected ? FALLBACK_ELEMENTS[selected] : null;

  return (
    <div className="flex flex-col md:flex-row gap-5 h-full flex-1 min-h-0">
      {elements.length > 0 && (
        <>
          {/* Left Panel: Info & Selection */}
          <div className="w-full md:w-[280px] lg:w-[320px] flex flex-col gap-4 overflow-y-auto pr-2 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Nguyên tố
              </div>
              <div className="flex flex-wrap gap-1.5">
                {elements.map((el) => (
                  <button
                    key={el}
                    onClick={() => setSelected(el)}
                    className={`h-9 px-3 rounded-lg text-sm font-bold border transition-all ${
                      selected === el
                        ? "bg-primary text-primary-foreground border-primary shadow-glow"
                        : "bg-card/40 border-border/50 hover:border-primary/40 text-foreground hover:bg-card/60"
                    }`}
                  >
                    {el}
                  </button>
                ))}
              </div>
            </div>

            {elData && (
              <div className="rounded-2xl bg-card/40 border border-border/50 p-4 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-primary/20 text-primary font-display font-bold text-2xl flex items-center justify-center shrink-0">
                    {elData.symbol}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Nguyên tử khối
                    </div>
                    <div className="text-lg font-bold">{elData.atomic_mass}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-card/60 rounded-xl p-2 border border-border/50">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">
                      Proton
                    </div>
                    <div className="font-mono font-bold text-base">{elData.number}</div>
                  </div>
                  <div className="text-center bg-card/60 rounded-xl p-2 border border-border/50">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">
                      Neutron
                    </div>
                    <div className="font-mono font-bold text-base">
                      {Math.round(elData.atomic_mass) - elData.number}
                    </div>
                  </div>
                  <div className="text-center bg-card/60 rounded-xl p-2 border border-border/50">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">
                      Electron
                    </div>
                    <div className="font-mono font-bold text-base">{elData.number}</div>
                  </div>
                </div>
                <div className="bg-card/60 rounded-xl p-3 border border-border/50">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1">
                    Cấu hình Electron
                  </div>
                  <div className="font-mono font-bold text-sm text-primary">
                    {elData.shells.join(", ")}
                  </div>
                </div>
              </div>
            )}

            {lesson.explore3D.molecules.length > 0 && (
              <div className="space-y-2 mt-auto pt-4 border-t border-border/50">
                <div className="text-[11px] font-bold uppercase tracking-widest text-primary">
                  Phân tử liên quan
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lesson.explore3D.molecules.map((f) => (
                    <Link
                      key={f}
                      to="/tools/molecules"
                      className="px-3 py-1.5 rounded-lg bg-card/60 border border-border/50 text-sm font-mono font-bold hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all text-foreground"
                    >
                      {f}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Button
              asChild
              variant="outline"
              className="rounded-xl w-full border-border/50 bg-card/60 font-bold h-10 shadow-sm hover:bg-card/80 mt-2 shrink-0"
            >
              <Link to="/tools/periodic-table">Bảng tuần hoàn ↗</Link>
            </Button>
          </div>

          {/* Right Panel: 3D Viewer */}
          <div className="w-full md:w-auto flex-1 min-h-[300px] md:min-h-0 h-full relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 shadow-inner border border-border/20">
            {elData ? (
              <>
                <AtomViewer3D
                  shells={elData.shells}
                  protons={elData.number}
                  neutrons={Math.round(elData.atomic_mass) - elData.number}
                  symbol={elData.symbol}
                  height="100%"
                  autoRotate
                  interactive
                  showShellLabels
                />
                <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none opacity-50 text-[11px] font-medium uppercase tracking-widest text-white/70">
                  Kéo thả để xoay · Cuộn để thu phóng
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold bg-card/20 backdrop-blur-xl">
                Chọn nguyên tố để xem mô hình 3D
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Practice Tab ──────────────────────────────────────────────────────────
function PracticeTab({ lesson }: { lesson: Lesson }) {
  const wetChallenge = getChallengeForLesson(lesson.id);
  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-4">
      {lesson.practice.missions.length > 0 && (
        <div className="rounded-3xl border border-border/50 bg-card/60 p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="text-primary text-xl">🎯</span> Nhiệm vụ bài học
          </h3>
          <ul className="space-y-3">
            {lesson.practice.missions.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 p-3 rounded-2xl bg-card/40 border border-border/30"
              >
                <div className="mt-1 size-4 rounded-full border-2 border-primary/50 flex-shrink-0" />
                <span className="font-medium text-sm leading-snug">{m.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-primary text-xl">⚡</span> Chọn chế độ thực hành
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <PracticeCard
            icon="🖥️"
            title="Mô phỏng 3D"
            subtitle="Kéo thả tương tác · Không cần camera"
            lessonId={lesson.id}
            mode="sim"
          />
          <PracticeCard
            icon="📷"
            title="AR Lab (Camera)"
            subtitle="Dùng thẻ AR để điều khiển · Yêu cầu camera"
            lessonId={lesson.id}
            mode="ar"
            highlight
          />
        </div>

        {/* Lab ướt — gợi ý thử thách phù hợp với bài học (nếu có) */}
        {wetChallenge && (
          <Link
            to="/lab/wet"
            search={{ lesson: lesson.id, challenge: wetChallenge.id }}
            className="group mt-4 flex items-center gap-4 rounded-3xl border border-amber-500/40 bg-amber-500/5 p-5 transition-all hover:bg-amber-500/10 hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]"
          >
            <div className="size-14 rounded-2xl bg-card/80 border border-border/50 shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              🧪
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-lg text-foreground">Phòng thí nghiệm ướt 3D</div>
              <div className="text-sm font-medium text-muted-foreground mt-0.5">
                Thử thách: {wetChallenge.title} — {wetChallenge.hint}
              </div>
            </div>
            <span className="text-sm font-bold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
              Vào lab →
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function InfoPill({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-card/60 border border-border/50 p-4 shadow-sm flex flex-col justify-center ${className}`}
    >
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="font-mono font-bold text-lg text-foreground">{value}</div>
    </div>
  );
}

function PracticeCard({
  icon,
  title,
  subtitle,
  lessonId,
  mode,
  highlight,
}: {
  icon: string;
  title: string;
  subtitle: string;
  lessonId: string;
  mode: "sim" | "ar";
  highlight?: boolean;
}) {
  const onEnter = () => appStore.enterLessonContext(lessonId);
  return (
    <Link
      to={mode === "ar" ? "/lab/ar" : "/lab/sim"}
      search={{ lesson: lessonId }}
      onClick={onEnter}
      className={`group rounded-3xl border p-6 transition-all flex flex-col gap-4 relative overflow-hidden ${
        highlight
          ? "border-primary/50 bg-primary/5 hover:bg-primary/10 hover:shadow-[0_0_30px_rgba(45,212,191,0.15)]"
          : "border-border/50 bg-card/40 hover:bg-card/60 hover:border-primary/30 shadow-soft"
      }`}
    >
      {highlight && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />}

      <div className="size-14 rounded-2xl bg-card/80 border border-border/50 shadow-sm flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <div className="font-bold text-lg text-foreground">{title}</div>
        <div className="text-sm font-medium text-muted-foreground mt-1">{subtitle}</div>
      </div>

      <div className="mt-auto pt-4 flex items-center text-sm font-bold text-primary">
        <span className="bg-primary/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          Bắt đầu <Play className="size-3 fill-current" />
        </span>
      </div>
    </Link>
  );
}
