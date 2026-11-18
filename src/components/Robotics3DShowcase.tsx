import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Cpu,
  Gauge,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { PageRoute } from '../types';

type RoboticsMode = 'inspect' | 'wave' | 'sweep';

interface Robotics3DShowcaseProps {
  onNavigate?: (route: PageRoute, subjectId?: string) => void;
}

const MODE_LABELS: Record<RoboticsMode, { label: string; telemetry: string }> = {
  inspect: {
    label: 'Pick & Inspect',
    telemetry: 'KINEMATIC MODE · AUTONOMOUS PICK & LASER SCAN',
  },
  wave: {
    label: 'Harmonic',
    telemetry: 'KINEMATIC MODE · MULTI-AXIS HARMONIC SYNC',
  },
  sweep: {
    label: 'Sweep',
    telemetry: 'KINEMATIC MODE · 360° CALIBRATION TELEMETRY',
  },
};

// Pre-allocated math helpers outside render loop (Zero GC)
const _dummy = new THREE.Object3D();
const _targetPos = new THREE.Vector3();

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

function createFloorGridTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#060c1d';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle calibration grid lines
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.22)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Precision crosshair rings around center
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.35)';
    ctx.lineWidth = 2;
    [96, 168, 232].forEach((r) => {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Radial edge fade vignette
    const grad = ctx.createRadialGradient(256, 256, 60, 256, 256, 256);
    grad.addColorStop(0, 'rgba(6, 12, 29, 0)');
    grad.addColorStop(0.72, 'rgba(6, 12, 29, 0.35)');
    grad.addColorStop(1, 'rgba(4, 8, 20, 1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 124);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.78)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.32)');
    grad.addColorStop(1, 'rgba(4, 8, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function Robotics3DShowcase({ onNavigate }: Robotics3DShowcaseProps) {
  const prefersReduced = useReducedMotion();
  const hostRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<RoboticsMode>('inspect');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<1 | 1.5 | 0.5>(1);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const modeRef = useRef<RoboticsMode>('inspect');
  const isPlayingRef = useRef(true);
  const speedRef = useRef(1);
  const isVisibleRef = useRef(true);
  const resetCameraRef = useRef(false);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

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
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initW = Math.max(1, host.clientWidth || 720);
    const initH = Math.max(1, host.clientHeight || 480);
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
    scene.fog = new THREE.FogExp2(0x040814, 0.042);

    const camera = new THREE.PerspectiveCamera(38, initW / initH, 0.1, 80);
    camera.position.set(4.1, 3.05, 5.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.enableZoom = false; // Keep vertical page scroll smooth
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0.25, 1.15, 0);
    controls.update();

    // Studio Reflection Environment (PMREM)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // Calibrated 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x090f24, 0.88);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.3);
    keyLight.position.set(5.5, 8.0, 5.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 22;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8b5cf6, 1.9);
    rimLight.position.set(-5.0, 3.5, -4.5);
    scene.add(rimLight);

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const floorTex = createFloorGridTexture();
    floorTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    textures.push(floorTex);

    const shadowTex = createContactShadowTexture();
    textures.push(shadowTex);

    // Materials (varied PBR contrast: brushed metal, anodized blue, matte polymer, glowing emissives, transmissive crystal)
    const darkChassisMat = new THREE.MeshStandardMaterial({
      color: 0x162033,
      metalness: 0.88,
      roughness: 0.28,
    });
    const brushedAluminumMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.94,
      roughness: 0.18,
    });
    const anodizedBlueMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.82,
      roughness: 0.24,
    });
    const mattePolymerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.15,
      roughness: 0.72,
    });
    const violetEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.65,
      roughness: 0.25,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.75,
    });
    const cyanEmissiveMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.55,
      roughness: 0.22,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.9,
    });
    const scanConeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const crystalSpecimenMat = new THREE.MeshPhysicalMaterial({
      color: 0x60a5fa,
      metalness: 0.08,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: isSoftwareGl ? 0.68 : 1.0,
      ior: 1.55,
      thickness: 0.9,
      clearcoat: 1.0,
    });

    materials.push(
      darkChassisMat,
      brushedAluminumMat,
      anodizedBlueMat,
      mattePolymerMat,
      violetEmissiveMat,
      cyanEmissiveMat,
      scanConeMat,
      crystalSpecimenMat
    );

    // Arena Floor & Contact Shadows
    const floorGeo = new THREE.CircleGeometry(4.4, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.42,
      metalness: 0.35,
    });
    geometries.push(floorGeo);
    materials.push(floorMat);

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = !isSoftwareGl;
    scene.add(floorMesh);

    const shadowPlaneGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    });
    geometries.push(shadowPlaneGeo);
    materials.push(shadowPlaneMat);

    const armShadow = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    armShadow.rotation.x = -Math.PI / 2;
    armShadow.position.set(-0.75, 0.01, 0);
    scene.add(armShadow);

    // Master Robotic Assembly positioned slightly left of center to frame specimen pedestal cleanly
    const robotRoot = new THREE.Group();
    robotRoot.position.set(-0.75, 0, 0);
    scene.add(robotRoot);

    // Part 1: Stepped Calibration Base (LatheGeometry)
    const basePoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.88, 0),
      new THREE.Vector2(0.88, 0.1),
      new THREE.Vector2(0.76, 0.16),
      new THREE.Vector2(0.72, 0.28),
      new THREE.Vector2(0.58, 0.34),
      new THREE.Vector2(0, 0.34),
    ];
    const baseGeo = new THREE.LatheGeometry(basePoints, 36);
    geometries.push(baseGeo);
    const baseMesh = new THREE.Mesh(baseGeo, darkChassisMat);
    baseMesh.castShadow = !isSoftwareGl;
    baseMesh.receiveShadow = !isSoftwareGl;
    robotRoot.add(baseMesh);

    // Glowing Base Ring
    const baseGlowGeo = new THREE.TorusGeometry(0.75, 0.022, 12, 48);
    baseGlowGeo.rotateX(Math.PI / 2);
    geometries.push(baseGlowGeo);
    const baseGlowRing = new THREE.Mesh(baseGlowGeo, cyanEmissiveMat);
    baseGlowRing.position.y = 0.16;
    robotRoot.add(baseGlowRing);

    // Base Fastener Bolts (InstancedMesh)
    const boltGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.06, 6);
    geometries.push(boltGeo);
    const baseBolts = new THREE.InstancedMesh(boltGeo, brushedAluminumMat, 12);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      _dummy.position.set(Math.cos(a) * 0.8, 0.11, Math.sin(a) * 0.8);
      _dummy.rotation.set(0, a, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      baseBolts.setMatrixAt(i, _dummy.matrix);
    }
    baseBolts.instanceMatrix.needsUpdate = true;
    baseBolts.computeBoundingSphere();
    baseBolts.frustumCulled = false;
    robotRoot.add(baseBolts);

    // Part 2: Rotating Waist Turret
    const waistPivot = new THREE.Group();
    waistPivot.position.y = 0.34;
    robotRoot.add(waistPivot);

    const turretGeo = new THREE.CylinderGeometry(0.46, 0.54, 0.32, 24);
    geometries.push(turretGeo);
    const turretMesh = new THREE.Mesh(turretGeo, anodizedBlueMat);
    turretMesh.position.y = 0.16;
    turretMesh.castShadow = !isSoftwareGl;
    waistPivot.add(turretMesh);

    // Beveled Dual Shoulder Clevis Brackets (ExtrudeGeometry)
    const bracketShape = new THREE.Shape();
    bracketShape.moveTo(-0.26, 0);
    bracketShape.lineTo(0.26, 0);
    bracketShape.lineTo(0.18, 0.52);
    bracketShape.absarc(0, 0.52, 0.18, 0, Math.PI, false);
    bracketShape.lineTo(-0.26, 0);

    const bracketGeo = new THREE.ExtrudeGeometry(bracketShape, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    bracketGeo.center();
    geometries.push(bracketGeo);

    const leftBracket = new THREE.Mesh(bracketGeo, darkChassisMat);
    leftBracket.position.set(0, 0.52, 0.22);
    leftBracket.castShadow = !isSoftwareGl;
    const rightBracket = new THREE.Mesh(bracketGeo, darkChassisMat);
    rightBracket.position.set(0, 0.52, -0.22);
    rightBracket.castShadow = !isSoftwareGl;
    waistPivot.add(leftBracket, rightBracket);

    // Shoulder Servo Drum
    const servoGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.62, 24);
    servoGeo.rotateX(Math.PI / 2);
    geometries.push(servoGeo);
    const shoulderServo = new THREE.Mesh(servoGeo, brushedAluminumMat);
    shoulderServo.position.set(0, 0.72, 0);
    shoulderServo.castShadow = !isSoftwareGl;
    waistPivot.add(shoulderServo);

    // Part 3: Lower Boom Arm (Shoulder Pivot)
    const shoulderPivot = new THREE.Group();
    shoulderPivot.position.set(0, 0.72, 0);
    waistPivot.add(shoulderPivot);

    const lowerBeamGeo = new THREE.BoxGeometry(0.18, 1.38, 0.14);
    const centerStrutGeo = new THREE.CylinderGeometry(0.055, 0.055, 1.24, 14);
    geometries.push(lowerBeamGeo, centerStrutGeo);

    const beamFront = new THREE.Mesh(lowerBeamGeo, anodizedBlueMat);
    beamFront.position.set(0, 0.69, 0.14);
    beamFront.castShadow = !isSoftwareGl;
    const beamBack = new THREE.Mesh(lowerBeamGeo, anodizedBlueMat);
    beamBack.position.set(0, 0.69, -0.14);
    beamBack.castShadow = !isSoftwareGl;
    const hydraulicPiston = new THREE.Mesh(centerStrutGeo, brushedAluminumMat);
    hydraulicPiston.position.set(-0.14, 0.62, 0);

    shoulderPivot.add(beamFront, beamBack, hydraulicPiston);

    // Violet Servo Cap on Shoulder
    const servoCapGeo = new THREE.TorusGeometry(0.16, 0.025, 12, 32);
    geometries.push(servoCapGeo);
    const shoulderCapF = new THREE.Mesh(servoCapGeo, violetEmissiveMat);
    shoulderCapF.position.set(0, 0, 0.32);
    const shoulderCapB = new THREE.Mesh(servoCapGeo, violetEmissiveMat);
    shoulderCapB.position.set(0, 0, -0.32);
    shoulderPivot.add(shoulderCapF, shoulderCapB);

    // Part 4: Elbow Pivot & Tapered Forearm
    const elbowPivot = new THREE.Group();
    elbowPivot.position.set(0, 1.36, 0);
    shoulderPivot.add(elbowPivot);

    const elbowDrumGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.48, 24);
    elbowDrumGeo.rotateX(Math.PI / 2);
    geometries.push(elbowDrumGeo);
    const elbowDrum = new THREE.Mesh(elbowDrumGeo, brushedAluminumMat);
    elbowDrum.castShadow = !isSoftwareGl;
    elbowPivot.add(elbowDrum);

    const forearmGeo = new THREE.CylinderGeometry(0.1, 0.15, 1.18, 16);
    forearmGeo.rotateZ(-Math.PI / 2);
    geometries.push(forearmGeo);
    const forearmMesh = new THREE.Mesh(forearmGeo, darkChassisMat);
    forearmMesh.position.set(0.58, 0, 0);
    forearmMesh.castShadow = !isSoftwareGl;
    elbowPivot.add(forearmMesh);

    // Optical Conduit Bar along Forearm
    const conduitGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.96, 10);
    conduitGeo.rotateZ(-Math.PI / 2);
    geometries.push(conduitGeo);
    const forearmConduit = new THREE.Mesh(conduitGeo, cyanEmissiveMat);
    forearmConduit.position.set(0.56, 0.14, 0);
    elbowPivot.add(forearmConduit);

    // Part 5: Wrist Gimbal, Dual Precision Gripper & Volumetric Laser Scan Cone
    const wristPivot = new THREE.Group();
    wristPivot.position.set(1.16, 0, 0);
    elbowPivot.add(wristPivot);

    const wristSphereGeo = new THREE.SphereGeometry(0.12, 20, 16);
    const flangeGeo = new THREE.CylinderGeometry(0.14, 0.11, 0.16, 18);
    flangeGeo.rotateZ(-Math.PI / 2);
    geometries.push(wristSphereGeo, flangeGeo);

    const wristJoint = new THREE.Mesh(wristSphereGeo, brushedAluminumMat);
    const gripperBase = new THREE.Mesh(flangeGeo, mattePolymerMat);
    gripperBase.position.x = 0.12;
    wristPivot.add(wristJoint, gripperBase);

    const jawGeo = new THREE.BoxGeometry(0.24, 0.04, 0.055);
    geometries.push(jawGeo);
    const jawTop = new THREE.Mesh(jawGeo, brushedAluminumMat);
    jawTop.position.set(0.28, 0.08, 0);
    const jawBottom = new THREE.Mesh(jawGeo, brushedAluminumMat);
    jawBottom.position.set(0.28, -0.08, 0);
    wristPivot.add(jawTop, jawBottom);

    // Emitter Nozzle + Volumetric Scan Beam Cone
    const emitterGeo = new THREE.SphereGeometry(0.048, 16, 16);
    const coneGeo = new THREE.ConeGeometry(0.36, 1.05, 28, 1, true);
    coneGeo.translate(0, -0.525, 0);
    coneGeo.rotateZ(Math.PI / 2);
    geometries.push(emitterGeo, coneGeo);

    const scannerEmitter = new THREE.Mesh(emitterGeo, cyanEmissiveMat);
    scannerEmitter.position.set(0.22, 0, 0);
    const scanCone = new THREE.Mesh(coneGeo, scanConeMat);
    scanCone.position.set(0.22, 0, 0);
    wristPivot.add(scannerEmitter, scanCone);

    // Part 6: Inspection Target Pedestal & Floating Holographic Specimen
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(1.35, 0, 0.1);
    scene.add(pedestalGroup);

    const pedGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.42, 8);
    const pedRingGeo = new THREE.TorusGeometry(0.44, 0.018, 10, 36);
    pedRingGeo.rotateX(Math.PI / 2);
    geometries.push(pedGeo, pedRingGeo);

    const pedMesh = new THREE.Mesh(pedGeo, mattePolymerMat);
    pedMesh.position.y = 0.21;
    pedMesh.castShadow = !isSoftwareGl;
    pedMesh.receiveShadow = !isSoftwareGl;
    const pedGlow = new THREE.Mesh(pedRingGeo, violetEmissiveMat);
    pedGlow.position.y = 0.42;
    pedestalGroup.add(pedMesh, pedGlow);

    const specimenOuterGeo = new THREE.OctahedronGeometry(0.28, 0);
    const specimenCoreGeo = new THREE.IcosahedronGeometry(0.14, 0);
    geometries.push(specimenOuterGeo, specimenCoreGeo);

    const specimenShell = new THREE.Mesh(specimenOuterGeo, crystalSpecimenMat);
    specimenShell.position.y = 0.85;
    specimenShell.renderOrder = 2;
    const specimenInner = new THREE.Mesh(specimenCoreGeo, violetEmissiveMat);
    specimenInner.position.y = 0.85;
    pedestalGroup.add(specimenShell, specimenInner);

    // Part 7: 72 Animated Telemetry Field Cubes (InstancedMesh Harmonic Wave)
    const nodeCount = 72;
    const nodeGeo = new THREE.BoxGeometry(0.048, 0.048, 0.048);
    geometries.push(nodeGeo);
    const telemetryNodes = new THREE.InstancedMesh(nodeGeo, cyanEmissiveMat, nodeCount);
    telemetryNodes.frustumCulled = false;
    scene.add(telemetryNodes);

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
      const w = Math.max(1, host.clientWidth || 720);
      const h = Math.max(1, host.clientHeight || 480);
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
    let simTime = 0;

    // Smoothed kinematic state (zero sudden snaps between modes)
    let curWaist = 0;
    let curShoulder = -0.25;
    let curElbow = -0.35;
    let curWrist = -0.4;
    let curJaw = 0.08;

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

      if (resetCameraRef.current) {
        _targetPos.set(4.1, 3.05, 5.4);
        camera.position.copy(_targetPos);
        controls.target.set(0.25, 1.15, 0);
        controls.update();
        resetCameraRef.current = false;
      }

      if (isVisibleRef.current) {
        if (isPlayingRef.current) {
          simTime += delta * speedRef.current;
        }

        const activeMode = modeRef.current;
        let tWaist = 0;
        let tShoulder = -0.28;
        let tElbow = -0.35;
        let tWrist = -0.45;
        let tJaw = 0.08;

        if (activeMode === 'inspect') {
          tWaist = Math.sin(simTime * 0.7) * 0.26 - 0.06;
          tShoulder = -0.38 + Math.sin(simTime * 1.1) * 0.16;
          tElbow = -0.28 + Math.cos(simTime * 1.1) * 0.22;
          tWrist = -0.52 + Math.sin(simTime * 1.8) * 0.18;
          tJaw = 0.065 + (Math.sin(simTime * 2.4) * 0.5 + 0.5) * 0.05;
          scanConeMat.opacity = 0.15 + Math.sin(simTime * 4.0) * 0.06;
        } else if (activeMode === 'wave') {
          tWaist = Math.sin(simTime * 0.9) * 0.75;
          tShoulder = -0.2 + Math.sin(simTime * 1.4) * 0.34;
          tElbow = -0.15 + Math.sin(simTime * 1.4 - 0.8) * 0.42;
          tWrist = -0.2 + Math.sin(simTime * 2.1 - 1.4) * 0.36;
          tJaw = 0.09;
          scanConeMat.opacity = 0.11;
        } else {
          // 360 calibration sweep
          tWaist = simTime * 0.65;
          tShoulder = -0.15 + Math.sin(simTime * 1.2) * 0.12;
          tElbow = -0.22;
          tWrist = -0.35 + Math.cos(simTime * 2.0) * 0.12;
          tJaw = 0.075;
          scanConeMat.opacity = 0.2;
        }

        // Smooth angular damping (shortest-arc lerp for continuous sweep)
        curWaist =
          activeMode === 'sweep'
            ? THREE.MathUtils.lerp(curWaist, tWaist, 1 - Math.exp(-5 * delta))
            : THREE.MathUtils.damp(curWaist, tWaist, 5.5, delta);
        curShoulder = THREE.MathUtils.damp(curShoulder, tShoulder, 5.5, delta);
        curElbow = THREE.MathUtils.damp(curElbow, tElbow, 5.5, delta);
        curWrist = THREE.MathUtils.damp(curWrist, tWrist, 6.0, delta);
        curJaw = THREE.MathUtils.damp(curJaw, tJaw, 7.0, delta);

        waistPivot.rotation.y = curWaist;
        shoulderPivot.rotation.z = curShoulder;
        elbowPivot.rotation.z = curElbow;
        wristPivot.rotation.z = curWrist;
        jawTop.position.y = curJaw;
        jawBottom.position.y = -curJaw;

        // Levitating specimen animation
        specimenShell.rotation.y = simTime * 0.85;
        specimenShell.rotation.x = Math.sin(simTime * 0.7) * 0.25;
        specimenInner.rotation.y = -simTime * 1.4;
        const hoverY = 0.86 + Math.sin(simTime * 1.8) * 0.07;
        specimenShell.position.y = hoverY;
        specimenInner.position.y = hoverY;

        // Harmonic orbital telemetry cubes
        for (let i = 0; i < nodeCount; i++) {
          const angle = (i / nodeCount) * Math.PI * 2 + simTime * 0.14;
          const ring = 2.15 + (i % 4) * 0.42;
          const waveY =
            0.35 + ((i % 5) * 0.22) + Math.sin(simTime * 1.7 + i * 0.45) * 0.16;
          _dummy.position.set(Math.cos(angle) * ring, waveY, Math.sin(angle) * ring);
          _dummy.rotation.set(simTime * 0.6 + i, angle, 0);
          const s = 0.75 + Math.sin(simTime * 2.0 + i) * 0.25;
          _dummy.scale.setScalar(s);
          _dummy.updateMatrix();
          telemetryNodes.setMatrixAt(i, _dummy.matrix);
        }
        telemetryNodes.instanceMatrix.needsUpdate = true;

        controls.update();
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
      controls.dispose();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
    };
  }, [prefersReduced]);

  const cycleSpeed = () => {
    setSpeed((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 0.5 : 1));
  };

  return (
    <section
      className="relative border-t border-white/10 bg-[#040814]/45 py-16 sm:py-24"
      aria-label="Interactive 3D Robotics & Cybernetics Simulation"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-blue-400">
              <Cpu className="h-4 w-4" />
              <span>Real-Time 3D Mechatronics Lab</span>
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Interactive 3D Robotic Calibration Studio
            </h2>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-300">
              Drag to orbit around the 6-axis educational robotics rig and switch kinematic presets in real time. Built for Engineering Technology, ICT, and Automation demonstrations.
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              <span>Inspect Robotics Projects</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Full-Width Interactive 3D Viewport */}
        <div className="relative mt-8 h-[420px] w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#091228] via-[#050a18] to-[#040814] sm:h-[500px] lg:h-[540px]">
          {/* Minimal Top-Left Telemetry Readout (no backdrop-filter, no pulsing dot) */}
          <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-[#070d1e]/90 px-3.5 py-2 sm:left-5 sm:top-5">
            <p className="font-mono text-[11px] font-semibold text-blue-300">
              {MODE_LABELS[mode].telemetry}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Drag canvas to orbit · Speed {speed.toFixed(1)}×
            </p>
          </div>

          {prefersReduced || contextLost ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
              <svg className="h-28 w-28 text-blue-400" viewBox="0 0 140 140" fill="none">
                <rect x="35" y="106" width="70" height="14" rx="4" stroke="currentColor" strokeWidth="2" fill="rgba(37, 99, 235, 0.2)" />
                <path d="M55 106 L55 72 L85 44 L106 54" stroke="#60a5fa" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="55" cy="72" r="6" fill="#8b5cf6" />
                <circle cx="85" cy="44" r="5" fill="#38bdf8" />
                <polygon points="104,70 116,84 104,98 92,84" fill="rgba(139, 92, 246, 0.3)" stroke="#8b5cf6" strokeWidth="1.5" />
              </svg>
              <p className="font-display mt-4 text-lg font-semibold text-white">
                6-Axis Robotic Calibration Studio
              </p>
              <p className="mt-1 max-w-md text-xs text-slate-400">
                Interactive WebGL kinematics paused for reduced-motion accessibility.
              </p>
            </div>
          ) : (
            <div
              ref={hostRef}
              role="img"
              aria-label="Interactive 3D Robotic Calibration Arm — drag to orbit"
              className="h-full w-full cursor-grab active:cursor-grabbing"
            />
          )}

          {/* Unified Collapsible Bottom Control Dock (Zero backdrop-filter over WebGL) */}
          {!prefersReduced && !contextLost && (
            <div className="absolute bottom-4 left-1/2 z-10 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-col items-center gap-2">
              {dockCollapsed ? (
                <button
                  type="button"
                  onClick={() => setDockCollapsed(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-[#070d1e]/95 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-400/50 hover:text-white"
                >
                  <ChevronUp className="h-3.5 w-3.5 text-blue-400" />
                  <span>Show 3D Controls</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-[#070d1e]/95 p-1.5 sm:gap-2 sm:px-3 sm:py-2">
                  {(['inspect', 'wave', 'sweep'] as RoboticsMode[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setMode(item)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        mode === item
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {MODE_LABELS[item].label}
                    </button>
                  ))}

                  <span className="hidden h-4 w-px bg-white/15 sm:inline-block" aria-hidden="true" />

                  <button
                    type="button"
                    onClick={() => setIsPlaying((p) => !p)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap"
                    aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5 text-blue-400" /> : <Play className="h-3.5 w-3.5 text-emerald-400" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={cycleSpeed}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap"
                    title="Cycle animation speed"
                  >
                    <Gauge className="h-3.5 w-3.5 text-violet-400" />
                    <span>{speed.toFixed(1)}×</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetCameraRef.current = true;
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap"
                    title="Reset camera angle"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Reset View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDockCollapsed(true)}
                    className="inline-flex items-center rounded-lg bg-white/5 p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Collapse 3D controls"
                    title="Collapse controls"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
