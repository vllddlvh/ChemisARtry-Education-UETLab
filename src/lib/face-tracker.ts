// face-tracker.ts
// MediaPipe FaceDetector wrapper dùng cho hiệu ứng "head-coupled perspective"
// (parallax theo đầu). Chỉ cần vị trí + kích thước khuôn mặt trong khung hình,
// nên dùng FaceDetector (nhẹ) thay vì FaceLandmarker.
//
// Trả về:
//  - x, y: tâm đầu (giữa hai mắt) chuẩn hoá 0..1 trong khung hình webcam (CHƯA mirror)
//  - size: khoảng cách hai mắt chuẩn hoá (proxy cho khoảng cách tới màn hình —
//          mặt càng to => càng gần)

import { FaceDetector, FilesetResolver, type FaceDetectorResult } from "@mediapipe/tasks-vision";

export type HeadPose = {
  x: number; // 0..1 (0 = trái khung hình, 1 = phải)
  y: number; // 0..1 (0 = trên, 1 = dưới)
  size: number; // ~0.04..0.3 khoảng cách hai mắt chuẩn hoá
};

let detector: FaceDetector | null = null;
let loading: Promise<FaceDetector> | null = null;

export async function initFaceDetector(): Promise<FaceDetector> {
  if (detector) return detector;
  if (loading) return loading;

  loading = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    );
    detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.5,
    });
    return detector;
  })();

  return loading;
}

/**
 * Trích xuất vị trí đầu từ kết quả FaceDetector. Ưu tiên keypoints (mắt),
 * fallback sang bounding box. Trả về null nếu không thấy mặt.
 *
 * @param videoWidth / videoHeight: dùng để chuẩn hoá bounding box (pixel -> 0..1).
 */
export function processFaceResult(
  result: FaceDetectorResult,
  videoWidth: number,
  videoHeight: number,
): HeadPose | null {
  const det = result.detections?.[0];
  if (!det) return null;

  // keypoints chuẩn hoá: [rightEye, leftEye, noseTip, mouth, rightEarTragion, leftEarTragion]
  const kp = det.keypoints;
  if (kp && kp.length >= 2) {
    const rEye = kp[0];
    const lEye = kp[1];
    const cx = (rEye.x + lEye.x) / 2;
    const cy = (rEye.y + lEye.y) / 2;
    const dx = rEye.x - lEye.x;
    const dy = rEye.y - lEye.y;
    const size = Math.hypot(dx, dy);
    if (Number.isFinite(cx) && Number.isFinite(cy) && size > 0) {
      return { x: cx, y: cy, size };
    }
  }

  // Fallback: bounding box (đơn vị pixel).
  const box = det.boundingBox;
  if (box && videoWidth > 0 && videoHeight > 0) {
    const cx = (box.originX + box.width / 2) / videoWidth;
    const cy = (box.originY + box.height / 2) / videoHeight;
    // dùng bề rộng mặt làm proxy size, quy về thang gần với inter-eye (~0.5x)
    const size = (box.width / videoWidth) * 0.5;
    return { x: cx, y: cy, size };
  }

  return null;
}
