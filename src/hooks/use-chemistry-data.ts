import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Molecule, Reaction } from "@/lib/chemistry";
import {
  getChemistryApiConfig,
  fetchExternalChemistryData,
  mergeChemistryData,
  normalizeMolecule,
  normalizeReaction,
  type ChemistryData,
} from "@/lib/chemistry-api";

export function useChemistryData() {
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiConfigured = getChemistryApiConfig() !== null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [supabaseResult, apiResult] = await Promise.allSettled([
          fetchSupabaseChemistry(),
          fetchExternalChemistryData(),
        ]);

        if (cancelled) return;

        let supabaseData: ChemistryData | null = null;
        let apiData: ChemistryData | null = null;

        if (supabaseResult.status === "fulfilled") {
          supabaseData = supabaseResult.value;
        }
        if (apiResult.status === "fulfilled") {
          apiData = apiResult.value;
        } else if (import.meta.env.DEV) {
          console.warn("External chemistry API failed", apiResult.reason);
        }

        if (!apiConfigured) {
          apiData = null;
        }

        if (!supabaseData && !apiData) {
          throw new Error("Failed to load data");
        }

        const merged = mergeChemistryData(
          supabaseData ?? { molecules: [], reactions: [] },
          apiData ?? { molecules: [], reactions: [] },
        );

        setMolecules(merged.molecules);
        setReactions(merged.reactions);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load data";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { molecules, reactions, loading, error };
}

async function fetchSupabaseChemistry(): Promise<ChemistryData> {
  const [m, r] = await Promise.all([
    supabase.from("molecules").select("*").order("formula"),
    supabase.from("reactions").select("*"),
  ]);
  if (m.error) throw m.error;
  if (r.error) throw r.error;

  const molecules = ((m.data ?? []) as unknown as Molecule[]).map((item) =>
    normalizeMolecule(item, "supabase"),
  );
  const reactions = ((r.data ?? []) as unknown as Reaction[]).map((item) =>
    normalizeReaction(item, "supabase"),
  );

  return { molecules, reactions };
}
