import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

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

function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(219, 234, 254, 0.88)');
    grad.addColorStop(0.58, 'rgba(96, 165, 250, 0.28)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Deterministic seeded pseudo-random helper for reproducible particle layout
function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface PointerState {
  x: number;
  y: number;
  active: boolean;
  pulseAge: number;
  pulseOriginX: number;
  pulseOriginY: number;
}

const HERO_PARTICLE_COUNT = 340;
const AMBIENT_STAR_COUNT = 220;
const LATTICE_NODE_COUNT = 78;

const PALETTE = [
  new THREE.Color('#60a5fa'), // Electric Blue
  new THREE.Color('#38bdf8'), // Cyan Sky
  new THREE.Color('#818cf8'), // Indigo
  new THREE.Color('#a78bfa'), // Violet
];

interface ParticleFieldProps {
  pointerRef: React.MutableRefObject<PointerState>;
  scrollRatioRef: React.MutableRefObject<number>;
  isSoftwareGl: boolean;
  isVisible: boolean;
}

function QuantumParticleField({
  pointerRef,
  scrollRatioRef,
  isSoftwareGl,
  isVisible,
}: ParticleFieldProps) {
  const heroClusterRef = useRef<THREE.Group>(null);
  const ambientFieldRef = useRef<THREE.Group>(null);
  const { gl, invalidate } = useThree();
  const simTimeRef = useRef(0);

  const spriteTex = useMemo(() => createSoftParticleTexture(), []);

  // 1. Hero-centered interactive particle cloud (centered behind hero at scrollY = 0)
  const { particlesGeo, basePositions, phases } = useMemo(() => {
    const positions = new Float32Array(HERO_PARTICLE_COUNT * 3);
    const basePos = new Float32Array(HERO_PARTICLE_COUNT * 3);
    const colors = new Float32Array(HERO_PARTICLE_COUNT * 3);
    const phaseArr = new Float32Array(HERO_PARTICLE_COUNT);

    for (let i = 0; i < HERO_PARTICLE_COUNT; i++) {
      const u = seeded(i, 1);
      const v = seeded(i, 2);
      const w = seeded(i, 3);

      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const radius = 1.45 + Math.pow(w, 0.72) * 5.6;

      const x = Math.sin(phi) * Math.cos(theta) * radius * 1.5;
      const y = Math.cos(phi) * radius * 0.92;
      const z = Math.sin(phi) * Math.sin(theta) * radius * 0.9 - 0.7;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      basePos[i * 3] = x;
      basePos[i * 3 + 1] = y;
      basePos[i * 3 + 2] = z;

      phaseArr[i] = seeded(i, 4) * Math.PI * 2;

      const c = PALETTE[i % PALETTE.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeBoundingSphere();

    return { particlesGeo: geo, basePositions: basePos, phases: phaseArr };
  }, []);

  // 2. Full-viewport deep volumetric starfield that spans seamlessly as user scrolls the page
  const ambientStarsGeo = useMemo(() => {
    const positions = new Float32Array(AMBIENT_STAR_COUNT * 3);
    const colors = new Float32Array(AMBIENT_STAR_COUNT * 3);

    for (let i = 0; i < AMBIENT_STAR_COUNT; i++) {
      const x = (seeded(i, 11) - 0.5) * 18;
      const y = (seeded(i, 12) - 0.5) * 14;
      const z = -1.5 - seeded(i, 13) * 6.5;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const c = PALETTE[(i + 1) % PALETTE.length];
      colors[i * 3] = c.r * 0.85;
      colors[i * 3 + 1] = c.g * 0.85;
      colors[i * 3 + 2] = c.b * 0.95;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeBoundingSphere();
    return geo;
  }, []);

  // 3. Centered futuristic neural constellation (Fibonacci sphere + wireframe lattice)
  const { latticeNodesGeo, latticeLinesGeo } = useMemo(() => {
    const nodePos = new Float32Array(LATTICE_NODE_COUNT * 3);
    const nodeColors = new Float32Array(LATTICE_NODE_COUNT * 3);
    const coords: Array<[number, number, number]> = [];

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < LATTICE_NODE_COUNT; i++) {
      const yNorm = 1 - (i / (LATTICE_NODE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
      const theta = goldenAngle * i;
      const r = 2.7 + (seeded(i, 9) - 0.5) * 0.52;

      const x = Math.cos(theta) * radiusAtY * r * 1.32;
      const y = yNorm * r * 0.94;
      const z = Math.sin(theta) * radiusAtY * r * 0.86 - 0.4;

      coords.push([x, y, z]);
      nodePos[i * 3] = x;
      nodePos[i * 3 + 1] = y;
      nodePos[i * 3 + 2] = z;

      const c = i % 3 === 0 ? PALETTE[3] : PALETTE[i % 2];
      nodeColors[i * 3] = c.r;
      nodeColors[i * 3 + 1] = c.g;
      nodeColors[i * 3 + 2] = c.b;
    }

    const nGeo = new THREE.BufferGeometry();
    nGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    nGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));

    const lineVertices: number[] = [];
    const maxDistSq = 1.68 * 1.68;
    for (let i = 0; i < coords.length; i++) {
      for (let j = i + 1; j < coords.length; j++) {
        const dx = coords[i][0] - coords[j][0];
        const dy = coords[i][1] - coords[j][1];
        const dz = coords[i][2] - coords[j][2];
        if (dx * dx + dy * dy + dz * dz < maxDistSq) {
          lineVertices.push(
            coords[i][0],
            coords[i][1],
            coords[i][2],
            coords[j][0],
            coords[j][1],
            coords[j][2]
          );
        }
      }
    }

    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3));

    return { latticeNodesGeo: nGeo, latticeLinesGeo: lGeo };
  }, []);

  const particlesMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.14,
        map: spriteTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [spriteTex]
  );

  const ambientStarsMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.11,
        map: spriteTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [spriteTex]
  );

  const latticeNodesMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.17,
        map: spriteTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [spriteTex]
  );

  const latticeLinesMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#4f46e5',
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    return () => {
      particlesGeo.dispose();
      ambientStarsGeo.dispose();
      latticeNodesGeo.dispose();
      latticeLinesGeo.dispose();
      particlesMat.dispose();
      ambientStarsMat.dispose();
      latticeNodesMat.dispose();
      latticeLinesMat.dispose();
      spriteTex.dispose();
    };
  }, [
    particlesGeo,
    ambientStarsGeo,
    latticeNodesGeo,
    latticeLinesGeo,
    particlesMat,
    ambientStarsMat,
    latticeNodesMat,
    latticeLinesMat,
    spriteTex,
  ]);

  // Software WebGL paced invalidation loop so headless / VDI environments never starve
  useEffect(() => {
    if (!isSoftwareGl || !isVisible) return;
    let disposed = false;
    let timerId = 0;

    const scheduleNext = () => {
      if (disposed) return;
      const rawGl = gl.getContext();
      if (!rawGl || !('fenceSync' in rawGl)) {
        timerId = window.setTimeout(() => {
          if (!disposed) {
            invalidate();
            scheduleNext();
          }
        }, 90);
        return;
      }

      const webgl2 = rawGl as WebGL2RenderingContext;
      const sync = webgl2.fenceSync(webgl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
      webgl2.flush();

      const poll = () => {
        if (disposed) {
          if (sync) webgl2.deleteSync(sync);
          return;
        }
        const status = sync && webgl2.getSyncParameter(sync, webgl2.SYNC_STATUS);
        if (status === webgl2.UNSIGNALED) {
          timerId = window.setTimeout(poll, 8);
        } else {
          if (sync) webgl2.deleteSync(sync);
          timerId = window.setTimeout(() => {
            if (!disposed) {
              invalidate();
              scheduleNext();
            }
          }, 90);
        }
      };

      timerId = window.setTimeout(poll, 8);
    };

    invalidate();
    scheduleNext();

    return () => {
      disposed = true;
      window.clearTimeout(timerId);
    };
  }, [gl, invalidate, isSoftwareGl, isVisible]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    simTimeRef.current += delta;
    const t = simTimeRef.current;

    const heroCluster = heroClusterRef.current;
    const ambientField = ambientFieldRef.current;
    if (!heroCluster || !ambientField) return;

    const ptr = pointerRef.current;
    if (ptr.pulseAge >= 0 && ptr.pulseAge < 1.8) {
      ptr.pulseAge += delta * 1.45;
    }

    const scrollRatio = scrollRatioRef.current;

    // Centered behind the Hero section at scroll=0, smoothly drifting across the full page on scroll
    const targetHeroY = scrollRatio * 1.35;
    const targetHeroRotY = t * 0.045 + scrollRatio * 0.65 + (ptr.active ? ptr.x * 0.28 : 0);
    const targetHeroRotX =
      Math.sin(t * 0.25) * 0.06 + scrollRatio * 0.14 + (ptr.active ? -ptr.y * 0.18 : 0);

    heroCluster.position.y = THREE.MathUtils.damp(heroCluster.position.y, targetHeroY, 3.0, delta);
    heroCluster.rotation.y = THREE.MathUtils.damp(
      heroCluster.rotation.y,
      targetHeroRotY,
      3.2,
      delta
    );
    heroCluster.rotation.x = THREE.MathUtils.damp(
      heroCluster.rotation.x,
      targetHeroRotX,
      3.2,
      delta
    );

    // Subtle parallax on full-page ambient starfield
    ambientField.rotation.y = THREE.MathUtils.damp(
      ambientField.rotation.y,
      -t * 0.015 + (ptr.active ? ptr.x * 0.08 : 0),
      2.4,
      delta
    );
    ambientField.position.y = THREE.MathUtils.damp(
      ambientField.position.y,
      scrollRatio * 0.85,
      2.6,
      delta
    );

    // Fade constellation lines subtly when scrolled far down so text sections stay crystal clear
    const targetLineOpacity = THREE.MathUtils.lerp(0.18, 0.07, Math.min(1, scrollRatio * 2.2));
    latticeLinesMat.opacity = THREE.MathUtils.damp(
      latticeLinesMat.opacity,
      targetLineOpacity,
      4.0,
      delta
    );

    // Update hero particle positions with harmonic wave + pointer ripple + click pulse
    const posAttr = particlesGeo.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const cursorWorldX = ptr.x * 4.8;
    const cursorWorldY = ptr.y * 2.8;

    const pulseActive = ptr.pulseAge >= 0 && ptr.pulseAge < 1.6;
    const pulseRadius = ptr.pulseAge * 4.4;
    const pulseX = ptr.pulseOriginX * 4.8;
    const pulseY = ptr.pulseOriginY * 2.8;

    for (let i = 0; i < HERO_PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const bx = basePositions[idx];
      const by = basePositions[idx + 1];
      const bz = basePositions[idx + 2];
      const ph = phases[i];

      let nx = bx + Math.sin(t * 0.55 + ph) * 0.11;
      let ny = by + Math.cos(t * 0.45 + ph * 1.3) * 0.11;
      let nz = bz + Math.sin(t * 0.35 + ph * 0.7) * 0.08;

      if (ptr.active) {
        const dx = nx - cursorWorldX;
        const dy = ny - cursorWorldY;
        const distSq = dx * dx + dy * dy;
        if (distSq < 3.8 && distSq > 0.001) {
          const force = (1 - distSq / 3.8) * 0.34;
          const invDist = 1 / Math.sqrt(distSq);
          nx += dx * invDist * force;
          ny += dy * invDist * force;
        }
      }

      if (pulseActive) {
        const pdx = nx - pulseX;
        const pdy = ny - pulseY;
        const dist = Math.sqrt(pdx * pdx + pdy * pdy);
        const band = Math.abs(dist - pulseRadius);
        if (band < 0.85 && dist > 0.001) {
          const strength = (1 - band / 0.85) * (1 - ptr.pulseAge / 1.6) * 0.36;
          nx += (pdx / dist) * strength;
          ny += (pdy / dist) * strength;
          nz += strength * 0.45;
        }
      }

      arr[idx] = nx;
      arr[idx + 1] = ny;
      arr[idx + 2] = nz;
    }

    posAttr.needsUpdate = true;
  });

  return (
    <>
      <group ref={ambientFieldRef}>
        <points geometry={ambientStarsGeo} material={ambientStarsMat} />
      </group>
      <group ref={heroClusterRef} position={[0, 0.25, 0]}>
        <points geometry={particlesGeo} material={particlesMat} />
        <points geometry={latticeNodesGeo} material={latticeNodesMat} />
        <lineSegments geometry={latticeLinesGeo} material={latticeLinesMat} />
      </group>
    </>
  );
}

interface HeroParticleBackgroundProps {
  fullPage?: boolean;
}

export function HeroParticleBackground({ fullPage = true }: HeroParticleBackgroundProps) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    active: false,
    pulseAge: -1,
    pulseOriginX: 0,
    pulseOriginY: 0,
  });
  const scrollRatioRef = useRef(0);

  const [isVisible, setIsVisible] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);

  useEffect(() => {
    if (!fullPage) {
      setPortalTarget(null);
      return;
    }
    setPortalTarget(document.getElementById('home-particle-portal'));
  }, [fullPage]);

  // Pause rendering when browser tab is hidden (or when inline section scrolls out of view)
  useEffect(() => {
    if (prefersReduced) return;

    const handleVisibility = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    let io: IntersectionObserver | null = null;
    if (!fullPage && containerRef.current) {
      io = new IntersectionObserver(
        (entries) => {
          setIsVisible(Boolean(entries[0]?.isIntersecting ?? true));
        },
        { threshold: 0.02 }
      );
      io.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      io?.disconnect();
    };
  }, [fullPage, prefersReduced]);

  // Track full-page scroll depth & pointer coordinates without blocking UI interaction
  useEffect(() => {
    if (prefersReduced) return;

    const updateScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      scrollRatioRef.current = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (fullPage) {
        pointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        pointerRef.current.y = -((e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2);
        pointerRef.current.active = true;
        return;
      }

      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!inside) {
        pointerRef.current.active = false;
        return;
      }

      pointerRef.current.x = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
      pointerRef.current.y = -(((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2);
      pointerRef.current.active = true;
    };

    const handlePointerDown = (e: PointerEvent) => {
      const nx = fullPage
        ? (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2
        : pointerRef.current.x;
      const ny = fullPage
        ? -((e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2)
        : pointerRef.current.y;
      pointerRef.current.pulseOriginX = nx;
      pointerRef.current.pulseOriginY = ny;
      pointerRef.current.pulseAge = 0;
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [fullPage, prefersReduced]);

  if (prefersReduced || contextLost) {
    return null;
  }

  const canvasNode = (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={
        fullPage
          ? 'pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden opacity-85'
          : 'pointer-events-none absolute inset-0 z-[1] flex items-center justify-center overflow-hidden opacity-85'
      }
    >
      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 1.75]}
        frameloop={!isVisible ? 'never' : isSoftwareGl ? 'demand' : 'always'}
        camera={{ position: [0, 0, 7.2], fov: 48, near: 0.1, far: 40 }}
        gl={{
          antialias: !isSoftwareGl,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.domElement.addEventListener(
            'webglcontextlost',
            (e) => {
              e.preventDefault();
              setContextLost(true);
            },
            false
          );
          gl.domElement.addEventListener(
            'webglcontextrestored',
            () => {
              setContextLost(false);
            },
            false
          );
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <QuantumParticleField
          pointerRef={pointerRef}
          scrollRatioRef={scrollRatioRef}
          isSoftwareGl={isSoftwareGl}
          isVisible={isVisible}
        />
      </Canvas>
    </div>
  );

  if (fullPage && portalTarget) {
    return createPortal(canvasNode, portalTarget);
  }

  return canvasNode;
}
