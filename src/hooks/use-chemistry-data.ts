import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Molecule, Reaction } from "@/lib/chemistry";

export function useChemistryData() {
  const [molecules, setMolecules] = useState<Molecule[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, r] = await Promise.all([
          supabase.from("molecules").select("*").order("formula"),
          supabase.from("reactions").select("*"),
        ]);
        if (cancelled) return;
        if (m.error) throw m.error;
        if (r.error) throw r.error;
        setMolecules((m.data ?? []) as unknown as Molecule[]);
        setReactions((r.data ?? []) as unknown as Reaction[]);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load data";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { molecules, reactions, loading, error };
}
