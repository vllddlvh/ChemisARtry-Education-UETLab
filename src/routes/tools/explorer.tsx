// /search — PubChem Compound Explorer: deep search + 3D preview + properties.
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import MoleculePreview from "@/components/MoleculePreview";
import {
  usePubChemSearch,
  usePubChemMolecule,
  usePubChemDescription,
  usePubChemCompoundAutocomplete,
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
  const navigate = useNavigate();
  const search = usePubChemSearch(500, false);
  const autocomplete = usePubChemCompoundAutocomplete(180);
  const mol3d = usePubChemMolecule();
  const desc = usePubChemDescription();
  const [selected, setSelected] = useState<PubChemCompoundSummary | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleSelect(compound: PubChemCompoundSummary) {
    setSelected(compound);
    mol3d.load(compound.cid);
    desc.load(compound.cid);
  }

  function handleAddToLab() {
    if (!mol3d.molecule) return;

    sessionStorage.setItem("chemisartry.pendingSpawn", JSON.stringify(mol3d.molecule));
    navigate({ to: "/lab/ar", search: { spawn: "pubchem" } });
  }

  function handleChooseSuggestion(term: string) {
    autocomplete.setQuery(term);
    setInputFocused(false);
    handleSubmitSearch(term);
    inputRef.current?.blur();
  }

  function handleSubmitSearch(queryOverride?: string) {
    const q = (queryOverride ?? search.query).trim();
    if (q.length < 2) return;
    if (queryOverride !== undefined) {
      search.setQuery(queryOverride);
      autocomplete.setQuery(queryOverride);
    }
    setSubmittedQuery(q);
    search.runSearch(q);
  }

  const showAutocomplete =
    inputFocused && search.query.trim().length >= 3 && autocomplete.terms.length > 0;
  const showResults = submittedQuery.length >= 2 && submittedQuery === search.query.trim();
  const hasSubmittedResults = showResults && !search.loading && search.results.length > 0;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background text-foreground">
      <main className="flex-1 min-h-0 overflow-y-auto scroll-smooth scrollbar-dark">
        <div className="mx-auto max-w-7xl w-full px-6 pt-10 pb-0">
          {/* Header */}
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-primary mb-1.5">
                <Globe className="h-3.5 w-3.5" /> 100M+ hợp chất · PubChem
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">Khám phá hợp chất</h1>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm md:text-base">
                Tra cứu mọi hợp chất hóa học. Khám phá mô hình phân tử 3D, tính chất và thông tin chi tiết từ kho dữ liệu hóa học mở lớn nhất thế giới.
              </p>
            </div>
            <Button asChild className="rounded-full bg-gradient-primary">
              <Link to="/lab/ar">
                <FlaskConical className="mr-2 h-4 w-4" /> AR Lab
              </Link>
            </Button>
          </div>

          {/* Search */}
          <form
            className="mt-6 relative max-w-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitSearch();
            }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
              placeholder="Tìm kiếm theo tên, công thức hoặc SMILES..."
              className="pl-12 h-12 text-base rounded-full border-2 focus:border-primary"
            />
            <input type="submit" className="sr-only" aria-hidden="true" tabIndex={-1} />
            {search.loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
            )}

            {showAutocomplete && (
              <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-border/70 bg-card/95 text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur-2xl">
                <div className="flex items-center justify-between px-4 pt-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground/90">
                  <span>Có phải bạn muốn tìm?</span>
                  <span>{autocomplete.total} gợi ý</span>
                </div>
                <div className="max-h-[260px] overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {autocomplete.terms.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleChooseSuggestion(term)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-primary/15"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        C
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-semibold">{search.query}</span>
                        <span className="text-muted-foreground">
                          {term.slice(search.query.trim().length)}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Suggestions when empty */}
          {search.query.trim().length < 2 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Thử ngay:</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.query}
                  onClick={() => handleSubmitSearch(s.query)}
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
              {showResults && search.error && (
                <p className="text-sm text-destructive mb-3">{search.error}</p>
              )}

              {hasSubmittedResults && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {search.total} compound{search.total !== 1 ? "s" : ""} found
                  </p>
                  {search.results.map((c) => (
                    <button
                      key={c.cid}
                      onClick={() => handleSelect(c)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all overflow-hidden ${selected?.cid === c.cid
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border bg-card hover:border-primary/40 hover:-translate-y-0.5"
                        }`}
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] items-start gap-3 min-w-0">
                        <div className="min-w-0 overflow-hidden">
                          <div
                            className="block overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-sm"
                            style={{ maxWidth: "100%" }}
                            title={c.iupacName || c.molecularFormula}
                          >
                            {c.iupacName || c.molecularFormula}
                          </div>
                          <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-xs min-w-0 overflow-hidden">
                            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-primary font-bold">
                              {c.molecularFormula}
                            </span>
                            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                              MW: {Number(c.molecularWeight).toFixed(2)}
                            </span>
                            <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">CID: {c.cid}</span>
                          </div>
                        </div>
                        <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                          <Atom className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showResults &&
                !search.loading &&
                search.results.length === 0 &&
                !search.error && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Beaker className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No compounds found for "{submittedQuery}".</p>
                    <p className="text-xs mt-1">Try a different name, formula, or SMILES string.</p>
                  </div>
                )}

              {!showResults && !selected && (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Bắt đầu khám phá ngay nào</p>
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

                    <Button
                      className="w-full mt-4 rounded-full bg-gradient-primary"
                      onClick={handleAddToLab}
                      disabled={!mol3d.molecule}
                    >
                      <FlaskConical className="mr-2 h-4 w-4" />
                      Thêm vào Lab
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Chọn một hợp chất để xem cấu trúc 3D và tính chất của nó</p>
                </div>
              )}
            </div>
          </div>

          {/* Attribution removed per design request */}
        </div>
      </main>
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
