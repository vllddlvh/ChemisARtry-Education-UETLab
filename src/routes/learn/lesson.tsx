import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { getLessonById, type Lesson } from "@/lib/lessons-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BookOpen, Box, FlaskConical } from "lucide-react";
import AtomViewer3D from "@/components/AtomViewer3D";
import { FALLBACK_ELEMENTS } from "@/lib/lesson-element-map";

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

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/60 backdrop-blur sticky top-16 z-10">
        <div className="mx-auto max-w-4xl px-4 md:px-6 h-12 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/learn" className="hover:text-foreground transition">Lộ trình</Link>
            <span>/</span>
            <Link to="/learn/road" search={{ roadId: lesson.roadId }} className="hover:text-foreground transition">
              Road {lesson.roadId}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-[160px]">{lesson.title}</span>
          </nav>
          <span className="text-xs text-muted-foreground shrink-0">
            {lesson.order}/{lesson.roadId === 1 ? 12 : 10}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 md:px-6 py-8 flex-1">
        <div className="mb-6">
          <div className="text-xs text-muted-foreground">{lesson.chapter}</div>
          <h1 className="text-2xl font-display font-bold mt-1">
            Bài {lesson.order}: {lesson.title}
          </h1>
        </div>

        <Tabs defaultValue="theory">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="theory" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> Lý thuyết
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-1.5">
              <Box className="h-3.5 w-3.5" /> Khám phá 3D
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" /> Thực hành
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Lý thuyết */}
          <TabsContent value="theory">
            <TheoryTab lesson={lesson} />
          </TabsContent>

          {/* Tab 2: Khám phá 3D */}
          <TabsContent value="explore">
            <ExploreTab lesson={lesson} />
          </TabsContent>

          {/* Tab 3: Thực hành */}
          <TabsContent value="practice">
            <PracticeTab lesson={lesson} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border bg-card/80 backdrop-blur sticky bottom-0">
        <div className="mx-auto max-w-4xl px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          {prevLesson ? (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/learn/lesson" search={{ lessonId: prevLesson.id }}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Bài trước
              </Link>
            </Button>
          ) : (
            <div />
          )}
          {nextLesson ? (
            <Button asChild className="rounded-full bg-gradient-primary">
              <Link to="/learn/lesson" search={{ lessonId: nextLesson.id }}>
                Bài tiếp theo <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full bg-gradient-primary">
              <Link to="/learn/road" search={{ roadId: lesson.roadId }}>
                Hoàn thành Road {lesson.roadId} 🎉
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Theory Tab ────────────────────────────────────────────────────────────
function TheoryTab({ lesson }: { lesson: Lesson }) {
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  return (
    <div className="space-y-6">
      {lesson.theory ? (
        <div className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: lesson.theory }} />
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
          <div className="text-3xl mb-3">📝</div>
          <p className="font-medium">Nội dung lý thuyết đang được biên soạn.</p>
          <p className="text-sm mt-1">Chuyển sang tab <strong>Khám phá 3D</strong> hoặc <strong>Thực hành</strong> để học ngay.</p>
        </div>
      )}

      {/* Inline Quiz */}
      {lesson.quiz.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold mb-4">Quiz nhanh</h3>
          <div className="space-y-5">
            {lesson.quiz.map((q) => (
              <div key={q.id}>
                <p className="text-sm font-medium mb-2">{q.question}</p>
                <div className="grid grid-cols-2 gap-2">
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
                        className={`rounded-xl border p-2.5 text-sm text-left transition ${
                          showResult
                            ? isCorrect
                              ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                              : isChosen
                              ? "border-red-400 bg-red-400/10 text-red-600 dark:text-red-400"
                              : "border-border opacity-50"
                            : "border-border hover:border-primary/50"
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
    <div className="space-y-4">
      {elements.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {elements.map((el) => (
              <button
                key={el}
                onClick={() => setSelected(el)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  selected === el ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                }`}
              >
                {el}
              </button>
            ))}
          </div>

          {elData ? (
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
              <AtomViewer3D
                shells={elData.shells}
                protons={elData.number}
                neutrons={Math.round(elData.atomic_mass) - elData.number}
                symbol={elData.symbol}
                height={320}
                autoRotate
                interactive
                showShellLabels
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center text-muted-foreground">
              Chọn nguyên tố để xem mô hình 3D
            </div>
          )}

          {elData && (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <InfoPill label="Proton" value={String(elData.number)} />
              <InfoPill label="Neutron" value={String(Math.round(elData.atomic_mass) - elData.number)} />
              <InfoPill label="Electron" value={String(elData.number)} />
              <InfoPill label="Cấu hình" value={elData.shells.join(", ")} className="col-span-3" />
            </div>
          )}

          <Button asChild variant="outline" className="rounded-full w-full">
            <Link to="/tools/periodic-table">Mở bảng tuần hoàn đầy đủ ↗</Link>
          </Button>
        </>
      )}

      {lesson.explore3D.molecules.length > 0 && (
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="text-sm font-medium mb-2">Phân tử liên quan:</div>
          <div className="flex flex-wrap gap-2">
            {lesson.explore3D.molecules.map((f) => (
              <Link
                key={f}
                to="/tools/molecules"
                className="px-3 py-1.5 rounded-full bg-muted text-sm font-mono hover:bg-primary/10 transition"
              >
                {f}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Practice Tab ──────────────────────────────────────────────────────────
function PracticeTab({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm">Chọn cách thực hành:</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <PracticeCard
          icon="🖥️"
          title="Mô phỏng 3D"
          subtitle="Kéo thả chuột · Không cần camera"
          href={`/lab/sim?lesson=${lesson.id}`}
        />
        <PracticeCard
          icon="📷"
          title="AR Lab (camera)"
          subtitle="Dùng tay điều khiển · Cần cho phép camera"
          href={`/lab/ar?lesson=${lesson.id}`}
        />
      </div>

      {lesson.practice.missions.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold text-sm mb-3">Nhiệm vụ bài này</h3>
          <ul className="space-y-2">
            {lesson.practice.missions.map((m) => (
              <li key={m.id} className="flex items-start gap-2 text-sm">
                <span className="h-5 w-5 rounded-full border-2 border-border flex-shrink-0 mt-0.5" />
                {m.description}
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs text-muted-foreground">
            0 / {lesson.practice.missions.length} nhiệm vụ hoàn thành
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────
function InfoPill({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl bg-muted/50 p-3 text-center ${className}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-mono font-bold mt-0.5">{value}</div>
    </div>
  );
}

function PracticeCard({ icon, title, subtitle, href }: { icon: string; title: string; subtitle: string; href: string }) {
  return (
    <Link
      to={href}
      className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:-translate-y-0.5 transition flex items-start gap-3"
    >
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
        <div className="mt-2 text-xs text-primary font-medium">Bắt đầu →</div>
      </div>
    </Link>
  );
}
