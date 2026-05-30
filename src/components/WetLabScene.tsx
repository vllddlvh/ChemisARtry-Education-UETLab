// WetLabScene.tsx
// Phòng thí nghiệm ướt 3D chân thực: bàn đá, giá gỗ, ống nghiệm thuỷ tinh
// (transmission + reflection từ environment), chất lỏng có mặt khum (meniscus),
// đèn cồn (bunsen) với ngọn lửa thật, bong bóng/kết tủa/khói/hơi nước.
//
// Người dùng chọn thuốc thử rồi bấm vào ống nghiệm để rót (có animation dòng
// chảy) và quan sát phản ứng.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { findLabReaction, getReagent, type LabReaction } from "@/lib/lab-experiments";
import { playClink, playPour, playPuff, startFizz, startSizzle } from "@/lib/lab-audio";

type FizzHandle = { stop: () => void };

export type TubeView = {
  index: number;
  contents: string[];
  label: string;
};

type Props = {
  tubeCount?: number;
  selectedReagent: string | null;
  selectedReagentColor?: string | null;
  heatedTube: number | null;
  onPour?: (tubeIndex: number, reagentId: string) => void;
  onReaction?: (tubeIndex: number, reaction: LabReaction) => void;
  onTubesChange?: (tubes: TubeView[]) => void;
  resetSignal: number;
  /** Tăng để đổ bỏ riêng ống đang chọn (activeTube). */
  clearTubeSignal?: number;
  activeTube: number | null;
  onSelectTube?: (index: number | null) => void;
};

type Pour = {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  t: number;
};

type TubeState = {
  index: number;
  group: THREE.Group;
  liquid: THREE.Mesh;
  liquidMat: THREE.MeshPhysicalMaterial;
  meniscus: THREE.Mesh;
  glassMats: THREE.MeshPhysicalMaterial[]; // vật liệu thuỷ tinh (để làm nóng đỏ)
  glow: THREE.Mesh; // highlight halo
  label: THREE.Sprite;
  labelText: string;
  level: number;
  targetLevel: number;
  color: THREE.Color;
  targetColor: THREE.Color;
  contents: string[];
  bubbles?: THREE.Points;
  bubbleVel?: Float32Array;
  bubbleRate: number; // hệ số tốc độ bọt theo intensity
  foam?: THREE.Points; // bọt trào miệng ống
  precipitate?: THREE.Points;
  precipY?: Float32Array;
  smoke?: THREE.Points;
  steam?: THREE.Points;
  glowDisk?: THREE.PointLight; // ánh sáng phát quang dung dịch
  heatGlow?: THREE.PointLight;
  flame?: THREE.Group;
  fizzSound?: FizzHandle | null;
  sizzleSound?: FizzHandle | null;
  hot: number; // 0..1 độ nóng của thuỷ tinh
  ripple: number; // biên độ gợn sóng mặt chất lỏng
  reacted: boolean;
  shakeUntil: number;
};

const TUBE_HEIGHT = 2.6;
const TUBE_RADIUS = 0.4;
const TUBE_INNER = 0.33;

export default function WetLabScene({
  tubeCount = 5,
  selectedReagent,
  selectedReagentColor,
  heatedTube,
  onPour,
  onReaction,
  onTubesChange,
  resetSignal,
  clearTubeSignal = 0,
  activeTube,
  onSelectTube,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const tubesRef = useRef<TubeState[]>([]);
  const poursRef = useRef<Pour[]>([]);

  const selectedReagentRef = useRef(selectedReagent);
  const selectedColorRef = useRef(selectedReagentColor);
  const heatedTubeRef = useRef(heatedTube);
  const activeTubeRef = useRef(activeTube);
  const onPourRef = useRef(onPour);
  const onReactionRef = useRef(onReaction);
  const onTubesChangeRef = useRef(onTubesChange);
  const onSelectTubeRef = useRef(onSelectTube);

  selectedReagentRef.current = selectedReagent;
  selectedColorRef.current = selectedReagentColor;
  heatedTubeRef.current = heatedTube;
  activeTubeRef.current = activeTube;
  onPourRef.current = onPour;
  onReactionRef.current = onReaction;
  onTubesChangeRef.current = onTubesChange;
  onSelectTubeRef.current = onSelectTube;

  const orbitRef = useRef({
    theta: 0.0,
    phi: 1.18,
    radius: 9.5,
    targetTheta: 0,
    targetPhi: 1.18,
    targetRadius: 9.5,
    dragging: false,
    lx: 0,
    ly: 0,
  });

  const emitTubes = () => {
    const views: TubeView[] = tubesRef.current.map((t) => ({
      index: t.index,
      contents: [...t.contents],
      label: t.contents.map((id) => getReagent(id)?.formula ?? id).join(" + "),
    }));
    onTubesChangeRef.current?.(views);
  };

  // Vẽ nhãn nổi (sprite) hiển thị nội dung ống nghiệm trên một canvas.
  const drawLabelCanvas = (lines: string[], accent: string): HTMLCanvasElement => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 200;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // thẻ bo tròn
    const w = canvas.width - 24;
    const h = 120;
    const x = 12;
    const y = 40;
    const r = 28;
    ctx.fillStyle = "rgba(13,20,33,0.88)";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // mũi nhọn chỉ xuống ống
    ctx.fillStyle = "rgba(13,20,33,0.88)";
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 16, y + h - 2);
    ctx.lineTo(canvas.width / 2 + 16, y + h - 2);
    ctx.lineTo(canvas.width / 2, y + h + 28);
    ctx.closePath();
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (lines.length === 1) {
      ctx.fillStyle = "#eaf6ff";
      ctx.font = "bold 52px 'JetBrains Mono', monospace";
      ctx.fillText(lines[0], canvas.width / 2, y + h / 2);
    } else {
      ctx.fillStyle = accent;
      ctx.font = "bold 30px Inter, sans-serif";
      ctx.fillText(lines[0], canvas.width / 2, y + 36);
      ctx.fillStyle = "#eaf6ff";
      ctx.font = "bold 40px 'JetBrains Mono', monospace";
      ctx.fillText(lines[1], canvas.width / 2, y + 82);
    }
    return canvas;
  };

  const updateTubeLabel = (tube: TubeState) => {
    const formulas = tube.contents.map((id) => getReagent(id)?.formula ?? id);
    const text = formulas.join(" + ");
    if (text === tube.labelText) return;
    tube.labelText = text;

    const sprite = tube.label;
    const oldMat = sprite.material as THREE.SpriteMaterial;
    oldMat.map?.dispose();

    if (!text) {
      sprite.visible = false;
      return;
    }
    sprite.visible = true;
    const accent = tube.reacted ? "#5eead4" : "#7dd3fc";
    const lines = formulas.length > 1 ? [`Ống ${tube.index + 1}`, text] : [text];
    const canvas = drawLabelCanvas(lines, accent);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    oldMat.map = tex;
    oldMat.needsUpdate = true;
  };

  // ── Pouring stream animation ──
  const spawnPourStream = (tube: TubeState, colorHex: string) => {
    const scene = sceneRef.current!;
    const start = new THREE.Vector3();
    tube.group.getWorldPosition(start);
    start.y += TUBE_HEIGHT / 2 + 2.2;
    const geo = new THREE.CylinderGeometry(0.05, 0.09, 2.2, 8, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.75,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(start);
    scene.add(mesh);
    poursRef.current.push({ mesh, mat, t: 0 });
  };

  const pourInto = (tube: TubeState, reagentId: string) => {
    const reagent = getReagent(reagentId);
    if (!reagent) return;

    tube.contents.push(reagentId);
    spawnPourStream(tube, reagent.color);
    tube.shakeUntil = performance.now() + 250;
    tube.ripple = 1;
    playClink();
    playPour();

    const add = reagent.phase === "liquid" || reagent.phase === "indicator" ? 0.3 : 0.08;
    tube.targetLevel = Math.min(0.9, tube.targetLevel + add);
    if (tube.targetLevel < 0.18) tube.targetLevel = 0.3;

    const rc = new THREE.Color(reagent.color);
    if (tube.contents.length === 1) tube.targetColor.copy(rc);
    else tube.targetColor.lerp(rc, 0.5);

    onPourRef.current?.(tube.index, reagentId);

    updateTubeLabel(tube);

    const heated = heatedTubeRef.current === tube.index;
    const reaction = findLabReaction(tube.contents, heated);
    if (reaction && !tube.reacted) {
      // chờ dòng chảy chạm đáy rồi mới phản ứng
      setTimeout(() => applyReaction(tube, reaction), 450);
    }
    emitTubes();
  };

  const applyReaction = (tube: TubeState, reaction: LabReaction) => {
    if (!sceneRef.current) return;
    tube.reacted = true;
    tube.shakeUntil = performance.now() + 700;
    tube.ripple = 1.5;
    const eff = reaction.effect;
    const intensity = eff.intensity ?? "gentle";
    const rate = intensity === "violent" ? 2.4 : intensity === "vigorous" ? 1.6 : 1;

    if (eff.colorChange) tube.targetColor.set(eff.colorChange);
    if (eff.gas) {
      startBubbles(tube, eff.gasColor ?? "#ffffff", rate);
      if (eff.fizz) startFoam(tube, eff.gasColor ?? "#ffffff");
      playPuff();
      tube.fizzSound?.stop();
      tube.fizzSound = startFizz(
        intensity === "violent" ? 0.95 : intensity === "vigorous" ? 0.65 : 0.4,
      );
    }
    if (eff.precipitate) startPrecipitate(tube, eff.precipitate);
    if (eff.smoke) startSmoke(tube, eff.smoke);
    if (eff.glow) startGlowLight(tube, eff.glow);
    if (eff.temperature === "hot") {
      startHeatGlow(tube);
      startSteam(tube);
    }
    updateTubeLabel(tube);
    onReactionRef.current?.(tube.index, reaction);
  };

  // ── Particle effects ──
  const startBubbles = (tube: TubeState, colorHex: string, rate = 1) => {
    const count = Math.round(48 * Math.min(2.5, rate));
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * TUBE_INNER * 1.5;
      pos[i * 3 + 1] = -TUBE_HEIGHT / 2 + Math.random() * 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * TUBE_INNER * 1.5;
      vel[i] = (0.7 + Math.random() * 1.4) * rate;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.11 + rate * 0.03,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    tube.group.add(pts);
    tube.bubbles = pts;
    tube.bubbleVel = vel;
    tube.bubbleRate = rate;
  };

  // Bọt trào lên miệng ống (foam) khi sủi mạnh.
  const startFoam = (tube: TubeState, colorHex: string) => {
    const count = 50;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * TUBE_INNER;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = TUBE_HEIGHT / 2 - 0.1 + Math.random() * 0.3;
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.2,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    tube.group.add(pts);
    tube.foam = pts;
  };

  // Ánh sáng phát quang trong dung dịch (chemiluminescence).
  const startGlowLight = (tube: TubeState, colorHex: string) => {
    if (tube.glowDisk) return;
    const light = new THREE.PointLight(new THREE.Color(colorHex), 0, 4);
    light.position.set(0, 0, 0);
    tube.group.add(light);
    tube.glowDisk = light;
  };

  const startPrecipitate = (tube: TubeState, colorHex: string) => {
    const count = 90;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const yArr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * TUBE_INNER * 1.6;
      pos[i * 3 + 1] = -TUBE_HEIGHT / 2 + Math.random() * tube.level * TUBE_HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * TUBE_INNER * 1.6;
      yArr[i] = -TUBE_HEIGHT / 2 + Math.random() * 0.6;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.14,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    tube.group.add(pts);
    tube.precipitate = pts;
    tube.precipY = yArr;
  };

  const startSmoke = (tube: TubeState, colorHex: string) => {
    const count = 40;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = TUBE_HEIGHT / 2 + Math.random() * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: colorHex,
      size: 0.55,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    tube.group.add(pts);
    tube.smoke = pts;
  };

  const startSteam = (tube: TubeState) => {
    const count = 24;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 1] = TUBE_HEIGHT / 2 + Math.random() * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.35,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    tube.group.add(pts);
    tube.steam = pts;
  };

  const startHeatGlow = (tube: TubeState) => {
    if (tube.heatGlow) return;
    const glow = new THREE.PointLight(0xff7043, 0, 5);
    glow.position.set(0, -TUBE_HEIGHT / 2, 0);
    tube.group.add(glow);
    tube.heatGlow = glow;
  };

  // ── Bunsen flame (procedural) under heated tube ──
  const buildFlame = (): THREE.Group => {
    const g = new THREE.Group();
    const outer = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 1.0, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: "#ffb74d",
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    outer.position.y = 0.5;
    const inner = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.55, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: "#4fc3f7",
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    inner.position.y = 0.3;
    g.add(outer, inner);
    g.userData.outer = outer;
    g.userData.inner = inner;
    return g;
  };

  const setHeated = (tube: TubeState, on: boolean) => {
    if (on && !tube.flame) {
      const flame = buildFlame();
      flame.position.set(0, -TUBE_HEIGHT / 2 - 1.15, 0);
      tube.group.add(flame);
      tube.flame = flame;
      startHeatGlow(tube);
      tube.sizzleSound?.stop();
      tube.sizzleSound = startSizzle();
      // nếu nội dung cần đun mới phản ứng → kiểm tra lại
      const reaction = findLabReaction(tube.contents, true);
      if (reaction && !tube.reacted) setTimeout(() => applyReaction(tube, reaction), 600);
    } else if (!on && tube.flame) {
      tube.group.remove(tube.flame);
      tube.flame.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      tube.flame = undefined;
      if (tube.heatGlow) {
        tube.group.remove(tube.heatGlow);
        tube.heatGlow = undefined;
      }
      tube.sizzleSound?.stop();
      tube.sizzleSound = null;
    }
  };

  const clearEffects = (tube: TubeState) => {
    const dispose = (p?: THREE.Points) => {
      if (!p) return;
      tube.group.remove(p);
      p.geometry.dispose();
      (p.material as THREE.Material).dispose();
    };
    dispose(tube.bubbles);
    dispose(tube.foam);
    dispose(tube.precipitate);
    dispose(tube.smoke);
    dispose(tube.steam);
    tube.bubbles = undefined;
    tube.foam = undefined;
    tube.precipitate = undefined;
    tube.smoke = undefined;
    tube.steam = undefined;
    if (tube.glowDisk) {
      tube.group.remove(tube.glowDisk);
      tube.glowDisk = undefined;
    }
    tube.fizzSound?.stop();
    tube.fizzSound = null;
    tube.hot = 0;
    setHeated(tube, false);
  };

  const resetTube = (tube: TubeState) => {
    clearEffects(tube);
    tube.contents = [];
    tube.reacted = false;
    tube.targetLevel = 0;
    tube.targetColor.set("#bcdcff");
    updateTubeLabel(tube);
  };

  // ── Setup once ──
  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Environment map cho phản chiếu thuỷ tinh (RoomEnvironment).
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(48, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(5, 11, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -12;
    key.shadow.camera.right = 12;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.bias = -0.0004;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fc4ff, 0.5);
    fill.position.set(-7, 4, -4);
    scene.add(fill);
    // ánh đèn ấm phía trên bàn
    const lamp = new THREE.PointLight(0xfff1d8, 0.6, 30);
    lamp.position.set(0, 8, 3);
    scene.add(lamp);

    // ── Phòng lab ──
    // Sàn phản chiếu nhẹ
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ color: "#0e1622", roughness: 0.55, metalness: 0.15 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -4.6;
    floor.receiveShadow = true;
    scene.add(floor);

    // Tường sau
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 30),
      new THREE.MeshStandardMaterial({ color: "#16212f", roughness: 1 }),
    );
    backWall.position.set(0, 6, -10);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Kệ tường phía sau (trang trí)
    const shelfMat = new THREE.MeshStandardMaterial({ color: "#22303f", roughness: 0.8 });
    for (let s = 0; s < 2; s++) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 1.2), shelfMat);
      shelf.position.set(0, 4 + s * 3, -9.2);
      shelf.castShadow = true;
      scene.add(shelf);
      // vài lọ hoá chất trên kệ
      for (let b = 0; b < 9; b++) {
        const hue = (b * 40) % 360;
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.4, 1.4, 16),
          new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(`hsl(${hue}, 55%, 55%)`),
            roughness: 0.25,
            transmission: 0.4,
            transparent: true,
            opacity: 0.85,
            thickness: 0.5,
          }),
        );
        bottle.position.set(-11 + b * 2.5, 4.85 + s * 3, -9.2);
        bottle.castShadow = true;
        scene.add(bottle);
      }
    }

    // Bàn đá đen
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.6, 10),
      new THREE.MeshStandardMaterial({ color: "#1a222e", roughness: 0.35, metalness: 0.25 }),
    );
    bench.position.y = -2.3;
    bench.receiveShadow = true;
    bench.castShadow = true;
    scene.add(bench);
    // viền bàn
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(20.3, 0.18, 10.3),
      new THREE.MeshStandardMaterial({ color: "#2b3a4d", roughness: 0.5, metalness: 0.3 }),
    );
    edge.position.y = -2.02;
    scene.add(edge);

    // Giá gỗ đỡ ống nghiệm
    const woodMat = new THREE.MeshStandardMaterial({
      color: "#b07d49",
      roughness: 0.65,
      metalness: 0.02,
    });
    const totalW = tubeCount * 1.5;
    const rackBase = new THREE.Mesh(new THREE.BoxGeometry(totalW + 1.2, 0.35, 2.2), woodMat);
    rackBase.position.set(0, -1.85, 0);
    rackBase.castShadow = true;
    rackBase.receiveShadow = true;
    scene.add(rackBase);
    const rackTop = new THREE.Mesh(new THREE.BoxGeometry(totalW + 1.2, 0.28, 1.7), woodMat);
    rackTop.position.set(0, -0.1, 0);
    rackTop.castShadow = true;
    scene.add(rackTop);
    // chân giá
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.85, 1.7), woodMat);
      leg.position.set((sx * (totalW + 1.2)) / 2 - sx * 0.2, -1.0, 0);
      leg.castShadow = true;
      scene.add(leg);
    }
    for (let i = 0; i < tubeCount; i++) {
      const x = -totalW / 2 + 0.75 + i * 1.5;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(TUBE_RADIUS + 0.07, 0.055, 10, 28),
        new THREE.MeshStandardMaterial({ color: "#8a5f33", roughness: 0.7 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.04, 0);
      ring.castShadow = true;
      scene.add(ring);
    }

    // ── Ống nghiệm ──
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: "#ffffff",
      roughness: 0.02,
      metalness: 0,
      transmission: 1.0,
      transparent: true,
      opacity: 1,
      thickness: 0.5,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
    });

    const tubes: TubeState[] = [];
    for (let i = 0; i < tubeCount; i++) {
      const x = -totalW / 2 + 0.75 + i * 1.5;
      const group = new THREE.Group();
      group.position.set(x, -0.5, 0);

      // mỗi ống dùng vật liệu thuỷ tinh riêng để có thể nóng đỏ độc lập
      const tubeGlass = glassMat.clone();

      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(TUBE_RADIUS, TUBE_RADIUS, TUBE_HEIGHT, 40, 1, true),
        tubeGlass,
      );
      body.castShadow = true;
      group.add(body);
      const bottom = new THREE.Mesh(
        new THREE.SphereGeometry(TUBE_RADIUS, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
        tubeGlass,
      );
      bottom.position.y = -TUBE_HEIGHT / 2;
      group.add(bottom);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(TUBE_RADIUS, 0.045, 10, 36), tubeGlass);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = TUBE_HEIGHT / 2;
      group.add(rim);

      const liquidMat = new THREE.MeshPhysicalMaterial({
        color: "#bcdcff",
        roughness: 0.12,
        metalness: 0,
        transmission: 0.4,
        transparent: true,
        opacity: 0.92,
        thickness: 0.6,
        ior: 1.34,
        envMapIntensity: 0.6,
      });
      const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(TUBE_INNER, TUBE_INNER, 1, 32),
        liquidMat,
      );
      liquid.position.y = -TUBE_HEIGHT / 2;
      liquid.scale.y = 0.0001;
      liquid.visible = false;
      group.add(liquid);

      // mặt khum (meniscus) — chỏm cầu trên bề mặt chất lỏng
      const meniscus = new THREE.Mesh(
        new THREE.SphereGeometry(TUBE_INNER, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        liquidMat,
      );
      meniscus.scale.set(1, 0.32, 1);
      meniscus.visible = false;
      group.add(meniscus);

      // halo highlight khi chọn
      const glow = new THREE.Mesh(
        new THREE.CylinderGeometry(
          TUBE_RADIUS + 0.12,
          TUBE_RADIUS + 0.12,
          TUBE_HEIGHT,
          32,
          1,
          true,
        ),
        new THREE.MeshBasicMaterial({
          color: "#5eead4",
          transparent: true,
          opacity: 0,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      group.add(glow);

      // nhãn nổi hiển thị nội dung ống
      const labelSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ transparent: true, depthTest: false, depthWrite: false }),
      );
      labelSprite.scale.set(2.6, 1.02, 1);
      labelSprite.position.set(0, TUBE_HEIGHT / 2 + 1.15, 0);
      labelSprite.visible = false;
      group.add(labelSprite);

      group.userData.tubeIndex = i;
      scene.add(group);

      tubes.push({
        index: i,
        group,
        liquid,
        liquidMat,
        meniscus,
        glassMats: [tubeGlass],
        glow,
        label: labelSprite,
        labelText: "",
        level: 0,
        targetLevel: 0,
        color: new THREE.Color("#bcdcff"),
        targetColor: new THREE.Color("#bcdcff"),
        contents: [],
        bubbleRate: 1,
        hot: 0,
        ripple: 0,
        reacted: false,
        shakeUntil: 0,
      });
    }
    tubesRef.current = tubes;

    // ── Interaction ──
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const setNdc = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const pickTube = (): TubeState | null => {
      raycaster.setFromCamera(ndc, camera);
      const groups = tubesRef.current.map((t) => t.group);
      const hits = raycaster.intersectObjects(groups, true);
      if (hits.length === 0) return null;
      let obj: THREE.Object3D | null = hits[0].object;
      while (obj && obj.userData.tubeIndex === undefined) obj = obj.parent;
      if (!obj) return null;
      return tubesRef.current.find((t) => t.index === obj!.userData.tubeIndex) ?? null;
    };

    let downX = 0;
    let downY = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      setNdc(e);
      downX = e.clientX;
      downY = e.clientY;
      moved = false;
      orbitRef.current.dragging = true;
      orbitRef.current.lx = e.clientX;
      orbitRef.current.ly = e.clientY;
    };
    const onMove = (e: PointerEvent) => {
      if (!orbitRef.current.dragging) return;
      const dx = e.clientX - orbitRef.current.lx;
      const dy = e.clientY - orbitRef.current.ly;
      if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > 5) moved = true;
      orbitRef.current.targetTheta -= dx * 0.008;
      orbitRef.current.targetPhi = Math.max(
        0.45,
        Math.min(1.5, orbitRef.current.targetPhi - dy * 0.006),
      );
      orbitRef.current.lx = e.clientX;
      orbitRef.current.ly = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      orbitRef.current.dragging = false;
      if (moved) return;
      setNdc(e);
      const tube = pickTube();
      if (!tube) {
        onSelectTubeRef.current?.(null);
        return;
      }
      onSelectTubeRef.current?.(tube.index);
      const reagent = selectedReagentRef.current;
      if (reagent) pourInto(tube, reagent);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      orbitRef.current.targetRadius = Math.max(
        6,
        Math.min(16, orbitRef.current.targetRadius + e.deltaY * 0.01),
      );
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Loop ──
    let raf = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());
      const t = clock.elapsedTime;
      const now = performance.now();

      const o = orbitRef.current;
      o.theta += (o.targetTheta - o.theta) * Math.min(1, dt * 6);
      o.phi += (o.targetPhi - o.phi) * Math.min(1, dt * 6);
      o.radius += (o.targetRadius - o.radius) * Math.min(1, dt * 6);
      camera.position.set(
        o.radius * Math.sin(o.phi) * Math.sin(o.theta),
        o.radius * Math.cos(o.phi),
        o.radius * Math.sin(o.phi) * Math.cos(o.theta),
      );
      camera.lookAt(0, -0.3, 0);

      // pour streams
      for (let i = poursRef.current.length - 1; i >= 0; i--) {
        const p = poursRef.current[i];
        p.t += dt;
        p.mat.opacity = Math.max(0, 0.75 - p.t * 1.4);
        p.mesh.position.y -= dt * 5;
        if (p.t > 0.5) {
          scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mat.dispose();
          poursRef.current.splice(i, 1);
        }
      }

      for (const tube of tubesRef.current) {
        tube.level += (tube.targetLevel - tube.level) * Math.min(1, dt * 4);

        const baseX = tube.group.position.x;
        // rung khi rót / phản ứng
        if (now < tube.shakeUntil) {
          tube.group.position.x = baseX + Math.sin(now * 0.06) * 0.02;
        }

        if (tube.level > 0.001) {
          tube.liquid.visible = true;
          tube.meniscus.visible = true;
          const h = tube.level * (TUBE_HEIGHT - 0.2);
          tube.liquid.scale.y = h;
          tube.liquid.position.y = -TUBE_HEIGHT / 2 + h / 2 + 0.05;
          // gợn sóng mặt chất lỏng sau khi rót/phản ứng
          const ripple = tube.ripple > 0.01 ? Math.sin(t * 22) * 0.06 * tube.ripple : 0;
          tube.meniscus.position.y = -TUBE_HEIGHT / 2 + h + 0.05 + ripple;
          tube.meniscus.scale.set(1, 0.32 + ripple * 0.5, 1);
        } else {
          tube.liquid.visible = false;
          tube.meniscus.visible = false;
        }
        tube.ripple *= 0.93;

        tube.color.lerp(tube.targetColor, Math.min(1, dt * 3));
        tube.liquidMat.color.copy(tube.color);

        // thuỷ tinh nóng đỏ khi đun
        const targetHot = tube.flame ? 1 : 0;
        tube.hot += (targetHot - tube.hot) * Math.min(1, dt * 1.2);
        if (tube.glassMats[0]) {
          const gmat = tube.glassMats[0];
          const e = gmat.emissive;
          const glowAmt = tube.hot * (0.6 + Math.sin(t * 5) * 0.15);
          e.setRGB(glowAmt, glowAmt * 0.28, glowAmt * 0.08);
          gmat.emissiveIntensity = tube.hot;
        }

        // halo highlight
        const targetGlow = activeTubeRef.current === tube.index ? 0.22 : 0;
        const gm = tube.glow.material as THREE.MeshBasicMaterial;
        gm.opacity += (targetGlow - gm.opacity) * Math.min(1, dt * 8);

        // bubbles
        if (tube.bubbles && tube.bubbleVel) {
          const arr = tube.bubbles.geometry.attributes.position.array as Float32Array;
          const top = -TUBE_HEIGHT / 2 + tube.level * (TUBE_HEIGHT - 0.2);
          const wob = tube.bubbleRate * 0.004;
          for (let i = 0; i < tube.bubbleVel.length; i++) {
            arr[i * 3 + 1] += tube.bubbleVel[i] * dt;
            arr[i * 3] += Math.sin(t * 5 + i) * wob;
            if (arr[i * 3 + 1] > top) {
              arr[i * 3 + 1] = -TUBE_HEIGHT / 2 + Math.random() * 0.2;
              arr[i * 3] = (Math.random() - 0.5) * TUBE_INNER * 1.5;
              arr[i * 3 + 2] = (Math.random() - 0.5) * TUBE_INNER * 1.5;
            }
          }
          tube.bubbles.geometry.attributes.position.needsUpdate = true;
        }

        // foam (bọt trào miệng ống)
        if (tube.foam) {
          const arr = tube.foam.geometry.attributes.position.array as Float32Array;
          const fm = tube.foam.material as THREE.PointsMaterial;
          for (let i = 0; i < arr.length / 3; i++) {
            arr[i * 3 + 1] += (0.25 + Math.random() * 0.2) * dt;
            arr[i * 3] += Math.sin(t * 8 + i) * 0.004;
            if (arr[i * 3 + 1] > TUBE_HEIGHT / 2 + 1.0) {
              const a = Math.random() * Math.PI * 2;
              const r = Math.random() * TUBE_INNER;
              arr[i * 3] = Math.cos(a) * r;
              arr[i * 3 + 1] = TUBE_HEIGHT / 2 - 0.1;
              arr[i * 3 + 2] = Math.sin(a) * r;
            }
          }
          fm.size = 0.18 + Math.sin(t * 10) * 0.03;
          tube.foam.geometry.attributes.position.needsUpdate = true;
        }

        // ánh sáng phát quang dung dịch
        if (tube.glowDisk) {
          tube.glowDisk.intensity = 1.4 + Math.sin(t * 4) * 0.5;
        }

        if (tube.precipitate && tube.precipY) {
          const arr = tube.precipitate.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < tube.precipY.length; i++) {
            if (arr[i * 3 + 1] > tube.precipY[i]) {
              arr[i * 3 + 1] -= (0.25 + Math.random() * 0.2) * dt;
              arr[i * 3] += Math.sin(t * 2 + i) * 0.002;
            }
          }
          tube.precipitate.geometry.attributes.position.needsUpdate = true;
        }

        if (tube.smoke) {
          const arr = tube.smoke.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < arr.length / 3; i++) {
            arr[i * 3 + 1] += 0.6 * dt;
            arr[i * 3] += (Math.random() - 0.5) * 0.02;
            if (arr[i * 3 + 1] > TUBE_HEIGHT / 2 + 3) arr[i * 3 + 1] = TUBE_HEIGHT / 2;
          }
          tube.smoke.geometry.attributes.position.needsUpdate = true;
        }

        if (tube.steam) {
          const arr = tube.steam.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < arr.length / 3; i++) {
            arr[i * 3 + 1] += 0.4 * dt;
            arr[i * 3] += Math.sin(t * 3 + i) * 0.004;
            if (arr[i * 3 + 1] > TUBE_HEIGHT / 2 + 2) arr[i * 3 + 1] = TUBE_HEIGHT / 2;
          }
          tube.steam.geometry.attributes.position.needsUpdate = true;
        }

        if (tube.heatGlow) tube.heatGlow.intensity = 1.6 + Math.sin(t * 9) * 0.7;

        // flame flicker
        if (tube.flame) {
          const sc = 1 + Math.sin(t * 18 + tube.index) * 0.12;
          tube.flame.scale.set(1, sc, 1);
          tube.flame.rotation.y = Math.sin(t * 6) * 0.1;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      tubesRef.current.forEach((tube) => {
        tube.fizzSound?.stop();
        tube.sizzleSound?.stop();
      });
      pmrem.dispose();
      renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tubeCount]);

  // Reset
  useEffect(() => {
    if (resetSignal === 0) return;
    tubesRef.current.forEach((t) => resetTube(t));
    emitTubes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // Đổ bỏ riêng ống đang chọn.
  useEffect(() => {
    if (clearTubeSignal === 0) return;
    const idx = activeTubeRef.current;
    if (idx === null) return;
    const tube = tubesRef.current.find((t) => t.index === idx);
    if (!tube) return;
    resetTube(tube);
    emitTubes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTubeSignal]);

  // Đồng bộ trạng thái đun nóng từ props.
  useEffect(() => {
    tubesRef.current.forEach((t) => setHeated(t, heatedTube === t.index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatedTube]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
