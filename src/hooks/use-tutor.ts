// src/hooks/use-tutor.ts
// Client-side state + actions for the AI Chemistry Tutor chat.
// Calls the `askTutor` server function (which holds the Groq key). No login is
// required — guests can chat too.

import { useCallback, useState } from "react";
import { askTutor } from "@/server/tutor";
import { MAX_MESSAGE_CHARS, type ChatMessage, type TutorLessonContext } from "@/lib/tutor";

export interface UseTutorOptions {
  lesson?: TutorLessonContext | null;
  gradeLevel?: string | null;
}

export interface UseTutor {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

export function useTutor({ lesson = null, gradeLevel = null }: UseTutorOptions = {}): UseTutor {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim().slice(0, MAX_MESSAGE_CHARS);
      if (!content || loading) return;

      setError(null);
      const userMsg: ChatMessage = { role: "user", content };
      const history = [...messages, userMsg];
      setMessages(history);
      setLoading(true);

      try {
        const res = await askTutor({
          data: {
            messages: history,
            lesson,
            gradeLevel,
          },
        });
        if (res.ok && res.reply) {
          setMessages((prev) => [...prev, { role: "assistant", content: res.reply as string }]);
        } else {
          setError(res.error ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
          // Roll the failed user turn back out so they can retry cleanly.
          setMessages((prev) => prev.filter((m) => m !== userMsg));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
        setError(msg);
        // Roll the failed user turn back out of history so they can retry cleanly.
        setMessages((prev) => prev.filter((m) => m !== userMsg));
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, lesson, gradeLevel],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, reset };
}
