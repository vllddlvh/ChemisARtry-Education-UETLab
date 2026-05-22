// PubChem search panel — search any compound, preview 3D, and spawn into AR.
// Used in ControlPanel sidebar (compact mode) and standalone.
import { useState } from "react";
import { usePubChemSearch, usePubChemMolecule, usePubChemDescription } from "@/hooks/use-pubchem-search";
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
  const mol3d = usePubChemMolecule();
  const desc = usePubChemDescription();
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCompound, setSelectedCompound] = useState<PubChemCompoundSummary | null>(null);

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

  return (
    <div className={compact ? "space-y-2" : "space-y-4"}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          placeholder="Search PubChem (e.g. caffeine, C6H12O6)..."
          className={`pl-9 ${compact ? "h-9 text-sm rounded-xl" : "rounded-full"}`}
        />
        {search.loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        )}
      </div>

      {/* Error */}
      {search.error && (
        <p className="text-xs text-destructive px-1">{search.error}</p>
      )}

      {/* Results */}
      {search.results.length > 0 && (
        <div className={`space-y-1.5 ${compact ? "max-h-[240px]" : "max-h-[360px]"} overflow-y-auto`}>
          {compact && (
            <p className="text-[10px] text-muted-foreground px-1">
              {search.total} result{search.total !== 1 ? "s" : ""} from PubChem
            </p>
          )}
          {!compact && search.total > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              Showing {search.results.length} of {search.total} results from PubChem
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
      {search.query.trim().length >= 2 && !search.loading && search.results.length === 0 && !search.error && (
        <p className="text-xs text-muted-foreground text-center py-3">
          No compounds found. Try a different name or formula.
        </p>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                <Badge variant="outline">
                  CID: {selectedCompound.cid}
                </Badge>
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
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading description...
                </div>
              )}
              {desc.description && (
                <div className="mt-3 rounded-xl border border-border bg-card p-4">
                  <p className="text-sm leading-relaxed">{desc.description.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Source: {desc.description.source}
                  </p>
                </div>
              )}

              {/* 3D Preview */}
              {mol3d.loading && (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading 3D structure...</span>
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
                      {mol3d.molecule.atoms.length} atoms · {mol3d.molecule.bonds.length} bonds
                    </div>
                    <div className="flex gap-2">
                      {onAddToLibrary && (
                        <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={handleAddToLibrary}>
                          + Library
                        </Button>
                      )}
                      {onSpawn && (
                        <Button size="sm" className="rounded-full bg-gradient-primary text-xs" onClick={handleSpawn}>
                          <Sparkles className="mr-1 h-3 w-3" /> Spawn in AR
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
                <ExternalLink className="h-3 w-3" /> View on PubChem
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
      className={`w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:-translate-y-0.5 transition-all ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={`font-semibold truncate ${compact ? "text-xs" : "text-sm"}`}>
            {compound.iupacName || compound.molecularFormula}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-primary text-xs font-bold">
              {compound.molecularFormula}
            </span>
            <span className="text-[10px] text-muted-foreground">
              MW: {Number(compound.molecularWeight).toFixed(1)}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <Atom className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}
