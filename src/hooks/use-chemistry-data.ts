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
import { BUILTIN_MOLECULES, BUILTIN_REACTIONS } from "@/lib/reaction-data";

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

        // Nếu cả Supabase lẫn API đều lỗi, vẫn tiếp tục với dữ liệu rỗng và
        // chỉ ghi nhận lỗi (để hiển thị nếu cần) — KHÔNG dừng lại, vì ta luôn
        // muốn nạp dữ liệu phản ứng tích hợp sẵn (built-in) ở bước sau.
        if (!supabaseData && !apiData) {
          if (import.meta.env.DEV) {
            console.warn(
              "Không tải được hoá chất từ Supabase/API — dùng dữ liệu tích hợp sẵn.",
              supabaseResult.status === "rejected" ? supabaseResult.reason : null,
            );
          }
          setError("Không kết nối được kho dữ liệu trực tuyến — đang dùng dữ liệu tích hợp sẵn.");
        }

        const merged = mergeChemistryData(
          supabaseData ?? { molecules: [], reactions: [] },
          apiData ?? { molecules: [], reactions: [] },
        );

        // Trộn thêm dữ liệu phản ứng tích hợp sẵn (built-in) để phòng thí
        // nghiệm luôn có phản ứng để tương tác, kể cả khi DB trống/lỗi hoặc khi
        // người dùng ghép các nguyên tử đơn lẻ.
        const withBuiltins = mergeWithBuiltins(merged);

        setMolecules(withBuiltins.molecules);
        setReactions(withBuiltins.reactions);
      } catch (e: unknown) {
        if (cancelled) return;
        // Trường hợp xấu nhất: vẫn nạp dữ liệu tích hợp sẵn để lab dùng được.
        const fallback = mergeWithBuiltins({ molecules: [], reactions: [] });
        setMolecules(fallback.molecules);
        setReactions(fallback.reactions);
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

// Trộn dữ liệu built-in vào dữ liệu đã merge. Tránh trùng lặp:
// - Molecule trùng theo "formula" (ưu tiên dữ liệu sẵn có từ Supabase/API).
// - Reaction trùng theo chữ ký reactants→products (không phân biệt thứ tự).
function reactionSignature(r: Reaction): string {
  const left = [...r.reactants].sort().join("+");
  const right = [...r.products].sort().join("+");
  return `${left}=>${right}`;
}

function mergeWithBuiltins(base: ChemistryData): ChemistryData {
  const moleculeByFormula = new Map<string, Molecule>();
  for (const m of base.molecules) moleculeByFormula.set(m.formula, m);
  for (const m of BUILTIN_MOLECULES) {
    const normalized = normalizeMolecule(m, "api");
    if (!moleculeByFormula.has(normalized.formula)) {
      moleculeByFormula.set(normalized.formula, normalized);
    }
  }

  const reactionBySignature = new Map<string, Reaction>();
  for (const r of base.reactions) reactionBySignature.set(reactionSignature(r), r);
  for (const r of BUILTIN_REACTIONS) {
    const normalized = normalizeReaction(r, "api");
    const sig = reactionSignature(normalized);
    if (!reactionBySignature.has(sig)) {
      reactionBySignature.set(sig, normalized);
    }
  }

  const molecules = Array.from(moleculeByFormula.values()).sort((a, b) =>
    a.formula.localeCompare(b.formula, "en", { numeric: true, sensitivity: "base" }),
  );
  const reactions = Array.from(reactionBySignature.values()).sort((a, b) =>
    a.equation.localeCompare(b.equation, "en", { numeric: true, sensitivity: "base" }),
  );

  return { molecules, reactions };
}
