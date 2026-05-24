import type { Atom, Bond, Molecule, Reaction } from "@/lib/chemistry";

export type ChemistryData = { molecules: Molecule[]; reactions: Reaction[] };

type ApiConfig = {
  baseUrl: string;
  moleculesPath: string;
  reactionsPath: string;
  authHeader: string;
  authToken?: string;
};

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MOLECULES_PATH = "/molecules";
const DEFAULT_REACTIONS_PATH = "/reactions";

function readEnv(key: string): string | undefined {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return metaEnv?.[key] ?? (process.env as Record<string, string> | undefined)?.[key];
}

export function getChemistryApiConfig(): ApiConfig | null {
  const baseUrl = readEnv("VITE_CHEM_API_BASE_URL")?.trim();
  if (!baseUrl) return null;
  return {
    baseUrl,
    moleculesPath: readEnv("VITE_CHEM_API_MOLECULES_PATH")?.trim() || DEFAULT_MOLECULES_PATH,
    reactionsPath: readEnv("VITE_CHEM_API_REACTIONS_PATH")?.trim() || DEFAULT_REACTIONS_PATH,
    authHeader: readEnv("VITE_CHEM_API_AUTH_HEADER")?.trim() || "Authorization",
    authToken: readEnv("VITE_CHEM_API_AUTH_TOKEN")?.trim(),
  };
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function fetchJson(
  url: string,
  headers: Record<string, string>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`API ${res.status} ${res.statusText}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function unwrapArray(payload: unknown, fallbackKey?: string): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const keys = [fallbackKey, "data", "results", "items"].filter(Boolean) as string[];
    for (const key of keys) {
      if (Array.isArray(obj[key])) return obj[key] as unknown[];
    }
  }
  return [];
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toString(value: unknown): string | null {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function readString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = toString(obj[key]);
    if (v) return v;
  }
  return null;
}

function readPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function readArrayField(obj: Record<string, unknown>, paths: string[]): unknown[] {
  for (const path of paths) {
    const value = path.includes(".") ? readPath(obj, path) : obj[path];
    if (Array.isArray(value)) return value;
  }
  return [];
}

const SUBSCRIPT_MAP: Record<string, string> = {
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
};

export function normalizeFormula(raw: string): string {
  const replaced = raw.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d) => SUBSCRIPT_MAP[d] ?? d);
  const noState = replaced.replace(/\((aq|s|l|g)\)$/i, "");
  return noState.replace(/\s+/g, "").trim();
}

function normalizeCategory(raw: string | null): string {
  const value = (raw ?? "common").trim().toLowerCase();
  return value || "common";
}

export function normalizeMolecule(input: Molecule, source: "supabase" | "api"): Molecule {
  return {
    ...input,
    id: input.id || makeStableId(source, input.formula, input.name),
    formula: normalizeFormula(input.formula),
    name: input.name?.trim() || normalizeFormula(input.formula),
    description: input.description?.trim() || "",
    category: normalizeCategory(input.category),
  };
}

export function normalizeReaction(input: Reaction, source: "supabase" | "api"): Reaction {
  const reactants = normalizeFormulaList(input.reactants);
  const products = normalizeFormulaList(input.products);
  const equation = input.equation?.trim() || buildEquation(reactants, products);
  return {
    ...input,
    id: input.id || makeStableId(source, equation || reactants.join("+") + products.join("+")),
    reactants,
    products,
    equation,
    description: input.description?.trim() || "",
    energy_kj: Number.isFinite(input.energy_kj ?? NaN) ? input.energy_kj : null,
  };
}

function normalizeFormulaList(list: string[]): string[] {
  return list.map((f) => normalizeFormula(f)).filter(Boolean);
}

function buildEquation(reactants: string[], products: string[]): string {
  const left = reactants.join(" + ");
  const right = products.join(" + ");
  return left && right ? `${left} -> ${right}` : left || right;
}

function makeStableId(source: string, ...parts: string[]): string {
  const seed = parts.filter(Boolean).join("-") || "item";
  const slug = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${source}-${slug || "item"}`;
}

function parseAtom(raw: unknown): Atom | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const el = readString(obj, ["el", "element", "symbol", "atomicSymbol"]);
  if (!el) return null;
  const coords = readArrayField(obj, ["coords", "position", "xyz", "vector"]);
  const x = toNumber(obj.x) ?? toNumber(coords[0]);
  const y = toNumber(obj.y) ?? toNumber(coords[1]);
  const z = toNumber(obj.z) ?? toNumber(coords[2]);
  if (x === null || y === null || z === null) return null;
  return { el, x, y, z };
}

function parseAtoms(raw: Record<string, unknown>): Atom[] {
  const atomsRaw = readArrayField(raw, [
    "atoms",
    "structure.atoms",
    "geometry.atoms",
    "model.atoms",
  ]);
  return atomsRaw.map(parseAtom).filter(Boolean) as Atom[];
}

function parseBond(raw: unknown): Bond | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const a =
    toNumber(obj.a) ??
    toNumber(obj.from) ??
    toNumber(obj.source) ??
    toNumber(obj.start) ??
    toNumber(obj.i) ??
    toNumber(obj.atom1);
  const b =
    toNumber(obj.b) ??
    toNumber(obj.to) ??
    toNumber(obj.target) ??
    toNumber(obj.end) ??
    toNumber(obj.j) ??
    toNumber(obj.atom2);
  if (a === null || b === null) return null;
  const order = toNumber(obj.order) ?? toNumber(obj.bondOrder) ?? 1;
  return { a: Math.floor(a), b: Math.floor(b), order: Math.max(1, Math.round(order)) };
}

function parseBonds(raw: Record<string, unknown>, atomCount: number): Bond[] {
  const bondsRaw = readArrayField(raw, ["bonds", "structure.bonds", "geometry.bonds", "links"]);
  return bondsRaw
    .map(parseBond)
    .filter((b): b is Bond => Boolean(b))
    .filter((b) => b.a >= 0 && b.b >= 0 && b.a < atomCount && b.b < atomCount);
}

function parseFormulaList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return normalizeFormulaList(value.map((v) => String(v)));
  }
  if (typeof value === "string") {
    return normalizeFormulaList(
      value
        .split("+")
        .map((s) => s.replace(/^\s*\d+\s*/, "").trim())
        .filter(Boolean),
    );
  }
  return [];
}

function parseEquationToLists(equation: string): { reactants: string[]; products: string[] } {
  const parts = equation.split(/->|→/);
  if (parts.length < 2) return { reactants: [], products: [] };
  return {
    reactants: parseFormulaList(parts[0] ?? ""),
    products: parseFormulaList(parts[1] ?? ""),
  };
}

function coerceMolecule(raw: unknown, source: "api", fallbackIndex: number): Molecule | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const formula = readString(obj, ["formula", "molecular_formula", "mf", "chemicalFormula"]);
  if (!formula) return null;
  const name = readString(obj, ["name", "common_name", "title", "label"]) ?? formula;
  const description = readString(obj, ["description", "summary", "desc", "notes"]) ?? "";
  const category = readString(obj, ["category", "type", "class", "group"]) ?? "common";
  const atoms = parseAtoms(obj);
  if (atoms.length === 0) return null;
  const bonds = parseBonds(obj, atoms.length);
  const id =
    readString(obj, ["id", "_id", "uuid", "uid"]) ??
    makeStableId(source, formula, name, String(fallbackIndex));
  return normalizeMolecule({ id, formula, name, description, category, atoms, bonds }, source);
}

function coerceReaction(raw: unknown, source: "api", fallbackIndex: number): Reaction | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const equation = readString(obj, ["equation", "balanced", "reaction", "label"]) ?? "";
  let reactants = parseFormulaList(obj.reactants ?? obj.reactant ?? obj.inputs ?? obj.left);
  let products = parseFormulaList(obj.products ?? obj.product ?? obj.outputs ?? obj.right);
  if (reactants.length === 0 || products.length === 0) {
    const parsed = parseEquationToLists(equation);
    reactants = reactants.length ? reactants : parsed.reactants;
    products = products.length ? products : parsed.products;
  }
  if (reactants.length === 0 || products.length === 0) return null;
  const description = readString(obj, ["description", "summary", "desc", "notes"]) ?? "";
  const energy = toNumber(obj.energy_kj) ?? toNumber(obj.energyKj) ?? toNumber(obj.deltaH) ?? null;
  const id =
    readString(obj, ["id", "_id", "uuid", "uid"]) ??
    makeStableId(
      source,
      equation || reactants.join("+") + products.join("+"),
      String(fallbackIndex),
    );
  return normalizeReaction(
    {
      id,
      reactants,
      products,
      equation: equation || buildEquation(reactants, products),
      description,
      energy_kj: energy,
    },
    source,
  );
}

export async function fetchExternalChemistryData(): Promise<ChemistryData> {
  const config = getChemistryApiConfig();
  if (!config) return { molecules: [], reactions: [] };

  const headers: Record<string, string> = { Accept: "application/json" };
  if (config.authToken) {
    headers[config.authHeader] =
      config.authHeader.toLowerCase() === "authorization"
        ? `Bearer ${config.authToken}`
        : config.authToken;
  }

  const [moleculesPayload, reactionsPayload] = await Promise.all([
    fetchJson(joinUrl(config.baseUrl, config.moleculesPath), headers),
    fetchJson(joinUrl(config.baseUrl, config.reactionsPath), headers),
  ]);

  const moleculesRaw = unwrapArray(moleculesPayload, "molecules");
  const reactionsRaw = unwrapArray(reactionsPayload, "reactions");

  const molecules = moleculesRaw
    .map((item, index) => coerceMolecule(item, "api", index))
    .filter(Boolean) as Molecule[];
  const reactions = reactionsRaw
    .map((item, index) => coerceReaction(item, "api", index))
    .filter(Boolean) as Reaction[];

  return { molecules, reactions };
}

export function mergeChemistryData(
  primary: ChemistryData,
  secondary: ChemistryData,
): ChemistryData {
  const moleculeMap = new Map<string, Molecule>();
  const reactionMap = new Map<string, Reaction>();

  for (const m of [...primary.molecules, ...secondary.molecules]) {
    if (!moleculeMap.has(m.id)) moleculeMap.set(m.id, m);
  }
  for (const r of [...primary.reactions, ...secondary.reactions]) {
    if (!reactionMap.has(r.id)) reactionMap.set(r.id, r);
  }

  const molecules = Array.from(moleculeMap.values()).sort((a, b) =>
    a.formula.localeCompare(b.formula, "en", { numeric: true, sensitivity: "base" }),
  );
  const reactions = Array.from(reactionMap.values()).sort((a, b) =>
    a.equation.localeCompare(b.equation, "en", { numeric: true, sensitivity: "base" }),
  );

  return { molecules, reactions };
}
