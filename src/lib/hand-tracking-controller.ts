// Lightweight wrapper around MediaPipe Hands for the Virtual Lab.
// Independent of the AR HandTracker — exposes a callback-driven API tuned
// for desktop webcams: cursor position (normalized), pinch state, tilt, scale.
//
// Falls back gracefully: if MediaPipe fails to load, the controller stays
// inactive and the page keeps using mouse/touch input.

import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type LabHandFrame = {
  /** normalized 0..1 in webcam space (mirrored x for natural feel) */
  cursor: { x: number; y: number };
  /** true while user is pinching (thumb tip close to index tip) */
  pinching: boolean;
  /** -1 = tilt left, 0 = neutral, 1 = tilt right (for pour gesture) */
  tilt: number;
  /** distance between two hands (normalized) — null if only one hand visible */
  twoHandDistance: number | null;
  /** number of hands detected */
  hands: number;
};

type Listener = (frame: LabHandFrame) => void;

export class HandTrackingController {
  private landmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private raf = 0;
  private listeners = new Set<Listener>();
  private lastTimestamp = -1;
  ready = false;
  error: string | null = null;

  async start(video: HTMLVideoElement, opts?: { reuseStream?: boolean }): Promise<void> {
    this.video = video;
    try {
      // Reuse existing stream on the video element if provided (shared webcam).
      if (opts?.reuseStream && video.srcObject) {
        this.stream = video.srcObject as MediaStream;
        this.ownedStream = false;
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });
        video.srcObject = this.stream;
        this.ownedStream = true;
      }
      try { await video.play(); } catch { /* already playing */ }

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
      });
      this.ready = true;
      this.loop();
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Hand tracking unavailable";
      this.ready = false;
    }
  }

  private ownedStream = false;

  stop() {
    cancelAnimationFrame(this.raf);
    if (this.ownedStream) {
      this.stream?.getTracks().forEach((t) => t.stop());
      if (this.video) this.video.srcObject = null;
    }
    this.stream = null;
    this.landmarker?.close();
    this.landmarker = null;
    this.ready = false;
  }

  onFrame(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private loop = () => {
    if (!this.video || !this.landmarker) return;
    const ts = performance.now();
    if (ts !== this.lastTimestamp && this.video.readyState >= 2) {
      this.lastTimestamp = ts;
      try {
        const result = this.landmarker.detectForVideo(this.video, ts);
        const frame = this.process(result);
        this.listeners.forEach((l) => l(frame));
      } catch {
        // swallow transient detection errors
      }
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private process(result: HandLandmarkerResult): LabHandFrame {
    const out: LabHandFrame = {
      cursor: { x: 0.5, y: 0.5 },
      pinching: false,
      tilt: 0,
      twoHandDistance: null,
      hands: result.landmarks.length,
    };
    if (result.landmarks.length === 0) return out;

    const lm0 = result.landmarks[0];
    if (lm0 && lm0.length >= 21) {
      const indexTip = lm0[8];
      const thumbTip = lm0[4];
      const wrist = lm0[0];
      const middleMcp = lm0[9];

      // Mirror x so moving right with right hand moves cursor right
      out.cursor = { x: 1 - indexTip.x, y: indexTip.y };

      const dx = thumbTip.x - indexTip.x;
      const dy = thumbTip.y - indexTip.y;
      const pinchDist = Math.hypot(dx, dy);
      out.pinching = pinchDist < 0.05;

      // Tilt: angle of wrist->middleMcp from vertical
      const ang = Math.atan2(middleMcp.x - wrist.x, -(middleMcp.y - wrist.y));
      out.tilt = Math.max(-1, Math.min(1, ang / 0.9));
    }

    if (result.landmarks.length >= 2) {
      const a = result.landmarks[0][9];
      const b = result.landmarks[1][9];
      out.twoHandDistance = Math.hypot(a.x - b.x, a.y - b.y);
    }
    return out;
  }
}
