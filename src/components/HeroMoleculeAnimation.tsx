import { useEffect, useRef } from "react";
import * as THREE from "three";
import { elementInfo } from "@/lib/chemistry";

// Caffein Molecule C8H10N4O2
const CAFFEINE_ATOMS = [
  { el: "O", x: -1.78, y: -1.54, z: 0.17 },
  { el: "O", x: -1.41, y: 2.76, z: 0.05 },
  { el: "N", x: 0.16, y: -0.19, z: 0.01 },
  { el: "N", x: 0.36, y: 2.05, z: 0.02 },
  { el: "N", x: 2.11, y: 0.37, z: -0.1 },
  { el: "N", x: 2.37, y: -1.68, z: -0.09 },
  { el: "C", x: -0.73, y: -0.4, z: 0.08 },
  { el: "C", x: -0.52, y: 1.83, z: 0.06 },
  { el: "C", x: 0.81, y: 1.05, z: -0.02 },
  { el: "C", x: 1.08, y: -1.25, z: -0.03 },
  { el: "C", x: 3.12, y: -0.51, z: -0.15 },
  { el: "C", x: -2.08, y: 0.28, z: 0.16 }, // Methyl group 1
  { el: "C", x: 0.69, y: 3.45, z: 0.05 }, // Methyl group 2
  { el: "C", x: 2.65, y: -3.07, z: -0.11 }, // Methyl group 3
  { el: "H", x: 4.14, y: -0.19, z: -0.22 },
  { el: "H", x: -2.25, y: 0.68, z: 1.15 },
  { el: "H", x: -2.25, y: 1.06, z: -0.57 },
  { el: "H", x: -2.79, y: -0.52, z: -0.0 },
  { el: "H", x: 0.26, y: 3.98, z: 0.9 },
  { el: "H", x: 1.77, y: 3.55, z: 0.13 },
  { el: "H", x: 0.35, y: 3.88, z: -0.89 },
  { el: "H", x: 3.73, y: -3.12, z: -0.19 },
  { el: "H", x: 2.22, y: -3.53, z: -1.0 },
  { el: "H", x: 2.26, y: -3.57, z: 0.77 },
];

// Determine bonds based on distance
function getBonds(atoms: { el: string; x: number; y: number; z: number }[]) {
  const bonds = [];
  for (let i = 0; i < atoms.length; i++) {
    for (let j = i + 1; j < atoms.length; j++) {
      const dx = atoms[i].x - atoms[j].x;
      const dy = atoms[i].y - atoms[j].y;
      const dz = atoms[i].z - atoms[j].z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0.4 && dist < 1.7) {
        // Double bonds for C=O and some ring bonds in Caffeine (simplified)
        let order = 1;
        if (
          (atoms[i].el === "O" && atoms[j].el === "C") ||
          (atoms[i].el === "C" && atoms[j].el === "O")
        ) {
          order = 2;
        } else if (dist < 1.38 && atoms[i].el !== "H" && atoms[j].el !== "H") {
          order = 2;
        }
        bonds.push({ a: i, b: j, order });
      }
    }
  }
  return bonds;
}

const CAFFEINE_BONDS = getBonds(CAFFEINE_ATOMS);

type Props = {
  height?: number | string;
  autoRotate?: boolean;
  className?: string;
};

export default function HeroMoleculeAnimation({
  height = "100%",
  autoRotate = true,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = containerRef.current;
    if (!wrap) return;

    let cleanupFn: (() => void) | undefined;

    const initTimer = setTimeout(() => {
      const getWidth = () => wrap.clientWidth;
      const getHeight = () => (typeof height === "number" ? height : wrap.clientHeight);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setSize(getWidth(), getHeight());
      renderer.setClearColor(0x000000, 0); // Transparent

      // Fade in smoothly
      renderer.domElement.style.opacity = "0";
      renderer.domElement.style.transition = "opacity 0.8s ease-out";
      wrap.appendChild(renderer.domElement);

      // Scene & Camera
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, getWidth() / Math.max(1, getHeight()), 0.1, 100);
      camera.position.set(0, 0, 16);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 1.2));
      const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
      mainLight.position.set(5, 8, 5);
      scene.add(mainLight);

      const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.0); // Teal tint
      fillLight.position.set(-5, -3, -3);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.8); // Purple/Slate tint
      rimLight.position.set(0, 5, -5);
      scene.add(rimLight);

      // Molecule Group
      const group = new THREE.Group();

      // Materials
      // A premium glassmorphic look
      const getAtomMaterial = (color: string) => {
        return new THREE.MeshPhysicalMaterial({
          color: color,
          metalness: 0.2,
          roughness: 0.1,
          transmission: 0.6, // Glass effect
          ior: 1.5,
          thickness: 0.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
          transparent: true,
          opacity: 0.95,
        });
      };

      const bondMaterial = new THREE.MeshPhysicalMaterial({
        color: "#94a3b8", // slate-400
        metalness: 0.5,
        roughness: 0.3,
        clearcoat: 0.8,
        transparent: true,
        opacity: 0.7,
      });

      // Build Atoms
      const atomSpheres: THREE.Mesh[] = [];
      for (const a of CAFFEINE_ATOMS) {
        const info = elementInfo(a.el);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(info.radius * 1.2, 32, 32),
          getAtomMaterial(info.color),
        );
        mesh.position.set(a.x, a.y, a.z);
        group.add(mesh);
        atomSpheres.push(mesh);
      }

      // Build Bonds
      for (const b of CAFFEINE_BONDS) {
        const pa = new THREE.Vector3(
          CAFFEINE_ATOMS[b.a].x,
          CAFFEINE_ATOMS[b.a].y,
          CAFFEINE_ATOMS[b.a].z,
        );
        const pb = new THREE.Vector3(
          CAFFEINE_ATOMS[b.b].x,
          CAFFEINE_ATOMS[b.b].y,
          CAFFEINE_ATOMS[b.b].z,
        );
        const count = b.order;

        const axis = new THREE.Vector3().subVectors(pb, pa).normalize();
        const perp =
          Math.abs(axis.y) < 0.9
            ? new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize()
            : new THREE.Vector3().crossVectors(axis, new THREE.Vector3(1, 0, 0)).normalize();

        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 0.18;
          const len = pa.distanceTo(pb);
          const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 16), bondMaterial);
          cyl.position.copy(pa).add(new THREE.Vector3().subVectors(pb, pa).multiplyScalar(0.5));
          cyl.position.add(perp.clone().multiplyScalar(offset));
          cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
          group.add(cyl);
        }
      }

      // Center the group
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      group.position.sub(center);

      scene.add(group);

      // Initial Rotation
      group.rotation.x = 0.3;
      group.rotation.y = -0.5;

      // --- Interaction ---
      let raf = 0;
      let dragging = false;
      let lastX = 0,
        lastY = 0;

      // Physics variables for smooth damping
      let targetRotationX = group.rotation.x;
      let targetRotationY = group.rotation.y;

      const el = renderer.domElement;
      el.style.cursor = "grab";

      const down = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        el.style.cursor = "grabbing";
        el.setPointerCapture(e.pointerId);
      };

      const move = (e: PointerEvent) => {
        if (!dragging) return;
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;

        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;

        lastX = e.clientX;
        lastY = e.clientY;
      };

      const up = (e: PointerEvent) => {
        dragging = false;
        el.style.cursor = "grab";
        try {
          el.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      };

      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);

      // --- Loop ---
      const tick = () => {
        raf = requestAnimationFrame(tick);

        if (autoRotate && !dragging) {
          targetRotationY += 0.003;
          targetRotationX += Math.sin(Date.now() * 0.001) * 0.001; // subtle wobble
        }

        // Smooth interpolation (Lerp)
        group.rotation.y += (targetRotationY - group.rotation.y) * 0.1;
        group.rotation.x += (targetRotationX - group.rotation.x) * 0.1;

        // Slight floating animation
        group.position.y = Math.sin(Date.now() * 0.002) * 0.2;

        renderer.render(scene, camera);
      };
      tick();

      // Fade in after first render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          renderer.domElement.style.opacity = "1";
        });
      });

      // --- Resize ---
      const onResize = () => {
        const W = getWidth();
        const H = getHeight();
        renderer.setSize(W, H);
        camera.aspect = W / Math.max(1, H);
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(wrap);

      cleanupFn = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        ro.disconnect();
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        renderer.dispose();
        try {
          wrap.removeChild(el);
        } catch {
          /* ignore */
        }
      };
    }, 300); // Wait 300ms so Framer Motion page transition is buttery smooth

    return () => {
      clearTimeout(initTimer);
      if (cleanupFn) cleanupFn();
    };
  }, [height, autoRotate]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ touchAction: "none" }}
    />
  );
}
