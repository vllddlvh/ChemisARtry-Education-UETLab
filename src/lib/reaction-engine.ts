// Rule-based reaction engine.
// Two molecules trigger a reaction when their centers come within THRESHOLD
// and their formulas match a reaction rule's reactants (unordered, at least one of each).

import type { Reaction } from "@/lib/chemistry";

export const PROXIMITY_THRESHOLD = 1.8; // world units

export function findMatchingReaction(
  formulasPresent: string[],
  reactions: Reaction[]
): Reaction | null {
  for (const r of reactions) {
    const needed = [...r.reactants];
    const pool = [...formulasPresent];
    let ok = true;
    for (const n of needed) {
      const i = pool.indexOf(n);
      if (i === -1) { ok = false; break; }
      pool.splice(i, 1);
    }
    if (ok) return r;
  }
  return null;
}
