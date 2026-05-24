// Periodic table data loader.
// Source: Bowserinator/Periodic-Table-JSON (public, no API key).
// Strategy: try fetch -> cache to localStorage -> fall back to a small embedded
// snapshot of common elements so the page is always usable offline.

export type PTElement = {
  number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  category: string;
  phase?: string;
  density?: number | null;
  melt?: number | null;
  boil?: number | null;
  electron_configuration?: string;
  electron_configuration_semantic?: string;
  shells: number[];
  cpk_hex?: string | null;
  summary?: string;
  discovered_by?: string | null;
  xpos?: number; // 1..18
  ypos?: number; // 1..7 (or 8/9 for la/ac)
  group?: number | null;
  period?: number;
};

const SOURCE_URL =
  "https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json";
const CACHE_KEY = "molelab.periodic-table.v1";

// Compact embedded fallback (first 36 elements) — enough so the page renders
// even when offline. The full set is fetched on first visit and cached.
const FALLBACK: PTElement[] = [
  {
    number: 1,
    symbol: "H",
    name: "Hydrogen",
    atomic_mass: 1.008,
    category: "diatomic nonmetal",
    shells: [1],
    xpos: 1,
    ypos: 1,
    period: 1,
    group: 1,
    phase: "Gas",
    electron_configuration: "1s1",
    summary: "Lightest and most abundant element in the universe.",
  },
  {
    number: 2,
    symbol: "He",
    name: "Helium",
    atomic_mass: 4.0026,
    category: "noble gas",
    shells: [2],
    xpos: 18,
    ypos: 1,
    period: 1,
    group: 18,
    phase: "Gas",
    electron_configuration: "1s2",
    summary: "Inert noble gas used in balloons and cryogenics.",
  },
  {
    number: 3,
    symbol: "Li",
    name: "Lithium",
    atomic_mass: 6.94,
    category: "alkali metal",
    shells: [2, 1],
    xpos: 1,
    ypos: 2,
    period: 2,
    group: 1,
    phase: "Solid",
    electron_configuration: "1s2 2s1",
  },
  {
    number: 4,
    symbol: "Be",
    name: "Beryllium",
    atomic_mass: 9.0122,
    category: "alkaline earth metal",
    shells: [2, 2],
    xpos: 2,
    ypos: 2,
    period: 2,
    group: 2,
    phase: "Solid",
  },
  {
    number: 5,
    symbol: "B",
    name: "Boron",
    atomic_mass: 10.81,
    category: "metalloid",
    shells: [2, 3],
    xpos: 13,
    ypos: 2,
    period: 2,
    group: 13,
    phase: "Solid",
  },
  {
    number: 6,
    symbol: "C",
    name: "Carbon",
    atomic_mass: 12.011,
    category: "polyatomic nonmetal",
    shells: [2, 4],
    xpos: 14,
    ypos: 2,
    period: 2,
    group: 14,
    phase: "Solid",
    electron_configuration: "1s2 2s2 2p2",
    summary: "Backbone of all known organic life.",
  },
  {
    number: 7,
    symbol: "N",
    name: "Nitrogen",
    atomic_mass: 14.007,
    category: "diatomic nonmetal",
    shells: [2, 5],
    xpos: 15,
    ypos: 2,
    period: 2,
    group: 15,
    phase: "Gas",
  },
  {
    number: 8,
    symbol: "O",
    name: "Oxygen",
    atomic_mass: 15.999,
    category: "diatomic nonmetal",
    shells: [2, 6],
    xpos: 16,
    ypos: 2,
    period: 2,
    group: 16,
    phase: "Gas",
  },
  {
    number: 9,
    symbol: "F",
    name: "Fluorine",
    atomic_mass: 18.998,
    category: "diatomic nonmetal",
    shells: [2, 7],
    xpos: 17,
    ypos: 2,
    period: 2,
    group: 17,
    phase: "Gas",
  },
  {
    number: 10,
    symbol: "Ne",
    name: "Neon",
    atomic_mass: 20.18,
    category: "noble gas",
    shells: [2, 8],
    xpos: 18,
    ypos: 2,
    period: 2,
    group: 18,
    phase: "Gas",
  },
  {
    number: 11,
    symbol: "Na",
    name: "Sodium",
    atomic_mass: 22.99,
    category: "alkali metal",
    shells: [2, 8, 1],
    xpos: 1,
    ypos: 3,
    period: 3,
    group: 1,
    phase: "Solid",
  },
  {
    number: 12,
    symbol: "Mg",
    name: "Magnesium",
    atomic_mass: 24.305,
    category: "alkaline earth metal",
    shells: [2, 8, 2],
    xpos: 2,
    ypos: 3,
    period: 3,
    group: 2,
    phase: "Solid",
  },
  {
    number: 13,
    symbol: "Al",
    name: "Aluminium",
    atomic_mass: 26.982,
    category: "post-transition metal",
    shells: [2, 8, 3],
    xpos: 13,
    ypos: 3,
    period: 3,
    group: 13,
    phase: "Solid",
  },
  {
    number: 14,
    symbol: "Si",
    name: "Silicon",
    atomic_mass: 28.085,
    category: "metalloid",
    shells: [2, 8, 4],
    xpos: 14,
    ypos: 3,
    period: 3,
    group: 14,
    phase: "Solid",
  },
  {
    number: 15,
    symbol: "P",
    name: "Phosphorus",
    atomic_mass: 30.974,
    category: "polyatomic nonmetal",
    shells: [2, 8, 5],
    xpos: 15,
    ypos: 3,
    period: 3,
    group: 15,
    phase: "Solid",
  },
  {
    number: 16,
    symbol: "S",
    name: "Sulfur",
    atomic_mass: 32.06,
    category: "polyatomic nonmetal",
    shells: [2, 8, 6],
    xpos: 16,
    ypos: 3,
    period: 3,
    group: 16,
    phase: "Solid",
  },
  {
    number: 17,
    symbol: "Cl",
    name: "Chlorine",
    atomic_mass: 35.45,
    category: "diatomic nonmetal",
    shells: [2, 8, 7],
    xpos: 17,
    ypos: 3,
    period: 3,
    group: 17,
    phase: "Gas",
  },
  {
    number: 18,
    symbol: "Ar",
    name: "Argon",
    atomic_mass: 39.948,
    category: "noble gas",
    shells: [2, 8, 8],
    xpos: 18,
    ypos: 3,
    period: 3,
    group: 18,
    phase: "Gas",
  },
  {
    number: 19,
    symbol: "K",
    name: "Potassium",
    atomic_mass: 39.098,
    category: "alkali metal",
    shells: [2, 8, 8, 1],
    xpos: 1,
    ypos: 4,
    period: 4,
    group: 1,
    phase: "Solid",
  },
  {
    number: 20,
    symbol: "Ca",
    name: "Calcium",
    atomic_mass: 40.078,
    category: "alkaline earth metal",
    shells: [2, 8, 8, 2],
    xpos: 2,
    ypos: 4,
    period: 4,
    group: 2,
    phase: "Solid",
  },
  {
    number: 26,
    symbol: "Fe",
    name: "Iron",
    atomic_mass: 55.845,
    category: "transition metal",
    shells: [2, 8, 14, 2],
    xpos: 8,
    ypos: 4,
    period: 4,
    group: 8,
    phase: "Solid",
  },
  {
    number: 29,
    symbol: "Cu",
    name: "Copper",
    atomic_mass: 63.546,
    category: "transition metal",
    shells: [2, 8, 18, 1],
    xpos: 11,
    ypos: 4,
    period: 4,
    group: 11,
    phase: "Solid",
  },
  {
    number: 30,
    symbol: "Zn",
    name: "Zinc",
    atomic_mass: 65.38,
    category: "transition metal",
    shells: [2, 8, 18, 2],
    xpos: 12,
    ypos: 4,
    period: 4,
    group: 12,
    phase: "Solid",
  },
  {
    number: 35,
    symbol: "Br",
    name: "Bromine",
    atomic_mass: 79.904,
    category: "diatomic nonmetal",
    shells: [2, 8, 18, 7],
    xpos: 17,
    ypos: 4,
    period: 4,
    group: 17,
    phase: "Liquid",
  },
  {
    number: 36,
    symbol: "Kr",
    name: "Krypton",
    atomic_mass: 83.798,
    category: "noble gas",
    shells: [2, 8, 18, 8],
    xpos: 18,
    ypos: 4,
    period: 4,
    group: 18,
    phase: "Gas",
  },
  {
    number: 47,
    symbol: "Ag",
    name: "Silver",
    atomic_mass: 107.868,
    category: "transition metal",
    shells: [2, 8, 18, 18, 1],
    xpos: 11,
    ypos: 5,
    period: 5,
    group: 11,
    phase: "Solid",
  },
  {
    number: 53,
    symbol: "I",
    name: "Iodine",
    atomic_mass: 126.904,
    category: "diatomic nonmetal",
    shells: [2, 8, 18, 18, 7],
    xpos: 17,
    ypos: 5,
    period: 5,
    group: 17,
    phase: "Solid",
  },
  {
    number: 79,
    symbol: "Au",
    name: "Gold",
    atomic_mass: 196.967,
    category: "transition metal",
    shells: [2, 8, 18, 32, 18, 1],
    xpos: 11,
    ypos: 6,
    period: 6,
    group: 11,
    phase: "Solid",
  },
  {
    number: 80,
    symbol: "Hg",
    name: "Mercury",
    atomic_mass: 200.592,
    category: "transition metal",
    shells: [2, 8, 18, 32, 18, 2],
    xpos: 12,
    ypos: 6,
    period: 6,
    group: 12,
    phase: "Liquid",
  },
  {
    number: 82,
    symbol: "Pb",
    name: "Lead",
    atomic_mass: 207.2,
    category: "post-transition metal",
    shells: [2, 8, 18, 32, 18, 4],
    xpos: 14,
    ypos: 6,
    period: 6,
    group: 14,
    phase: "Solid",
  },
  {
    number: 92,
    symbol: "U",
    name: "Uranium",
    atomic_mass: 238.029,
    category: "actinide",
    shells: [2, 8, 18, 32, 21, 9, 2],
    xpos: 6,
    ypos: 9,
    period: 7,
    group: null,
    phase: "Solid",
  },
];

export async function loadPeriodicTable(): Promise<PTElement[]> {
  // 1. Try cache
  if (typeof window !== "undefined") {
    try {
      const cached = window.localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as PTElement[];
        if (Array.isArray(parsed) && parsed.length > 100) return parsed;
      }
    } catch {
      /* ignore */
    }
  }

  // 2. Try network
  try {
    const res = await fetch(SOURCE_URL, { cache: "force-cache" });
    if (res.ok) {
      const json = (await res.json()) as { elements: PTElement[] };
      if (Array.isArray(json.elements) && json.elements.length > 100) {
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(json.elements));
        } catch {
          /* quota — ignore */
        }
        return json.elements;
      }
    }
  } catch {
    /* offline — ignore */
  }

  // 3. Fallback
  return FALLBACK;
}

// Map category -> Tailwind/CSS background classes (semantic-friendly).
// Categories from Bowserinator dataset: alkali metal, alkaline earth metal,
// transition metal, post-transition metal, metalloid, diatomic nonmetal,
// polyatomic nonmetal, noble gas, lanthanide, actinide, unknown.
export const CATEGORY_STYLE: Record<
  string,
  { bg: string; text: string; ring: string; label: string }
> = {
  "alkali metal": {
    bg: "bg-red-100 dark:bg-red-500/10",
    text: "text-red-900 dark:text-red-300",
    ring: "ring-red-300/50 dark:ring-red-500/20",
    label: "Kim loại kiềm",
  },
  "alkaline earth metal": {
    bg: "bg-orange-100 dark:bg-orange-500/10",
    text: "text-orange-900 dark:text-orange-300",
    ring: "ring-orange-300/50 dark:ring-orange-500/20",
    label: "Kim loại kiềm thổ",
  },
  "transition metal": {
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-900 dark:text-amber-300",
    ring: "ring-amber-300/50 dark:ring-amber-500/20",
    label: "Kim loại chuyển tiếp",
  },
  "post-transition metal": {
    bg: "bg-lime-100 dark:bg-lime-500/10",
    text: "text-lime-900 dark:text-lime-300",
    ring: "ring-lime-300/50 dark:ring-lime-500/20",
    label: "Kim loại yếu",
  },
  metalloid: {
    bg: "bg-emerald-100 dark:bg-emerald-500/10",
    text: "text-emerald-900 dark:text-emerald-300",
    ring: "ring-emerald-300/50 dark:ring-emerald-500/20",
    label: "Á kim",
  },
  "diatomic nonmetal": {
    bg: "bg-sky-100 dark:bg-sky-500/10",
    text: "text-sky-900 dark:text-sky-300",
    ring: "ring-sky-300/50 dark:ring-sky-500/20",
    label: "Phi kim hai nguyên tử",
  },
  "polyatomic nonmetal": {
    bg: "bg-cyan-100 dark:bg-cyan-500/10",
    text: "text-cyan-900 dark:text-cyan-300",
    ring: "ring-cyan-300/50 dark:ring-cyan-500/20",
    label: "Phi kim đa nguyên tử",
  },
  "noble gas": {
    bg: "bg-violet-100 dark:bg-violet-500/10",
    text: "text-violet-900 dark:text-violet-300",
    ring: "ring-violet-300/50 dark:ring-violet-500/20",
    label: "Khí hiếm",
  },
  lanthanide: {
    bg: "bg-pink-100 dark:bg-pink-500/10",
    text: "text-pink-900 dark:text-pink-300",
    ring: "ring-pink-300/50 dark:ring-pink-500/20",
    label: "Họ Lantan",
  },
  actinide: {
    bg: "bg-fuchsia-100 dark:bg-fuchsia-500/10",
    text: "text-fuchsia-900 dark:text-fuchsia-300",
    ring: "ring-fuchsia-300/50 dark:ring-fuchsia-500/20",
    label: "Họ Actini",
  },
};

export function categoryStyle(category: string) {
  const key = (category || "").toLowerCase();
  return (
    CATEGORY_STYLE[key] ?? {
      bg: "bg-muted",
      text: "text-foreground",
      ring: "ring-border",
      label: category || "Unknown",
    }
  );
}

export const SHELL_NAMES = ["K", "L", "M", "N", "O", "P", "Q", "R"];
