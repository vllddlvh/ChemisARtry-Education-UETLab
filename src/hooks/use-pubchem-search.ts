// React hook for PubChem search with debounce and loading state.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchPubChem,
  fetchMolecule3D,
  fetchCompoundDescription,
  type PubChemCompoundSummary,
  type PubChemMolecule3D,
  type PubChemDescription,
} from "@/lib/pubchem-api";

export type PubChemSearchState = {
  query: string;
  results: PubChemCompoundSummary[];
  total: number;
  loading: boolean;
  error: string | null;
};

/**
 * Debounced PubChem search hook.
 * Returns search state + setQuery function.
 */
export function usePubChemSearch(debounceMs = 400) {
  const [state, setState] = useState<PubChemSearchState>({
    query: "",
    results: [],
    total: 0,
    loading: false,
    error: null,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const setQuery = useCallback((q: string) => {
    setState((s) => ({ ...s, query: q }));
  }, []);

  useEffect(() => {
    const q = state.query.trim();
    if (!q || q.length < 2) {
      setState((s) => ({ ...s, results: [], total: 0, loading: false, error: null }));
      return;
    }

    // Debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current = true; // cancel previous in-flight

    setState((s) => ({ ...s, loading: true, error: null }));

    timerRef.current = setTimeout(async () => {
      abortRef.current = false;
      try {
        const result = await searchPubChem(q);
        if (abortRef.current) return;
        setState((s) => ({
          ...s,
          results: result.compounds,
          total: result.total,
          loading: false,
        }));
      } catch (e) {
        if (abortRef.current) return;
        setState((s) => ({
          ...s,
          results: [],
          total: 0,
          loading: false,
          error: e instanceof Error ? e.message : "Search failed",
        }));
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current = true;
    };
  }, [state.query, debounceMs]);

  return { ...state, setQuery };
}

/**
 * Hook to fetch a full 3D molecule from PubChem by CID.
 * Call `load(cid)` to trigger.
 */
export function usePubChemMolecule() {
  const [molecule, setMolecule] = useState<PubChemMolecule3D | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (cid: number) => {
    setLoading(true);
    setError(null);
    setMolecule(null);
    try {
      const mol = await fetchMolecule3D(cid);
      if (!mol) {
        setError("No 3D structure available for this compound.");
      } else {
        setMolecule(mol);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load molecule");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMolecule(null);
    setError(null);
    setLoading(false);
  }, []);

  return { molecule, loading, error, load, clear };
}

/**
 * Hook to fetch compound description from PUG-View.
 */
export function usePubChemDescription() {
  const [description, setDescription] = useState<PubChemDescription | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (cid: number) => {
    setLoading(true);
    setDescription(null);
    try {
      const desc = await fetchCompoundDescription(cid);
      setDescription(desc);
    } catch {
      // best-effort
    } finally {
      setLoading(false);
    }
  }, []);

  return { description, loading, load };
}
