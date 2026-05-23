// src/lib/three-helpers.ts
// Tách buildMoleculeGroup và spawnBurst ra khỏi ARScene.tsx
// để dùng chung giữa lab-sim.tsx, lab-ar.tsx và ARScene.tsx

import * as THREE from "three";
import { elementInfo, type Molecule } from "@/lib/chemistry";

// ── Types ─────────────────────────────────────────────────────────────────

export type SpawnedMol = {
  id: string;
  formula: string;
  group: THREE.Group;
  labels: THREE.Sprite[];
  grabbedBy: number | null;
  baseScale: number;
  spawnedAt: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────

export function makeBond(a: THREE.Vector3, b: THREE.Vector3): THREE.Mesh {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(0.09, 0.09, len, 16);
  const mat = new THREE.MeshPhysicalMaterial({
    color: "#d4d7de",
    roughness: 0.5,
    metalness: 0.2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(a).add(dir.multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize()
  );
  return mesh;
}

export function makeTextSprite(text: string, color = "#0f1e3d"): THREE.Sprite {
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
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.55, 0.55, 1);
  return sprite;
}

/** Build a ball-and-stick THREE.Group for a molecule. */
export function buildMoleculeGroup(
  m: Molecule,
  withLabels: boolean
): { group: THREE.Group; labels: THREE.Sprite[] } {
  const group = new THREE.Group();
  group.userData.formula = m.formula;
  const labels: THREE.Sprite[] = [];

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

/** Spawn a sparkly particle burst at a world position. */
export function spawnBurst(
  scene: THREE.Scene,
  position: THREE.Vector3,
  color: string
): void {
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
        (Math.random() - 0.5) * 4
      )
    );
  }

  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size: 0.18,
    transparent: true,
    opacity: 1,
  });
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

/** Create standard Three.js lights for a chemistry scene. */
export function createChemistryLights(): THREE.Object3D[] {
  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 6, 4);
  const rim = new THREE.DirectionalLight(0x88ccff, 0.6);
  rim.position.set(-5, -2, -4);
  return [ambient, key, rim];
}
