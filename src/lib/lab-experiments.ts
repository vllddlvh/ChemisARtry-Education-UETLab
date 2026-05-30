// lab-experiments.ts
// "Engine" mô phỏng phòng thí nghiệm ướt (wet lab): thuốc thử + phản ứng quan sát được.
// Không có API công khai nào cho hiện tượng phản ứng (sủi bọt/kết tủa/đổi màu),
// nên dữ liệu này được biên soạn thủ công theo hóa học phổ thông.

export type Phase = "liquid" | "solid" | "powder" | "metal" | "indicator";

export type Reagent = {
  id: string;
  name: string; // tên tiếng Việt
  formula: string;
  /** màu dung dịch/chất (hex) */
  color: string;
  /** chất rắn/kim loại thì liquid = false (không làm dâng mực chất lỏng nhiều) */
  phase: Phase;
  category: "acid" | "base" | "salt" | "metal" | "indicator" | "oxidizer" | "other";
  hazard: "low" | "corrosive" | "flammable" | "toxic";
  description: string;
};

export type ObservationEffect = {
  /** màu dung dịch sau phản ứng (hex), bỏ trống = giữ nguyên */
  colorChange?: string;
  /** sủi bọt khí */
  gas?: boolean;
  gasColor?: string;
  /** màu kết tủa (hex), null = không kết tủa */
  precipitate?: string | null;
  /** nhiệt: hot = tỏa nhiệt (bốc hơi), cold = thu nhiệt */
  temperature?: "hot" | "cold" | null;
  /** khói (vd NH3 + HCl tạo khói trắng) */
  smoke?: string | null;
  /** mức độ mãnh liệt của phản ứng — chi phối tốc độ/sô lượng hiệu ứng */
  intensity?: "gentle" | "vigorous" | "violent";
  /** bọt trào lên/tràn miệng ống (vd sủi mạnh) */
  fizz?: boolean;
  /** dung dịch phát sáng (vd phản ứng phát quang/glow) */
  glow?: string | null;
  /** đổi màu của ngọn lửa (thử màu ngọn lửa kim loại) */
  flameColor?: string | null;
};

export type LabReaction = {
  id: string;
  reactants: string[]; // reagent ids (không phân biệt thứ tự)
  equation: string;
  observation: string; // mô tả hiện tượng nhìn thấy
  explanation: string; // giải thích
  effect: ObservationEffect;
  /** cần đun nóng (đèn cồn) mới xảy ra */
  requiresHeat?: boolean;
};

// ── Thuốc thử ────────────────────────────────────────────────────────────────

export const REAGENTS: Reagent[] = [
  {
    id: "hcl",
    name: "Axit clohidric",
    formula: "HCl",
    color: "#eef6ff",
    phase: "liquid",
    category: "acid",
    hazard: "corrosive",
    description: "Axit mạnh, không màu.",
  },
  {
    id: "h2so4",
    name: "Axit sunfuric",
    formula: "H₂SO₄",
    color: "#f5f3e8",
    phase: "liquid",
    category: "acid",
    hazard: "corrosive",
    description: "Axit mạnh, sánh, háo nước.",
  },
  {
    id: "naoh",
    name: "Natri hidroxit",
    formula: "NaOH",
    color: "#eefcf6",
    phase: "liquid",
    category: "base",
    hazard: "corrosive",
    description: "Bazơ mạnh (xút), không màu.",
  },
  {
    id: "nh3",
    name: "Amoniac",
    formula: "NH₃",
    color: "#eef9ff",
    phase: "liquid",
    category: "base",
    hazard: "toxic",
    description: "Dung dịch bazơ yếu, mùi khai.",
  },
  {
    id: "cuso4",
    name: "Đồng(II) sunfat",
    formula: "CuSO₄",
    color: "#1e88e5",
    phase: "liquid",
    category: "salt",
    hazard: "toxic",
    description: "Dung dịch màu xanh lam đặc trưng.",
  },
  {
    id: "agno3",
    name: "Bạc nitrat",
    formula: "AgNO₃",
    color: "#f7fbff",
    phase: "liquid",
    category: "salt",
    hazard: "corrosive",
    description: "Không màu, nhạy sáng.",
  },
  {
    id: "nacl",
    name: "Natri clorua",
    formula: "NaCl",
    color: "#fbfdff",
    phase: "liquid",
    category: "salt",
    hazard: "low",
    description: "Dung dịch muối ăn, không màu.",
  },
  {
    id: "bacl2",
    name: "Bari clorua",
    formula: "BaCl₂",
    color: "#fbfdff",
    phase: "liquid",
    category: "salt",
    hazard: "toxic",
    description: "Không màu, dùng nhận biết gốc sunfat.",
  },
  {
    id: "na2so4",
    name: "Natri sunfat",
    formula: "Na₂SO₄",
    color: "#fbfdff",
    phase: "liquid",
    category: "salt",
    hazard: "low",
    description: "Không màu.",
  },
  {
    id: "fecl3",
    name: "Sắt(III) clorua",
    formula: "FeCl₃",
    color: "#c9772e",
    phase: "liquid",
    category: "salt",
    hazard: "corrosive",
    description: "Dung dịch màu vàng nâu.",
  },
  {
    id: "pb_no3",
    name: "Chì(II) nitrat",
    formula: "Pb(NO₃)₂",
    color: "#fbfdff",
    phase: "liquid",
    category: "salt",
    hazard: "toxic",
    description: "Không màu, độc.",
  },
  {
    id: "ki",
    name: "Kali iodua",
    formula: "KI",
    color: "#fbfdff",
    phase: "liquid",
    category: "salt",
    hazard: "low",
    description: "Không màu.",
  },
  {
    id: "h2o2",
    name: "Hidro peoxit",
    formula: "H₂O₂",
    color: "#f2fbff",
    phase: "liquid",
    category: "oxidizer",
    hazard: "corrosive",
    description: "Nước oxi già, dễ phân hủy.",
  },
  {
    id: "caco3",
    name: "Canxi cacbonat",
    formula: "CaCO₃",
    color: "#f3f3ee",
    phase: "powder",
    category: "salt",
    hazard: "low",
    description: "Đá vôi/bột, ít tan.",
  },
  {
    id: "zn",
    name: "Kẽm",
    formula: "Zn",
    color: "#9aa3b2",
    phase: "metal",
    category: "metal",
    hazard: "low",
    description: "Viên kẽm kim loại.",
  },
  {
    id: "fe",
    name: "Sắt (đinh)",
    formula: "Fe",
    color: "#6b6f76",
    phase: "metal",
    category: "metal",
    hazard: "low",
    description: "Đinh sắt kim loại.",
  },
  {
    id: "phenol",
    name: "Phenolphtalein",
    formula: "C₂₀H₁₄O₄",
    color: "#fdfdff",
    phase: "indicator",
    category: "indicator",
    hazard: "flammable",
    description: "Chất chỉ thị, không màu (hồng trong bazơ).",
  },
  {
    id: "litmus",
    name: "Quỳ tím",
    formula: "—",
    color: "#9b7fd4",
    phase: "indicator",
    category: "indicator",
    hazard: "low",
    description: "Chất chỉ thị màu tím.",
  },
  {
    id: "kmno4",
    name: "Kali pemanganat",
    formula: "KMnO₄",
    color: "#7b1fa2",
    phase: "liquid",
    category: "oxidizer",
    hazard: "corrosive",
    description: "Dung dịch tím đậm, chất oxi hoá mạnh.",
  },
  {
    id: "na2co3",
    name: "Natri cacbonat",
    formula: "Na₂CO₃",
    color: "#fbfdff",
    phase: "liquid",
    category: "salt",
    hazard: "low",
    description: "Soda, dung dịch không màu, có tính bazơ.",
  },
  {
    id: "iodine",
    name: "Dung dịch iốt",
    formula: "I₂",
    color: "#8d6e3a",
    phase: "liquid",
    category: "other",
    hazard: "toxic",
    description: "Màu nâu vàng, nhận biết tinh bột.",
  },
  {
    id: "starch",
    name: "Hồ tinh bột",
    formula: "(C₆H₁₀O₅)ₙ",
    color: "#f4f1e6",
    phase: "liquid",
    category: "other",
    hazard: "low",
    description: "Dung dịch keo trắng đục.",
  },
];

export function getReagent(id: string): Reagent | undefined {
  return REAGENTS.find((r) => r.id === id);
}

/**
 * Canonical id for a reaction given its reactant ids — mirrors the id scheme
 * used by `rxn()` below (sorted reactant ids joined by "_"). Lets challenges
 * reference reactions by reactant set without hard-coding fragile strings.
 */
export function labReactionId(reactants: string[]): string {
  return `lab-${[...reactants].sort().join("_")}`;
}

// ── Phản ứng quan sát được ─────────────────────────────────────────────────

function rxn(
  reactants: string[],
  equation: string,
  observation: string,
  explanation: string,
  effect: ObservationEffect,
  requiresHeat = false,
): LabReaction {
  return {
    id: `lab-${[...reactants].sort().join("_")}`,
    reactants,
    equation,
    observation,
    explanation,
    effect,
    requiresHeat,
  };
}

export const LAB_REACTIONS: LabReaction[] = [
  // Kết tủa
  rxn(
    ["cuso4", "naoh"],
    "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄",
    "Xuất hiện kết tủa xanh lam (Cu(OH)₂).",
    "Ion Cu²⁺ gặp OH⁻ tạo kết tủa đồng(II) hidroxit không tan.",
    { precipitate: "#1565c0", colorChange: "#7fb3e8" },
  ),
  rxn(
    ["agno3", "nacl"],
    "AgNO₃ + NaCl → AgCl↓ + NaNO₃",
    "Kết tủa trắng vón cục (AgCl) xuất hiện.",
    "Ion Ag⁺ và Cl⁻ tạo bạc clorua không tan, hóa đen ngoài ánh sáng.",
    { precipitate: "#fafafa", colorChange: "#eef0f2" },
  ),
  rxn(
    ["bacl2", "na2so4"],
    "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl",
    "Kết tủa trắng mịn (BaSO₄).",
    "Ion Ba²⁺ gặp SO₄²⁻ tạo bari sunfat — phản ứng nhận biết gốc sunfat.",
    { precipitate: "#ffffff", colorChange: "#f1f3f5" },
  ),
  rxn(
    ["bacl2", "h2so4"],
    "BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl",
    "Kết tủa trắng (BaSO₄) không tan trong axit.",
    "Bari sunfat bền, không tan kể cả trong axit mạnh.",
    { precipitate: "#ffffff", colorChange: "#f1f3f5" },
  ),
  rxn(
    ["fecl3", "naoh"],
    "FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl",
    "Kết tủa nâu đỏ (Fe(OH)₃).",
    "Ion Fe³⁺ gặp OH⁻ tạo sắt(III) hidroxit màu nâu đỏ.",
    { precipitate: "#8d3b1e", colorChange: "#b56a47" },
  ),
  rxn(
    ["pb_no3", "ki"],
    "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃",
    "Kết tủa vàng óng (PbI₂) — hiệu ứng 'mưa vàng'.",
    "Ion Pb²⁺ và I⁻ tạo chì(II) iodua vàng rực.",
    { precipitate: "#f6c700", colorChange: "#f0dd8a" },
  ),

  // Sủi khí
  rxn(
    ["hcl", "caco3"],
    "2HCl + CaCO₃ → CaCl₂ + H₂O + CO₂↑",
    "Sủi bọt khí mạnh (CO₂), đá vôi tan dần.",
    "Axit tác dụng với muối cacbonat giải phóng khí cacbonic.",
    { gas: true, gasColor: "#dfe7ee", intensity: "vigorous", fizz: true },
  ),
  rxn(
    ["hcl", "zn"],
    "2HCl + Zn → ZnCl₂ + H₂↑",
    "Viên kẽm tan, sủi bọt khí (H₂).",
    "Kim loại đứng trước H đẩy hidro ra khỏi axit.",
    { gas: true, gasColor: "#eaf2ff", temperature: "hot", intensity: "vigorous" },
  ),
  rxn(
    ["h2so4", "zn"],
    "Zn + H₂SO₄ → ZnSO₄ + H₂↑",
    "Kẽm tan, sủi bọt khí hidro.",
    "Phản ứng kim loại với axit loãng giải phóng H₂.",
    { gas: true, gasColor: "#eaf2ff", temperature: "hot", intensity: "vigorous" },
  ),
  rxn(
    ["hcl", "fe"],
    "Fe + 2HCl → FeCl₂ + H₂↑",
    "Đinh sắt tan dần, sủi bọt khí, dung dịch ngả lục nhạt.",
    "Sắt phản ứng với axit tạo muối sắt(II) và khí hidro.",
    { gas: true, gasColor: "#eaf2ff", colorChange: "#cfe8d8" },
  ),
  rxn(
    ["h2o2"],
    "2H₂O₂ → 2H₂O + O₂↑",
    "Sủi bọt khí oxi (mạnh hơn khi đun nóng).",
    "Hidro peoxit phân hủy giải phóng khí oxi.",
    { gas: true, gasColor: "#eafff4", intensity: "vigorous", fizz: true },
    true,
  ),

  // Thế (displacement)
  rxn(
    ["cuso4", "fe"],
    "Fe + CuSO₄ → FeSO₄ + Cu",
    "Đinh sắt phủ lớp đồng đỏ, dung dịch nhạt màu xanh dần ngả lục.",
    "Sắt mạnh hơn đồng nên đẩy đồng ra khỏi muối (phản ứng thế).",
    { precipitate: "#b3592b", colorChange: "#88b08a" },
  ),

  // Trung hòa
  rxn(
    ["hcl", "naoh"],
    "HCl + NaOH → NaCl + H₂O",
    "Không đổi màu nhưng ống nghiệm ấm lên (tỏa nhiệt).",
    "Phản ứng trung hòa axit–bazơ tạo muối và nước, tỏa nhiệt.",
    { temperature: "hot" },
  ),
  rxn(
    ["h2so4", "naoh"],
    "H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O",
    "Dung dịch nóng lên rõ rệt (tỏa nhiệt mạnh).",
    "Trung hòa axit mạnh bằng bazơ mạnh tỏa nhiều nhiệt.",
    { temperature: "hot" },
  ),

  // Khói
  rxn(
    ["nh3", "hcl"],
    "NH₃ + HCl → NH₄Cl",
    "Tạo khói trắng dày (NH₄Cl).",
    "Khí amoniac gặp hơi axit clohidric tạo tinh thể muối amoni clorua bay trong không khí.",
    { smoke: "#ffffff" },
  ),

  // Chỉ thị màu
  rxn(
    ["phenol", "naoh"],
    "Phenolphtalein + NaOH",
    "Dung dịch chuyển sang màu hồng đậm.",
    "Phenolphtalein không màu trong môi trường bazơ thì hóa hồng.",
    { colorChange: "#ff5ea0" },
  ),
  rxn(
    ["phenol", "nh3"],
    "Phenolphtalein + NH₃",
    "Dung dịch hóa hồng nhạt.",
    "Amoniac có tính bazơ làm phenolphtalein hóa hồng.",
    { colorChange: "#ff8fc0" },
  ),
  rxn(
    ["litmus", "hcl"],
    "Quỳ tím + axit",
    "Quỳ tím hóa đỏ.",
    "Môi trường axit làm quỳ tím chuyển đỏ.",
    { colorChange: "#e23b3b" },
  ),
  rxn(
    ["litmus", "h2so4"],
    "Quỳ tím + axit",
    "Quỳ tím hóa đỏ.",
    "Môi trường axit làm quỳ tím chuyển đỏ.",
    { colorChange: "#e23b3b" },
  ),
  rxn(
    ["litmus", "naoh"],
    "Quỳ tím + bazơ",
    "Quỳ tím hóa xanh.",
    "Môi trường bazơ làm quỳ tím chuyển xanh.",
    { colorChange: "#3b6fe2" },
  ),

  // Nhận biết & oxi hoá đặc sắc
  rxn(
    ["iodine", "starch"],
    "I₂ + hồ tinh bột",
    "Dung dịch chuyển xanh tím đậm đặc trưng.",
    "Iốt tạo phức màu xanh tím với tinh bột — phản ứng nhận biết tinh bột.",
    { colorChange: "#1a237e" },
  ),
  rxn(
    ["kmno4", "h2o2"],
    "2KMnO₄ + 5H₂O₂ + 3H₂SO₄ → 2MnSO₄ + 5O₂↑ + ...",
    "Màu tím nhạt dần rồi mất màu, sủi bọt khí oxi mạnh.",
    "H₂O₂ khử KMnO₄ tím về Mn²⁺ không màu, giải phóng khí O₂.",
    { colorChange: "#f3e9d2", gas: true, gasColor: "#eafff4", intensity: "violent", fizz: true },
  ),
  rxn(
    ["hcl", "na2co3"],
    "2HCl + Na₂CO₃ → 2NaCl + H₂O + CO₂↑",
    "Sủi bọt khí CO₂ mạnh ngay lập tức.",
    "Axit tác dụng với muối cacbonat giải phóng khí cacbonic.",
    { gas: true, gasColor: "#dfe7ee", intensity: "violent", fizz: true },
  ),
  rxn(
    ["agno3", "hcl"],
    "AgNO₃ + HCl → AgCl↓ + HNO₃",
    "Kết tủa trắng đục (AgCl) xuất hiện ngay.",
    "Ion Ag⁺ gặp Cl⁻ tạo bạc clorua không tan.",
    { precipitate: "#fafafa", colorChange: "#eef0f2" },
  ),
  rxn(
    ["cuso4", "nh3"],
    "CuSO₄ + NH₃ (dư) → [Cu(NH₃)₄]²⁺",
    "Đầu tiên kết tủa xanh, sau tan tạo dung dịch xanh lam đậm.",
    "Cu²⁺ tạo phức amoniac màu xanh lam đặc trưng (xanh hoàng gia).",
    { colorChange: "#1565c0" },
  ),
];

/**
 * Tìm phản ứng khớp với tập thuốc thử có trong bình (subset match, không thứ tự).
 * heated: bình có đang được đun nóng không.
 */
export function findLabReaction(contents: string[], heated: boolean): LabReaction | null {
  for (const r of LAB_REACTIONS) {
    const pool = [...contents];
    let ok = true;
    for (const need of r.reactants) {
      const i = pool.indexOf(need);
      if (i === -1) {
        ok = false;
        break;
      }
      pool.splice(i, 1);
    }
    if (!ok) continue;
    if (r.requiresHeat && !heated) continue;
    return r;
  }
  return null;
}

/** Tra cứu phản ứng theo id (id sinh bởi `rxn()` / `labReactionId`). */
export function getLabReactionById(id: string): LabReaction | undefined {
  return LAB_REACTIONS.find((r) => r.id === id);
}

/** Tổng số phản ứng wet-lab khả dụng (dùng cho thành tích "khám phá hết"). */
export const TOTAL_LAB_REACTIONS = LAB_REACTIONS.length;

/**
 * pH gần đúng của một thuốc thử (định tính cho mục đích giáo dục — không phải
 * giá trị đo chính xác). Dựa trên loại chất + độ mạnh axit/bazơ phổ thông.
 */
const APPROX_PH: Record<string, number> = {
  hcl: 1,
  h2so4: 1,
  agno3: 4,
  fecl3: 3,
  cuso4: 4,
  pb_no3: 4,
  iodine: 5,
  h2o2: 5,
  kmno4: 5,
  nacl: 7,
  na2so4: 7,
  bacl2: 7,
  ki: 7,
  starch: 7,
  na2co3: 11,
  nh3: 11,
  naoh: 14,
};

/** pH gần đúng cho một tập thuốc thử (lấy trung vị các chất có pH xác định). */
export function approxPH(contents: string[]): number | null {
  const vals = contents.map((id) => APPROX_PH[id]).filter((v): v is number => v !== undefined);
  if (vals.length === 0) return null;
  vals.sort((a, b) => a - b);
  const mid = Math.floor(vals.length / 2);
  const median = vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
  return Math.round(median * 10) / 10;
}

/** Cặp chất nguy hiểm khi trộn — cảnh báo an toàn (định tính). */
export function isHazardousMix(a: Reagent, b: Reagent): boolean {
  const strongAcid = (r: Reagent) => r.category === "acid" && r.hazard === "corrosive";
  const reactiveMetal = (r: Reagent) => r.category === "metal";
  const strongOxidizer = (r: Reagent) => r.category === "oxidizer";
  // Axit mạnh + kim loại, hoặc oxi hoá mạnh + (axit/kim loại) → mãnh liệt.
  if ((strongAcid(a) && reactiveMetal(b)) || (strongAcid(b) && reactiveMetal(a))) return true;
  if (
    (strongOxidizer(a) && (b.category === "acid" || b.category === "metal")) ||
    (strongOxidizer(b) && (a.category === "acid" || a.category === "metal"))
  )
    return true;
  return false;
}
