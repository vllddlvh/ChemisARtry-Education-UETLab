// Element detail panel — shows 3D atom + tabs of info, with AR launcher.
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Box, Loader2, ExternalLink } from "lucide-react";
import AtomViewer3D from "./AtomViewer3D";
import { categoryStyle, SHELL_NAMES, type PTElement } from "@/lib/periodic-table-data";
import { searchPubChem, type PubChemCompoundSummary } from "@/lib/pubchem-api";

type Props = {
  element: PTElement | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLaunchAR: (el: PTElement) => void;
};

export default function ElementDetail({ element, open, onOpenChange, onLaunchAR }: Props) {
  if (!element) return null;
  const s = categoryStyle(element.category);
  const protons = element.number;
  const neutrons = Math.max(0, Math.round(element.atomic_mass) - protons);

  // PubChem lookup for the element
  const [pubchemData, setPubchemData] = useState<PubChemCompoundSummary | null>(null);
  const [pubchemLoading, setPubchemLoading] = useState(false);
  const [relatedCompounds, setRelatedCompounds] = useState<PubChemCompoundSummary[]>([]);

  useEffect(() => {
    if (!open || !element) return;
    let cancelled = false;
    setPubchemLoading(true);
    setPubchemData(null);
    setRelatedCompounds([]);

    // Fetch element data + related compounds in parallel
    Promise.all([
      searchPubChem(element.name, 1),
      searchPubChem(`${element.name} compound`, 5),
    ])
      .then(([elementResult, compoundsResult]) => {
        if (cancelled) return;
        setPubchemData(elementResult.compounds[0] ?? null);
        // Filter out the element itself from related compounds
        const related = compoundsResult.compounds.filter(
          (c) => c.cid !== elementResult.compounds[0]?.cid
        );
        setRelatedCompounds(related.slice(0, 4));
      })
      .catch(() => { /* best-effort */ })
      .finally(() => { if (!cancelled) setPubchemLoading(false); });
    return () => { cancelled = true; };
  }, [open, element]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-2">
          <div className="flex items-start gap-4">
            <div className={`h-16 w-16 shrink-0 rounded-2xl grid place-items-center ${s.bg} ${s.text} ring-1 ${s.ring} shadow-sm`}>
              <span className="text-2xl font-bold font-display">{element.symbol}</span>
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-2xl font-display flex items-center gap-2">
                {element.name}
                <span className="text-sm font-mono text-muted-foreground">#{element.number}</span>
              </SheetTitle>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">{s.label}</Badge>
                {element.phase && <Badge variant="outline">{element.phase}</Badge>}
                <span className="text-muted-foreground font-mono">M = {element.atomic_mass.toFixed(3)} u</span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* 3D atom */}
        <div className="relative mx-5 mt-3 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
          <AtomViewer3D
            shells={element.shells}
            protons={protons}
            neutrons={neutrons}
            symbol={element.symbol}
            color={element.cpk_hex ? `#${element.cpk_hex}` : "#38bdf8"}
            height={300}
            autoRotate
            interactive
          />
          <div className="absolute top-2 left-3 text-[11px] text-white/70 font-mono">
            Bohr model · drag to rotate · scroll to zoom
          </div>
          <Button
            size="sm"
            className="absolute bottom-3 right-3 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white border-0 shadow-lg"
            onClick={() => onLaunchAR(element)}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Open in AR
          </Button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-4">
          <Tabs defaultValue="overview">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
              <TabsTrigger value="shells">Shells</TabsTrigger>
              <TabsTrigger value="pubchem">PubChem</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-3 text-sm">
              {element.summary && (
                <p className="text-foreground/90 leading-relaxed">{element.summary}</p>
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <Row label="Atomic number" value={String(element.number)} />
                <Row label="Atomic mass" value={`${element.atomic_mass} u`} />
                <Row label="Category" value={s.label} />
                <Row label="Phase (STP)" value={element.phase ?? "—"} />
                <Row label="Density" value={element.density ? `${element.density} g/L` : "—"} />
                <Row label="Melting" value={element.melt ? `${element.melt} K` : "—"} />
                <Row label="Boiling" value={element.boil ? `${element.boil} K` : "—"} />
                <Row label="Group / Period" value={`${element.group ?? "—"} / ${element.period ?? "—"}`} />
                <Row label="Discovered by" value={element.discovered_by ?? "—"} />
                <Row label="Protons / Neutrons" value={`${protons} / ${neutrons}`} />
              </dl>
            </TabsContent>

            <TabsContent value="config" className="mt-4 space-y-3">
              <div className="rounded-lg bg-muted p-3 font-mono text-sm break-all">
                {element.electron_configuration ?? element.electron_configuration_semantic ?? "—"}
              </div>
              {element.electron_configuration_semantic && (
                <div className="text-xs text-muted-foreground">
                  Semantic: <span className="font-mono">{element.electron_configuration_semantic}</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shells" className="mt-4">
              <div className="grid grid-cols-4 gap-2">
                {element.shells.map((n, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card p-3 text-center">
                    <div className="text-xs text-muted-foreground font-mono">Shell {SHELL_NAMES[i] ?? i + 1}</div>
                    <div className="text-2xl font-bold font-display mt-1">{n}</div>
                    <div className="text-[10px] text-muted-foreground">electrons</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pubchem" className="mt-4 space-y-3">
              {pubchemLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading from PubChem...
                </div>
              )}
              {pubchemData && (
                <div className="space-y-3">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <Row label="IUPAC Name" value={pubchemData.iupacName || "—"} />
                    <Row label="Molecular Formula" value={pubchemData.molecularFormula || "—"} />
                    <Row label="Molecular Weight" value={pubchemData.molecularWeight ? `${Number(pubchemData.molecularWeight).toFixed(3)} g/mol` : "—"} />
                    <Row label="Complexity" value={pubchemData.complexity ? String(Number(pubchemData.complexity).toFixed(1)) : "—"} />
                    <Row label="H-Bond Donors" value={String(pubchemData.hBondDonorCount)} />
                    <Row label="H-Bond Acceptors" value={String(pubchemData.hBondAcceptorCount)} />
                    <Row label="Charge" value={String(pubchemData.charge)} />
                    <Row label="CID" value={String(pubchemData.cid)} />
                  </dl>
                  {pubchemData.canonicalSmiles && (
                    <div className="rounded-lg bg-muted p-2.5 font-mono text-[11px] break-all">
                      <span className="text-muted-foreground">SMILES: </span>
                      {pubchemData.canonicalSmiles}
                    </div>
                  )}
                  {pubchemData.inchi && (
                    <div className="rounded-lg bg-muted p-2.5 font-mono text-[11px] break-all">
                      <span className="text-muted-foreground">InChI: </span>
                      {pubchemData.inchi}
                    </div>
                  )}
                  <a
                    href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemData.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> View full data on PubChem
                  </a>
                </div>
              )}
              {!pubchemLoading && !pubchemData && (
                <p className="text-xs text-muted-foreground">No PubChem data found for this element.</p>
              )}

              {/* Related compounds */}
              {relatedCompounds.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Related compounds
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {relatedCompounds.map((c) => (
                      <a
                        key={c.cid}
                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${c.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-border bg-muted/40 p-2 hover:border-primary/40 transition text-xs"
                      >
                        <div className="font-mono font-bold text-primary truncate">{c.molecularFormula}</div>
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {c.iupacName || "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          MW: {Number(c.molecularWeight).toFixed(1)}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button
            className="w-full mt-5 rounded-full bg-gradient-primary"
            onClick={() => onLaunchAR(element)}
          >
            <Box className="mr-2 h-4 w-4" />
            Interact in AR (webcam + hand gestures)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium">{value}</dd>
    </>
  );
}
