// Reusable 3D molecule preview (no camera, no hand tracking).
// Used in library detail modals and cards.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { elementInfo, type Molecule } from "@/lib/chemistry";

type Props = { molecule: Molecule; height?: number; autoRotate?: boolean };

export default function MoleculePreview({ molecule, height = 260, autoRotate = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = ref.current!;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(wrap.clientWidth, height);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / height, 0.1, 100);
    camera.position.set(0, 0, 6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.95));
    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(4, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88ccff, 0.55);
    rim.position.set(-4, -3, -3);
    scene.add(rim);

    const group = new THREE.Group();
    for (const a of molecule.atoms) {
      const info = elementInfo(a.el);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(info.radius, 32, 32),
        new THREE.MeshPhysicalMaterial({
          color: info.color,
          roughness: 0.35,
          metalness: 0.15,
          clearcoat: 0.6,
        }),
      );
      mesh.position.set(a.x, a.y, a.z);
      group.add(mesh);
    }
    for (const b of molecule.bonds) {
      const pa = new THREE.Vector3(
        molecule.atoms[b.a].x,
        molecule.atoms[b.a].y,
        molecule.atoms[b.a].z,
      );
      const pb = new THREE.Vector3(
        molecule.atoms[b.b].x,
        molecule.atoms[b.b].y,
        molecule.atoms[b.b].z,
      );
      const count = Math.min(3, Math.max(1, b.order));
      const axis = new THREE.Vector3().subVectors(pb, pa).normalize();
      const perp =
        Math.abs(axis.y) < 0.9
          ? new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 1, 0)).normalize()
          : new THREE.Vector3().crossVectors(axis, new THREE.Vector3(1, 0, 0)).normalize();
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * 0.14;
        const len = pa.distanceTo(pb);
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.09, 0.09, len, 16),
          new THREE.MeshPhysicalMaterial({ color: "#d4d7de", roughness: 0.5, metalness: 0.2 }),
        );
        cyl.position.copy(pa).add(new THREE.Vector3().subVectors(pb, pa).multiplyScalar(0.5));
        cyl.position.add(perp.clone().multiplyScalar(offset));
        cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
        group.add(cyl);
      }
    }
    // auto-fit camera
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z, 1);
    camera.position.z = maxDim * 2.6 + 2;
    scene.add(group);

    let raf = 0;
    let dragging = false;
    let lastX = 0,
      lastY = 0;
    const el = renderer.domElement;
    el.style.cursor = "grab";
    const down = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      group.rotation.y += (e.clientX - lastX) * 0.01;
      group.rotation.x += (e.clientY - lastY) * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = () => {
      dragging = false;
      el.style.cursor = "grab";
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (autoRotate && !dragging) group.rotation.y += 0.006;
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      renderer.setSize(wrap.clientWidth, height);
      camera.aspect = wrap.clientWidth / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("pointerdown", down);
      renderer.dispose();
      wrap.removeChild(el);
    };
  }, [molecule, height, autoRotate]);

  return <div ref={ref} style={{ height }} className="w-full rounded-2xl bg-gradient-hero" />;
}
