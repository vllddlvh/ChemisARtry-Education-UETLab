// src/lib/lab-challenges.ts
// Thử thách / nhiệm vụ cho Phòng thí nghiệm ướt 3D.
//
// Mỗi thử thách gắn với một phản ứng mục tiêu (xác định bằng tập reagent ids).
// Khi người dùng kích hoạt đúng phản ứng đó trong lab, thử thách được tính là
// hoàn thành. Dữ liệu thuần (pure data) — không phụ thuộc React.

import { labReactionId } from "@/lib/lab-experiments";

export type ChallengeCategory =
  | "precipitate"
  | "gas"
  | "neutralize"
  | "indicator"
  | "decompose"
  | "identify";

export interface LabChallenge {
  id: string;
  /** Tiêu đề ngắn hiển thị trong danh sách. */
  title: string;
  /** Mô tả mục tiêu cho người học. */
  goal: string;
  /** Gợi ý cách làm (cặp chất cần trộn). */
  hint: string;
  /** Nhóm thử thách (lọc/nhóm UI). */
  category: ChallengeCategory;
  /** Tập reagent ids của phản ứng mục tiêu. */
  reactants: string[];
  /** Có cần đun nóng không (gợi ý cho UI). */
  requiresHeat?: boolean;
  /** Id bài học liên quan (nếu mở từ tab Học tập). */
  lessonId?: string;
  /** Biểu tượng emoji. */
  icon: string;
}

/** Id phản ứng mục tiêu của một thử thách. */
export function challengeReactionId(c: LabChallenge): string {
  return labReactionId(c.reactants);
}

export const LAB_CHALLENGES: LabChallenge[] = [
  {
    id: "ch-precip-blue",
    title: "Tạo kết tủa xanh lam",
    goal: "Tạo kết tủa đồng(II) hidroxit Cu(OH)₂ màu xanh lam.",
    hint: "Trộn dung dịch CuSO₄ với NaOH.",
    category: "precipitate",
    reactants: ["cuso4", "naoh"],
    icon: "🔵",
  },
  {
    id: "ch-precip-yellow",
    title: "Mưa vàng",
    goal: "Tạo kết tủa chì(II) iodua PbI₂ vàng óng.",
    hint: "Trộn Pb(NO₃)₂ với KI.",
    category: "precipitate",
    reactants: ["pb_no3", "ki"],
    icon: "🌟",
  },
  {
    id: "ch-identify-sulfate",
    title: "Nhận biết gốc sunfat",
    goal: "Dùng thuốc thử tạo kết tủa trắng BaSO₄ để nhận biết ion SO₄²⁻.",
    hint: "Trộn BaCl₂ với Na₂SO₄ (hoặc H₂SO₄).",
    category: "identify",
    reactants: ["bacl2", "na2so4"],
    icon: "🔍",
  },
  {
    id: "ch-gas-co2",
    title: "Điều chế khí CO₂",
    goal: "Tạo khí cacbonic sủi bọt từ muối cacbonat và axit.",
    hint: "Cho HCl vào đá vôi CaCO₃ (hoặc Na₂CO₃).",
    category: "gas",
    reactants: ["hcl", "caco3"],
    icon: "🫧",
  },
  {
    id: "ch-gas-h2",
    title: "Điều chế khí H₂",
    goal: "Cho kim loại phản ứng với axit để giải phóng khí hidro.",
    hint: "Thả viên kẽm Zn vào HCl.",
    category: "gas",
    reactants: ["hcl", "zn"],
    icon: "💨",
  },
  {
    id: "ch-neutralize",
    title: "Phản ứng trung hoà",
    goal: "Trung hoà axit mạnh bằng bazơ mạnh (toả nhiệt).",
    hint: "Trộn HCl với NaOH — quan sát ống ấm lên.",
    category: "neutralize",
    reactants: ["hcl", "naoh"],
    icon: "🌡️",
  },
  {
    id: "ch-indicator-pink",
    title: "Đổi màu chất chỉ thị",
    goal: "Làm phenolphtalein hoá hồng trong môi trường bazơ.",
    hint: "Nhỏ phenolphtalein vào NaOH.",
    category: "indicator",
    reactants: ["phenol", "naoh"],
    icon: "🌸",
  },
  {
    id: "ch-decompose-h2o2",
    title: "Phân huỷ oxi già",
    goal: "Phân huỷ H₂O₂ thành nước và khí oxi (cần đun nóng).",
    hint: "Đổ H₂O₂ vào ống rồi bật đèn cồn để đun.",
    category: "decompose",
    reactants: ["h2o2"],
    requiresHeat: true,
    icon: "🔥",
  },
  {
    id: "ch-identify-starch",
    title: "Nhận biết tinh bột",
    goal: "Tạo phức xanh tím đặc trưng giữa iốt và tinh bột.",
    hint: "Nhỏ dung dịch iốt vào hồ tinh bột.",
    category: "identify",
    reactants: ["iodine", "starch"],
    icon: "🟣",
  },
  {
    id: "ch-smoke",
    title: "Khói trắng không lửa",
    goal: "Tạo khói trắng NH₄Cl từ amoniac và axit clohidric.",
    hint: "Trộn NH₃ với HCl.",
    category: "gas",
    reactants: ["nh3", "hcl"],
    icon: "☁️",
  },
];

export function getChallengeById(id: string): LabChallenge | undefined {
  return LAB_CHALLENGES.find((c) => c.id === id);
}

/**
 * Gợi ý thử thách Lab ướt cho một bài học (nếu bài đó phù hợp với thí nghiệm
 * ướt — vd phản ứng, acid–base, phân huỷ). Trả về challenge id hoặc undefined.
 */
const LESSON_TO_CHALLENGE: Record<string, string> = {
  // Road 1
  "road1-lesson7": "ch-precip-blue", // Liên kết ion (NaCl) → minh hoạ kết tủa muối
  // Road 2
  "road2-lesson1": "ch-gas-co2", // Phản ứng là gì
  "road2-lesson3": "ch-gas-h2", // Phản ứng đốt cháy / kim loại + axit
  "road2-lesson5": "ch-decompose-h2o2", // Phản ứng phân huỷ
  "road2-lesson6": "ch-neutralize", // Acid & Base
};

export function getChallengeForLesson(lessonId: string): LabChallenge | undefined {
  const id = LESSON_TO_CHALLENGE[lessonId];
  return id ? getChallengeById(id) : undefined;
}

export const CHALLENGE_CATEGORY_LABEL: Record<ChallengeCategory, string> = {
  precipitate: "Kết tủa",
  gas: "Sủi khí",
  neutralize: "Trung hoà",
  indicator: "Chỉ thị màu",
  decompose: "Phân huỷ",
  identify: "Nhận biết",
};
