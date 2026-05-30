// src/lib/tutor.ts
// Shared types + prompt building for the AI Chemistry Tutor ("Trợ giảng Hoá học").
//
// This module is import-safe on BOTH client and server: it contains only pure
// types, constants and prompt-construction helpers. The Groq API key and the
// actual network call live in the server function (`src/server/tutor.ts`) so
// the secret is never bundled into client code.

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** Optional lesson context passed from the Lesson page so answers stay on-topic. */
export interface TutorLessonContext {
  lessonId: string;
  title: string;
  chapter: string;
  roadId: 1 | 2;
  /** Plain-text theory (HTML stripped) to ground the answer. */
  theory?: string;
}

export interface TutorRequest {
  /** Conversation so far (most recent last), excluding the system prompt. */
  messages: ChatMessage[];
  lesson?: TutorLessonContext | null;
  /** Learner grade level for tone/depth calibration. */
  gradeLevel?: string | null;
}

export interface TutorResponse {
  /** True when the model produced a reply. */
  ok: boolean;
  /** The assistant reply (present when ok). */
  reply?: string;
  /** A user-facing error message (present when not ok). */
  error?: string;
}

/** Max chars of theory we inline into the system prompt to keep tokens bounded. */
const MAX_THEORY_CHARS = 1500;
/** Max conversation turns forwarded to the model. */
export const MAX_HISTORY_MESSAGES = 12;
/** Max characters allowed per user message. */
export const MAX_MESSAGE_CHARS = 2000;

/** Strip HTML tags and collapse whitespace from lesson theory. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const GRADE_LABEL: Record<string, string> = {
  "10": "lớp 10",
  "11": "lớp 11",
  "12": "lớp 12",
  self: "tự học",
};

/**
 * Build the system prompt that constrains the tutor: Vietnamese, high-school
 * chemistry scope, grounded in the current lesson, safe and pedagogical.
 */
export function buildSystemPrompt(req: TutorRequest): string {
  const lines: string[] = [
    "Bạn là 'Trợ giảng Hoá học' của ứng dụng ChemisARtry — một gia sư Hoá học thân thiện cho học sinh THPT Việt Nam.",
    "Luôn trả lời bằng tiếng Việt, rõ ràng, ngắn gọn và đúng trình độ phổ thông.",
    "Bám sát chương trình Hoá học THPT (lớp 10–12). Khi phù hợp, gợi ý người học mở mô phỏng 3D, AR hoặc Phòng thí nghiệm ướt trong ứng dụng để trực quan hơn.",
    "Trình bày công thức/hằng số hoá học chính xác. Nếu không chắc chắn, hãy nói rõ và khuyên đối chiếu SGK — tuyệt đối không bịa số liệu.",
    "Ưu tiên giải thích từng bước, đặt câu hỏi gợi mở để học sinh tự suy nghĩ thay vì chỉ đưa đáp án.",
    "Chỉ trả lời trong phạm vi hoá học và học tập. Nếu được hỏi ngoài phạm vi, lịch sự từ chối và kéo về chủ đề Hoá học.",
    "Không hướng dẫn tổng hợp chất nguy hiểm, chất nổ, ma tuý hay bất cứ điều gì có thể gây hại.",
  ];

  const grade = req.gradeLevel ? GRADE_LABEL[req.gradeLevel] : null;
  if (grade) {
    lines.push(`Người học đang ở trình độ ${grade}. Điều chỉnh độ sâu cho phù hợp.`);
  }

  if (req.lesson) {
    const { title, chapter, roadId } = req.lesson;
    lines.push(
      `Ngữ cảnh bài học hiện tại: "${title}" (Road ${roadId} — ${chapter}). Hãy ưu tiên giải thích liên quan tới bài này.`,
    );
    if (req.lesson.theory) {
      const theory = req.lesson.theory.slice(0, MAX_THEORY_CHARS);
      lines.push(`Tóm tắt nội dung lý thuyết của bài (dùng làm căn cứ):\n"""${theory}"""`);
    }
  }

  return lines.join("\n");
}
