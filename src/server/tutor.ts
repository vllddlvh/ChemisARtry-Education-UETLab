// src/server/tutor.ts
// Server function for the AI Chemistry Tutor. Proxies a chat completion request
// to Groq (OpenAI-compatible API). The GROQ_API_KEY lives ONLY here (server-side
// process.env) and is never exposed to the client.
//
// Auth: NOT required — guests can use the tutor. A best-effort per-IP rate limit
// (in-memory) blunts casual abuse without requiring login.
//
// IMPORTANT: this handler NEVER throws for expected failures. TanStack Start
// redacts thrown errors from server functions into a generic 500 "HTTPError",
// which hides the real cause from users. Instead we always return a structured
// { ok, reply?, error? } result so the UI can show a meaningful message.

import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import {
  buildSystemPrompt,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
  type ChatMessage,
  type TutorRequest,
  type TutorResponse,
} from "@/lib/tutor";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

// ── Best-effort rate limit (per IP, sliding window) ─────────────────────────
const RATE_LIMIT_MAX = 20; // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // per minute
const hits = new Map<string, number[]>();

function clientIp(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) || "anonymous";
  } catch {
    return "anonymous";
  }
}

/** Returns true if the caller is within the rate limit (and records the hit). */
function withinRateLimit(): boolean {
  const ip = clientIp();
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) return false;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return true;
}

/** Coerce + sanitize untrusted client input into a safe payload. */
function sanitize(input: unknown): TutorRequest {
  const data = (input ?? {}) as Partial<TutorRequest>;
  const rawMessages = Array.isArray(data.messages) ? data.messages : [];
  const messages: ChatMessage[] = rawMessages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  const lesson = data.lesson
    ? {
        lessonId: String(data.lesson.lessonId ?? ""),
        title: String(data.lesson.title ?? ""),
        chapter: String(data.lesson.chapter ?? ""),
        roadId: data.lesson.roadId === 2 ? (2 as const) : (1 as const),
        theory:
          typeof data.lesson.theory === "string" ? data.lesson.theory.slice(0, 4000) : undefined,
      }
    : null;

  const gradeLevel = typeof data.gradeLevel === "string" ? data.gradeLevel : null;

  return { messages, lesson, gradeLevel };
}

function fail(error: string): TutorResponse {
  return { ok: false, error };
}

export const askTutor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sanitize(input))
  .handler(async ({ data }): Promise<TutorResponse> => {
    if (!withinRateLimit()) {
      return fail("Bạn hỏi hơi nhanh 😅. Vui lòng chờ một chút rồi thử lại.");
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return fail(
        "Trợ giảng chưa được cấu hình: thiếu GROQ_API_KEY trên máy chủ. Hãy thêm khoá vào .env rồi khởi động lại server.",
      );
    }

    if (data.messages.length === 0) {
      return fail("Câu hỏi trống.");
    }

    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const systemPrompt = buildSystemPrompt(data);

    const body = {
      model,
      temperature: 0.3,
      max_tokens: 1024,
      messages: [{ role: "system" as const, content: systemPrompt }, ...data.messages],
    };

    let res: Response;
    try {
      res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch {
      return fail("Không kết nối được tới dịch vụ AI. Vui lòng thử lại.");
    }

    if (!res.ok) {
      let detail = "";
      try {
        const errJson = (await res.json()) as { error?: { message?: string } };
        detail = errJson?.error?.message ? ` — ${errJson.error.message}` : "";
      } catch {
        /* ignore */
      }
      if (res.status === 429) {
        return fail("Trợ giảng đang quá tải (giới hạn truy vấn). Hãy thử lại sau giây lát.");
      }
      if (res.status === 401) {
        return fail("Khoá GROQ_API_KEY không hợp lệ. Hãy kiểm tra lại khoá trong .env.");
      }
      return fail(`Dịch vụ AI trả về lỗi (${res.status})${detail}. Vui lòng thử lại.`);
    }

    let json: { choices?: Array<{ message?: { content?: string } }> };
    try {
      json = (await res.json()) as typeof json;
    } catch {
      return fail("Không đọc được phản hồi từ dịch vụ AI.");
    }

    const reply = json.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return fail("Trợ giảng không tạo được câu trả lời. Vui lòng thử lại.");
    }

    return { ok: true, reply };
  });
