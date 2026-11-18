import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Layers, RotateCcw } from 'lucide-react';
import type { PageRoute } from '../types';

interface Scroll3DShowcaseProps {
  onNavigate: (route: PageRoute, subjectId?: string) => void;
}

const STAGES = [
  {
    id: 'science',
    step: '01',
    subtitle: 'SFT',
    title: '01. SCIENCE FOR TECHNOLOGY (SFT)',
    tagline: 'Discover Science. Understand Innovation.',
    description:
      'Explore the scientific principles behind modern technology through practical experiments, scientific research, and innovative learning. Build a strong foundation in applied science and discover how scientific knowledge shapes the future.',
    targetSubjectId: 'sft',
    actionLabel: 'Explore SFT',
  },
  {
    id: 'engineering',
    step: '02',
    subtitle: 'ET & BST',
    title: '02. ENGINEERING & BIO SYSTEMS TECHNOLOGY (ET & BST)',
    tagline: 'Design. Engineer. Transform.',
    description:
      'Explore engineering principles, advanced technological systems, biological processes, and sustainable solutions. Develop practical skills through creative design, hands-on experiments, and real-world technological applications.',
    targetSubjectId: 'et',
    actionLabel: 'Explore ET & BST',
  },
  {
    id: 'computing',
    step: '03',
    subtitle: 'ICT, GEO & AGRI',
    title: '03. DIGITAL, GEOSPATIAL & AGRICULTURAL TECHNOLOGY (ICT, GEO & AGRI)',
    tagline: 'Connect Technology. Explore Earth. Grow the Future.',
    description:
      'Discover the power of information technology, geographic information systems, geospatial analysis, and modern agriculture. Explore digital innovation, understand our environment, and develop smart solutions for a sustainable future.',
    targetSubjectId: 'ict',
    actionLabel: 'Explore ICT, GEO & AGRI',
  },
];

// Pre-allocated math helpers outside render loop (Zero GC)
const _vec3 = new THREE.Vector3();

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

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0, 'rgba(2, 6, 23, 0.72)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.28)');
    grad.addColorStop(1, 'rgba(5, 9, 20, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createCircuitRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      const y = i * 32 + 16;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#60a5fa';
    for (let x = 24; x < 512; x += 64) {
      for (let y = 16; y < 512; y += 64) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function Scroll3DShowcase(_props: Scroll3DShowcaseProps) {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);

  const [activeStage, setActiveStage] = useState(0);
  const [manualExplode, setManualExplode] = useState<boolean | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const scrollProgressRef = useRef(0);
  const manualExplodeRef = useRef<boolean | null>(null);
  const pointerTiltRef = useRef({ x: 0, y: 0 });
  const resetPulseRef = useRef(false);

  useEffect(() => {
    manualExplodeRef.current = manualExplode;
  }, [manualExplode]);

  // Track section scroll progress (0 -> 1)
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const raw = -rect.top / scrollable;
      const clamped = Math.min(1, Math.max(0, raw));
      scrollProgressRef.current = clamped;

      const stageIdx = clamped < 0.34 ? 0 : clamped < 0.7 ? 1 : 2;
      setActiveStage((prev) => (prev === stageIdx ? prev : stageIdx));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Initialize Three.js WebGL scene once
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || prefersReduced) return;

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
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const initW = host.clientWidth || 640;
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
    scene.fog = new THREE.FogExp2(0x050914, 0.045);

    const camera = new THREE.PerspectiveCamera(
      40,
      (host.clientWidth || 640) / Math.max(1, host.clientHeight || 480),
      0.1,
      100
    );
    camera.position.set(0, 1.35, 7.6);

    // Procedural Studio Environment (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x090f24, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(4.5, 6.5, 5.0);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x8b5cf6, 1.8);
    rimLight.position.set(-5.0, 2.5, -4.0);
    scene.add(rimLight);

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const circuitTex = createCircuitRingTexture();
    circuitTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    textures.push(circuitTex);

    const shadowTex = createContactShadowTexture();
    textures.push(shadowTex);

    // Materials with calibrated roughness/metalness contrast
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.24,
    });
    const anodizedCobaltMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.82,
      roughness: 0.28,
      map: circuitTex,
    });
    const violetAccentMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      metalness: 0.72,
      roughness: 0.32,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.45,
    });
    const satinSilverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.92,
      roughness: 0.16,
    });
    const crystalCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0x60a5fa,
      metalness: 0.05,
      roughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.9,
      transparent: true,
      opacity: isSoftwareGl ? 0.52 : 1.0,
      ior: 1.62,
      thickness: 1.4,
      attenuationColor: new THREE.Color(0x3b82f6),
      clearcoat: 1.0,
    });
    const satelliteMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.75,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
    });
    materials.push(
      titaniumMat,
      anodizedCobaltMat,
      violetAccentMat,
      satinSilverMat,
      crystalCoreMat,
      satelliteMat
    );

    // Master Tech-Core Composite Group (8 coordinated parts)
    const rootAssembly = new THREE.Group();
    scene.add(rootAssembly);

    // Part 1: Outer Machined Octagonal Housing (ExtrudeGeometry with bevel)
    const octShape = new THREE.Shape();
    const outerR = 1.65;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const x = Math.cos(a) * outerR;
      const y = Math.sin(a) * outerR;
      if (i === 0) octShape.moveTo(x, y);
      else octShape.lineTo(x, y);
    }
    octShape.closePath();
    const innerHole = new THREE.Path();
    innerHole.absarc(0, 0, 1.18, 0, Math.PI * 2, true);
    octShape.holes.push(innerHole);

    const chassisGeo = new THREE.ExtrudeGeometry(octShape, {
      depth: 0.36,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.05,
      bevelSegments: 3,
    });
    chassisGeo.center();
    geometries.push(chassisGeo);

    const frontChassis = new THREE.Mesh(chassisGeo, titaniumMat);
    frontChassis.position.z = 0.45;
    frontChassis.castShadow = !isSoftwareGl;
    rootAssembly.add(frontChassis);

    const rearChassis = new THREE.Mesh(chassisGeo, titaniumMat);
    rearChassis.position.z = -0.45;
    rearChassis.castShadow = !isSoftwareGl;
    rootAssembly.add(rearChassis);

    // Part 2: Precision Lathe Stator Collar
    const lathePts = [
      new THREE.Vector2(0.85, -0.35),
      new THREE.Vector2(1.12, -0.35),
      new THREE.Vector2(1.22, -0.15),
      new THREE.Vector2(1.22, 0.15),
      new THREE.Vector2(1.12, 0.35),
      new THREE.Vector2(0.85, 0.35),
    ];
    const statorGeo = new THREE.LatheGeometry(lathePts, 36);
    statorGeo.rotateX(Math.PI / 2);
    geometries.push(statorGeo);
    const statorCollar = new THREE.Mesh(statorGeo, anodizedCobaltMat);
    rootAssembly.add(statorCollar);

    // Part 3: Inner Gimbal Rings
    const gimbalOuterGeo = new THREE.TorusGeometry(1.05, 0.045, 16, 64);
    const gimbalInnerGeo = new THREE.TorusGeometry(0.82, 0.038, 16, 56);
    geometries.push(gimbalOuterGeo, gimbalInnerGeo);

    const gimbalOuter = new THREE.Mesh(gimbalOuterGeo, satinSilverMat);
    const gimbalInner = new THREE.Mesh(gimbalInnerGeo, violetAccentMat);
    rootAssembly.add(gimbalOuter);
    rootAssembly.add(gimbalInner);

    // Part 4: Central Optical Crystal Core + Internal Faceted Polyhedron
    const crystalShellGeo = new THREE.IcosahedronGeometry(0.56, 0);
    const innerEmitterGeo = new THREE.OctahedronGeometry(0.28, 0);
    geometries.push(crystalShellGeo, innerEmitterGeo);

    const crystalCore = new THREE.Mesh(crystalShellGeo, crystalCoreMat);
    const innerEmitter = new THREE.Mesh(innerEmitterGeo, violetAccentMat);
    crystalCore.renderOrder = 2;
    rootAssembly.add(crystalCore);
    rootAssembly.add(innerEmitter);

    // Part 5: 24 Precision Fastener Bolts (InstancedMesh)
    const boltGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.1, 6);
    boltGeo.rotateX(Math.PI / 2);
    geometries.push(boltGeo);
    const bolts = new THREE.InstancedMesh(boltGeo, satinSilverMat, 16);
    const boltDummy = new THREE.Object3D();
    for (let i = 0; i < 16; i++) {
      const ringIdx = i < 8 ? 0 : 1;
      const angle = ((i % 8) / 8) * Math.PI * 2;
      boltDummy.position.set(
        Math.cos(angle) * 1.42,
        Math.sin(angle) * 1.42,
        ringIdx === 0 ? 0.68 : -0.68
      );
      boltDummy.rotation.set(0, 0, angle);
      boltDummy.updateMatrix();
      bolts.setMatrixAt(i, boltDummy.matrix);
    }
    bolts.instanceMatrix.needsUpdate = true;
    bolts.computeBoundingSphere();
    bolts.frustumCulled = false;
    rootAssembly.add(bolts);

    // Part 6: 6 Discipline Orbital Satellites (SFT, ET, ICT, BST, AGRI, GEO)
    const satGroup = new THREE.Group();
    const satGeo = new THREE.OctahedronGeometry(0.14, 0);
    const satRingGeo = new THREE.TorusGeometry(0.2, 0.018, 10, 28);
    geometries.push(satGeo, satRingGeo);
    const satMeshes: THREE.Group[] = [];

    for (let i = 0; i < 6; i++) {
      const node = new THREE.Group();
      const body = new THREE.Mesh(satGeo, satelliteMat);
      const halo = new THREE.Mesh(satRingGeo, satinSilverMat);
      halo.rotation.x = Math.PI / 2.4;
      node.add(body, halo);
      const angle = (i / 6) * Math.PI * 2;
      node.position.set(Math.cos(angle) * 2.25, Math.sin(angle) * 1.15, Math.sin(angle * 2) * 0.65);
      satGroup.add(node);
      satMeshes.push(node);
    }
    rootAssembly.add(satGroup);

    // Part 7: Procedural Orbital Conduit Spline (TubeGeometry)
    const conduitPoints = [
      new THREE.Vector3(-2.3, -0.4, 0.4),
      new THREE.Vector3(-1.1, 1.35, -0.5),
      new THREE.Vector3(1.15, 1.25, 0.6),
      new THREE.Vector3(2.35, -0.3, -0.35),
      new THREE.Vector3(0.9, -1.45, 0.45),
      new THREE.Vector3(-1.2, -1.35, -0.5),
    ];
    const conduitCurve = new THREE.CatmullRomCurve3(conduitPoints, true);
    const conduitGeo = new THREE.TubeGeometry(conduitCurve, 96, 0.02, 8, true);
    geometries.push(conduitGeo);
    const conduitMesh = new THREE.Mesh(conduitGeo, violetAccentMat);
    rootAssembly.add(conduitMesh);

    // Part 8: Instanced Micro-Telemetry Field (90 Nodes)
    const particleGeo = new THREE.BoxGeometry(0.045, 0.045, 0.045);
    geometries.push(particleGeo);
    const particleField = new THREE.InstancedMesh(particleGeo, satelliteMat, 90);
    const pDummy = new THREE.Object3D();
    for (let i = 0; i < 90; i++) {
      const r = 2.6 + (i % 7) * 0.35;
      const theta = i * 0.618 * Math.PI * 2;
      const y = ((i % 13) - 6) * 0.38;
      pDummy.position.set(Math.cos(theta) * r, y, Math.sin(theta) * r);
      pDummy.rotation.set(theta, theta * 0.5, 0);
      const scale = 0.7 + (i % 4) * 0.25;
      pDummy.scale.setScalar(scale);
      pDummy.updateMatrix();
      particleField.setMatrixAt(i, pDummy.matrix);
    }
    particleField.instanceMatrix.needsUpdate = true;
    particleField.computeBoundingSphere();
    particleField.frustumCulled = false;
    scene.add(particleField);

    // Grounding Soft Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(5.5, 5.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.48,
    });
    geometries.push(shadowGeo);
    materials.push(shadowMat);
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -2.25;
    scene.add(contactShadow);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Resize observer (deferred via rAF + updateStyle=false to prevent ResizeObserver loops)
    let lastW = initW;
    let lastH = initH;
    let resizeRafId = 0;
    const applyResize = () => {
      resizeRafId = 0;
      if (disposed || !host) return;
      const w = host.clientWidth || 640;
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

    // Smooth Damped Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    let currentScroll = 0;
    let currentExplode = 0;
    let currentCamX = 0;
    let currentCamY = 1.35;
    let currentCamZ = 7.6;

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
      const elapsed = clock.getElapsedTime();

      if (resetPulseRef.current) {
        pointerTiltRef.current.x = 0;
        pointerTiltRef.current.y = 0;
        resetPulseRef.current = false;
      }

      const targetScroll = scrollProgressRef.current;
      currentScroll = THREE.MathUtils.damp(currentScroll, targetScroll, 5.5, delta);

      // Explode factor peaks during middle scroll stage (0.34 -> 0.72) or manual override
      const scrollExplode =
        currentScroll < 0.25
          ? currentScroll * 0.4
          : currentScroll < 0.72
          ? 0.1 + ((currentScroll - 0.25) / 0.47) * 0.9
          : 1.0 - ((currentScroll - 0.72) / 0.28) * 0.35;

      const targetExplode =
        manualExplodeRef.current === true
          ? 1.0
          : manualExplodeRef.current === false
          ? 0.0
          : scrollExplode;
      currentExplode = THREE.MathUtils.damp(currentExplode, targetExplode, 5.0, delta);

      // Scroll-driven exploded separation
      frontChassis.position.z = 0.45 + currentExplode * 0.95;
      rearChassis.position.z = -0.45 - currentExplode * 0.95;
      bolts.position.z = currentExplode * 0.35;
      statorCollar.scale.setScalar(1 + currentExplode * 0.08);
      conduitMesh.scale.setScalar(1 + currentExplode * 0.16);

      // Scroll-driven rotation + subtle ambient float + pointer parallax
      rootAssembly.rotation.y =
        currentScroll * Math.PI * 1.45 + elapsed * 0.18 + pointerTiltRef.current.x * 0.45;
      rootAssembly.rotation.x =
        Math.sin(currentScroll * Math.PI) * 0.35 + pointerTiltRef.current.y * 0.25;
      rootAssembly.position.y = Math.sin(elapsed * 1.1) * 0.08;

      gimbalOuter.rotation.x = elapsed * 0.45 + currentScroll * 2.2;
      gimbalOuter.rotation.y = elapsed * 0.25;
      gimbalInner.rotation.y = -elapsed * 0.65 - currentScroll * 2.8;
      gimbalInner.rotation.z = elapsed * 0.3;

      crystalCore.rotation.y = elapsed * 0.5 + currentScroll * 3.0;
      crystalCore.rotation.x = elapsed * 0.3;
      innerEmitter.rotation.y = -elapsed * 0.9;

      satGroup.rotation.y = elapsed * 0.22 + currentScroll * 1.6;
      for (let i = 0; i < satMeshes.length; i++) {
        const sat = satMeshes[i];
        sat.rotation.y = elapsed * 0.8 + i;
        const spread = 1 + currentExplode * 0.22;
        const angle = (i / 6) * Math.PI * 2;
        sat.position.set(
          Math.cos(angle) * 2.25 * spread,
          Math.sin(angle) * 1.15 * spread + Math.sin(elapsed * 1.4 + i) * 0.08,
          Math.sin(angle * 2) * 0.65 * spread
        );
      }

      particleField.rotation.y = -elapsed * 0.06 - currentScroll * 0.7;

      // Camera choreography tied to scroll stages
      const targetCamX = Math.sin(currentScroll * Math.PI) * 0.85;
      const targetCamY = 1.35 - currentScroll * 0.95;
      const targetCamZ = 7.6 - Math.sin(currentScroll * Math.PI) * 0.9;

      currentCamX = THREE.MathUtils.damp(currentCamX, targetCamX, 4.5, delta);
      currentCamY = THREE.MathUtils.damp(currentCamY, targetCamY, 4.5, delta);
      currentCamZ = THREE.MathUtils.damp(currentCamZ, targetCamZ, 4.5, delta);

      camera.position.set(currentCamX, currentCamY, currentCamZ);
      _vec3.set(0, 0, 0);
      camera.lookAt(_vec3);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      if (resizeRafId) cancelAnimationFrame(resizeRafId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      envTarget.dispose();
      renderer.dispose();
    };
  }, [prefersReduced]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerTiltRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    pointerTiltRef.current.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  const handlePointerLeave = () => {
    pointerTiltRef.current.x = 0;
    pointerTiltRef.current.y = 0;
  };

  const handleSelectStage = (idx: number) => {
    setActiveStage(idx);
    const el = sectionRef.current;
    if (!el) return;
    const sectionTop = el.getBoundingClientRect().top + window.scrollY;
    const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
    const targetProgress = idx === 0 ? 0.08 : idx === 1 ? 0.52 : 0.92;
    window.scrollTo({
      top: sectionTop + scrollable * targetProgress,
      behavior: prefersReduced ? 'auto' : 'smooth',
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative border-b border-white/10 bg-[#040814]/45"
      aria-label="Interactive 3D Scroll Engineering Showcase"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Scrolling Narrative Chapters (Left) */}
          <div className="py-16 lg:col-span-5 lg:py-24">
            <p className="text-sm font-medium text-blue-400">Interactive 3D Architecture</p>
            <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Scroll to Inspect Our Technical Ecosystem
            </h2>

            <div className="mt-10 space-y-24 lg:space-y-44 lg:pb-24">
              {STAGES.map((stage, idx) => {
                const isActive = activeStage === idx;
                return (
                  <div
                    key={stage.id}
                    onClick={() => handleSelectStage(idx)}
                    className={`cursor-pointer rounded-2xl border p-6 transition-all duration-300 ${
                      prefersReduced ? '' : 'hover:-translate-y-1.5'
                    } ${
                      isActive
                        ? 'border-blue-400/60 bg-[#0d1734] shadow-[0_14px_34px_-10px_rgba(59,130,246,0.35),0_0_20px_-6px_rgba(34,211,238,0.2)] hover:border-cyan-400/70 hover:shadow-[0_18px_40px_-10px_rgba(59,130,246,0.45),0_0_26px_-4px_rgba(34,211,238,0.28)]'
                        : 'border-white/10 bg-[#080f21]/75 opacity-70 hover:opacity-100 hover:border-blue-400/50 hover:bg-[#0c152e] hover:shadow-[0_14px_32px_-10px_rgba(59,130,246,0.34),0_0_18px_-6px_rgba(139,92,246,0.22)]'
                    }`}
                  >
                    <h3 className="font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-blue-300">
                      {stage.tagline}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {stage.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky 3D Viewport (Right) */}
          <div className="lg:col-span-7">
            <div className="lg:sticky lg:top-20 py-4 lg:py-12">
              <div
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-b from-[#0a132c] via-[#060b19] to-[#040711] sm:h-[460px] lg:h-[560px]"
              >
                {/* Top Left Minimal Stage Indicator (no backdrop-filter, no pulsing dot) */}
                <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-lg border border-white/10 bg-[#070d1e]/90 px-3.5 py-2">
                  <p className="font-mono text-[11px] font-semibold text-blue-300">
                    STAGE {STAGES[activeStage]?.step} · {STAGES[activeStage]?.subtitle}
                  </p>
                </div>

                {/* WebGL Canvas Host or Reduced Motion / Fallback */}
                {prefersReduced || contextLost ? (
                  <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                    <svg className="h-24 w-24 text-blue-400" viewBox="0 0 120 120" fill="none">
                      <polygon
                        points="60,10 105,35 105,85 60,110 15,85 15,35"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="rgba(37, 99, 235, 0.14)"
                      />
                      <circle cx="60" cy="60" r="24" stroke="#8b5cf6" strokeWidth="1.5" />
                      <polygon
                        points="60,36 80,60 60,84 40,60"
                        fill="rgba(96, 165, 250, 0.35)"
                        stroke="#60a5fa"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <p className="font-display mt-4 text-base font-semibold text-white">
                      Technology Core Assembly
                    </p>
                    <p className="mt-1 max-w-sm text-xs text-slate-400">
                      3D WebGL preview paused for reduced-motion accessibility. Scroll chapters remain active.
                    </p>
                  </div>
                ) : (
                  <div ref={canvasHostRef} className="h-full w-full" />
                )}

                {/* Unified Compact Bottom Control Dock (Zero backdrop-filter over WebGL) */}
                {!prefersReduced && !contextLost && (
                  <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/15 bg-[#070d1e]/92 px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        setManualExplode((prev) =>
                          prev === true ? false : prev === false ? null : true
                        )
                      }
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                        manualExplode === true
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>
                        {manualExplode === true
                          ? 'Exploded: On'
                          : manualExplode === false
                          ? 'Exploded: Off'
                          : 'Scroll Sync'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setManualExplode(null);
                        resetPulseRef.current = true;
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white whitespace-nowrap"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Auto-Sync</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
