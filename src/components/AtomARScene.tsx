// Full-screen AR scene: webcam passthrough + 3D atom controlled by hand gestures.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, RotateCcw, Hand, MousePointer2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import WebcamPassthrough, { type WebcamPassthroughHandle } from "./WebcamPassthrough";
import AtomViewer3D, { type AtomViewer3DHandle } from "./AtomViewer3D";
import { HandTrackingController, type LabHandFrame } from "@/lib/hand-tracking-controller";
import { categoryStyle, type PTElement } from "@/lib/periodic-table-data";

type Props = {
  element: PTElement;
  onClose: () => void;
};

export default function AtomARScene({ element, onClose }: Props) {
  const webcamRef = useRef<WebcamPassthroughHandle>(null);
  const atomRef = useRef<AtomViewer3DHandle>(null);
  const ctrlRef = useRef<HandTrackingController | null>(null);
  const lastFrameRef = useRef<LabHandFrame | null>(null);

  const [showLabels, setShowLabels] = useState(false);
  const [handsActive, setHandsActive] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; pinch: boolean } | null>(null);
  const [handStatus, setHandStatus] = useState<"starting" | "ready" | "fallback">("starting");

  const s = categoryStyle(element.category);
  const protons = element.number;
  const neutrons = Math.max(0, Math.round(element.atomic_mass) - protons);

  // ---- Hand tracking lifecycle (headless: hidden video element) ----
  useEffect(() => {
    let cancelled = false;
    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.display = "none";
    document.body.appendChild(video);

    const ctrl = new HandTrackingController();
    ctrlRef.current = ctrl;

    (async () => {
      await ctrl.start(video);
      if (cancelled) return;
      if (!ctrl.ready) {
        setHandStatus("fallback");
        toast.message("Hand tracking unavailable — use mouse to rotate.");
        return;
      }
      setHandStatus("ready");
      setHandsActive(true);

      const off = ctrl.onFrame((f) => {
        const prev = lastFrameRef.current;
        lastFrameRef.current = f;

        if (f.hands === 0) {
          setCursor(null);
          return;
        }
        setCursor({ x: f.cursor.x, y: f.cursor.y, pinch: f.pinching });

        // 1-hand pinch + drag → rotate
        if (f.pinching && prev?.pinching) {
          const dx = (f.cursor.x - prev.cursor.x) * 6;
          const dy = (f.cursor.y - prev.cursor.y) * 6;
          atomRef.current?.rotate(dx, dy);
        }

        // 2-hand zoom
        if (f.twoHandDistance != null && prev?.twoHandDistance != null) {
          const ratio = f.twoHandDistance / Math.max(0.01, prev.twoHandDistance);
          if (Math.abs(1 - ratio) > 0.005) {
            atomRef.current?.zoom(ratio);
          }
        }
      });

      // Cleanup hook for the listener
      ctrl.onFrame; // (already captured)
      return () => off();
    })();

    return () => {
      cancelled = true;
      ctrl.stop();
      try {
        document.body.removeChild(video);
      } catch {
        /* ignore */
      }
    };
  }, []);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "r" || e.key === "R") atomRef.current?.reset();
      if (e.key === "l" || e.key === "L") setShowLabels((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <WebcamPassthrough ref={webcamRef} enabled dim={0.3} />

      {/* Transparent 3D atom layered on top of webcam */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <AtomViewer3D
          ref={atomRef}
          shells={element.shells}
          protons={protons}
          neutrons={neutrons}
          symbol={element.symbol}
          color={element.cpk_hex ? `#${element.cpk_hex}` : "#7dd3fc"}
          height="100%"
          autoRotate={!handsActive}
          interactive
          transparent
          showShellLabels={showLabels}
        />
      </div>

      {/* HUD top-left: element info */}
      <div className="absolute top-4 left-4 z-20 rounded-2xl bg-black/55 backdrop-blur px-4 py-3 text-white max-w-xs">
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-xl grid place-items-center ${s.bg} ${s.text} ring-1 ${s.ring}`}
          >
            <span className="text-lg font-bold font-display">{element.symbol}</span>
          </div>
          <div>
            <div className="text-base font-semibold font-display leading-tight">{element.name}</div>
            <div className="text-[11px] text-white/70 font-mono">
              Z = {element.number} · {element.shells.reduce((a, b) => a + b, 0)}e⁻ ·{" "}
              {element.shells.length} shells
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <Badge variant="secondary" className="bg-white/15 text-white border-0">
            {s.label}
          </Badge>
          {element.phase && (
            <Badge variant="secondary" className="bg-white/15 text-white border-0">
              {element.phase}
            </Badge>
          )}
        </div>
      </div>

      {/* HUD top-right: controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full bg-black/55 text-white hover:bg-black/70 border-0"
          onClick={onClose}
        >
          <X className="mr-1.5 h-3.5 w-3.5" /> Exit AR
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full bg-black/55 text-white hover:bg-black/70 border-0"
          onClick={() => atomRef.current?.reset()}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full bg-black/55 text-white hover:bg-black/70 border-0"
          onClick={() => setShowLabels((v) => !v)}
        >
          {showLabels ? (
            <EyeOff className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <Eye className="mr-1.5 h-3.5 w-3.5" />
          )}
          Shell labels
        </Button>
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/55 backdrop-blur px-4 py-2 text-white text-xs flex items-center gap-3">
        {handStatus === "ready" ? (
          <>
            <span className="inline-flex items-center gap-1.5">
              <Hand className="h-3.5 w-3.5" /> Pinch + move = rotate · two hands = zoom
            </span>
          </>
        ) : handStatus === "starting" ? (
          <span>Starting hand tracking…</span>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <MousePointer2 className="h-3.5 w-3.5" /> Drag to rotate · scroll to zoom
          </span>
        )}
        <span className="opacity-50">·</span>
        <span className="opacity-70 font-mono">R reset · L labels · Esc exit</span>
      </div>

      {/* Virtual cursor overlay */}
      {cursor && (
        <div
          className={`pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all
            ${cursor.pinch ? "h-9 w-9 border-2 border-fuchsia-400 bg-fuchsia-400/30" : "h-6 w-6 border border-white/80 bg-white/10"}`}
          style={{ left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%` }}
        />
      )}
    </div>
  );
}
