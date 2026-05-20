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
  H:  { color: "#ffffff", radius: 0.28, name: "Hydrogen" },
  C:  { color: "#222222", radius: 0.38, name: "Carbon" },
  N:  { color: "#3050f8", radius: 0.38, name: "Nitrogen" },
  O:  { color: "#ff3b3b", radius: 0.38, name: "Oxygen" },
  F:  { color: "#90e050", radius: 0.36, name: "Fluorine" },
  Na: { color: "#ab5cf2", radius: 0.5,  name: "Sodium" },
  Cl: { color: "#1fe01f", radius: 0.44, name: "Chlorine" },
  S:  { color: "#ffd23b", radius: 0.42, name: "Sulfur" },
  P:  { color: "#ff8000", radius: 0.42, name: "Phosphorus" },
};

export function elementInfo(el: string) {
  return ELEMENTS[el] ?? { color: "#cccccc", radius: 0.35, name: el };
}
