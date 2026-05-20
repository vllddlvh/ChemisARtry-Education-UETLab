// Full-screen webcam video that sits BEHIND the 3D canvas, used for AR/MR modes.
// Mirrors horizontally for a natural selfie view. Quietly noop's if the camera
// is unavailable. Exposes the underlying <video> via ref so other components
// (e.g. hand-tracker) can reuse the stream.
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export type WebcamPassthroughHandle = {
  videoEl: () => HTMLVideoElement | null;
  stream: () => MediaStream | null;
};

type Props = {
  enabled: boolean;
  /** 0..1 darkening overlay so the 3D scene reads better. */
  dim?: number;
  /** Subtle blur in pixels for MR aesthetic. */
  blur?: number;
  className?: string;
};

const WebcamPassthrough = forwardRef<WebcamPassthroughHandle, Props>(function WebcamPassthrough(
  { enabled, dim = 0.25, blur = 0, className = "" },
  ref,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "ready" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    videoEl: () => videoRef.current,
    stream: () => (videoRef.current?.srcObject as MediaStream | null) ?? null,
  }), []);

  useEffect(() => {
    if (!enabled) {
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      setStatus("idle");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setStatus("starting");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setStatus("ready");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Camera unavailable");
        setStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: "scaleX(-1)", filter: blur > 0 ? `blur(${blur}px)` : undefined }}
        playsInline
        muted
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,${dim * 0.4}) 0%, rgba(0,0,0,${dim}) 80%)` }}
      />
      {status !== "ready" && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 text-white text-[11px] px-3 py-1 backdrop-blur">
          {status === "starting" && "Starting camera…"}
          {status === "error" && (err ?? "Camera blocked")}
        </div>
      )}
    </div>
  );
});

export default WebcamPassthrough;
