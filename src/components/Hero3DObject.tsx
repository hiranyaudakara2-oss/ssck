import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const _lookTarget = new THREE.Vector3(0, 0, 0);

function detectSoftwareGl(): boolean {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function Hero3DObject({ className = '' }: { className?: string }) {
  const prefersReduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [contextLost, setContextLost] = useState(false);

  const isVisibleRef = useRef(true);
  const pointerRef = useRef({ x: 0, y: 0, dragging: false, lastX: 0, lastY: 0, spinX: 0, spinY: 0 });
  const pulseEnergyRef = useRef(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || prefersReduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = Boolean(entries[0]?.isIntersecting ?? true);
      },
      { threshold: 0.05 }
    );
    io.observe(host);

    const isSoftwareGl = detectSoftwareGl();
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));

    const initW = Math.max(1, host.clientWidth || 380);
    const initH = Math.max(1, host.clientHeight || 380);
    renderer.setSize(initW, initH, false);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    host.innerHTML = '';
    host.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, initW / initH, 0.1, 60);
    camera.position.set(0, 0.4, 5.6);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Calibrated 3-point lighting rig
    const hemi = new THREE.HemisphereLight(0x60a5fa, 0x090f24, 0.9);
    const key = new THREE.DirectionalLight(0xfff4e6, 2.0);
    key.position.set(4, 5, 5);
    const rim = new THREE.DirectionalLight(0x8b5cf6, 1.8);
    rim.position.set(-4.5, -2, -3.5);
    scene.add(hemi, key, rim);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const cobaltAlloyMat = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      metalness: 0.88,
      roughness: 0.22,
    });
    const darkTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.92,
      roughness: 0.25,
    });
    const violetEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.72,
      roughness: 0.26,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.55,
    });
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      metalness: 0.05,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.62 : 1.0,
      ior: 1.58,
      thickness: 1.2,
      clearcoat: 1.0,
    });
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
    });
    materials.push(cobaltAlloyMat, darkTitaniumMat, violetEmissiveMat, crystalMat, nodeMat);

    const assembly = new THREE.Group();
    scene.add(assembly);

    // Outer hexagonal precision gimbal
    const ringGeoA = new THREE.TorusGeometry(1.42, 0.045, 16, 72);
    const ringGeoB = new THREE.TorusGeometry(1.12, 0.036, 16, 64);
    const ringGeoC = new THREE.TorusGeometry(0.84, 0.028, 14, 52);
    geometries.push(ringGeoA, ringGeoB, ringGeoC);

    const ringA = new THREE.Mesh(ringGeoA, darkTitaniumMat);
    const ringB = new THREE.Mesh(ringGeoB, cobaltAlloyMat);
    const ringC = new THREE.Mesh(ringGeoC, violetEmissiveMat);
    assembly.add(ringA, ringB, ringC);

    // Central optical polyhedron + inner plasma octahedron
    const coreGeo = new THREE.IcosahedronGeometry(0.56, 0);
    const innerGeo = new THREE.OctahedronGeometry(0.28, 0);
    geometries.push(coreGeo, innerGeo);

    const crystalCore = new THREE.Mesh(coreGeo, crystalMat);
    const innerCore = new THREE.Mesh(innerGeo, violetEmissiveMat);
    crystalCore.renderOrder = 2;
    assembly.add(crystalCore, innerCore);

    // Instanced orbital quantum nodes (24 nodes)
    const dotGeo = new THREE.OctahedronGeometry(0.055, 0);
    geometries.push(dotGeo);
    const orbitalDots = new THREE.InstancedMesh(dotGeo, nodeMat, 24);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const r = 1.65 + (i % 3) * 0.14;
      const y = ((i % 5) - 2) * 0.22;
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.rotation.set(a, a * 0.5, 0);
      dummy.updateMatrix();
      orbitalDots.setMatrixAt(i, dummy.matrix);
    }
    orbitalDots.instanceMatrix.needsUpdate = true;
    orbitalDots.computeBoundingSphere();
    orbitalDots.frustumCulled = false;
    assembly.add(orbitalDots);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let disposed = false;
    let frameId = 0;
    let resizeRafId = 0;
    let lastW = initW;
    let lastH = initH;

    const applyResize = () => {
      resizeRafId = 0;
      if (disposed || !host) return;
      const w = Math.max(1, host.clientWidth || 380);
      const h = Math.max(1, host.clientHeight || 380);
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(() => {
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(applyResize);
    });
    resizeObserver.observe(host);

    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const rawGl = renderer.getContext();
      if (!rawGl || !('fenceSync' in rawGl)) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const gl = rawGl as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);

      if (isVisibleRef.current) {
        const elapsed = clock.getElapsedTime();
        pulseEnergyRef.current = THREE.MathUtils.damp(pulseEnergyRef.current, 0, 3.2, delta);
        const speedBoost = 1 + pulseEnergyRef.current * 2.8;

        assembly.rotation.y = elapsed * 0.25 * speedBoost + pointerRef.current.spinX + pointerRef.current.x * 0.35;
        assembly.rotation.x = Math.sin(elapsed * 0.4) * 0.14 + pointerRef.current.spinY + pointerRef.current.y * 0.25;
        assembly.position.y = Math.sin(elapsed * 1.3) * 0.07;

        ringA.rotation.x = elapsed * 0.38 * speedBoost;
        ringA.rotation.y = elapsed * 0.22;
        ringB.rotation.y = -elapsed * 0.52 * speedBoost;
        ringB.rotation.z = elapsed * 0.31;
        ringC.rotation.x = -elapsed * 0.65 * speedBoost;
        ringC.rotation.z = -elapsed * 0.42;

        crystalCore.rotation.y = elapsed * 0.45 * speedBoost;
        crystalCore.rotation.x = elapsed * 0.28;
        innerCore.rotation.y = -elapsed * 0.9 * speedBoost;
        const scalePulse = 1 + pulseEnergyRef.current * 0.14;
        crystalCore.scale.setScalar(scalePulse);

        orbitalDots.rotation.y = -elapsed * 0.16 * speedBoost;
        violetEmissiveMat.emissiveIntensity = 0.55 + pulseEnergyRef.current * 0.95;

        camera.lookAt(_lookTarget);
        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      io.disconnect();
      cancelAnimationFrame(frameId);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envTarget.dispose();
      renderer.dispose();
    };
  }, [prefersReduced]);

  if (prefersReduced || contextLost) {
    return (
      <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
        <svg className="h-28 w-28 text-blue-400/80" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 4" />
          <circle cx="60" cy="60" r="32" stroke="#8b5cf6" strokeWidth="1.5" />
          <polygon points="60,34 82,60 60,86 38,60" fill="rgba(96,165,250,0.28)" stroke="#60a5fa" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label="Interactive 3D SSCK TECH Gyroscope — drag to rotate or click to energize"
      onPointerDown={(e) => {
        pointerRef.current.dragging = true;
        pointerRef.current.lastX = e.clientX;
        pointerRef.current.lastY = e.clientY;
        pulseEnergyRef.current = 1;
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        pointerRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        if (pointerRef.current.dragging) {
          pointerRef.current.spinX += (e.clientX - pointerRef.current.lastX) * 0.01;
          pointerRef.current.spinY += (e.clientY - pointerRef.current.lastY) * 0.01;
          pointerRef.current.lastX = e.clientX;
          pointerRef.current.lastY = e.clientY;
        }
      }}
      onPointerUp={() => {
        pointerRef.current.dragging = false;
      }}
      onPointerLeave={() => {
        pointerRef.current.dragging = false;
        pointerRef.current.x = 0;
        pointerRef.current.y = 0;
      }}
      className={`cursor-grab active:cursor-grabbing ${className}`}
    />
  );
}
