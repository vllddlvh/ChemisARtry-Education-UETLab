// /search — PubChem Compound Explorer: deep search + 3D preview + properties.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import MoleculePreview from "@/components/MoleculePreview";
import {
  usePubChemSearch,
  usePubChemMolecule,
  usePubChemDescription,
} from "@/hooks/use-pubchem-search";
import type { PubChemCompoundSummary } from "@/lib/pubchem-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  Globe,
  Atom,
  ExternalLink,
  Sparkles,
  FlaskConical,
  Beaker,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/tools/explorer")({
  head: () => ({
    meta: [
      { title: "Compound Explorer — MoleLab AR" },
      {
        name: "description",
        content: "Explore 100M+ chemical compounds from PubChem with interactive 3D structures.",
      },
      { property: "og:title", content: "Compound Explorer — MoleLab AR" },
      {
        property: "og:description",
        content: "Search, visualize, and learn about any chemical compound.",
      },
    ],
  }),
  component: SearchPage,
});

const SUGGESTIONS = [
  { label: "Caffeine", query: "caffeine" },
  { label: "Aspirin", query: "aspirin" },
  { label: "Glucose", query: "glucose" },
  { label: "Ethanol", query: "ethanol" },
  { label: "Dopamine", query: "dopamine" },
  { label: "Penicillin", query: "penicillin" },
  { label: "Cholesterol", query: "cholesterol" },
  { label: "ATP", query: "adenosine triphosphate" },
];

function SearchPage() {
  const search = usePubChemSearch(500);
  const mol3d = usePubChemMolecule();
  const desc = usePubChemDescription();
  const [selected, setSelected] = useState<PubChemCompoundSummary | null>(null);

  function handleSelect(compound: PubChemCompoundSummary) {
    setSelected(compound);
    mol3d.load(compound.cid);
    desc.load(compound.cid);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto max-w-7xl w-full px-6 py-10 flex-1">
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-primary mb-1.5">
              <Globe className="h-3.5 w-3.5" /> 100M+ compounds · PubChem
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold">Compound Explorer</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl text-sm md:text-base">
              Search any chemical compound. View 3D molecular structures, properties, and
              descriptions from the world's largest free chemistry database.
            </p>
          </div>
          <Button asChild className="rounded-full bg-gradient-primary">
            <Link to="/lab/sim">
              <FlaskConical className="mr-2 h-4 w-4" /> AR Lab
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mt-6 relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Search by name, formula, or SMILES..."
            className="pl-12 h-12 text-base rounded-full border-2 focus:border-primary"
          />
          {search.loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
          )}
        </div>

        {/* Suggestions when empty */}
        {search.query.trim().length < 2 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.query}
                onClick={() => search.setQuery(s.query)}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Main content: results + detail */}
        <div className="mt-8 grid lg:grid-cols-[1fr_420px] gap-6 min-h-[500px]">
          {/* Left: results list */}
          <div>
            {search.error && <p className="text-sm text-destructive mb-3">{search.error}</p>}

            {search.results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  {search.total} compound{search.total !== 1 ? "s" : ""} found
                </p>
                {search.results.map((c) => (
                  <button
                    key={c.cid}
                    onClick={() => handleSelect(c)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      selected?.cid === c.cid
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {c.iupacName || c.molecularFormula}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                          <span className="font-mono text-primary font-bold">
                            {c.molecularFormula}
                          </span>
                          <span className="text-muted-foreground">
                            MW: {Number(c.molecularWeight).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground">CID: {c.cid}</span>
                        </div>
                      </div>
                      <div className="shrink-0 h-9 w-9 rounded-xl bg-primary/10 grid place-items-center">
                        <Atom className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {search.query.trim().length >= 2 &&
              !search.loading &&
              search.results.length === 0 &&
              !search.error && (
                <div className="text-center py-12 text-muted-foreground">
                  <Beaker className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>No compounds found for "{search.query}".</p>
                  <p className="text-xs mt-1">Try a different name, formula, or SMILES string.</p>
                </div>
              )}

            {search.query.trim().length < 2 && !selected && (
              <div className="text-center py-16 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Start typing to explore</p>
                <p className="text-sm mt-1">
                  Search by compound name, molecular formula, or click a suggestion above.
                </p>
              </div>
            )}
          </div>

          {/* Right: detail panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {selected ? (
              <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
                {/* 3D Preview */}
                {mol3d.loading && (
                  <div className="h-[250px] flex items-center justify-center bg-gradient-hero">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-sm">Loading 3D...</span>
                    </div>
                  </div>
                )}
                {mol3d.error && (
                  <div className="h-[250px] flex items-center justify-center bg-gradient-hero px-6">
                    <p className="text-sm text-destructive text-center">{mol3d.error}</p>
                  </div>
                )}
                {mol3d.molecule && <MoleculePreview molecule={mol3d.molecule} height={250} />}

                {/* Info */}
                <div className="p-5 space-y-3">
                  <h3 className="font-display font-bold text-lg leading-tight">
                    {selected.iupacName || selected.molecularFormula}
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {selected.molecularFormula}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Number(selected.molecularWeight).toFixed(2)} g/mol
                    </Badge>
                  </div>

                  {/* Properties grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <PropCell label="H-Bond Donors" value={String(selected.hBondDonorCount)} />
                    <PropCell
                      label="H-Bond Acceptors"
                      value={String(selected.hBondAcceptorCount)}
                    />
                    <PropCell label="Complexity" value={Number(selected.complexity).toFixed(0)} />
                    <PropCell label="Charge" value={String(selected.charge)} />
                  </div>

                  {selected.canonicalSmiles && (
                    <div className="rounded-lg bg-muted p-2 font-mono text-[10px] break-all leading-relaxed">
                      {selected.canonicalSmiles}
                    </div>
                  )}

                  {/* Description */}
                  {desc.loading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                    </div>
                  )}
                  {desc.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                      {desc.description.description}
                    </p>
                  )}

                  {mol3d.molecule && (
                    <div className="text-xs text-muted-foreground">
                      {mol3d.molecule.atoms.length} atoms · {mol3d.molecule.bonds.length} bonds
                    </div>
                  )}

                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${selected.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> PubChem page
                  </a>

                  <Button asChild className="w-full mt-4 rounded-full bg-gradient-primary">
                    <Link to="/lab/sim" search={{ spawn: selected.molecularFormula }}>
                      <FlaskConical className="mr-2 h-4 w-4" />
                      Thêm vào Lab
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a compound to see its 3D structure and properties</p>
              </div>
            )}
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-10 text-[11px] text-muted-foreground border-t border-border pt-4">
          Data from{" "}
          <a
            href="https://pubchem.ncbi.nlm.nih.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            PubChem
          </a>
          , National Center for Biotechnology Information, U.S. National Library of Medicine.
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function PropCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}
