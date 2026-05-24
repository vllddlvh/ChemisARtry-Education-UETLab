// 3D Bohr-style atom viewer. Reusable in detail panel and AR scene.
// - Nucleus: cluster of proton (red) + neutron (gray) spheres (capped count).
// - Shells: thin glowing rings + electrons that orbit at varying speeds.
// - Mouse drag rotates; wheel zooms. Optionally auto-rotates.
import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import * as THREE from "three";

export type AtomViewer3DHandle = {
  /** Programmatic rotate delta in radians. */
  rotate: (dx: number, dy: number) => void;
  /** Multiplicative zoom (>1 zoom in, <1 zoom out). */
  zoom: (factor: number) => void;
  /** Reset camera + group rotation. */
  reset: () => void;
  /** Get the underlying canvas (e.g. for raycast hit forwarding). */
  canvas: () => HTMLCanvasElement | null;
};

type Props = {
  shells: number[];
  protons: number;
  neutrons: number;
  symbol: string;
  color?: string;
  height?: number | string;
  autoRotate?: boolean;
  interactive?: boolean;
  transparent?: boolean;
  showShellLabels?: boolean;
  className?: string;
};

const SHELL_NAMES = ["K", "L", "M", "N", "O", "P", "Q", "R"];

const AtomViewer3D = forwardRef<AtomViewer3DHandle, Props>(function AtomViewer3D(
  {
    shells,
    protons,
    neutrons,
    symbol,
    color = "#38bdf8",
    height = 320,
    autoRotate = true,
    interactive = true,
    transparent = false,
    showShellLabels = false,
    className = "",
  },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer?: THREE.WebGLRenderer;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    group?: THREE.Group;
    cleanup?: () => void;
  }>({});

  useImperativeHandle(
    ref,
    () => ({
      rotate: (dx, dy) => {
        const g = stateRef.current.group;
        if (!g) return;
        g.rotation.y += dx;
        g.rotation.x += dy;
      },
      zoom: (factor) => {
        const cam = stateRef.current.camera;
        if (!cam) return;
        cam.position.z = Math.max(4, Math.min(40, cam.position.z / factor));
        cam.updateProjectionMatrix();
      },
      reset: () => {
        const g = stateRef.current.group;
        const cam = stateRef.current.camera;
        if (g) g.rotation.set(0.25, 0, 0);
        if (cam) {
          cam.position.set(0, 0, 14);
          cam.updateProjectionMatrix();
        }
      },
      canvas: () => stateRef.current.renderer?.domElement ?? null,
    }),
    [],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const w = () => wrap.clientWidth;
    const h = () => (typeof height === "number" ? height : wrap.clientHeight);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(w(), h());
    if (transparent) renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    if (!transparent) scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, w() / h(), 0.1, 100);
    camera.position.set(0, 0, 14);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(5, 6, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x88ccff, 0.5);
    rim.position.set(-5, -3, -3);
    scene.add(rim);

    const group = new THREE.Group();
    group.rotation.x = 0.25;
    scene.add(group);

    // ---- Nucleus ----
    const NUCLEON_LIMIT = 80;
    const totalNucleons = Math.min(NUCLEON_LIMIT, protons + neutrons);
    const protonCount = Math.round((protons / Math.max(1, protons + neutrons)) * totalNucleons);

    const nucleusRadius = 0.55 + Math.cbrt(Math.max(1, totalNucleons)) * 0.18;
    const nucleusGroup = new THREE.Group();
    const protonMat = new THREE.MeshPhysicalMaterial({
      color: "#ef4444",
      roughness: 0.35,
      metalness: 0.2,
      clearcoat: 0.5,
    });
    const neutronMat = new THREE.MeshPhysicalMaterial({
      color: "#94a3b8",
      roughness: 0.45,
      metalness: 0.15,
    });
    const nucleonGeo = new THREE.SphereGeometry(0.32, 18, 18);

    for (let i = 0; i < totalNucleons; i++) {
      const isProton = i < protonCount;
      const m = new THREE.Mesh(nucleonGeo, isProton ? protonMat : neutronMat);
      // Random distribution within sphere
      const u = Math.random(),
        v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = nucleusRadius * Math.cbrt(Math.random());
      m.position.set(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      nucleusGroup.add(m);
    }
    group.add(nucleusGroup);

    // Glow halo around nucleus
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(nucleusRadius * 1.4, 24, 24),
      new THREE.MeshBasicMaterial({
        color: "#fb7185",
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
      }),
    );
    group.add(halo);

    // Symbol label sprite
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 256;
    labelCanvas.height = 256;
    const lctx = labelCanvas.getContext("2d")!;
    lctx.fillStyle = "rgba(255,255,255,0.95)";
    lctx.font = "bold 140px Inter, sans-serif";
    lctx.textAlign = "center";
    lctx.textBaseline = "middle";
    lctx.shadowColor = "rgba(0,0,0,0.6)";
    lctx.shadowBlur = 18;
    lctx.fillText(symbol, 128, 138);
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    const labelSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false }),
    );
    labelSprite.scale.set(2.2, 2.2, 1);
    group.add(labelSprite);

    // ---- Electron shells ----
    const electronGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const electronMat = new THREE.MeshPhysicalMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.55,
      roughness: 0.3,
      metalness: 0.4,
    });

    const shellGroups: { group: THREE.Group; speed: number; tilt: THREE.Euler }[] = [];
    const baseRadius = nucleusRadius + 1.6;
    const step = 1.4;

    shells.forEach((count, i) => {
      const radius = baseRadius + i * step;
      const sg = new THREE.Group();
      // Tilt each shell on a different axis to give 3D depth
      sg.rotation.set((i % 3) * 0.4 - 0.4, (i % 4) * 0.3, (i % 2) * 0.5);

      // Ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.015, 8, 96),
        new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.25 }),
      );
      sg.add(ring);

      // Electrons
      for (let e = 0; e < count; e++) {
        const ang = (e / count) * Math.PI * 2;
        const m = new THREE.Mesh(electronGeo, electronMat);
        m.position.set(Math.cos(ang) * radius, Math.sin(ang) * radius, 0);
        m.userData = { shellIndex: i, baseAngle: ang, radius };
        sg.add(m);
      }

      // Optional shell label sprite
      if (showShellLabels) {
        const sc = document.createElement("canvas");
        sc.width = 96;
        sc.height = 96;
        const sx = sc.getContext("2d")!;
        sx.fillStyle = "rgba(255,255,255,0.9)";
        sx.font = "bold 48px Inter";
        sx.textAlign = "center";
        sx.textBaseline = "middle";
        sx.fillText(SHELL_NAMES[i] ?? `#${i + 1}`, 48, 48);
        const t = new THREE.CanvasTexture(sc);
        const sp = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }),
        );
        sp.position.set(radius + 0.25, 0, 0);
        sp.scale.set(0.7, 0.7, 1);
        sg.add(sp);
      }

      group.add(sg);
      shellGroups.push({
        group: sg,
        speed: 0.6 / Math.pow(i + 1, 0.85),
        tilt: sg.rotation.clone(),
      });
    });

    // Auto-fit camera to outer shell
    const maxRadius = baseRadius + Math.max(0, shells.length - 1) * step + 1.2;
    camera.position.z = Math.max(10, maxRadius * 2.4);

    // ---- Interaction ----
    let raf = 0;
    let dragging = false;
    let lastX = 0,
      lastY = 0;
    const el = renderer.domElement;
    if (interactive) el.style.cursor = "grab";

    const down = (e: PointerEvent) => {
      if (!interactive) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.style.cursor = "grabbing";
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      group.rotation.y += (e.clientX - lastX) * 0.008;
      group.rotation.x += (e.clientY - lastY) * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      el.style.cursor = interactive ? "grab" : "default";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      const f = e.deltaY > 0 ? 0.92 : 1.08;
      camera.position.z = Math.max(4, Math.min(40, camera.position.z / f));
    };

    if (interactive) {
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("wheel", wheel, { passive: false });
    }

    // ---- Loop ----
    const t0 = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const t = (performance.now() - t0) / 1000;

      // Auto-rotate group
      if (autoRotate && !dragging) {
        group.rotation.y += 0.003;
      }

      // Spin nucleus subtly
      nucleusGroup.rotation.y += 0.01;
      nucleusGroup.rotation.x += 0.006;

      // Animate electrons in their shells
      shellGroups.forEach(({ group: sg, speed }) => {
        sg.children.forEach((child) => {
          const ud = (child as THREE.Mesh).userData;
          if (ud && typeof ud.baseAngle === "number") {
            const a = ud.baseAngle + t * speed * Math.PI;
            (child as THREE.Mesh).position.set(Math.cos(a) * ud.radius, Math.sin(a) * ud.radius, 0);
          }
        });
      });

      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      const W = w(),
        H = h();
      renderer.setSize(W, H);
      camera.aspect = W / Math.max(1, H);
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    const cleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      renderer.dispose();
      try {
        wrap.removeChild(el);
      } catch {
        /* ignore */
      }
    };

    stateRef.current = { renderer, scene, camera, group, cleanup };
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    shells.join(","),
    protons,
    neutrons,
    symbol,
    color,
    autoRotate,
    interactive,
    transparent,
    showShellLabels,
  ]);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ height, touchAction: "none" }}
    />
  );
});

export default AtomViewer3D;
