// Chemistry data types + CPK colors + element metadata.
// CPK coloring standard: https://en.wikipedia.org/wiki/CPK_coloring

export type Atom = { el: string; x: number; y: number; z: number };
export type Bond = { a: number; b: number; order: number };

export type Molecule = {
  id: string;
  formula: string;
  name: string;
  description: string;
  category: string;
  atoms: Atom[];
  bonds: Bond[];
};

export type Reaction = {
  id: string;
  reactants: string[];
  products: string[];
  equation: string;
  description: string;
  energy_kj: number | null;
};

// CPK colors + van der Waals radii (scaled for ball-and-stick).
export const ELEMENTS: Record<string, { color: string; radius: number; name: string }> = {
  H: { color: "#ffffff", radius: 0.28, name: "Hydrogen" },
  He: { color: "#d9ffff", radius: 0.32, name: "Helium" },
  Li: { color: "#cc80ff", radius: 0.46, name: "Lithium" },
  Be: { color: "#c2ff00", radius: 0.42, name: "Beryllium" },
  B: { color: "#ffb5b5", radius: 0.4, name: "Boron" },
  C: { color: "#222222", radius: 0.38, name: "Carbon" },
  N: { color: "#3050f8", radius: 0.38, name: "Nitrogen" },
  O: { color: "#ff3b3b", radius: 0.38, name: "Oxygen" },
  F: { color: "#90e050", radius: 0.36, name: "Fluorine" },
  Ne: { color: "#b3e3f5", radius: 0.36, name: "Neon" },
  Na: { color: "#ab5cf2", radius: 0.5, name: "Sodium" },
  Mg: { color: "#8aff00", radius: 0.46, name: "Magnesium" },
  Al: { color: "#bfa6a6", radius: 0.44, name: "Aluminium" },
  Si: { color: "#f0c8a0", radius: 0.44, name: "Silicon" },
  P: { color: "#ff8000", radius: 0.42, name: "Phosphorus" },
  S: { color: "#ffd23b", radius: 0.42, name: "Sulfur" },
  Cl: { color: "#1fe01f", radius: 0.44, name: "Chlorine" },
  Ar: { color: "#80d1e3", radius: 0.4, name: "Argon" },
  K: { color: "#8f40d4", radius: 0.55, name: "Potassium" },
  Ca: { color: "#3dff00", radius: 0.52, name: "Calcium" },
  Fe: { color: "#e06633", radius: 0.48, name: "Iron" },
  Cu: { color: "#c88033", radius: 0.46, name: "Copper" },
  Zn: { color: "#7d80b0", radius: 0.46, name: "Zinc" },
  Br: { color: "#a62929", radius: 0.48, name: "Bromine" },
  Ag: { color: "#c0c0c0", radius: 0.5, name: "Silver" },
  I: { color: "#940094", radius: 0.52, name: "Iodine" },
  Au: { color: "#ffd123", radius: 0.5, name: "Gold" },
  Hg: { color: "#b8b8d0", radius: 0.5, name: "Mercury" },
};

export function elementInfo(el: string) {
  return ELEMENTS[el] ?? { color: "#cccccc", radius: 0.35, name: el };
}
