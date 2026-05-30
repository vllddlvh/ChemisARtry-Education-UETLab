// src/components/TutorChat.tsx
// "Trợ giảng Hoá học" — AI tutor chat panel (Sheet drawer).
//
// Renders the conversation, suggested starter questions, an input box, and
// loading/error states. All AI calls go through `useTutor` → `askTutor` server
// function (Groq key stays server-side).

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkles, Send, Loader2, RotateCcw, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useTutor } from "@/hooks/use-tutor";
import { useContentStore } from "@/hooks/use-content-store";
import type { TutorLessonContext } from "@/lib/tutor";

const DEFAULT_SUGGESTIONS = [
  "Liên kết ion và liên kết cộng hoá trị khác nhau thế nào?",
  "Giải thích cách cân bằng phương trình hoá học.",
  "Vì sao phân tử nước có hình gấp khúc?",
];

export interface TutorChatProps {
  /** Optional lesson context to ground answers. */
  lesson?: TutorLessonContext | null;
  /** Custom trigger; defaults to a floating button. */
  trigger?: ReactNode;
  /** Suggested starter questions (lesson pages can pass tailored ones). */
  suggestions?: string[];
}

export function TutorChat({ lesson = null, trigger, suggestions }: TutorChatProps) {
  const { state } = useContentStore();
  const { messages, loading, error, send, reset } = useTutor({
    lesson,
    gradeLevel: state.gradeLevel,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const starters = suggestions ?? DEFAULT_SUGGESTIONS;

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    void send(text);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            className="fixed bottom-6 right-6 z-40 rounded-full h-14 px-5 bg-gradient-primary text-primary-foreground shadow-glow gap-2"
            aria-label="Mở Trợ giảng Hoá học"
          >
            <Sparkles className="h-5 w-5" />
            <span className="hidden sm:inline font-bold">Trợ giảng</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary">
              <GraduationCap className="h-4 w-4" />
            </span>
            Trợ giảng Hoá học
          </SheetTitle>
          <SheetDescription className="text-xs">
            {lesson ? `Đang hỗ trợ bài: ${lesson.title}` : "Hỏi bất cứ điều gì về Hoá học THPT."}
          </SheetDescription>
        </SheetHeader>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 [&::-webkit-scrollbar]:w-1.5"
        >
          {messages.length === 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-muted/50 border border-border p-3 text-sm text-muted-foreground">
                👋 Chào bạn! Mình là trợ giảng Hoá học. Hãy đặt câu hỏi hoặc chọn gợi ý bên dưới.
              </div>
              <div className="flex flex-col gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    disabled={loading}
                    className="text-left text-sm rounded-xl border border-border bg-card px-3 py-2 hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang soạn câu trả lời…
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3">
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="mb-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" /> Cuộc trò chuyện mới
            </button>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Nhập câu hỏi Hoá học…"
              className="flex-1 resize-none rounded-2xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring max-h-32"
              aria-label="Câu hỏi cho trợ giảng"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="rounded-full bg-gradient-primary shrink-0"
              aria-label="Gửi câu hỏi"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground text-center">
            AI có thể mắc lỗi — hãy đối chiếu với SGK.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default TutorChat;
