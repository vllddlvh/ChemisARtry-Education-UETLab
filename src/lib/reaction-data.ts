// reaction-data.ts
// Cơ sở tri thức phản ứng tích hợp sẵn + phân loại phản ứng + style hiển thị.
//
// Mục tiêu: làm cho phòng thí nghiệm thực sự "phản ứng" được — kể cả khi
// người dùng spawn các nguyên tử đơn lẻ (H, O, Na, Cl...) rồi ghép lại.
// Dữ liệu này được trộn (merge) với dữ liệu từ Supabase trong useChemistryData,
// nên trang /tools/reactions cũng tự động phong phú hơn.

import type { Atom, Bond, Molecule, Reaction } from "@/lib/chemistry";

// ── Phân loại phản ứng ──────────────────────────────────────────────────────

export type ReactionKind =
  | "combustion" // cháy
  | "synthesis" // tổng hợp / hoá hợp
  | "decomposition" // phân huỷ
  | "acid-base" // trung hoà axit–bazơ
  | "single-replacement" // thế đơn
  | "double-replacement" // trao đổi
  | "redox" // oxi hoá - khử
  | "general"; // khác

export type ReactionVisual = {
  kind: ReactionKind;
  /** Nhãn tiếng Việt hiển thị cho người dùng. */
  label: string;
  /** Emoji minh hoạ. */
  icon: string;
  /** true = toả nhiệt, false = thu nhiệt, null = chưa rõ. */
  exothermic: boolean | null;
  /** Màu hạt particle cho hiệu ứng (hex). */
  particleColors: [string, string];
  /** Lớp CSS accent cho UI. */
  accentClass: string;
};

const KIND_META: Record<ReactionKind, { label: string; icon: string }> = {
  combustion: { label: "Phản ứng cháy", icon: "🔥" },
  synthesis: { label: "Phản ứng hoá hợp", icon: "🧬" },
  decomposition: { label: "Phản ứng phân huỷ", icon: "💥" },
  "acid-base": { label: "Trung hoà axit–bazơ", icon: "⚗️" },
  "single-replacement": { label: "Phản ứng thế", icon: "🔁" },
  "double-replacement": { label: "Phản ứng trao đổi", icon: "🔀" },
  redox: { label: "Oxi hoá – khử", icon: "⚡" },
  general: { label: "Phản ứng hoá học", icon: "✨" },
};

const ACIDS = new Set(["HCl", "H2SO4", "HNO3", "H3PO4", "CH3COOH", "H2CO3", "HBr", "HI", "HF"]);
const BASES = new Set([
  "NaOH",
  "KOH",
  "Ca(OH)2",
  "NH3",
  "Mg(OH)2",
  "Ba(OH)2",
  "Al(OH)3",
  "Fe(OH)3",
]);

function isElement(formula: string): boolean {
  // Nguyên tố đơn chất: 1-2 chữ cái, không có số (vd H, O, Na) hoặc đơn chất phân tử
  return (
    /^[A-Z][a-z]?$/.test(formula) || ["H2", "O2", "N2", "Cl2", "F2", "Br2", "I2"].includes(formula)
  );
}

/** Suy luận loại phản ứng từ chất tham gia / sản phẩm. */
export function classifyReaction(r: Reaction): ReactionKind {
  const reactants = r.reactants;
  const products = r.products;

  // Cháy: có O2 ở vế trái và (CO2 hoặc H2O) ở vế phải
  if (reactants.includes("O2") && products.some((p) => p === "CO2" || p === "H2O")) {
    return "combustion";
  }

  // Trung hoà axit–bazơ
  const hasAcid = reactants.some((x) => ACIDS.has(x));
  const hasBase = reactants.some((x) => BASES.has(x));
  if (hasAcid && hasBase) return "acid-base";

  // Phân huỷ: 1 chất → nhiều chất
  if (reactants.length === 1 && products.length >= 2) return "decomposition";

  // Hoá hợp / tổng hợp: nhiều chất → 1 chất
  if (reactants.length >= 2 && products.length === 1) {
    if (reactants.every(isElement)) return "synthesis";
    return "synthesis";
  }

  // Thế đơn: 1 đơn chất + 1 hợp chất → 1 đơn chất + 1 hợp chất
  const elementCount = reactants.filter(isElement).length;
  if (reactants.length === 2 && elementCount === 1 && products.length === 2) {
    return "single-replacement";
  }

  // Trao đổi: 2 hợp chất → 2 hợp chất
  if (reactants.length === 2 && elementCount === 0 && products.length === 2) {
    return "double-replacement";
  }

  return "general";
}

/** Trả về thông tin hiển thị (màu, nhãn, toả/thu nhiệt) cho 1 phản ứng. */
export function reactionVisual(r: Reaction): ReactionVisual {
  const kind = classifyReaction(r);
  const meta = KIND_META[kind];
  const exothermic = r.energy_kj == null ? defaultExo(kind) : r.energy_kj < 0;

  const particleColors = exothermic
    ? (["#ffb86b", "#ff5e3a"] as [string, string]) // ấm: cam-đỏ
    : exothermic === false
      ? (["#7de2ff", "#6a8bff"] as [string, string]) // lạnh: xanh
      : (["#a78bfa", "#7de2ff"] as [string, string]); // trung tính

  const accentClass = exothermic
    ? "text-orange-400 bg-orange-500/15 border-orange-400/30"
    : exothermic === false
      ? "text-sky-400 bg-sky-500/15 border-sky-400/30"
      : "text-violet-400 bg-violet-500/15 border-violet-400/30";

  return {
    kind,
    label: meta.label,
    icon: meta.icon,
    exothermic,
    particleColors,
    accentClass,
  };
}

function defaultExo(kind: ReactionKind): boolean | null {
  switch (kind) {
    case "combustion":
    case "acid-base":
    case "synthesis":
      return true;
    case "decomposition":
      return false;
    default:
      return null;
  }
}

// ── Hình học phân tử dự phòng (fallback) ────────────────────────────────────
// Dùng khi sản phẩm phản ứng không có trong Supabase, để vẫn hiển thị được.

function mol(
  formula: string,
  name: string,
  atoms: Atom[],
  bonds: Bond[],
  category = "common",
  description = "",
): Molecule {
  return {
    id: `builtin-${formula.toLowerCase()}`,
    formula,
    name,
    description,
    category,
    atoms,
    bonds,
  };
}

export const BUILTIN_MOLECULES: Molecule[] = [
  // Đơn chất phân tử
  mol(
    "H2",
    "Hydro",
    [
      { el: "H", x: -0.37, y: 0, z: 0 },
      { el: "H", x: 0.37, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 1 }],
    "element",
    "Khí hydro, phân tử hai nguyên tử.",
  ),
  mol(
    "O2",
    "Oxi",
    [
      { el: "O", x: -0.6, y: 0, z: 0 },
      { el: "O", x: 0.6, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 2 }],
    "element",
    "Khí oxi, liên kết đôi.",
  ),
  mol(
    "N2",
    "Nitơ",
    [
      { el: "N", x: -0.55, y: 0, z: 0 },
      { el: "N", x: 0.55, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 3 }],
    "element",
    "Khí nitơ, liên kết ba rất bền.",
  ),
  mol(
    "Cl2",
    "Clo",
    [
      { el: "Cl", x: -1.0, y: 0, z: 0 },
      { el: "Cl", x: 1.0, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 1 }],
    "element",
    "Khí clo màu vàng lục.",
  ),
  // Hợp chất thường gặp
  mol(
    "H2O",
    "Nước",
    [
      { el: "O", x: 0, y: 0, z: 0 },
      { el: "H", x: -0.76, y: 0.59, z: 0 },
      { el: "H", x: 0.76, y: 0.59, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
    ],
    "common",
    "Phân tử nước, góc liên kết ~104.5°.",
  ),
  mol(
    "CO2",
    "Cacbon đioxit",
    [
      { el: "C", x: 0, y: 0, z: 0 },
      { el: "O", x: -1.16, y: 0, z: 0 },
      { el: "O", x: 1.16, y: 0, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
    ],
    "common",
    "Khí cacbonic, phân tử thẳng.",
  ),
  mol(
    "NaCl",
    "Natri clorua",
    [
      { el: "Na", x: -1.0, y: 0, z: 0 },
      { el: "Cl", x: 1.0, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 1 }],
    "ionic",
    "Muối ăn, liên kết ion.",
  ),
  mol(
    "HCl",
    "Axit clohydric",
    [
      { el: "H", x: -0.64, y: 0, z: 0 },
      { el: "Cl", x: 0.64, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 1 }],
    "acid",
    "Khí hydro clorua / axit clohydric.",
  ),
  mol(
    "NH3",
    "Amoniac",
    [
      { el: "N", x: 0, y: 0, z: 0 },
      { el: "H", x: 0.94, y: 0.33, z: 0 },
      { el: "H", x: -0.47, y: 0.33, z: 0.82 },
      { el: "H", x: -0.47, y: 0.33, z: -0.82 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
    ],
    "common",
    "Khí amoniac, hình chóp tam giác.",
  ),
  mol(
    "CH4",
    "Metan",
    [
      { el: "C", x: 0, y: 0, z: 0 },
      { el: "H", x: 0.63, y: 0.63, z: 0.63 },
      { el: "H", x: -0.63, y: -0.63, z: 0.63 },
      { el: "H", x: -0.63, y: 0.63, z: -0.63 },
      { el: "H", x: 0.63, y: -0.63, z: -0.63 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
    ],
    "organic",
    "Metan, hình tứ diện.",
  ),
  mol(
    "MgO",
    "Magie oxit",
    [
      { el: "Mg", x: -0.9, y: 0, z: 0 },
      { el: "O", x: 0.9, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 1 }],
    "ionic",
    "Oxit bazơ.",
  ),
  mol(
    "CO",
    "Cacbon monoxit",
    [
      { el: "C", x: -0.56, y: 0, z: 0 },
      { el: "O", x: 0.56, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 3 }],
    "common",
    "Khí độc cacbon monoxit.",
  ),

  // ── Bổ sung cho các bài học Road 2 ──
  mol(
    "NaOH",
    "Natri hydroxit",
    [
      { el: "Na", x: -1.4, y: 0, z: 0 },
      { el: "O", x: 0.3, y: 0, z: 0 },
      { el: "H", x: 1.2, y: 0.4, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
    ],
    "base",
    "Bazơ mạnh (xút ăn da).",
  ),
  mol(
    "Ca(OH)2",
    "Canxi hydroxit",
    [
      { el: "Ca", x: 0, y: 0, z: 0 },
      { el: "O", x: -1.4, y: 0.2, z: 0 },
      { el: "H", x: -2.2, y: 0.6, z: 0 },
      { el: "O", x: 1.4, y: 0.2, z: 0 },
      { el: "H", x: 2.2, y: 0.6, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
    ],
    "base",
    "Vôi tôi, bazơ ít tan.",
  ),
  mol(
    "H2SO4",
    "Axit sunfuric",
    [
      { el: "S", x: 0, y: 0, z: 0 },
      { el: "O", x: 0, y: 1.3, z: 0 },
      { el: "O", x: 0, y: -1.3, z: 0 },
      { el: "O", x: -1.3, y: 0.3, z: 0 },
      { el: "H", x: -2.0, y: 0.9, z: 0 },
      { el: "O", x: 1.3, y: 0.3, z: 0 },
      { el: "H", x: 2.0, y: 0.9, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
      { a: 0, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 },
      { a: 5, b: 6, order: 1 },
    ],
    "acid",
    "Axit mạnh, háo nước mạnh.",
  ),
  mol(
    "SO2",
    "Lưu huỳnh đioxit",
    [
      { el: "S", x: 0, y: 0, z: 0 },
      { el: "O", x: -1.2, y: 0.7, z: 0 },
      { el: "O", x: 1.2, y: 0.7, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
    ],
    "common",
    "Khí mùi hắc, gây mưa axit.",
  ),
  mol(
    "SO3",
    "Lưu huỳnh trioxit",
    [
      { el: "S", x: 0, y: 0, z: 0 },
      { el: "O", x: 1.3, y: 0, z: 0 },
      { el: "O", x: -0.65, y: 1.13, z: 0 },
      { el: "O", x: -0.65, y: -1.13, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
      { a: 0, b: 3, order: 2 },
    ],
    "common",
    "Tam giác phẳng, tạo H₂SO₄ với nước.",
  ),
  mol(
    "H2O2",
    "Hydro peoxit",
    [
      { el: "O", x: -0.74, y: 0, z: 0 },
      { el: "O", x: 0.74, y: 0, z: 0 },
      { el: "H", x: -1.1, y: 0.9, z: 0.3 },
      { el: "H", x: 1.1, y: -0.9, z: 0.3 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 1, b: 3, order: 1 },
    ],
    "common",
    "Nước oxi già, dễ phân huỷ.",
  ),
  mol(
    "CaCO3",
    "Canxi cacbonat",
    [
      { el: "C", x: 0, y: 0, z: 0 },
      { el: "O", x: 0, y: 1.25, z: 0 },
      { el: "O", x: -1.08, y: -0.62, z: 0 },
      { el: "O", x: 1.08, y: -0.62, z: 0 },
      { el: "Ca", x: 2.4, y: -0.62, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
    ],
    "ionic",
    "Đá vôi, vỏ sò.",
  ),
  mol(
    "CaO",
    "Canxi oxit",
    [
      { el: "Ca", x: -0.95, y: 0, z: 0 },
      { el: "O", x: 0.95, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 1 }],
    "ionic",
    "Vôi sống.",
  ),
  mol(
    "HF",
    "Axit flohydric",
    [
      { el: "H", x: -0.5, y: 0, z: 0 },
      { el: "F", x: 0.5, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 1 }],
    "acid",
    "Axit yếu, ăn mòn thuỷ tinh.",
  ),
  mol(
    "C2H5OH",
    "Etanol (rượu)",
    [
      { el: "C", x: -1.25, y: 0, z: 0 },
      { el: "C", x: 0.05, y: 0.1, z: 0 },
      { el: "O", x: 0.9, y: 0.95, z: 0 },
      { el: "H", x: 1.75, y: 0.7, z: 0 },
      { el: "H", x: -1.7, y: 0.95, z: 0.3 },
      { el: "H", x: -1.65, y: -0.55, z: 0.85 },
      { el: "H", x: -1.65, y: -0.55, z: -0.85 },
      { el: "H", x: 0.15, y: -0.6, z: 0.85 },
      { el: "H", x: 0.15, y: -0.6, z: -0.85 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 },
      { a: 0, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 },
      { a: 1, b: 8, order: 1 },
    ],
    "organic",
    "Cồn etylic, có trong đồ uống có cồn.",
  ),
  mol(
    "Fe2O3",
    "Sắt(III) oxit",
    [
      { el: "Fe", x: -1.5, y: 0, z: 0 },
      { el: "Fe", x: 1.5, y: 0, z: 0 },
      { el: "O", x: 0, y: 0, z: 0 },
      { el: "O", x: -0.75, y: 1.2, z: 0 },
      { el: "O", x: 0.75, y: 1.2, z: 0 },
    ],
    [
      { a: 0, b: 2, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 1, b: 4, order: 1 },
    ],
    "ionic",
    "Gỉ sắt (rỉ sét).",
  ),
  mol(
    "H2CO3",
    "Axit cacbonic",
    [
      { el: "C", x: 0, y: 0, z: 0 },
      { el: "O", x: 0, y: 1.25, z: 0 },
      { el: "O", x: -1.1, y: -0.6, z: 0 },
      { el: "H", x: -1.9, y: -0.3, z: 0 },
      { el: "O", x: 1.1, y: -0.6, z: 0 },
      { el: "H", x: 1.9, y: -0.3, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 4, b: 5, order: 1 },
    ],
    "acid",
    "Axit yếu, có trong nước có ga.",
  ),
  mol(
    "NO",
    "Nitơ monoxit",
    [
      { el: "N", x: -0.58, y: 0, z: 0 },
      { el: "O", x: 0.58, y: 0, z: 0 },
    ],
    [{ a: 0, b: 1, order: 2 }],
    "common",
    "Khí không màu, hoá nâu trong không khí.",
  ),
  mol(
    "NO2",
    "Nitơ đioxit",
    [
      { el: "N", x: 0, y: 0, z: 0 },
      { el: "O", x: -1.1, y: 0.7, z: 0 },
      { el: "O", x: 1.1, y: 0.7, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
    ],
    "common",
    "Khí màu nâu đỏ, độc.",
  ),
  mol(
    "C2H4",
    "Etilen",
    [
      { el: "C", x: -0.67, y: 0, z: 0 },
      { el: "C", x: 0.67, y: 0, z: 0 },
      { el: "H", x: -1.23, y: 0.92, z: 0 },
      { el: "H", x: -1.23, y: -0.92, z: 0 },
      { el: "H", x: 1.23, y: 0.92, z: 0 },
      { el: "H", x: 1.23, y: -0.92, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 1, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 },
    ],
    "organic",
    "Anken đơn giản nhất, làm chín trái cây.",
  ),
  mol(
    "Na2SO4",
    "Natri sunfat",
    [
      { el: "S", x: 0, y: 0, z: 0 },
      { el: "O", x: 0, y: 1.3, z: 0 },
      { el: "O", x: 0, y: -1.3, z: 0 },
      { el: "O", x: -1.3, y: 0, z: 0 },
      { el: "O", x: 1.3, y: 0, z: 0 },
      { el: "Na", x: -2.4, y: 0.4, z: 0 },
      { el: "Na", x: 2.4, y: 0.4, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
      { a: 3, b: 5, order: 1 },
      { a: 4, b: 6, order: 1 },
    ],
    "ionic",
    "Muối trung hoà của axit sunfuric.",
  ),
  mol(
    "CaCl2",
    "Canxi clorua",
    [
      { el: "Ca", x: 0, y: 0, z: 0 },
      { el: "Cl", x: -1.7, y: 0, z: 0 },
      { el: "Cl", x: 1.7, y: 0, z: 0 },
    ],
    [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
    ],
    "ionic",
    "Muối, chất hút ẩm mạnh.",
  ),
];

// ── Phản ứng tích hợp sẵn ────────────────────────────────────────────────────

function rxn(
  reactants: string[],
  products: string[],
  equation: string,
  description: string,
  energy_kj: number | null,
): Reaction {
  return {
    id: `builtin-rxn-${[...reactants].sort().join("_")}__${[...products].sort().join("_")}`,
    reactants,
    products,
    equation,
    description,
    energy_kj,
  };
}

export const BUILTIN_REACTIONS: Reaction[] = [
  // Hoá hợp từ nguyên tử đơn lẻ (cho chế độ spawn nguyên tố)
  rxn(["H", "H"], ["H2"], "H + H → H₂", "Hai nguyên tử hydro kết hợp thành phân tử H₂.", -436),
  rxn(["O", "O"], ["O2"], "O + O → O₂", "Hai nguyên tử oxi kết hợp thành phân tử O₂.", -498),
  rxn(["N", "N"], ["N2"], "N + N → N₂", "Hình thành liên kết ba bền vững của N₂.", -945),
  rxn(["Cl", "Cl"], ["Cl2"], "Cl + Cl → Cl₂", "Hai nguyên tử clo kết hợp thành Cl₂.", -243),
  rxn(
    ["Na", "Cl"],
    ["NaCl"],
    "Na + Cl → NaCl",
    "Natri nhường electron cho clo tạo liên kết ion.",
    -411,
  ),
  rxn(["H", "Cl"], ["HCl"], "H + Cl → HCl", "Tạo phân tử hydro clorua.", -431),
  rxn(["Mg", "O"], ["MgO"], "Mg + O → MgO", "Magie cháy sáng tạo magie oxit.", -601),

  // Hoá hợp từ phân tử
  rxn(["H2", "O2"], ["H2O"], "2H₂ + O₂ → 2H₂O", "Phản ứng nổ của hydro và oxi tạo nước.", -572),
  rxn(["N2", "H2"], ["NH3"], "N₂ + 3H₂ → 2NH₃", "Tổng hợp amoniac (quy trình Haber).", -92),
  rxn(["C", "O2"], ["CO2"], "C + O₂ → CO₂", "Đốt cháy cacbon tạo khí cacbonic.", -394),
  rxn(["Na", "Cl2"], ["NaCl"], "2Na + Cl₂ → 2NaCl", "Natri phản ứng mãnh liệt với khí clo.", -822),

  // Cháy hợp chất
  rxn(["CH4", "O2"], ["CO2", "H2O"], "CH₄ + 2O₂ → CO₂ + 2H₂O", "Đốt cháy metan (khí gas).", -891),
  rxn(
    ["C2H5OH", "O2"],
    ["CO2", "H2O"],
    "C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O",
    "Đốt cháy cồn (etanol).",
    -1367,
  ),
  rxn(["C2H4", "O2"], ["CO2", "H2O"], "C₂H₄ + 3O₂ → 2CO₂ + 2H₂O", "Đốt cháy etilen.", -1411),
  rxn(["H2", "O2"], ["H2O"], "2H₂ + O₂ → 2H₂O", "Hydro cháy trong oxi tạo nước.", -572),
  rxn(["CO", "O2"], ["CO2"], "2CO + O₂ → 2CO₂", "Đốt cháy khí CO.", -566),

  // Trung hoà axit–bazơ
  rxn(
    ["HCl", "NaOH"],
    ["NaCl", "H2O"],
    "HCl + NaOH → NaCl + H₂O",
    "Phản ứng trung hoà tạo muối và nước.",
    -57,
  ),
  rxn(
    ["H2SO4", "NaOH"],
    ["Na2SO4", "H2O"],
    "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O",
    "Trung hoà axit sunfuric bằng xút.",
    -114,
  ),
  rxn(
    ["HCl", "Ca(OH)2"],
    ["CaCl2", "H2O"],
    "2HCl + Ca(OH)₂ → CaCl₂ + 2H₂O",
    "Trung hoà axit bằng vôi tôi.",
    -110,
  ),

  // Phản ứng phân huỷ
  rxn(["H2O2"], ["H2O", "O2"], "2H₂O₂ → 2H₂O + O₂", "Phân huỷ oxi già (có xúc tác MnO₂).", -196),
  rxn(["CaCO3"], ["CaO", "CO2"], "CaCO₃ → CaO + CO₂", "Nung vôi: nhiệt phân đá vôi.", 178),
  rxn(["H2O"], ["H2", "O2"], "2H₂O → 2H₂ + O₂", "Điện phân nước.", 572),

  // Tổng hợp công nghiệp
  rxn(["SO2", "O2"], ["SO3"], "2SO₂ + O₂ → 2SO₃", "Oxi hoá SO₂ (sản xuất axit sunfuric).", -198),
  rxn(["SO3", "H2O"], ["H2SO4"], "SO₃ + H₂O → H₂SO₄", "SO₃ tan trong nước tạo axit sunfuric.", -88),
  rxn(["CO2", "H2O"], ["H2CO3"], "CO₂ + H₂O → H₂CO₃", "CO₂ tan trong nước tạo axit cacbonic.", -20),
  rxn(["N2", "O2"], ["NO"], "N₂ + O₂ → 2NO", "Phản ứng ở nhiệt độ cao (tia sét).", 180),
  rxn(["NO", "O2"], ["NO2"], "2NO + O₂ → 2NO₂", "NO hoá nâu trong không khí.", -114),

  // Oxi hoá kim loại
  rxn(["Fe", "O2"], ["Fe2O3"], "4Fe + 3O₂ → 2Fe₂O₃", "Sắt bị gỉ (oxi hoá chậm).", -824),
];
