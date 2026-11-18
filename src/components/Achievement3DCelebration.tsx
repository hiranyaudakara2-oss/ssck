import { useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  Award,
  Calendar,
  CheckCircle2,
  FileBadge2,
  Medal,
  Sparkles,
  Trophy,
} from 'lucide-react';
import type { Achievement, AchievementIconType, AchievementTier } from '../types';
import {
  FullScreenOverlay,
  OverlayActionButton,
  OverlayMediaFrame,
  OverlayPanel,
  OverlayStagger,
} from './FullScreenOverlay';
import { SafeImage } from './MotionPrimitives';

export interface TierTheme {
  label: AchievementTier;
  primaryHex: string;
  secondaryHex: string;
  emissiveHex: string;
  borderGradient: string;
  badgeClass: string;
  glowClass: string;
  textAccentClass: string;
}

export const TIER_THEMES: Record<AchievementTier, TierTheme> = {
  Platinum: {
    label: 'Platinum',
    primaryHex: '#bae6fd',
    secondaryHex: '#a78bfa',
    emissiveHex: '#6366f1',
    borderGradient: 'from-cyan-400/70 via-blue-400/70 to-violet-400/70',
    badgeClass: 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200',
    glowClass: 'shadow-[0_0_32px_-8px_rgba(56,189,248,0.45)]',
    textAccentClass: 'text-cyan-300',
  },
  Gold: {
    label: 'Gold',
    primaryHex: '#fcd34d',
    secondaryHex: '#f59e0b',
    emissiveHex: '#d97706',
    borderGradient: 'from-amber-300/70 via-yellow-400/65 to-orange-400/70',
    badgeClass: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
    glowClass: 'shadow-[0_0_32px_-8px_rgba(245,158,11,0.42)]',
    textAccentClass: 'text-amber-300',
  },
  Silver: {
    label: 'Silver',
    primaryHex: '#e2e8f0',
    secondaryHex: '#94a3b8',
    emissiveHex: '#3b82f6',
    borderGradient: 'from-slate-200/65 via-sky-300/60 to-slate-400/65',
    badgeClass: 'border-slate-300/35 bg-slate-400/15 text-slate-200',
    glowClass: 'shadow-[0_0_30px_-8px_rgba(148,163,184,0.38)]',
    textAccentClass: 'text-slate-200',
  },
  Bronze: {
    label: 'Bronze',
    primaryHex: '#fdba74',
    secondaryHex: '#c2410c',
    emissiveHex: '#9a3412',
    borderGradient: 'from-orange-400/65 via-amber-500/60 to-rose-400/60',
    badgeClass: 'border-orange-400/35 bg-orange-500/15 text-orange-200',
    glowClass: 'shadow-[0_0_28px_-8px_rgba(234,88,12,0.38)]',
    textAccentClass: 'text-orange-300',
  },
};

export function resolveAchievementTier(ach: Achievement): AchievementTier {
  if (ach.tier && ach.tier in TIER_THEMES) return ach.tier;
  if (ach.awardLevel === 'International') return 'Platinum';
  if (ach.awardLevel === 'National') return 'Gold';
  if (ach.awardLevel === 'Provincial') return 'Silver';
  return 'Bronze';
}

export function resolveAchievementIconType(ach: Achievement): AchievementIconType {
  if (ach.iconType) return ach.iconType;
  const lower = ach.title.toLowerCase();
  if (lower.includes('certificate') || lower.includes('merit')) return 'certificate';
  if (lower.includes('medal') || lower.includes('silver') || lower.includes('olympiad')) return 'medal';
  if (lower.includes('trophy') || lower.includes('1st place') || lower.includes('championship')) return 'trophy';
  return 'award';
}

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

// Pre-allocated helpers outside useFrame (Zero GC)
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

interface StudioEnvProps {
  isSoftwareGl: boolean;
}

function StudioEnvironment({ isSoftwareGl }: StudioEnvProps) {
  const { gl, scene, invalidate } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const envTarget = pmrem.fromScene(room, 0.04);
    scene.environment = envTarget.texture;
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      envTarget.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    if (!isSoftwareGl) return;
    let disposed = false;
    let timerId = 0;

    const schedule = () => {
      if (disposed) return;
      const rawGl = gl.getContext();
      if (!rawGl || !('fenceSync' in rawGl)) {
        timerId = window.setTimeout(() => {
          if (!disposed) {
            invalidate();
            schedule();
          }
        }, 85);
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
              schedule();
            }
          }, 85);
        }
      };
      timerId = window.setTimeout(poll, 8);
    };

    invalidate();
    schedule();
    return () => {
      disposed = true;
      window.clearTimeout(timerId);
    };
  }, [gl, invalidate, isSoftwareGl]);

  return (
    <>
      <hemisphereLight args={[0x93c5fd, 0x090f24, 0.9]} />
      <directionalLight position={[4, 6, 5]} intensity={2.3} color={0xfff4e6} />
      <directionalLight position={[-4.5, 2, -4]} intensity={1.85} color={0x8b5cf6} />
    </>
  );
}

function ProceduralTrophyMesh({
  tier,
  celebrating = false,
}: {
  tier: AchievementTier;
  celebrating?: boolean;
}) {
  const rootRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const crownRef = useRef<THREE.Mesh>(null);
  const theme = TIER_THEMES[tier];

  // Composite procedural LatheGeometry trophy cup + torus handles + crystal crown
  const { baseGeo, cupGeo, handleGeo, haloGeo, crownGeo } = useMemo(() => {
    const basePts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.58, 0),
      new THREE.Vector2(0.58, 0.14),
      new THREE.Vector2(0.46, 0.2),
      new THREE.Vector2(0.42, 0.32),
      new THREE.Vector2(0.22, 0.36),
      new THREE.Vector2(0, 0.36),
    ];
    const bGeo = new THREE.LatheGeometry(basePts, 32);

    const cupPts = [
      new THREE.Vector2(0, 0.36),
      new THREE.Vector2(0.14, 0.36),
      new THREE.Vector2(0.11, 0.72),
      new THREE.Vector2(0.28, 0.88),
      new THREE.Vector2(0.56, 1.32),
      new THREE.Vector2(0.62, 1.72),
      new THREE.Vector2(0.54, 1.74),
      new THREE.Vector2(0.46, 1.34),
      new THREE.Vector2(0.18, 0.96),
      new THREE.Vector2(0, 0.96),
    ];
    const cGeo = new THREE.LatheGeometry(cupPts, 36);

    const hGeo = new THREE.TorusGeometry(0.24, 0.042, 12, 32, Math.PI * 1.18);
    const haGeo = new THREE.TorusGeometry(0.95, 0.025, 12, 64);
    const crGeo = new THREE.OctahedronGeometry(0.24, 0);

    return { baseGeo: bGeo, cupGeo: cGeo, handleGeo: hGeo, haloGeo: haGeo, crownGeo: crGeo };
  }, []);

  const primaryMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: theme.primaryHex,
        metalness: 0.92,
        roughness: 0.18,
      }),
    [theme.primaryHex]
  );

  const plinthMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.68,
        roughness: 0.34,
      }),
    []
  );

  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: theme.secondaryHex,
        metalness: 0.78,
        roughness: 0.24,
        emissive: theme.emissiveHex,
        emissiveIntensity: 0.48,
      }),
    [theme.secondaryHex, theme.emissiveHex]
  );

  useEffect(() => {
    return () => {
      baseGeo.dispose();
      cupGeo.dispose();
      handleGeo.dispose();
      haloGeo.dispose();
      crownGeo.dispose();
      primaryMat.dispose();
      plinthMat.dispose();
      accentMat.dispose();
    };
  }, [baseGeo, cupGeo, handleGeo, haloGeo, crownGeo, primaryMat, plinthMat, accentMat]);

  const elapsedRef = useRef(0);
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    elapsedRef.current += delta;
    const t = elapsedRef.current;

    if (rootRef.current) {
      const targetScale = celebrating ? 1 : 0.94;
      const curScale = rootRef.current.scale.x;
      const nextScale = THREE.MathUtils.damp(curScale, targetScale, 5.5, delta);
      rootRef.current.scale.setScalar(nextScale);

      rootRef.current.rotation.y = celebrating ? t * 1.15 : t * 0.55;
      rootRef.current.position.y = -0.92 + Math.sin(t * 2.0) * 0.07;
    }

    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.8;
      haloRef.current.rotation.x = Math.PI / 2.6 + Math.sin(t * 1.1) * 0.22;
    }

    if (crownRef.current) {
      crownRef.current.rotation.y = -t * 1.4;
      crownRef.current.rotation.x = t * 0.7;
      crownRef.current.position.y = 2.05 + Math.sin(t * 2.6) * 0.06;
    }
  });

  return (
    <group ref={rootRef} scale={celebrating ? 0.2 : 0.94} position={[0, -0.92, 0]}>
      <mesh geometry={baseGeo} material={plinthMat} />
      <mesh geometry={cupGeo} material={primaryMat} />
      <mesh
        geometry={handleGeo}
        material={primaryMat}
        position={[0.52, 1.38, 0]}
        rotation={[0, 0, -Math.PI * 0.58]}
      />
      <mesh
        geometry={handleGeo}
        material={primaryMat}
        position={[-0.52, 1.38, 0]}
        rotation={[0, Math.PI, -Math.PI * 0.58]}
      />
      <mesh ref={haloRef} geometry={haloGeo} material={accentMat} position={[0, 1.18, 0]} />
      <mesh ref={crownRef} geometry={crownGeo} material={accentMat} position={[0, 2.05, 0]} />
    </group>
  );
}

const CONFETTI_COUNT = 96;

function CelebrationConfettiBurst({ tier }: { tier: AchievementTier }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const theme = TIER_THEMES[tier];

  const { shardGeo, shardMat, seeds } = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.08, 0.14, 0.02);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.75,
      roughness: 0.22,
      emissive: theme.emissiveHex,
      emissiveIntensity: 0.35,
    });
    const arr = Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const a = (i / CONFETTI_COUNT) * Math.PI * 2 + (i % 7) * 0.31;
      const spd = 1.6 + (i % 5) * 0.45;
      const up = 2.2 + (i % 6) * 0.42;
      const spin = 2.5 + (i % 4) * 1.4;
      const scale = 0.65 + (i % 4) * 0.22;
      return { a, spd, up, spin, scale, delay: (i % 12) * 0.02 };
    });
    return { shardGeo: geo, shardMat: mat, seeds: arr };
  }, [theme.emissiveHex]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const hexChoices = [theme.primaryHex, theme.secondaryHex, '#60a5fa', '#a78bfa'];
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      _color.set(hexChoices[i % hexChoices.length]);
      mesh.setColorAt(i, _color);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.frustumCulled = false;

    return () => {
      shardGeo.dispose();
      shardMat.dispose();
    };
  }, [shardGeo, shardMat, theme.primaryHex, theme.secondaryHex]);

  const elapsedRef = useRef(0);

  useFrame((_, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const delta = Math.min(rawDelta, 0.05);
    elapsedRef.current += delta;
    const t = elapsedRef.current;

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const s = seeds[i];
      // Continuous looping celebration fountain
      const cycle = ((t + s.delay) % 3.6) / 3.6;
      const radial = s.spd * Math.pow(cycle, 0.72) * 1.55;
      const y = -0.3 + s.up * cycle - 2.35 * cycle * cycle;
      _dummy.position.set(
        Math.cos(s.a) * radial,
        y,
        Math.sin(s.a) * radial
      );
      _dummy.rotation.set(t * s.spin + i, t * s.spin * 0.7, s.a);
      const fadeScale = s.scale * Math.sin(cycle * Math.PI);
      _dummy.scale.setScalar(Math.max(0.001, fadeScale));
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[shardGeo, shardMat, CONFETTI_COUNT]} />;
}

export function AchievementHero3DEmblem({ tier }: { tier: AchievementTier }) {
  const prefersReduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || prefersReduced) return;
    const io = new IntersectionObserver(
      (entries) => setIsVisible(Boolean(entries[0]?.isIntersecting ?? true)),
      { threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [prefersReduced]);

  if (prefersReduced || contextLost) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Trophy className="h-20 w-20 text-amber-300" />
      </div>
    );
  }

  return (
    <div ref={hostRef} className="h-full w-full">
      <Canvas
        dpr={isSoftwareGl ? 1 : [1, 2]}
        frameloop={!isVisible ? 'never' : isSoftwareGl ? 'demand' : 'always'}
        camera={{ position: [0, 0.45, 4.3], fov: 36 }}
        gl={{ antialias: !isSoftwareGl, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
        }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <StudioEnvironment isSoftwareGl={isSoftwareGl} />
        <ProceduralTrophyMesh tier={tier} />
      </Canvas>
    </div>
  );
}

export function AchievementUnlockModal({
  achievement,
  onClose,
}: {
  achievement: Achievement | null;
  onClose: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [contextLost, setContextLost] = useState(false);
  const isSoftwareGl = useMemo(() => detectSoftwareGl(), []);

  const tier = achievement ? resolveAchievementTier(achievement) : 'Gold';
  const theme = TIER_THEMES[tier];
  const iconType = achievement ? resolveAchievementIconType(achievement) : 'trophy';

  const renderBadgeGlyph = () => {
    if (iconType === 'trophy') return <Trophy className="h-4 w-4" />;
    if (iconType === 'medal') return <Medal className="h-4 w-4" />;
    if (iconType === 'certificate') return <FileBadge2 className="h-4 w-4" />;
    return <Award className="h-4 w-4" />;
  };

  return (
    <FullScreenOverlay
      isOpen={Boolean(achievement)}
      onClose={onClose}
      ariaLabel={achievement ? `Achievement Unlocked: ${achievement.title}` : 'Achievement Unlocked'}
      closeLabel="Close celebration modal"
      maxWidth="4xl"
      tone="violet"
      headerBadge={
        <div className="flex items-center gap-2 font-semibold text-blue-200">
          <Sparkles className={`h-4 w-4 ${theme.textAccentClass}`} />
          <span>Achievement Unlocked</span>
        </div>
      }
    >
      {achievement && (
        <OverlayPanel className={theme.glowClass}>
          {/* 3D WebGL Celebration Viewport */}
          <div className="relative h-64 w-full overflow-hidden border-b border-blue-400/15 bg-gradient-to-b from-[#0f1a3a] via-[#080f24] to-[#050914] sm:h-80">
            {prefersReduced || contextLost ? (
              <div className="flex h-full w-full flex-col items-center justify-center">
                <div className={`flex h-24 w-24 items-center justify-center rounded-full border ${theme.badgeClass}`}>
                  <Trophy className="h-12 w-12" />
                </div>
              </div>
            ) : (
              <Canvas
                dpr={isSoftwareGl ? 1 : [1, 2]}
                frameloop={isSoftwareGl ? 'demand' : 'always'}
                camera={{ position: [0, 0.65, 4.6], fov: 40 }}
                gl={{ antialias: !isSoftwareGl, alpha: true, powerPreference: 'high-performance' }}
                onCreated={({ gl }) => {
                  gl.outputColorSpace = THREE.SRGBColorSpace;
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.18;
                  gl.domElement.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    setContextLost(true);
                  });
                }}
                style={{ width: '100%', height: '100%', display: 'block' }}
              >
                <StudioEnvironment isSoftwareGl={isSoftwareGl} />
                <ProceduralTrophyMesh tier={tier} celebrating />
                <CelebrationConfettiBurst tier={tier} />
              </Canvas>
            )}
          </div>

          {/* Achievement Details */}
          <div className="p-6 sm:p-10">
            <OverlayStagger delay={0.07}>
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-semibold ${theme.badgeClass}`}>
                  {renderBadgeGlyph()}
                  <span>{tier} Tier</span>
                </span>
                <span className="font-semibold text-blue-300">{achievement.awardLevel}</span>
                <span aria-hidden="true" className="text-slate-500">·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums text-cyan-300">
                  <Calendar className="h-3.5 w-3.5 text-blue-400" />
                  {achievement.awardDate || achievement.year}
                </span>
              </div>
            </OverlayStagger>

            <OverlayStagger delay={0.13}>
              <h2 className="font-display mt-3 bg-gradient-to-r from-white via-slate-100 to-violet-200 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                {achievement.title}
              </h2>
              <p className="mt-1 text-xs font-medium text-violet-300 sm:text-sm">{achievement.category}</p>
            </OverlayStagger>

            <OverlayStagger delay={0.2}>
              <div className="mt-6 grid gap-6 sm:grid-cols-12">
                {achievement.imageUrl && (
                  <OverlayMediaFrame
                    delay={0.18}
                    className="aspect-[4/3] rounded-xl border border-blue-400/20 sm:col-span-5"
                  >
                    <SafeImage
                      src={achievement.imageUrl}
                      alt={achievement.title}
                      fallbackLabel={achievement.title}
                      className="h-full w-full object-cover"
                    />
                  </OverlayMediaFrame>
                )}
                <div className={achievement.imageUrl ? 'sm:col-span-7' : 'sm:col-span-12'}>
                  <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
                    {achievement.description}
                  </p>
                  {achievement.recipients && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                        Awarded To
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-100 sm:text-sm">
                        {achievement.recipients}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </OverlayStagger>

            <OverlayStagger delay={0.28}>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Recorded in SSCK TECH Registry</span>
                </span>
                <OverlayActionButton variant="primary" onClick={onClose}>
                  Continue
                </OverlayActionButton>
              </div>
            </OverlayStagger>
          </div>
        </OverlayPanel>
      )}
    </FullScreenOverlay>
  );
}
