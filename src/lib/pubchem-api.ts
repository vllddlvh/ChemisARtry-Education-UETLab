// PubChem PUG-REST adapter.
// Free API, no key required. Docs: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
// We use:
//   1. Compound search by name/formula → CID
//   2. Property lookup (MW, IUPAC name, formula, InChI, etc.)
//   3. 3D conformer in JSON format → atoms + bonds for our Molecule type

import type { Atom, Bond, Molecule } from "@/lib/chemistry";
import { normalizeFormula } from "@/lib/chemistry-api";

const BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const VIEW_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";
const TIMEOUT_MS = 12000;

// ---------- Types ----------

export type PubChemCompoundSummary = {
  cid: number;
  iupacName: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSmiles: string;
  inchi: string;
  charge: number;
  complexity: number;
  hBondDonorCount: number;
  hBondAcceptorCount: number;
};

export type PubChemSearchResult = {
  compounds: PubChemCompoundSummary[];
  total: number;
};

export type PubChemMolecule3D = Molecule & {
  pubchemCid: number;
  iupacName: string;
  molecularWeight: number;
  smiles: string;
};

export type PubChemDescription = {
  title: string;
  description: string;
  source: string;
};

// ---------- Internal helpers ----------

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      if (res.status === 404) throw new PubChemNotFoundError(url);
      throw new Error(`PubChem ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export class PubChemNotFoundError extends Error {
  constructor(url: string) {
    super(`Not found: ${url}`);
    this.name = "PubChemNotFoundError";
  }
}

// ---------- Search ----------

/**
 * Search PubChem by name or formula. Returns up to `limit` compound summaries.
 */
export async function searchPubChem(query: string, limit = 8): Promise<PubChemSearchResult> {
  const q = query.trim();
  if (!q) return { compounds: [], total: 0 };

  // Try name search first
  const url = `${BASE}/compound/name/${encodeURIComponent(q)}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES,InChI,Charge,Complexity,HBondDonorCount,HBondAcceptorCount/JSON`;

  try {
    const data = await fetchJson<{
      PropertyTable: { Properties: RawProperty[] };
    }>(url);
    const props = data.PropertyTable.Properties.slice(0, limit);
    return {
      compounds: props.map(mapProperty),
      total: data.PropertyTable.Properties.length,
    };
  } catch (e) {
    if (e instanceof PubChemNotFoundError) {
      // Fallback: try formula search
      return searchByFormula(q, limit);
    }
    throw e;
  }
}

async function searchByFormula(formula: string, limit: number): Promise<PubChemSearchResult> {
  const url = `${BASE}/compound/formula/${encodeURIComponent(formula)}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES,InChI,Charge,Complexity,HBondDonorCount,HBondAcceptorCount/JSON`;
  try {
    const data = await fetchJson<{
      PropertyTable: { Properties: RawProperty[] };
    }>(url);
    const props = data.PropertyTable.Properties.slice(0, limit);
    return {
      compounds: props.map(mapProperty),
      total: data.PropertyTable.Properties.length,
    };
  } catch (e) {
    if (e instanceof PubChemNotFoundError) {
      return { compounds: [], total: 0 };
    }
    throw e;
  }
}

type RawProperty = {
  CID: number;
  IUPACName?: string;
  MolecularFormula?: string;
  MolecularWeight?: number;
  CanonicalSMILES?: string;
  InChI?: string;
  Charge?: number;
  Complexity?: number;
  HBondDonorCount?: number;
  HBondAcceptorCount?: number;
};

function mapProperty(p: RawProperty): PubChemCompoundSummary {
  return {
    cid: p.CID,
    iupacName: p.IUPACName ?? "",
    molecularFormula: p.MolecularFormula ?? "",
    molecularWeight: Number(p.MolecularWeight) || 0,
    canonicalSmiles: p.CanonicalSMILES ?? "",
    inchi: p.InChI ?? "",
    charge: Number(p.Charge) || 0,
    complexity: Number(p.Complexity) || 0,
    hBondDonorCount: Number(p.HBondDonorCount) || 0,
    hBondAcceptorCount: Number(p.HBondAcceptorCount) || 0,
  };
}

// ---------- 3D Conformer ----------

/**
 * Fetch 3D conformer for a CID and convert to our Molecule type.
 * PubChem returns JSON with atom coordinates and bond connectivity.
 */
export async function fetchMolecule3D(cid: number): Promise<PubChemMolecule3D | null> {
  // Get properties first
  const propUrl = `${BASE}/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`;
  const conformerUrl = `${BASE}/compound/cid/${cid}/JSON?record_type=3d`;

  const [propData, conformerData] = await Promise.allSettled([
    fetchJson<{ PropertyTable: { Properties: RawProperty[] } }>(propUrl),
    fetchJson<PubChemRecordResponse>(conformerUrl),
  ]);

  if (conformerData.status === "rejected") {
    // No 3D conformer available — try 2D as fallback
    return fetch2DFallback(cid, propData);
  }

  const record = conformerData.value;
  const conformer = record?.PC_Compounds?.[0];
  if (!conformer) return null;

  const atoms = parseConformerAtoms(conformer);
  const bonds = parseConformerBonds(conformer);

  if (atoms.length === 0) return null;

  const prop = propData.status === "fulfilled" ? propData.value.PropertyTable.Properties[0] : null;

  const formula = normalizeFormula(prop?.MolecularFormula ?? `CID${cid}`);
  const name = prop?.IUPACName ?? formula;

  // Center the molecule
  centerAtoms(atoms);
  // Scale to reasonable size for Three.js scene
  scaleAtoms(atoms, 2.5);

  return {
    id: `pubchem-${cid}`,
    formula,
    name,
    description: `PubChem CID ${cid}. ${prop?.IUPACName ?? ""}`,
    category: "pubchem",
    atoms,
    bonds,
    pubchemCid: cid,
    iupacName: prop?.IUPACName ?? "",
    molecularWeight: prop?.MolecularWeight ?? 0,
    smiles: prop?.CanonicalSMILES ?? "",
  };
}

async function fetch2DFallback(
  cid: number,
  propResult: PromiseSettledResult<{ PropertyTable: { Properties: RawProperty[] } }>,
): Promise<PubChemMolecule3D | null> {
  try {
    const url2d = `${BASE}/compound/cid/${cid}/JSON`;
    const data = await fetchJson<PubChemRecordResponse>(url2d);
    const conformer = data?.PC_Compounds?.[0];
    if (!conformer) return null;

    const atoms = parseConformerAtoms(conformer);
    const bonds = parseConformerBonds(conformer);
    if (atoms.length === 0) return null;

    const prop =
      propResult.status === "fulfilled" ? propResult.value.PropertyTable.Properties[0] : null;

    const formula = normalizeFormula(prop?.MolecularFormula ?? `CID${cid}`);
    const name = prop?.IUPACName ?? formula;

    centerAtoms(atoms);
    scaleAtoms(atoms, 2.5);

    return {
      id: `pubchem-${cid}`,
      formula,
      name,
      description: `PubChem CID ${cid}. ${prop?.IUPACName ?? ""}`,
      category: "pubchem",
      atoms,
      bonds,
      pubchemCid: cid,
      iupacName: prop?.IUPACName ?? "",
      molecularWeight: prop?.MolecularWeight ?? 0,
      smiles: prop?.CanonicalSMILES ?? "",
    };
  } catch {
    return null;
  }
}

// ---------- Description (PUG-View) ----------

/**
 * Fetch textual description for a compound from PUG-View.
 */
export async function fetchCompoundDescription(cid: number): Promise<PubChemDescription | null> {
  const url = `${VIEW_BASE}/data/compound/${cid}/JSON?heading=Record+Description`;
  try {
    const data = await fetchJson<PugViewResponse>(url);
    const sections = data?.Record?.Section ?? [];
    for (const sec of sections) {
      const infos = sec?.Section ?? [];
      for (const info of infos) {
        const strings = info?.Information ?? [];
        for (const s of strings) {
          if (s.Value?.StringWithMarkup?.[0]?.String) {
            return {
              title: info.TOCHeading ?? "Description",
              description: s.Value.StringWithMarkup[0].String,
              source: s.Reference?.[0] ?? "PubChem",
            };
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ---------- PubChem JSON conformer parsing ----------

type PubChemRecordResponse = {
  PC_Compounds?: PubChemConformer[];
};

type PubChemConformer = {
  atoms?: {
    aid?: number[];
    element?: number[];
  };
  bonds?: {
    aid1?: number[];
    aid2?: number[];
    order?: number[];
  };
  coords?: Array<{
    conformers?: Array<{
      x?: number[];
      y?: number[];
      z?: number[];
    }>;
  }>;
};

// Atomic number -> element symbol
const ATOMIC_SYMBOLS: Record<number, string> = {
  1: "H",
  2: "He",
  3: "Li",
  4: "Be",
  5: "B",
  6: "C",
  7: "N",
  8: "O",
  9: "F",
  10: "Ne",
  11: "Na",
  12: "Mg",
  13: "Al",
  14: "Si",
  15: "P",
  16: "S",
  17: "Cl",
  18: "Ar",
  19: "K",
  20: "Ca",
  24: "Cr",
  25: "Mn",
  26: "Fe",
  27: "Co",
  28: "Ni",
  29: "Cu",
  30: "Zn",
  33: "As",
  34: "Se",
  35: "Br",
  36: "Kr",
  47: "Ag",
  50: "Sn",
  53: "I",
  54: "Xe",
  56: "Ba",
  78: "Pt",
  79: "Au",
  80: "Hg",
  82: "Pb",
};

function getSymbol(atomicNumber: number): string {
  return ATOMIC_SYMBOLS[atomicNumber] ?? `E${atomicNumber}`;
}

function parseConformerAtoms(c: PubChemConformer): Atom[] {
  const elements = c.atoms?.element ?? [];
  const coords = c.coords?.[0]?.conformers?.[0];
  const xs = coords?.x ?? [];
  const ys = coords?.y ?? [];
  const zs = coords?.z ?? [];

  const atoms: Atom[] = [];
  for (let i = 0; i < elements.length; i++) {
    atoms.push({
      el: getSymbol(elements[i]),
      x: xs[i] ?? 0,
      y: ys[i] ?? 0,
      z: zs[i] ?? 0,
    });
  }
  return atoms;
}

function parseConformerBonds(c: PubChemConformer): Bond[] {
  const aid1 = c.bonds?.aid1 ?? [];
  const aid2 = c.bonds?.aid2 ?? [];
  const orders = c.bonds?.order ?? [];

  // PubChem uses 1-based atom IDs
  const bonds: Bond[] = [];
  for (let i = 0; i < aid1.length; i++) {
    bonds.push({
      a: aid1[i] - 1,
      b: aid2[i] - 1,
      order: orders[i] ?? 1,
    });
  }
  return bonds;
}

function centerAtoms(atoms: Atom[]): void {
  if (atoms.length === 0) return;
  let cx = 0,
    cy = 0,
    cz = 0;
  for (const a of atoms) {
    cx += a.x;
    cy += a.y;
    cz += a.z;
  }
  cx /= atoms.length;
  cy /= atoms.length;
  cz /= atoms.length;
  for (const a of atoms) {
    a.x -= cx;
    a.y -= cy;
    a.z -= cz;
  }
}

function scaleAtoms(atoms: Atom[], targetSize: number): void {
  if (atoms.length === 0) return;
  let maxDist = 0;
  for (const a of atoms) {
    const d = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    if (d > maxDist) maxDist = d;
  }
  if (maxDist < 0.01) return;
  const scale = targetSize / maxDist;
  for (const a of atoms) {
    a.x *= scale;
    a.y *= scale;
    a.z *= scale;
  }
}

// ---------- PUG-View types ----------

type PugViewResponse = {
  Record?: {
    Section?: PugViewSection[];
  };
};

type PugViewSection = {
  TOCHeading?: string;
  Section?: Array<{
    TOCHeading?: string;
    Information?: Array<{
      Value?: {
        StringWithMarkup?: Array<{ String?: string }>;
      };
      Reference?: string[];
    }>;
  }>;
};
