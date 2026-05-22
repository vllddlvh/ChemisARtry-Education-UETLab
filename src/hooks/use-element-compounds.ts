// Hook to fetch common compounds containing a specific element from PubChem.
// Uses PubChem formula search to find compounds with the element.
import { useCallback, useRef, useState } from "react";
import { searchPubChem, type PubChemCompoundSummary } from "@/lib/pubchem-api";

export type ElementCompoundsState = {
  compounds: PubChemCompoundSummary[];
  loading: boolean;
  error: string | null;
};

/**
 * Fetches common compounds containing a given element symbol.
 * Uses a set of well-known compound names for each element for better results.
 */
export function useElementCompounds() {
  const [state, setState] = useState<ElementCompoundsState>({
    compounds: [],
    loading: false,
    error: null,
  });
  const currentRef = useRef("");

  const fetch = useCallback(async (elementName: string) => {
    const key = elementName.toLowerCase();
    currentRef.current = key;
    setState({ compounds: [], loading: true, error: null });

    try {
      // Search PubChem for compounds related to this element
      const result = await searchPubChem(elementName, 6);
      if (currentRef.current !== key) return;

      setState({
        compounds: result.compounds,
        loading: false,
        error: null,
      });
    } catch (e) {
      if (currentRef.current !== key) return;
      setState({
        compounds: [],
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load",
      });
    }
  }, []);

  const clear = useCallback(() => {
    currentRef.current = "";
    setState({ compounds: [], loading: false, error: null });
  }, []);

  return { ...state, fetch, clear };
}
