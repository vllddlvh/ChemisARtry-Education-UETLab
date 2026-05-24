// Hook to enrich a local molecule with PubChem data (MW, SMILES, description, etc.)
// Fetches lazily when a molecule is selected. Caches results in memory.
import { useCallback, useRef, useState } from "react";
import {
  searchPubChem,
  fetchCompoundDescription,
  type PubChemCompoundSummary,
  type PubChemDescription,
} from "@/lib/pubchem-api";

export type EnrichedData = {
  pubchem: PubChemCompoundSummary | null;
  description: PubChemDescription | null;
  loading: boolean;
};

/**
 * Enriches a molecule with PubChem data. Call `enrich(formula, name)` when a molecule is selected.
 * Results are cached in memory so repeated lookups are instant.
 */
export function usePubChemEnrichment() {
  const [data, setData] = useState<EnrichedData>({
    pubchem: null,
    description: null,
    loading: false,
  });
  const cacheRef = useRef<
    Map<string, { pubchem: PubChemCompoundSummary | null; description: PubChemDescription | null }>
  >(new Map());
  const currentKeyRef = useRef<string>("");

  const enrich = useCallback(async (formula: string, name: string) => {
    const key = `${formula}::${name}`.toLowerCase();
    currentKeyRef.current = key;

    // Check cache
    const cached = cacheRef.current.get(key);
    if (cached) {
      setData({ ...cached, loading: false });
      return;
    }

    setData({ pubchem: null, description: null, loading: true });

    try {
      // Search by name first (more specific), fallback to formula
      const result = await searchPubChem(name || formula, 1);
      if (currentKeyRef.current !== key) return; // stale

      const compound = result.compounds[0] ?? null;
      let desc: PubChemDescription | null = null;

      if (compound) {
        desc = await fetchCompoundDescription(compound.cid);
        if (currentKeyRef.current !== key) return; // stale
      }

      const entry = { pubchem: compound, description: desc };
      cacheRef.current.set(key, entry);
      setData({ ...entry, loading: false });
    } catch {
      if (currentKeyRef.current === key) {
        setData({ pubchem: null, description: null, loading: false });
      }
    }
  }, []);

  const clear = useCallback(() => {
    currentKeyRef.current = "";
    setData({ pubchem: null, description: null, loading: false });
  }, []);

  return { ...data, enrich, clear };
}
