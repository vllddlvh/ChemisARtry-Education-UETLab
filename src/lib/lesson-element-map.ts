// src/lib/lesson-element-map.ts
// Map từ element symbol → data cần cho AtomViewer3D trong bài học
// Subset các nguyên tố hay dùng trong 22 bài học

export type LessonElement = {
  symbol: string;
  number: number;
  atomic_mass: number;
  shells: number[];
};

export const FALLBACK_ELEMENTS: Record<string, LessonElement> = {
  H:  { symbol: "H",  number: 1,  atomic_mass: 1.008,   shells: [1] },
  He: { symbol: "He", number: 2,  atomic_mass: 4.003,   shells: [2] },
  Li: { symbol: "Li", number: 3,  atomic_mass: 6.941,   shells: [2, 1] },
  Be: { symbol: "Be", number: 4,  atomic_mass: 9.012,   shells: [2, 2] },
  B:  { symbol: "B",  number: 5,  atomic_mass: 10.811,  shells: [2, 3] },
  C:  { symbol: "C",  number: 6,  atomic_mass: 12.011,  shells: [2, 4] },
  N:  { symbol: "N",  number: 7,  atomic_mass: 14.007,  shells: [2, 5] },
  O:  { symbol: "O",  number: 8,  atomic_mass: 15.999,  shells: [2, 6] },
  F:  { symbol: "F",  number: 9,  atomic_mass: 18.998,  shells: [2, 7] },
  Ne: { symbol: "Ne", number: 10, atomic_mass: 20.18,   shells: [2, 8] },
  Na: { symbol: "Na", number: 11, atomic_mass: 22.99,   shells: [2, 8, 1] },
  Mg: { symbol: "Mg", number: 12, atomic_mass: 24.305,  shells: [2, 8, 2] },
  Al: { symbol: "Al", number: 13, atomic_mass: 26.982,  shells: [2, 8, 3] },
  Si: { symbol: "Si", number: 14, atomic_mass: 28.086,  shells: [2, 8, 4] },
  P:  { symbol: "P",  number: 15, atomic_mass: 30.974,  shells: [2, 8, 5] },
  S:  { symbol: "S",  number: 16, atomic_mass: 32.06,   shells: [2, 8, 6] },
  Cl: { symbol: "Cl", number: 17, atomic_mass: 35.45,   shells: [2, 8, 7] },
  Ar: { symbol: "Ar", number: 18, atomic_mass: 39.948,  shells: [2, 8, 8] },
  K:  { symbol: "K",  number: 19, atomic_mass: 39.098,  shells: [2, 8, 8, 1] },
  Ca: { symbol: "Ca", number: 20, atomic_mass: 40.078,  shells: [2, 8, 8, 2] },
  Fe: { symbol: "Fe", number: 26, atomic_mass: 55.845,  shells: [2, 8, 14, 2] },
  Cu: { symbol: "Cu", number: 29, atomic_mass: 63.546,  shells: [2, 8, 18, 1] },
  Zn: { symbol: "Zn", number: 30, atomic_mass: 65.38,   shells: [2, 8, 18, 2] },
  Br: { symbol: "Br", number: 35, atomic_mass: 79.904,  shells: [2, 8, 18, 7] },
  Ag: { symbol: "Ag", number: 47, atomic_mass: 107.868, shells: [2, 8, 18, 18, 1] },
  I:  { symbol: "I",  number: 53, atomic_mass: 126.904, shells: [2, 8, 18, 18, 7] },
  Au: { symbol: "Au", number: 79, atomic_mass: 196.967, shells: [2, 8, 18, 32, 18, 1] },
};
