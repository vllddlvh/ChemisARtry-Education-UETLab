// PubChem search panel — search any compound, preview 3D, and spawn into AR.
// Used in ControlPanel sidebar (compact mode) and standalone.
import { useRef, useState } from "react";
import {
  usePubChemSearch,
  usePubChemMolecule,
  usePubChemDescription,
  usePubChemCompoundAutocomplete,
} from "@/hooks/use-pubchem-search";
import type { Molecule } from "@/lib/chemistry";
import type { PubChemCompoundSummary } from "@/lib/pubchem-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MoleculePreview from "@/components/MoleculePreview";
import { Search, Loader2, Atom, ExternalLink, Sparkles, FlaskConical } from "lucide-react";

type Props = {
  /** Called when user wants to spawn the loaded molecule into the AR scene */
  onSpawn?: (molecule: Molecule) => void;
  /** Called when user wants to add molecule to local library */
  onAddToLibrary?: (molecule: Molecule) => void;
  /** Compact mode for sidebar usage */
  compact?: boolean;
};

export default function PubChemSearch({ onSpawn, onAddToLibrary, compact = false }: Props) {
  const search = usePubChemSearch();
  const autocomplete = usePubChemCompoundAutocomplete();
  const mol3d = usePubChemMolecule();
  const desc = usePubChemDescription();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState<PubChemCompoundSummary | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSelect(compound: PubChemCompoundSummary) {
    setSelectedCompound(compound);
    setDetailOpen(true);
    mol3d.load(compound.cid);
    desc.load(compound.cid);
  }

  function handleSpawn() {
    if (mol3d.molecule && onSpawn) {
      onSpawn(mol3d.molecule);
      setDetailOpen(false);
    }
  }

  function handleAddToLibrary() {
    if (mol3d.molecule && onAddToLibrary) {
      onAddToLibrary(mol3d.molecule);
    }
  }

  function handleChooseSuggestion(term: string) {
    search.setQuery(term);
    autocomplete.setQuery(term);
    inputRef.current?.blur();
    setInputFocused(false);
  }

  const showAutocomplete =
    inputFocused &&
    search.query.trim().length >= 3 &&
    autocomplete.terms.length > 0 &&
    !autocomplete.error;

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search.query}
          onChange={(e) => {
            const next = e.target.value;
            search.setQuery(next);
            autocomplete.setQuery(next);
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Tìm kiếm compound (vd: caffeine, glucose)..."
          className={`pl-9 ${compact ? "h-9 text-sm rounded-xl" : "rounded-full"}`}
        />
        {search.loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}

        {showAutocomplete && (
          <div
            className={`absolute left-0 right-0 top-full mt-2 z-30 overflow-hidden rounded-2xl border border-border/60 bg-popover/95 shadow-2xl backdrop-blur-xl ${compact ? "max-h-[220px]" : "max-h-[280px]"
              }`}
          >
            <div className="flex items-center justify-between px-3 pt-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Compound suggestions</span>
              <span>{autocomplete.total} gợi ý</span>
            </div>
            <div className="max-h-[240px] overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {autocomplete.terms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleChooseSuggestion(term)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary/10"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    C
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-semibold">{search.query}</span>
                    <span className="text-muted-foreground">{term.slice(search.query.trim().length)}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {search.error && <p className="text-xs text-destructive px-1">{search.error}</p>}

      {/* Results */}
      {search.results.length > 0 && (
        <div
          className={`space-y-1.5 ${compact ? "max-h-[240px]" : "max-h-[360px]"} overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
        >
          {compact && (
            <p className="text-[10px] text-muted-foreground px-1">
              {search.total} kết quả từ PubChem
            </p>
          )}
          {!compact && search.total > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              Hiển thị {search.results.length} trên {search.total} kết quả từ PubChem
            </p>
          )}
          {search.results.map((c) => (
            <CompoundCard
              key={c.cid}
              compound={c}
              compact={compact}
              onSelect={() => handleSelect(c)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {search.query.trim().length >= 2 &&
        !search.loading &&
        search.results.length === 0 &&
        !search.error && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Không tìm thấy chất nào. Hãy thử tên hoặc công thức khác.
          </p>
        )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {selectedCompound && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-primary" />
                  {selectedCompound.iupacName || selectedCompound.molecularFormula}
                </DialogTitle>
              </DialogHeader>

              {/* Properties */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="font-mono">
                  {selectedCompound.molecularFormula}
                </Badge>
                <Badge variant="outline">
                  MW: {Number(selectedCompound.molecularWeight).toFixed(2)} g/mol
                </Badge>
                <Badge variant="outline">CID: {selectedCompound.cid}</Badge>
                {Number(selectedCompound.hBondDonorCount) > 0 && (
                  <Badge variant="outline">HBD: {selectedCompound.hBondDonorCount}</Badge>
                )}
                {Number(selectedCompound.hBondAcceptorCount) > 0 && (
                  <Badge variant="outline">HBA: {selectedCompound.hBondAcceptorCount}</Badge>
                )}
              </div>

              {/* SMILES */}
              {selectedCompound.canonicalSmiles && (
                <div className="mt-3 rounded-lg bg-muted p-2.5 font-mono text-xs break-all">
                  <span className="text-muted-foreground">SMILES: </span>
                  {selectedCompound.canonicalSmiles}
                </div>
              )}

              {/* Description from PUG-View */}
              {desc.loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải mô tả...
                </div>
              )}
              {desc.description && (
                <div className="mt-3 rounded-xl border border-border bg-card p-4">
                  <p className="text-sm leading-relaxed">{desc.description.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Nguồn: {desc.description.source}
                  </p>
                </div>
              )}

              {/* 3D Preview */}
              {mol3d.loading && (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Đang tải cấu trúc 3D...</span>
                </div>
              )}
              {mol3d.error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  {mol3d.error}
                </div>
              )}
              {mol3d.molecule && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                  <MoleculePreview molecule={mol3d.molecule} height={280} />
                  <div className="p-3 bg-card flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {mol3d.molecule.atoms.length} nguyên tử · {mol3d.molecule.bonds.length} liên kết
                    </div>
                    <div className="flex gap-2">
                      {onAddToLibrary && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full text-xs"
                          onClick={handleAddToLibrary}
                        >
                          + Thư viện
                        </Button>
                      )}
                      {onSpawn && (
                        <Button
                          size="sm"
                          className="rounded-full bg-gradient-primary text-xs"
                          onClick={handleSpawn}
                        >
                          <Sparkles className="mr-1 h-3 w-3" /> Đưa vào không gian XR
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* External link */}
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${selectedCompound.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-3"
              >
                <ExternalLink className="h-3 w-3" /> Xem trên PubChem
              </a>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompoundCard({
  compound,
  compact,
  onSelect,
}: {
  compound: PubChemCompoundSummary;
  compact: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border border-white/5 bg-background/40 hover:bg-background/60 hover:border-primary/40 hover:-translate-y-0.5 transition-all ${compact ? "p-3" : "p-4"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className={`font-semibold truncate tracking-wide ${compact ? "text-sm" : "text-base text-primary-foreground"}`}>
            {compound.iupacName || compound.molecularFormula}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-primary text-xs font-bold bg-primary/10 px-1.5 py-0.5 rounded">
              {compound.molecularFormula}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
              MW: {Number(compound.molecularWeight).toFixed(1)}
            </span>
          </div>
        </div>
        <div className="shrink-0 bg-white/5 p-2 rounded-full">
          <Atom className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}
