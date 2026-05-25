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
import { elementInfo, type Molecule } from "@/lib/chemistry";
import { findMatchingReaction, PROXIMITY_THRESHOLD } from "@/lib/reaction-engine";
import type { Reaction } from "@/lib/chemistry";

type SpawnedMol = {
  id: string;
  formula: string;
  group: THREE.Group;
  labels: THREE.Sprite[];
  grabbedBy: number | null; // hand index or null
  baseScale: number;
  spawnedAt: number;
};

type Props = {
  molecules: Molecule[];
  reactions: Reaction[];
  toSpawn: Molecule | null; // parent sets, we consume
  onSpawned: () => void;
  resetSignal: number;
  educationMode: boolean;
  onReaction: (r: Reaction) => void;
  arOn: boolean;
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
function spawnBurst(scene: THREE.Scene, position: THREE.Vector3, color: string) {
  const count = 60;
  const geom = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = position.x;
    pos[i * 3 + 1] = position.y;
    pos[i * 3 + 2] = position.z;
    vel.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      ),
    );
  }
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size: 0.18, transparent: true, opacity: 1 });
  const points = new THREE.Points(geom, mat);
  scene.add(points);
  const start = performance.now();
  const tick = () => {
    const t = (performance.now() - start) / 1000;
    const arr = geom.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += vel[i].x * 0.016;
      arr[i * 3 + 1] += vel[i].y * 0.016;
      arr[i * 3 + 2] += vel[i].z * 0.016;
      vel[i].multiplyScalar(0.94);
    }
    geom.attributes.position.needsUpdate = true;
    mat.opacity = Math.max(0, 1 - t / 1.2);
    if (t < 1.2) requestAnimationFrame(tick);
    else {
      scene.remove(points);
      geom.dispose();
      mat.dispose();
    }
  };
  requestAnimationFrame(tick);
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
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Initializing...");
  const [handCount, setHandCount] = useState(0);

  const spawnedRef = useRef<SpawnedMol[]>([]);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const handFrameRef = useRef<HandFrame>({ hands: [], timestamp: 0 });
  const educationRef = useRef(educationMode);
  const reactionsRef = useRef(reactions);
  const moleculesRef = useRef(molecules);
  const onReactionRef = useRef(onReaction);

  // Mouse drag refs
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const isDraggingRef = useRef(false);
  const draggedMolRef = useRef<SpawnedMol | null>(null);
  const intersectionRef = useRef(new THREE.Vector3());

  educationRef.current = educationMode;
  reactionsRef.current = reactions;
  moleculesRef.current = molecules;
  onReactionRef.current = onReaction;

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

    const onPointerDown = (e: any) => {
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
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          dragPlane.setFromNormalAndCoplanarPoint(camDir, mol.group.position);
          mol.grabbedBy = -1; // -1 means grabbed by mouse
        }
      }
    };

    const onPointerMove = (e: any) => {
      if (!isDraggingRef.current || !draggedMolRef.current) return;
      const rect = wrap.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
        draggedMolRef.current.group.position.copy(intersection);
      }
    };

    const onPointerUp = () => {
      if (isDraggingRef.current && draggedMolRef.current) {
        draggedMolRef.current.grabbedBy = null;
        isDraggingRef.current = false;
        draggedMolRef.current = null;
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let rafId = 0;
    let lastHandTs = -1;

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
    // Spawn near center, slight random offset
    group.position.set((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1, 0);
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
  }, [resetSignal]);

  // Toggle labels when education mode changes.
  useEffect(() => {
    spawnedRef.current.forEach((m) => {
      m.labels.forEach((l) => (l.visible = educationMode));
    });
  }, [educationMode]);

  function updateMolecules() {
    const scene = sceneRef.current;
    if (!scene) return;
    const frame = handFrameRef.current;
    const now = performance.now();

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
    for (let i = 0; i < spawnedRef.current.length; i++) {
      for (let j = i + 1; j < spawnedRef.current.length; j++) {
        const a = spawnedRef.current[i],
          b = spawnedRef.current[j];
        if (now - a.spawnedAt < 400 || now - b.spawnedAt < 400) continue;
        const d = a.group.position.distanceTo(b.group.position);
        if (d < PROXIMITY_THRESHOLD) {
          const rx = findMatchingReaction([a.formula, b.formula], reactionsRef.current);
          if (rx) {
            triggerReaction(a, b, rx);
            return;
          }
        }
      }
    }
  }

  function triggerReaction(a: SpawnedMol, b: SpawnedMol, rx: Reaction) {
    const scene = sceneRef.current;
    if (!scene) return;
    const center = a.group.position.clone().add(b.group.position).multiplyScalar(0.5);

    // Remove reactants
    scene.remove(a.group);
    scene.remove(b.group);
    spawnedRef.current = spawnedRef.current.filter((m) => m !== a && m !== b);

    spawnBurst(scene, center, "#ffb86b");
    spawnBurst(scene, center, "#7de2ff");

    // Spawn products
    rx.products.forEach((pf, idx) => {
      const def = moleculesRef.current.find((m) => m.formula === pf);
      if (!def) return;
      const { group, labels } = buildMoleculeGroup(def, educationRef.current);
      group.position.copy(center).add(new THREE.Vector3((idx - 0.5) * 2, 0, 0));
      scene.add(group);
      spawnedRef.current.push({
        id: crypto.randomUUID(),
        formula: pf,
        group,
        labels,
        grabbedBy: null,
        baseScale: 1,
        spawnedAt: performance.now(),
      });
    });

    onReactionRef.current(rx);
  }

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden rounded-3xl">
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
          <div className="text-center px-6 z-0 pointer-events-none select-none opacity-20 flex flex-col items-center">
            <div className="text-7xl mb-4 grayscale animate-float-slow">🧪</div>
            <h2 className="font-display text-2xl font-bold tracking-widest uppercase text-muted-foreground">
              Workspace
            </h2>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none cursor-grab active:cursor-grabbing" />
      <div className="absolute top-3 left-3 rounded-full bg-card/80 backdrop-blur px-3 py-1.5 text-xs font-medium shadow-soft">
        <span className={handCount > 0 ? "text-primary" : "text-muted-foreground"}>
          ✋ {handCount} {handCount === 1 ? "hand" : "hands"}
        </span>
        <span className="mx-2 text-border">•</span>
        <span className="text-muted-foreground">{status}</span>
      </div>
    </div>
  );
}
