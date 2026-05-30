// ARScene.tsx
// Camera feed + Three.js overlay.
// - MediaPipe tracks hands on the video element.
// - Three.js renders 3D ball-and-stick molecules that follow palm positions
//   when grabbed (pinch) and respond to wrist rotation + two-hand scaling.
// - When two molecules touch, a reaction is checked and product spawns with
//   a glow/particle animation.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { initHandLandmarker, processResult, type HandFrame } from "@/lib/hand-tracker";
import { initFaceDetector, processFaceResult, type HeadPose } from "@/lib/face-tracker";
import { elementInfo, type Molecule } from "@/lib/chemistry";
import { findMatchingReaction, PROXIMITY_THRESHOLD } from "@/lib/reaction-engine";
import { reactionVisual, type ReactionVisual } from "@/lib/reaction-data";
import type { Reaction } from "@/lib/chemistry";
import MoleculeInfoTooltip from "./MoleculeInfoTooltip";
import { toast } from "sonner";

type SpawnedMol = {
  id: string;
  formula: string;
  group: THREE.Group;
  labels: THREE.Sprite[];
  grabbedBy: number | null; // hand index or null
  baseScale: number;
  spawnedAt: number;
  // Hiệu ứng phóng to khi mới xuất hiện (sản phẩm phản ứng).
  scaleIn?: { start: number; duration: number };
  // Đang trong pha "đang phản ứng" (bị hút về tâm + phát sáng).
  reacting?: boolean;
};

// Một phản ứng đang diễn ra (pha animation trước khi tạo sản phẩm).
type PendingReaction = {
  a: SpawnedMol;
  b: SpawnedMol;
  rx: Reaction;
  visual: ReactionVisual;
  center: THREE.Vector3;
  startedAt: number;
};

const REACTION_WINDUP_MS = 650; // thời gian "tích tụ" trước khi tạo sản phẩm

type Props = {
  molecules: Molecule[];
  reactions: Reaction[];
  toSpawn: Molecule | null; // parent sets, we consume
  onSpawned: () => void;
  resetSignal: number;
  educationMode: boolean;
  onReaction: (r: Reaction) => void;
  arOn: boolean;
  /** Bật hiệu ứng head-coupled perspective (parallax theo đầu qua webcam). */
  headTracking?: boolean;
};

// Build a ball-and-stick group for a molecule.
function buildMoleculeGroup(
  m: Molecule,
  withLabels: boolean,
): { group: THREE.Group; labels: THREE.Sprite[] } {
  const group = new THREE.Group();
  group.userData.formula = m.formula;
  const labels: THREE.Sprite[] = [];

  const atomMeshes: THREE.Mesh[] = [];
  for (const a of m.atoms) {
    const info = elementInfo(a.el);
    const geo = new THREE.SphereGeometry(info.radius, 32, 32);
    const mat = new THREE.MeshPhysicalMaterial({
      color: info.color,
      roughness: 0.35,
      metalness: 0.15,
      clearcoat: 0.6,
      clearcoatRoughness: 0.25,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(a.x, a.y, a.z);
    mesh.userData = { isAtom: true, el: a.el };
    group.add(mesh);
    atomMeshes.push(mesh);

    if (withLabels) {
      const sprite = makeTextSprite(a.el);
      sprite.position.set(a.x, a.y + info.radius + 0.25, a.z);
      group.add(sprite);
      labels.push(sprite);
    }
  }

  for (const b of m.bonds) {
    const pa = new THREE.Vector3(m.atoms[b.a].x, m.atoms[b.a].y, m.atoms[b.a].z);
    const pb = new THREE.Vector3(m.atoms[b.b].x, m.atoms[b.b].y, m.atoms[b.b].z);
    const count = Math.min(3, Math.max(1, b.order));
    const axis = new THREE.Vector3().subVectors(pb, pa).normalize();
    const perp =
      Math.abs(axis.y) < 0.9
        ? new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize()
        : new THREE.Vector3().crossVectors(axis, new THREE.Vector3(1, 0, 0)).normalize();

    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 0.14;
      const cyl = makeBond(pa, pb);
      cyl.position.add(perp.clone().multiplyScalar(offset));
      group.add(cyl);
    }
  }
  return { group, labels };
}

function makeBond(a: THREE.Vector3, b: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(0.09, 0.09, len, 16);
  const mat = new THREE.MeshPhysicalMaterial({ color: "#d4d7de", roughness: 0.5, metalness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(a).add(dir.multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return mesh;
}

function makeTextSprite(text: string, color = "#0f1e3d") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "bold 56px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 64, 68);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.55, 0.55, 1);
  return sprite;
}

// Spawn a sparkly particle burst at a position.
function spawnBurst(
  scene: THREE.Scene,
  position: THREE.Vector3,
  color: string,
  opts?: { count?: number; size?: number; speed?: number; life?: number; gravity?: number },
) {
  const count = opts?.count ?? 60;
  const size = opts?.size ?? 0.18;
  const speed = opts?.speed ?? 4;
  const life = opts?.life ?? 1.2;
  const gravity = opts?.gravity ?? 0;
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = position.x;
    pos[i * 3 + 1] = position.y;
    pos[i * 3 + 2] = position.z;
    vel.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
      ),
    );
  }
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const points = new THREE.Points(geom, mat);
  scene.add(points);
  const start = performance.now();
  const tick = () => {
    const t = (performance.now() - start) / 1000;
    const arr = geom.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      vel[i].y -= gravity * 0.016;
      arr[i * 3] += vel[i].x * 0.016;
      arr[i * 3 + 1] += vel[i].y * 0.016;
      arr[i * 3 + 2] += vel[i].z * 0.016;
      vel[i].multiplyScalar(0.94);
    }
    geom.attributes.position.needsUpdate = true;
    mat.opacity = Math.max(0, 1 - t / life);
    if (t < life) requestAnimationFrame(tick);
    else {
      scene.remove(points);
      geom.dispose();
      mat.dispose();
    }
  };
  requestAnimationFrame(tick);
}

// Expanding glowing ring (shockwave) — nhấn mạnh thời điểm phản ứng xảy ra.
function spawnShockwave(scene: THREE.Scene, position: THREE.Vector3, color: string) {
  const geo = new THREE.RingGeometry(0.1, 0.32, 48);
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.copy(position);
  scene.add(ring);
  const start = performance.now();
  const life = 0.7;
  const tick = () => {
    const t = (performance.now() - start) / 1000;
    const s = 1 + (t / life) * 9;
    ring.scale.set(s, s, s);
    mat.opacity = Math.max(0, 0.9 * (1 - t / life));
    if (t < life) requestAnimationFrame(tick);
    else {
      scene.remove(ring);
      geo.dispose();
      mat.dispose();
    }
  };
  requestAnimationFrame(tick);
}

// Sprite hiển thị phương trình phản ứng nổi lên giữa không gian rồi mờ dần.
function spawnEquationSprite(scene: THREE.Scene, position: THREE.Vector3, equation: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // nền bo tròn bán trong suốt
  ctx.fillStyle = "rgba(12,18,30,0.82)";
  roundRect(ctx, 12, 70, canvas.width - 24, 116, 40);
  ctx.fill();
  ctx.strokeStyle = "rgba(125,226,255,0.55)";
  ctx.lineWidth = 3;
  roundRect(ctx, 12, 70, canvas.width - 24, 116, 40);
  ctx.stroke();
  ctx.fillStyle = "#eaf6ff";
  ctx.font = "bold 64px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(equation, canvas.width / 2, canvas.height / 2 + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(5.2, 1.3, 1);
  sprite.position.copy(position).add(new THREE.Vector3(0, 1.6, 0));
  scene.add(sprite);

  const start = performance.now();
  const life = 2.6;
  const baseY = sprite.position.y;
  const tick = () => {
    const t = (performance.now() - start) / 1000;
    sprite.position.y = baseY + t * 0.5;
    const k = t < 0.3 ? t / 0.3 : t > life - 0.6 ? Math.max(0, (life - t) / 0.6) : 1;
    mat.opacity = k;
    if (t < life) requestAnimationFrame(tick);
    else {
      scene.remove(sprite);
      tex.dispose();
      mat.dispose();
    }
  };
  requestAnimationFrame(tick);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ── Head-coupled perspective (off-axis projection) ──────────────────────────
// Đặt camera tại vị trí "mắt" (eye) và dựng frustom bất đối xứng nhìn vào một
// "cửa sổ" cố định nằm tại mặt phẳng z=0 (màn hình). Khi mắt dịch sang trái,
// vật thể như lộ ra mặt bên phải — đúng cảm giác nhìn qua cửa sổ thật.
// Tham khảo: Kooima, "Generalized Perspective Projection"; Johnny Lee WiiDesktopVR.
function applyOffAxisProjection(
  camera: THREE.PerspectiveCamera,
  eye: { x: number; y: number; z: number },
  screenHalfW: number,
  screenHalfH: number,
  near: number,
  far: number,
) {
  const n = near;
  // Khoảng cách từ mắt tới mặt phẳng màn hình (z=0). eye.z > 0.
  const dz = Math.max(0.01, eye.z);
  // Biên cửa sổ tại mặt phẳng màn hình, quy chiếu về near plane.
  const left = ((-screenHalfW - eye.x) * n) / dz;
  const right = ((screenHalfW - eye.x) * n) / dz;
  const top = ((screenHalfH - eye.y) * n) / dz;
  const bottom = ((-screenHalfH - eye.y) * n) / dz;

  camera.projectionMatrix.makePerspective(left, right, top, bottom, n, far);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

  // Camera nhìn thẳng theo trục -Z (không xoay), chỉ tịnh tiến theo mắt.
  camera.position.set(eye.x, eye.y, eye.z);
  camera.quaternion.identity();
  camera.updateMatrixWorld(true);
}

export default function ARScene({
  molecules,
  reactions,
  toSpawn,
  onSpawned,
  resetSignal,
  educationMode,
  onReaction,
  arOn,
  headTracking = false,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Initializing...");
  const [handCount, setHandCount] = useState(0);
  const [hasSpawnedMolecules, setHasSpawnedMolecules] = useState(false);
  const [trashHot, setTrashHot] = useState(false);
  const [hoveredAtom, setHoveredAtom] = useState<{ symbol: string; x: number; y: number } | null>(
    null,
  );
  // Hiệu ứng chớp sáng toàn màn hình khi phản ứng xảy ra (toả/thu nhiệt).
  const [flash, setFlash] = useState<{ color: string; key: number } | null>(null);
  // Gợi ý "sắp phản ứng" khi 2 phân tử tương thích lại gần nhau.
  const [reactionHint, setReactionHint] = useState<{ label: string; icon: string } | null>(null);

  const hoveredElRef = useRef<string | null>(null);

  const spawnedRef = useRef<SpawnedMol[]>([]);
  const pendingReactionRef = useRef<PendingReaction | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const handFrameRef = useRef<HandFrame>({ hands: [], timestamp: 0 });
  const educationRef = useRef(educationMode);
  const reactionsRef = useRef(reactions);
  const moleculesRef = useRef(molecules);
  const onReactionRef = useRef(onReaction);
  const arOnRef = useRef(arOn);

  // Head-coupled perspective state.
  const headTrackingRef = useRef(headTracking);
  const headPoseRef = useRef<HeadPose | null>(null);
  // Vị trí "mắt" ảo đã làm mượt (đơn vị world). Camera sẽ ngồi tại đây.
  const eyeRef = useRef({ x: 0, y: 0, z: 8 });
  // Khoảng cách camera mặc định (điều chỉnh bằng scroll-zoom ở chế độ mô phỏng).
  const baseCameraZRef = useRef(8);
  const lastFaceTsRef = useRef(-1);
  const faceDetectorRef = useRef<Awaited<ReturnType<typeof initFaceDetector>> | null>(null);
  const [headActive, setHeadActive] = useState(false);

  // Mouse drag refs
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const isDraggingRef = useRef(false);
  const draggedMolRef = useRef<SpawnedMol | null>(null);
  const intersectionRef = useRef(new THREE.Vector3());

  const syncSpawnedState = () => {
    setHasSpawnedMolecules(spawnedRef.current.length > 0);
  };

  const isOverTrash = (clientX: number, clientY: number) => {
    const trash = trashRef.current;
    if (!trash) return false;
    const rect = trash.getBoundingClientRect();
    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    );
  };

  const removeSpawnedMolecule = (mol: SpawnedMol) => {
    const scene = sceneRef.current;
    if (!scene) return;

    scene.remove(mol.group);
    spawnedRef.current = spawnedRef.current.filter((item) => item !== mol);
    if (draggedMolRef.current === mol) {
      draggedMolRef.current = null;
      isDraggingRef.current = false;
    }
    syncSpawnedState();
  };

  educationRef.current = educationMode;
  reactionsRef.current = reactions;
  moleculesRef.current = molecules;
  onReactionRef.current = onReaction;
  arOnRef.current = arOn;
  headTrackingRef.current = headTracking;

  // Main setup effect — once.
  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);
    cameraRef.current = camera;

    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 4);
    const rim = new THREE.DirectionalLight(0x88ccff, 0.6);
    rim.position.set(-5, -2, -4);
    scene.add(ambient, key, rim);

    const onResize = () => {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const raycaster = raycasterRef.current;
    const mouse = mouseRef.current;
    const dragPlane = dragPlaneRef.current;
    const intersection = intersectionRef.current;

    const onPointerDown = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = spawnedRef.current.map((m) => m.group);
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let hitGroup = intersects[0].object as THREE.Object3D;
        while (hitGroup.parent && hitGroup.parent.type !== "Scene") {
          if (spawnedRef.current.some((m) => m.group === hitGroup)) break;
          hitGroup = hitGroup.parent;
        }
        const mol = spawnedRef.current.find((m) => m.group === hitGroup);
        if (mol) {
          isDraggingRef.current = true;
          draggedMolRef.current = mol;
          // Kéo trên mặt phẳng "cửa sổ" z=0 để các phân tử hội tụ về cùng một
          // độ sâu — đảm bảo phản ứng (proximity 3D) luôn kích hoạt được, đồng
          // thời các phân tử chưa cầm vẫn giữ độ sâu riêng cho hiệu ứng parallax.
          dragPlane.set(new THREE.Vector3(0, 0, 1), 0);
          mol.grabbedBy = -1; // -1 means grabbed by mouse
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (isDraggingRef.current && draggedMolRef.current) {
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
          draggedMolRef.current.group.position.copy(intersection);
        }
        setTrashHot(isOverTrash(e.clientX, e.clientY));
        if (hoveredElRef.current !== null) {
          hoveredElRef.current = null;
          setHoveredAtom(null);
        }
      } else if (!arOnRef.current) {
        setTrashHot(false);
        // Hover detection (Chỉ áp dụng cho Lab 3D / Sim)
        const meshes = spawnedRef.current.map((m) => m.group);
        const intersects = raycaster.intersectObjects(meshes, true);
        if (intersects.length > 0) {
          const obj = intersects[0].object;
          if (obj.userData?.isAtom) {
            const el = obj.userData.el;
            if (hoveredElRef.current !== el) {
              hoveredElRef.current = el;
              setHoveredAtom({ symbol: el, x: e.clientX, y: e.clientY });
            }
          } else if (hoveredElRef.current !== null) {
            hoveredElRef.current = null;
            setHoveredAtom(null);
          }
        } else if (hoveredElRef.current !== null) {
          hoveredElRef.current = null;
          setHoveredAtom(null);
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current && draggedMolRef.current) {
        const dragged = draggedMolRef.current;
        dragged.grabbedBy = null;
        if (isOverTrash(e.clientX, e.clientY)) {
          removeSpawnedMolecule(dragged);
          setTrashHot(false);
          return;
        }
        isDraggingRef.current = false;
        draggedMolRef.current = null;
        setTrashHot(false);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Scroll-zoom (chế độ mô phỏng / khi không bật AR): điều chỉnh khoảng cách
    // camera theo trục Z. Khi đang head-tracking, off-axis projection sẽ tự
    // quản lý vị trí mắt nên ta bỏ qua wheel để tránh xung đột.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;
      if (!cam) return;
      if (headTrackingRef.current && arOnRef.current) return;
      const next = cam.position.z + e.deltaY * 0.01;
      const clamped = Math.max(3, Math.min(20, next));
      cam.position.z = clamped;
      baseCameraZRef.current = clamped;
      // Đồng bộ "mắt ảo" để updateCamera không kéo camera về mặc định ngay sau đó.
      eyeRef.current.z = clamped;
      cam.updateProjectionMatrix();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let rafId = 0;
    let lastHandTs = -1;

    // Hằng số "cửa sổ" cho off-axis projection (đơn vị world).
    // Khớp với khung nhìn mặc định (camera z=8, fov 55°) để khi không có
    // head-tracking, ảnh nhìn gần như cũ.
    const NEAR = 0.1;
    const FAR = 100;

    const loop = async () => {
      rafId = requestAnimationFrame(loop);
      const video = videoRef.current;
      const landmarker = (
        window as unknown as { __hl?: Awaited<ReturnType<typeof initHandLandmarker>> }
      ).__hl;
      if (video && video.readyState >= 2 && landmarker) {
        const ts = performance.now();
        if (ts !== lastHandTs) {
          try {
            const result = landmarker.detectForVideo(video, ts);
            handFrameRef.current = processResult(result, ts);
            setHandCount(handFrameRef.current.hands.length);
            lastHandTs = ts;
          } catch {
            /* MediaPipe occasionally throws on odd timestamps */
          }
        }
      }

      // Head tracking (chỉ khi bật + AR đang mở để có video).
      const faceDet = faceDetectorRef.current;
      if (headTrackingRef.current && arOnRef.current && video && video.readyState >= 2 && faceDet) {
        const ts = performance.now() + 1; // lệch 1ms để không trùng timestamp với hand
        if (ts !== lastFaceTsRef.current) {
          try {
            const res = faceDet.detectForVideo(video, ts);
            const pose = processFaceResult(res, video.videoWidth, video.videoHeight);
            headPoseRef.current = pose;
            lastFaceTsRef.current = ts;
          } catch {
            /* bỏ qua timestamp lỗi */
          }
        }
      } else {
        headPoseRef.current = null;
      }

      updateCamera(NEAR, FAR);

      // Drive molecule positions from hand state.
      updateMolecules();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(rafId);
      renderer.dispose();
      // clear scene
      spawnedRef.current.forEach((s) => scene.remove(s.group));
      spawnedRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start camera + hand tracking when arOn becomes true.
  useEffect(() => {
    if (!arOn) {
      setStatus("AR off");
      const v = videoRef.current;
      if (v && v.srcObject) {
        (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        v.srcObject = null;
      }
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setStatus("Starting camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setStatus("Loading hand tracker...");
        const hl = await initHandLandmarker();
        (window as unknown as { __hl?: unknown }).__hl = hl;
        setStatus("Ready — raise your hand!");
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Camera error";
        setStatus("Camera: " + msg);
        // Camera bị từ chối/không khả dụng — báo cho người dùng và vẫn giữ cảnh
        // hoạt động (phân tử vẫn spawn/kéo bằng chuột, giống chế độ mô phỏng).
        toast.error("Không thể bật camera", {
          description:
            "Phòng thí nghiệm vẫn hoạt động ở chế độ 3D — bạn có thể kéo thả phân tử bằng chuột. Hãy cấp quyền camera để dùng AR.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [arOn]);

  // Spawn molecule when parent asks.
  useEffect(() => {
    if (!toSpawn || !sceneRef.current) return;
    const { group, labels } = buildMoleculeGroup(toSpawn, educationRef.current);
    // Spawn near center, slight random offset. Thêm độ lệch trục Z để hiệu ứng
    // parallax (head-tracking) tạo cảm giác chiều sâu rõ rệt — vật ở trước/sau
    // mặt phẳng màn hình (z=0).
    group.position.set(
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 1,
      (Math.random() - 0.5) * 3,
    );
    sceneRef.current.add(group);
    spawnedRef.current.push({
      id: crypto.randomUUID(),
      formula: toSpawn.formula,
      group,
      labels,
      grabbedBy: null,
      baseScale: 1,
      spawnedAt: performance.now(),
    });
    syncSpawnedState();
    setTrashHot(false);
    spawnBurst(sceneRef.current, group.position.clone(), "#67d0ff");
    onSpawned();
  }, [toSpawn, onSpawned]);

  // Reset signal clears scene.
  useEffect(() => {
    if (resetSignal === 0) return;
    const s = sceneRef.current;
    if (!s) return;
    spawnedRef.current.forEach((m) => s.remove(m.group));
    spawnedRef.current = [];
    pendingReactionRef.current = null;
    setReactionHint(null);
    syncSpawnedState();
    setTrashHot(false);
  }, [resetSignal]);

  // Tự tắt hiệu ứng chớp sáng sau một nhịp ngắn.
  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 650);
    return () => clearTimeout(id);
  }, [flash]);

  // Khởi tạo FaceDetector khi bật head-tracking + AR.
  useEffect(() => {
    if (!headTracking || !arOn) return;
    let cancelled = false;
    initFaceDetector()
      .then((d) => {
        if (!cancelled) faceDetectorRef.current = d;
      })
      .catch(() => {
        /* không tải được model — bỏ qua, lab vẫn chạy bình thường */
      });
    return () => {
      cancelled = true;
    };
  }, [headTracking, arOn]);

  // Toggle labels when education mode changes.
  useEffect(() => {
    spawnedRef.current.forEach((m) => {
      m.labels.forEach((l) => (l.visible = educationMode));
    });
  }, [educationMode]);

  // Cập nhật camera mỗi frame: nếu bật head-tracking và thấy mặt thì áp dụng
  // off-axis projection theo vị trí đầu; nếu không thì dùng perspective chuẩn.
  function updateCamera(near: number, far: number) {
    const camera = cameraRef.current;
    const wrap = wrapRef.current;
    if (!camera || !wrap) return;

    const aspect = wrap.clientWidth / Math.max(1, wrap.clientHeight);
    // Nửa kích thước "cửa sổ" màn hình (world units) — chọn để khớp khung nhìn cũ.
    const screenHalfH = 4.2;
    const screenHalfW = screenHalfH * aspect;

    const pose = headPoseRef.current;
    const wantHead = headTrackingRef.current && arOnRef.current && !!pose;

    if (wantHead && pose) {
      // pose.x,y: 0..1 trong khung webcam (chưa mirror). Mirror X cho selfie.
      // Đưa về [-1,1], 0 = giữa.
      const nx = (0.5 - pose.x) * 2; // mirror
      const ny = (pose.y - 0.5) * 2;

      // Biên độ dịch mắt theo phương ngang/dọc (world units).
      const AMP_X = 6.5;
      const AMP_Y = 4.0;
      // size ~ inter-eye distance (0.04 xa .. 0.2 gần). Map sang khoảng cách camera.
      const s = Math.min(0.25, Math.max(0.05, pose.size));
      const t = (s - 0.05) / (0.25 - 0.05); // 0 (xa) .. 1 (gần)
      const targetZ = 9.5 - t * 4.0; // gần hơn => z nhỏ hơn => zoom vào

      const target = { x: nx * AMP_X, y: ny * AMP_Y, z: targetZ };
      // Làm mượt (low-pass) để tránh giật.
      const k = 0.18;
      eyeRef.current.x += (target.x - eyeRef.current.x) * k;
      eyeRef.current.y += (target.y - eyeRef.current.y) * k;
      eyeRef.current.z += (target.z - eyeRef.current.z) * k;

      if (!headActive) setHeadActive(true);
      applyOffAxisProjection(camera, eyeRef.current, screenHalfW, screenHalfH, near, far);
    } else {
      // Trả camera về trạng thái chuẩn (mượt) khi không có head-tracking.
      const baseZ = baseCameraZRef.current;
      const target = { x: 0, y: 0, z: baseZ };
      const k = 0.12;
      eyeRef.current.x += (target.x - eyeRef.current.x) * k;
      eyeRef.current.y += (target.y - eyeRef.current.y) * k;
      eyeRef.current.z += (target.z - eyeRef.current.z) * k;

      const drifting =
        Math.abs(eyeRef.current.x) > 0.01 ||
        Math.abs(eyeRef.current.y) > 0.01 ||
        Math.abs(eyeRef.current.z - baseZ) > 0.01;

      if (drifting) {
        // vẫn dùng off-axis để nội suy mượt về giữa
        applyOffAxisProjection(camera, eyeRef.current, screenHalfW, screenHalfH, near, far);
      } else {
        eyeRef.current.x = 0;
        eyeRef.current.y = 0;
        eyeRef.current.z = baseZ;
        camera.position.set(0, 0, baseZ);
        camera.quaternion.identity();
        camera.fov = 55;
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
      }
      if (headActive) setHeadActive(false);
    }
  }

  function updateMolecules() {
    const scene = sceneRef.current;
    if (!scene) return;
    const frame = handFrameRef.current;
    const now = performance.now();

    // Hiệu ứng phóng to khi sản phẩm mới xuất hiện.
    spawnedRef.current.forEach((m) => {
      if (m.scaleIn) {
        const t = (now - m.scaleIn.start) / m.scaleIn.duration;
        if (t >= 1) {
          m.group.scale.setScalar(m.baseScale);
          m.scaleIn = undefined;
        } else {
          // ease-out-back nhẹ
          const k = 1 - Math.pow(1 - t, 3);
          const overshoot = Math.sin(t * Math.PI) * 0.18;
          m.group.scale.setScalar(m.baseScale * (k + overshoot));
        }
      }
    });

    // Nếu đang có phản ứng trong pha "tích tụ", xử lý riêng và bỏ qua phần còn lại.
    if (pendingReactionRef.current) {
      advancePendingReaction(now);
      return;
    }

    // Map normalized hand coords -> world coords (mirror X for selfie).
    const handsWorld = frame.hands.map((h) => ({
      ...h,
      world: new THREE.Vector3(
        (0.5 - h.palm.x) * 10, // mirror + scale
        -(h.palm.y - 0.5) * 6,
        0,
      ),
    }));

    // Handle two-hand scaling: if both hands are pinching the same molecule,
    // use their distance to rescale.
    const grabbedByAny = new Map<number, number[]>(); // handIdx -> [molIdx...]
    void grabbedByAny;

    // First pass: update grabs
    spawnedRef.current.forEach((m) => {
      if (m.grabbedBy === -1) {
        m.group.rotation.y += 0.01;
        return; // Skip hand logic, being dragged by mouse
      }

      // find nearest hand
      let nearestIdx = -1;
      let nearestDist = Infinity;
      handsWorld.forEach((h, i) => {
        const d = h.world.distanceTo(m.group.position);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      });

      const nearest = nearestIdx >= 0 ? handsWorld[nearestIdx] : null;
      if (nearest && nearest.pinch > 0.55 && nearestDist < 2.5) {
        m.grabbedBy = nearestIdx;
      } else if (m.grabbedBy !== null) {
        const h = handsWorld[m.grabbedBy];
        if (!h || h.pinch < 0.35) m.grabbedBy = null;
      }

      if (m.grabbedBy !== null && handsWorld[m.grabbedBy]) {
        const h = handsWorld[m.grabbedBy];
        // Smooth position
        m.group.position.lerp(h.world, 0.35);
        // Rotate based on wrist roll
        m.group.rotation.z = -h.roll;
        m.group.rotation.y += 0.01;
      } else {
        // idle gentle rotation
        m.group.rotation.y += 0.004;
        m.group.rotation.x += 0.002;
      }
    });

    // Two-hand scaling: if any molecule is grabbed and both hands exist,
    // scale the most-recent molecule with hand distance.
    if (handsWorld.length === 2 && spawnedRef.current.length > 0) {
      const anyGrabbed = spawnedRef.current.find((m) => m.grabbedBy !== null);
      if (anyGrabbed && handsWorld[0].pinch > 0.5 && handsWorld[1].pinch > 0.5) {
        const d = handsWorld[0].world.distanceTo(handsWorld[1].world);
        const targetScale = Math.max(0.5, Math.min(2.5, d / 4));
        anyGrabbed.group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      }
    }

    // Reaction check: any two molecules within threshold
    let hintShown = false;
    for (let i = 0; i < spawnedRef.current.length; i++) {
      for (let j = i + 1; j < spawnedRef.current.length; j++) {
        const a = spawnedRef.current[i],
          b = spawnedRef.current[j];
        if (now - a.spawnedAt < 400 || now - b.spawnedAt < 400) continue;
        const d = a.group.position.distanceTo(b.group.position);
        const rx = findMatchingReaction([a.formula, b.formula], reactionsRef.current);
        if (!rx) continue;

        // Gợi ý "sắp phản ứng" khi lại gần (trong vùng 2x ngưỡng).
        if (d < PROXIMITY_THRESHOLD * 2.2 && !hintShown) {
          const v = reactionVisual(rx);
          setReactionHint((prev) =>
            prev?.label === v.label ? prev : { label: v.label, icon: v.icon },
          );
          hintShown = true;
        }

        if (d < PROXIMITY_THRESHOLD) {
          beginReaction(a, b, rx);
          return;
        }
      }
    }
    if (!hintShown) setReactionHint((prev) => (prev === null ? prev : null));
  }

  // Bắt đầu pha "tích tụ": hai chất phản ứng bị hút về tâm + phát sáng.
  function beginReaction(a: SpawnedMol, b: SpawnedMol, rx: Reaction) {
    const center = a.group.position.clone().add(b.group.position).multiplyScalar(0.5);
    a.grabbedBy = null;
    b.grabbedBy = null;
    a.reacting = true;
    b.reacting = true;
    pendingReactionRef.current = {
      a,
      b,
      rx,
      visual: reactionVisual(rx),
      center,
      startedAt: performance.now(),
    };
    setReactionHint(null);
  }

  // Cập nhật pha "tích tụ" mỗi frame; khi đủ thời gian thì tạo sản phẩm.
  function advancePendingReaction(now: number) {
    const p = pendingReactionRef.current;
    const scene = sceneRef.current;
    if (!p || !scene) return;
    const t = (now - p.startedAt) / REACTION_WINDUP_MS;

    // Hút 2 chất về tâm + rung + co lại nhẹ.
    [p.a, p.b].forEach((m) => {
      m.group.position.lerp(p.center, 0.18);
      const shake = Math.sin(now * 0.05) * 0.04 * t;
      m.group.position.x += shake;
      m.group.rotation.y += 0.12;
      const s = m.baseScale * (1 - 0.35 * t);
      m.group.scale.setScalar(Math.max(0.05, s));
    });

    // Phát một ít hạt "tích điện" hút vào tâm.
    if (Math.random() < 0.5) {
      spawnBurst(scene, p.center.clone(), p.visual.particleColors[1], {
        count: 6,
        size: 0.1,
        speed: 1.2,
        life: 0.5,
      });
    }

    if (t >= 1) {
      commitReaction(p);
      pendingReactionRef.current = null;
    }
  }

  function commitReaction(p: PendingReaction) {
    const scene = sceneRef.current;
    if (!scene) return;
    const { a, b, rx, visual, center } = p;

    // Remove reactants
    scene.remove(a.group);
    scene.remove(b.group);
    spawnedRef.current = spawnedRef.current.filter((m) => m !== a && m !== b);
    syncSpawnedState();
    setTrashHot(false);

    // Hiệu ứng theo loại phản ứng.
    const [c1, c2] = visual.particleColors;
    spawnShockwave(scene, center, c1);
    spawnBurst(scene, center, c1, { count: 90, size: 0.2, speed: 6, life: 1.3 });
    spawnBurst(scene, center, c2, { count: 60, size: 0.14, speed: 3.5, life: 1.1 });
    if (visual.kind === "combustion") {
      // lửa bay lên
      spawnBurst(scene, center, "#ffd166", {
        count: 50,
        size: 0.22,
        speed: 2,
        life: 1.6,
        gravity: -3,
      });
    }
    spawnEquationSprite(scene, center, rx.equation);

    // Chớp sáng toàn màn hình (đỏ-cam nếu toả nhiệt, xanh nếu thu nhiệt).
    setFlash({
      color:
        visual.exothermic === true
          ? "rgba(255,138,80,0.28)"
          : visual.exothermic === false
            ? "rgba(110,160,255,0.26)"
            : "rgba(167,139,250,0.24)",
      key: performance.now(),
    });

    // Spawn products với hiệu ứng phóng to.
    const productDefs = rx.products
      .map((pf) => moleculesRef.current.find((m) => m.formula === pf))
      .filter(Boolean) as Molecule[];

    productDefs.forEach((def, idx) => {
      const { group, labels } = buildMoleculeGroup(def, educationRef.current);
      const spread = (idx - (productDefs.length - 1) / 2) * 2.2;
      group.position.copy(center).add(new THREE.Vector3(spread, 0, 0));
      group.scale.setScalar(0.05);
      scene.add(group);
      spawnedRef.current.push({
        id: crypto.randomUUID(),
        formula: def.formula,
        group,
        labels,
        grabbedBy: null,
        baseScale: 1,
        spawnedAt: performance.now(),
        scaleIn: { start: performance.now(), duration: 420 },
      });
    });

    syncSpawnedState();
    onReactionRef.current(rx);
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden rounded-none">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        playsInline
        muted
      />
      {!arOn && (
        <div className="absolute inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,transparent_0%,var(--background)_100%)]"></div>
          {!hasSpawnedMolecules && (
            <div className="text-center px-6 z-0 pointer-events-none select-none opacity-20 flex flex-col items-center">
              <div className="text-7xl mb-4 grayscale animate-float-slow">🧪</div>
              <h2 className="font-display text-2xl font-bold tracking-widest uppercase text-muted-foreground">
                Workspace
              </h2>
            </div>
          )}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing"
      />

      {/* Chớp sáng toàn màn hình khi phản ứng xảy ra */}
      {flash && (
        <div
          key={flash.key}
          className="pointer-events-none absolute inset-0 z-30 animate-reaction-flash"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${flash.color}, transparent 70%)`,
          }}
        />
      )}

      {/* Gợi ý "sắp phản ứng" */}
      {reactionHint && (
        <div className="pointer-events-none absolute top-16 left-1/2 -translate-x-1/2 z-30 rounded-full bg-card/85 backdrop-blur-xl border border-primary/40 px-4 py-1.5 text-xs font-medium shadow-glow animate-pulse-glow flex items-center gap-2">
          <span className="text-base">{reactionHint.icon}</span>
          <span className="text-foreground">Sắp xảy ra: {reactionHint.label}</span>
          <span className="text-muted-foreground">— đưa lại gần để phản ứng</span>
        </div>
      )}

      {!arOn && (
        <MoleculeInfoTooltip
          elementSymbol={hoveredAtom?.symbol ?? null}
          x={hoveredAtom?.x ?? 0}
          y={hoveredAtom?.y ?? 0}
          onClose={() => {
            hoveredElRef.current = null;
            setHoveredAtom(null);
          }}
        />
      )}

      <div className="absolute top-3 left-3 rounded-full bg-card/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-soft">
        <span className={handCount > 0 ? "text-primary" : "text-muted-foreground"}>
          ✋ {handCount} {handCount === 1 ? "hand" : "hands"}
        </span>
        <span className="mx-2 text-border">•</span>
        <span className="text-muted-foreground">{status}</span>
        {headTracking && (
          <>
            <span className="mx-2 text-border">•</span>
            <span className={headActive ? "text-primary" : "text-muted-foreground"}>
              🧠 {headActive ? "3D theo đầu" : "tìm khuôn mặt…"}
            </span>
          </>
        )}
      </div>

      <div
        ref={trashRef}
        className={`pointer-events-auto absolute bottom-6 right-6 z-50 flex h-20 w-20 flex-col items-center justify-center rounded-3xl border border-border/60 bg-card/85 backdrop-blur-xl shadow-2xl transition-all duration-200 ${trashHot ? "scale-105 border-destructive/60 bg-destructive/15 shadow-[0_0_0_1px_rgba(239,68,68,0.25)]" : "hover:border-destructive/30 hover:bg-destructive/10"}`}
      >
        <div
          className={`text-2xl transition-transform duration-200 ${trashHot ? "scale-110" : ""}`}
        >
          🗑️
        </div>
        <div
          className={`mt-1 text-[10px] uppercase tracking-[0.3em] ${trashHot ? "text-destructive" : "text-muted-foreground"}`}
        >
          Trash
        </div>
      </div>
    </div>
  );
}
