"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * WebGL scene: a large glossy capsule surrounded by floating tablets, capsules and a medical cross.
 * - follows the pointer with a gentle parallax
 * - renders a single still frame when the OS asks for reduced motion
 * - pauses while off-screen, and frees all GPU memory on unmount
 * If WebGL is not available nothing is drawn (the CSS background behind it still shows).
 */
export default function MedScene({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      return; // no WebGL
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 640;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.style.opacity = "0";
    canvas.style.transition = "opacity 900ms ease";
    canvas.style.display = "block";
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    // lights (environment gives reflections; these add colour rims)
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(4, 6, 6);
    scene.add(key);
    const rimA = new THREE.PointLight(0x818cf8, 30, 20);
    rimA.position.set(-5, 2, 3);
    scene.add(rimA);
    const rimB = new THREE.PointLight(0x38bdf8, 25, 20);
    rimB.position.set(5, -3, 2);
    scene.add(rimB);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const geo = <T extends THREE.BufferGeometry>(g: T) => (geometries.push(g), g);
    const mat = (color: number, opts: Partial<THREE.MeshPhysicalMaterialParameters> = {}) => {
      const m = new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.22,
        metalness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        ...opts,
      });
      materials.push(m);
      return m;
    };

    // shared geometries
    const R = 0.5, L = 1.3;
    const halfCyl = geo(new THREE.CylinderGeometry(R, R, L / 2, 48, 1, true));
    const capTop = geo(new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2));
    const capBottom = geo(new THREE.SphereGeometry(R, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2));
    const seam = geo(new THREE.CylinderGeometry(R * 1.015, R * 1.015, 0.05, 48));
    const tabletGeo = geo(new THREE.SphereGeometry(0.5, 40, 20));
    const scoreGeo = geo(new THREE.BoxGeometry(0.9, 0.03, 0.06));
    const crossBar = geo(new RoundedBoxGeometry(1, 0.34, 0.34, 4, 0.12));

    const makeCapsule = (a: THREE.Material, b: THREE.Material) => {
      const g = new THREE.Group();
      const c1 = new THREE.Mesh(halfCyl, a);
      c1.position.y = L / 4;
      const s1 = new THREE.Mesh(capTop, a);
      s1.position.y = L / 2;
      const c2 = new THREE.Mesh(halfCyl, b);
      c2.position.y = -L / 4;
      const s2 = new THREE.Mesh(capBottom, b);
      s2.position.y = -L / 2;
      const band = new THREE.Mesh(seam, a);
      g.add(c1, s1, c2, s2, band);
      return g;
    };
    const makeTablet = (m: THREE.Material) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(tabletGeo, m);
      body.scale.set(1, 0.36, 1);
      const score = new THREE.Mesh(scoreGeo, mat(0xe2e8f0, { roughness: 0.6, clearcoat: 0 }));
      score.position.y = 0.175;
      g.add(body, score);
      return g;
    };
    const makeCross = (m: THREE.Material) => {
      const g = new THREE.Group();
      const h = new THREE.Mesh(crossBar, m);
      const v = new THREE.Mesh(crossBar, m);
      v.rotation.z = Math.PI / 2;
      g.add(h, v);
      return g;
    };

    const indigo = mat(0x5b5bf6);
    const pearl = mat(0xf8fafc, { roughness: 0.3 });
    const sky = mat(0x38bdf8);
    const coral = mat(0xfb7185);
    const amber = mat(0xfbbf24);
    const mint = mat(0x34d399);
    const violet = mat(0xa78bfa);
    const white = mat(0xffffff, { roughness: 0.35 });

    const world = new THREE.Group();
    scene.add(world);

    // hero capsule
    const hero = makeCapsule(indigo, pearl);
    hero.scale.setScalar(small ? 1.35 : 1.6);
    hero.rotation.z = -0.6;
    world.add(hero);

    // floating items: [object, x, y, z, scale]
    type Floater = { obj: THREE.Object3D; base: THREE.Vector3; phase: number; speed: number; spin: THREE.Vector3 };
    const floaters: Floater[] = [];
    const place = (obj: THREE.Object3D, x: number, y: number, z: number, s: number) => {
      obj.position.set(x, y, z);
      obj.scale.setScalar(s);
      obj.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      world.add(obj);
      floaters.push({
        obj,
        base: new THREE.Vector3(x, y, z),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.6,
        spin: new THREE.Vector3((Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.4),
      });
    };
    place(makeCapsule(coral, white), -2.6, 1.6, -1, 0.55);
    place(makeCapsule(sky, white), 2.5, -1.7, -0.5, 0.6);
    place(makeTablet(white), 2.3, 1.7, -1.5, 0.9);
    place(makeTablet(amber), -2.2, -1.6, 0.2, 0.7);
    place(makeCross(mint), 2.9, 0.2, -2.2, 0.6);
    if (!small) {
      place(makeCapsule(violet, white), -3.4, -0.1, -2.5, 0.5);
      place(makeTablet(sky), -0.6, 2.4, -2.8, 0.6);
      place(makeTablet(coral), 0.9, -2.5, -2, 0.55);
      place(makeCross(violet), -1.6, -2.6, -3, 0.45);
    }

    // sizing
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.position.z = camera.aspect < 0.9 ? 13 : camera.aspect < 1.3 ? 11 : 10;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // pointer parallax
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduceMotion) window.addEventListener("pointermove", onPointer, { passive: true });

    const clock = new THREE.Clock();
    let raf = 0;
    let visible = true;

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      hero.rotation.y = t * 0.55;
      hero.position.y = Math.sin(t * 0.9) * 0.15;
      for (const f of floaters) {
        f.obj.position.y = f.base.y + Math.sin(t * f.speed + f.phase) * 0.22;
        f.obj.position.x = f.base.x + Math.cos(t * f.speed * 0.7 + f.phase) * 0.08;
        f.obj.rotation.x += f.spin.x * 0.01;
        f.obj.rotation.y += f.spin.y * 0.01;
        f.obj.rotation.z += f.spin.z * 0.01;
      }
      world.rotation.y += (pointer.x * 0.35 - world.rotation.y) * 0.04;
      world.rotation.x += (pointer.y * 0.2 - world.rotation.x) * 0.04;
      renderer.render(scene, camera);
    };

    const loop = () => {
      if (visible) renderFrame();
      raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    renderFrame();
    canvas.style.opacity = "1";
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={className} />;
}
