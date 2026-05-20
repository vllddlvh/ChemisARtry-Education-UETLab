// MediaPipe Hands wrapper: runs on a <video> stream and returns landmarks.
// Gestures computed: pinch (thumb-tip to index-tip distance), palm center, wrist orientation.

import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

export type HandSample = {
  /** normalized 0..1 palm center (from landmark 9 — middle finger MCP) */
  palm: { x: number; y: number; z: number };
  /** normalized pinch strength 0 (open) .. 1 (closed) */
  pinch: number;
  /** wrist roll approximated from vector wrist->middleMCP */
  roll: number;
  handedness: "Left" | "Right";
};

export type HandFrame = {
  hands: HandSample[];
  timestamp: number;
};

let landmarker: HandLandmarker | null = null;

export async function initHandLandmarker(): Promise<HandLandmarker> {
  if (landmarker) return landmarker;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
  );
  landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
  return landmarker;
}

function dist(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function processResult(result: HandLandmarkerResult, timestamp: number): HandFrame {
  const hands: HandSample[] = [];
  for (let i = 0; i < result.landmarks.length; i++) {
    const lm = result.landmarks[i];
    if (!lm || lm.length < 21) continue;

    const thumbTip = lm[4];
    const indexTip = lm[8];
    const wrist = lm[0];
    const middleMcp = lm[9];

    // pinch distance normalized by hand size (wrist -> middleMCP)
    const handSize = Math.max(0.04, dist(wrist, middleMcp));
    const pinchRaw = dist(thumbTip, indexTip) / handSize;
    const pinch = Math.max(0, Math.min(1, 1 - pinchRaw / 0.8));

    const roll = Math.atan2(middleMcp.y - wrist.y, middleMcp.x - wrist.x);

    const handed = result.handedness[i]?.[0]?.categoryName === "Left" ? "Left" : "Right";

    hands.push({
      palm: { x: middleMcp.x, y: middleMcp.y, z: middleMcp.z },
      pinch,
      roll,
      handedness: handed,
    });
  }
  return { hands, timestamp };
}
