/**
 * LoginBackgroundDNA - Three.js Single Centered Slanted DNA + Full-Viewport Atoms, Molecules & Tiny Particles
 * Uses Three.js ESM via CDN (zero extra local library storage) with GPU shaders.
 * Dynamically adapts to viewport aspect ratio so left/right flanks and edges are richly populated,
 * while keeping the center login form crisp and dominant.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js';

(function initLoginBackgroundDNA() {
  const container = document.getElementById('login-bg-dna');
  const canvas = document.getElementById('login-bg-canvas');
  if (!container || !canvas) return;

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function revealContainer() {
    container.classList.add('is-ready');
  }

  if (document.documentElement.classList.contains('has-anime-intro') && !window.__kalingaIntroRevealed) {
    window.addEventListener('kalinga:intro-reveal', revealContainer, { once: true });
  } else {
    window.requestAnimationFrame(revealContainer);
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
  } catch (err) {
    return;
  }

  const scene = new THREE.Scene();
  const FOV_DEG = 42;
  const CAMERA_Z = 12.5;
  const camera = new THREE.PerspectiveCamera(FOV_DEG, window.innerWidth / Math.max(window.innerHeight, 1), 0.1, 40);
  camera.position.set(0, 0, CAMERA_Z);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  let visibleHalfHeight = Math.tan(THREE.MathUtils.degToRad(FOV_DEG / 2)) * CAMERA_Z;
  let visibleHalfWidth = visibleHalfHeight * camera.aspect;

  // Kalinga Portal Color Palette
  const COLOR_NAVY_DEEP = new THREE.Color('#0F1A4D');
  const COLOR_NAVY = new THREE.Color('#1B2A80');
  const COLOR_NAVY_LIGHT = new THREE.Color('#2A3FA8');
  const COLOR_RED = new THREE.Color('#E01E1E');

  // 1. Single Big Centered Slanted DNA Helix
  const PAIRS_PER_HELIX = 36;
  const BRIDGE_DOTS_PER_PAIR = 4;
  const MERGE_DOT_COUNT = 68;

  // 2. Scattered Atoms (6 Bohr atoms distributed across left, right, and outer areas)
  const ATOM_COUNT = 6;
  const ELECTRONS_PER_ATOM = 4;
  const DOTS_PER_ATOM = 1 + ELECTRONS_PER_ATOM;
  const ORBITS_PER_ATOM = 2;
  const SEGMENTS_PER_ORBIT = 20;
  const TOTAL_ATOM_DOTS = ATOM_COUNT * DOTS_PER_ATOM;
  const TOTAL_ATOM_LINE_SEGMENTS = ATOM_COUNT * ORBITS_PER_ATOM * SEGMENTS_PER_ORBIT;

  // 3. Scattered Molecules (6 molecular clusters distributed across left, right, and outer areas)
  const MOLECULE_COUNT = 6;
  const NODES_PER_MOLECULE = 6;
  const BONDS_PER_MOLECULE = 6;
  const TOTAL_MOLECULE_DOTS = MOLECULE_COUNT * NODES_PER_MOLECULE;
  const TOTAL_MOLECULE_LINE_SEGMENTS = MOLECULE_COUNT * BONDS_PER_MOLECULE;

  // 4. Tiny Scattered Ambient Particles spanning entire viewport width & height
  const TINY_PARTICLE_COUNT = 140;

  const helix = {
    baseX: 0,
    baseY: 0,
    tiltZ: -0.62,
    radius: 1.95,
    height: 18.0,
    phaseOffset: 0.0,
    speed: 0.42
  };

  const TOTAL_STRAND_NODES = PAIRS_PER_HELIX * 2;
  const TOTAL_BRIDGE_DOTS = PAIRS_PER_HELIX * BRIDGE_DOTS_PER_PAIR;
  const TOTAL_POINTS =
    TOTAL_STRAND_NODES +
    TOTAL_BRIDGE_DOTS +
    MERGE_DOT_COUNT +
    TOTAL_ATOM_DOTS +
    TOTAL_MOLECULE_DOTS +
    TINY_PARTICLE_COUNT;

  const positions = new Float32Array(TOTAL_POINTS * 3);
  const colors = new Float32Array(TOTAL_POINTS * 3);
  const sizes = new Float32Array(TOTAL_POINTS);
  const alphas = new Float32Array(TOTAL_POINTS);

  const nodePulse = new Float32Array(TOTAL_STRAND_NODES);
  const strandNodePositions = new Float32Array(TOTAL_STRAND_NODES * 3);

  const TOTAL_RUNGS = PAIRS_PER_HELIX;
  const TOTAL_LINE_SEGMENTS =
    TOTAL_RUNGS +
    TOTAL_ATOM_LINE_SEGMENTS +
    TOTAL_MOLECULE_LINE_SEGMENTS;
  const linePositions = new Float32Array(TOTAL_LINE_SEGMENTS * 2 * 3);
  const lineColors = new Float32Array(TOTAL_LINE_SEGMENTS * 2 * 3);

  let ptr = 0;

  // --- Strand Nodes ---
  for (let p = 0; p < PAIRS_PER_HELIX; p++) {
    const cA = p % 3 === 0 ? COLOR_NAVY_DEEP : p % 2 === 0 ? COLOR_NAVY : COLOR_NAVY_LIGHT;
    colors[ptr * 3] = cA.r;
    colors[ptr * 3 + 1] = cA.g;
    colors[ptr * 3 + 2] = cA.b;
    sizes[ptr] = 19.0;
    alphas[ptr] = 0.34;
    ptr++;

    const isRed = p % 3 === 1;
    const cB = isRed ? COLOR_RED : COLOR_NAVY;
    colors[ptr * 3] = cB.r;
    colors[ptr * 3 + 1] = cB.g;
    colors[ptr * 3 + 2] = cB.b;
    sizes[ptr] = isRed ? 20.5 : 18.0;
    alphas[ptr] = isRed ? 0.36 : 0.32;
    ptr++;
  }

  // --- Base-pair Bridge Dots ---
  for (let p = 0; p < PAIRS_PER_HELIX; p++) {
    for (let b = 0; b < BRIDGE_DOTS_PER_PAIR; b++) {
      const t = (b + 1) / (BRIDGE_DOTS_PER_PAIR + 1);
      const cMix = p % 3 === 1
        ? COLOR_NAVY.clone().lerp(COLOR_RED, t)
        : COLOR_NAVY_DEEP.clone().lerp(COLOR_NAVY_LIGHT, t);
      colors[ptr * 3] = cMix.r;
      colors[ptr * 3 + 1] = cMix.g;
      colors[ptr * 3 + 2] = cMix.b;
      sizes[ptr] = 9.0;
      alphas[ptr] = 0.17;
      ptr++;
    }
  }

  // --- Merging Dots (spawning across full viewport width including outer flanks) ---
  const mergeStartIdx = ptr;
  const mergeDots = [];

  function spawnMergeDot(dot, initialRandomProgress) {
    const targetNodeIndex = Math.floor(Math.random() * TOTAL_STRAND_NODES);
    const edgeChoice = Math.random();
    let ox;
    let oy;
    if (edgeChoice < 0.72) {
      // Spawn predominantly from left & right flank padding areas
      const side = Math.random() < 0.5 ? -1 : 1;
      ox = side * visibleHalfWidth * (0.38 + Math.random() * 0.58);
      oy = (Math.random() - 0.5) * visibleHalfHeight * 1.75;
    } else {
      const angle = Math.random() * Math.PI * 2;
      ox = Math.cos(angle) * visibleHalfWidth * 0.65;
      oy = Math.sin(angle) * visibleHalfHeight * 0.85;
    }

    dot.targetNode = targetNodeIndex;
    dot.originX = ox;
    dot.originY = oy;
    dot.originZ = (Math.random() - 0.5) * 3.0;
    dot.curveOffset = (Math.random() - 0.5) * 1.6;
    dot.progress = initialRandomProgress ? Math.random() : 0;
    dot.speed = 0.15 + Math.random() * 0.14;
    dot.baseSize = 10.5 + Math.random() * 6.5;
    dot.isRed = Math.random() < 0.28;
  }

  for (let i = 0; i < MERGE_DOT_COUNT; i++) {
    const dot = {};
    spawnMergeDot(dot, true);
    mergeDots.push(dot);

    const c = dot.isRed ? COLOR_RED : COLOR_NAVY_LIGHT;
    colors[ptr * 3] = c.r;
    colors[ptr * 3 + 1] = c.g;
    colors[ptr * 3 + 2] = c.b;
    sizes[ptr] = dot.baseSize;
    alphas[ptr] = 0.30;
    ptr++;
  }

  // --- Scattered Atoms using normalized viewport coordinates (nx, ny) ---
  const atomStartIdx = ptr;
  const atoms = [
    // Left flank & edges
    { nx: -0.84, ny: 0.62, z: -0.9, radius: 0.72, tiltA: 0.55, tiltB: -0.55, speed: 0.95, phase: 0.2, redNucleus: true },
    { nx: -0.78, ny: -0.58, z: -1.2, radius: 0.66, tiltA: 0.72, tiltB: -0.35, speed: -0.85, phase: 1.7, redNucleus: false },
    { nx: -0.52, ny: -0.10, z: -1.4, radius: 0.56, tiltA: -0.45, tiltB: 0.62, speed: 0.82, phase: 2.8, redNucleus: false },
    // Right flank & edges
    { nx: 0.83, ny: 0.58, z: -1.0, radius: 0.68, tiltA: -0.60, tiltB: 0.50, speed: 0.88, phase: 3.1, redNucleus: false },
    { nx: 0.80, ny: -0.60, z: -0.9, radius: 0.72, tiltA: 0.48, tiltB: -0.68, speed: -0.92, phase: 4.4, redNucleus: true },
    { nx: 0.54, ny: 0.14, z: -1.5, radius: 0.56, tiltA: 0.64, tiltB: -0.42, speed: -0.80, phase: 0.9, redNucleus: false }
  ];

  for (let aIdx = 0; aIdx < ATOM_COUNT; aIdx++) {
    const atom = atoms[aIdx];
    const nucCol = atom.redNucleus ? COLOR_RED : COLOR_NAVY;
    colors[ptr * 3] = nucCol.r;
    colors[ptr * 3 + 1] = nucCol.g;
    colors[ptr * 3 + 2] = nucCol.b;
    sizes[ptr] = 15.5;
    alphas[ptr] = 0.36;
    ptr++;

    for (let e = 0; e < ELECTRONS_PER_ATOM; e++) {
      const eCol = e === 0 && !atom.redNucleus ? COLOR_RED : COLOR_NAVY_LIGHT;
      colors[ptr * 3] = eCol.r;
      colors[ptr * 3 + 1] = eCol.g;
      colors[ptr * 3 + 2] = eCol.b;
      sizes[ptr] = 9.0;
      alphas[ptr] = 0.34;
      ptr++;
    }
  }

  // --- Scattered Molecules using normalized viewport coordinates (nx, ny) ---
  const moleculeStartIdx = ptr;
  const ringNodes = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ringNodes.push([Math.cos(a) * 0.72, Math.sin(a) * 0.72, (i % 2 === 0 ? 0.12 : -0.12)]);
  }
  const ringBonds = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]];

  const branchedNodes = [
    [0, 0, 0],
    [0.72, 0.38, 0.18],
    [-0.70, 0.42, -0.15],
    [0.08, -0.78, 0.14],
    [1.28, -0.12, -0.18],
    [-1.22, -0.18, 0.22]
  ];
  const branchedBonds = [[0, 1], [0, 2], [0, 3], [1, 4], [2, 5], [1, 2]];

  const molecules = [
    // Left flank & upper/lower outer zones
    { nx: -0.86, ny: 0.02, z: -1.3, scale: 0.86, rotSpeedY: 0.24, rotSpeedZ: 0.14, phase: 0.4, nodes: ringNodes, bonds: ringBonds, redIdx: 2 },
    { nx: -0.56, ny: 0.74, z: -1.5, scale: 0.74, rotSpeedY: 0.20, rotSpeedZ: -0.18, phase: 3.8, nodes: branchedNodes, bonds: branchedBonds, redIdx: 3 },
    { nx: -0.48, ny: -0.76, z: -1.6, scale: 0.70, rotSpeedY: -0.22, rotSpeedZ: 0.16, phase: 1.5, nodes: ringNodes, bonds: ringBonds, redIdx: 1 },
    // Right flank & upper/lower outer zones
    { nx: 0.85, ny: -0.04, z: -1.2, scale: 0.88, rotSpeedY: -0.22, rotSpeedZ: -0.16, phase: 2.1, nodes: branchedNodes, bonds: branchedBonds, redIdx: 0 },
    { nx: 0.56, ny: -0.74, z: -1.5, scale: 0.76, rotSpeedY: -0.25, rotSpeedZ: 0.15, phase: 1.2, nodes: ringNodes, bonds: ringBonds, redIdx: 4 },
    { nx: 0.50, ny: 0.74, z: -1.6, scale: 0.72, rotSpeedY: 0.21, rotSpeedZ: -0.14, phase: 2.9, nodes: branchedNodes, bonds: branchedBonds, redIdx: 5 }
  ];

  for (let mIdx = 0; mIdx < MOLECULE_COUNT; mIdx++) {
    const mol = molecules[mIdx];
    for (let n = 0; n < NODES_PER_MOLECULE; n++) {
      const isAccent = n === mol.redIdx;
      const col = isAccent ? COLOR_RED : n % 2 === 0 ? COLOR_NAVY : COLOR_NAVY_LIGHT;
      colors[ptr * 3] = col.r;
      colors[ptr * 3 + 1] = col.g;
      colors[ptr * 3 + 2] = col.b;
      sizes[ptr] = isAccent ? 13.0 : 11.0;
      alphas[ptr] = isAccent ? 0.34 : 0.28;
      ptr++;
    }
  }

  // --- Tiny Scattered Ambient Particles (normalized nx/ny so full viewport stays populated) ---
  const tinyStartIdx = ptr;
  const tinyParticles = [];

  for (let i = 0; i < TINY_PARTICLE_COUNT; i++) {
    const isRed = Math.random() < 0.22;
    const col = isRed ? COLOR_RED : Math.random() < 0.5 ? COLOR_NAVY : COLOR_NAVY_LIGHT;
    const p = {
      normX: (Math.random() - 0.5) * 2.08, // -1.04 to +1.04 of visibleHalfWidth
      normY: (Math.random() - 0.5) * 2.08, // -1.04 to +1.04 of visibleHalfHeight
      z: (Math.random() - 0.5) * 3.2 - 0.5,
      vx: (Math.random() - 0.5) * 0.018,
      vy: 0.014 + Math.random() * 0.024,
      swayAmp: 0.14 + Math.random() * 0.24,
      swayFreq: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2
    };
    tinyParticles.push(p);

    colors[ptr * 3] = col.r;
    colors[ptr * 3 + 1] = col.g;
    colors[ptr * 3 + 2] = col.b;
    sizes[ptr] = 4.5 + Math.random() * 4.2;
    alphas[ptr] = 0.18 + Math.random() * 0.14;
    ptr++;
  }

  // --- Line Colors (DNA rungs + Atom orbital rings + Molecule covalent bonds) ---
  let lineColorPtr = 0;
  for (let p = 0; p < PAIRS_PER_HELIX; p++) {
    const c1 = COLOR_NAVY;
    const c2 = p % 3 === 1 ? COLOR_RED : COLOR_NAVY_LIGHT;
    lineColors[lineColorPtr++] = c1.r;
    lineColors[lineColorPtr++] = c1.g;
    lineColors[lineColorPtr++] = c1.b;
    lineColors[lineColorPtr++] = c2.r;
    lineColors[lineColorPtr++] = c2.g;
    lineColors[lineColorPtr++] = c2.b;
  }

  for (let s = 0; s < TOTAL_ATOM_LINE_SEGMENTS; s++) {
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.r;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.g;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.b;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.r;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.g;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.b;
  }

  for (let s = 0; s < TOTAL_MOLECULE_LINE_SEGMENTS; s++) {
    lineColors[lineColorPtr++] = COLOR_NAVY.r;
    lineColors[lineColorPtr++] = COLOR_NAVY.g;
    lineColors[lineColorPtr++] = COLOR_NAVY.b;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.r;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.g;
    lineColors[lineColorPtr++] = COLOR_NAVY_LIGHT.b;
  }

  const pointsGeo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3);
  const colAttr = new THREE.BufferAttribute(colors, 3);
  const sizeAttr = new THREE.BufferAttribute(sizes, 1);
  const alphaAttr = new THREE.BufferAttribute(alphas, 1);

  pointsGeo.setAttribute('position', posAttr);
  pointsGeo.setAttribute('aColor', colAttr);
  pointsGeo.setAttribute('aSize', sizeAttr);
  pointsGeo.setAttribute('aAlpha', alphaAttr);

  const pointsMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uCenterClearX: { value: window.innerWidth <= 640 ? 1.85 : 2.75 },
      uCenterClearY: { value: 2.8 },
      uHalfWidth: { value: visibleHalfWidth },
      uHalfHeight: { value: visibleHalfHeight }
    },
    vertexShader: `
      attribute float aSize;
      attribute float aAlpha;
      attribute vec3 aColor;
      uniform float uPixelRatio;
      uniform float uCenterClearX;
      uniform float uCenterClearY;
      uniform float uHalfWidth;
      uniform float uHalfHeight;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // Gentle elliptical center softening so login boxes and text always stand out cleanly
        vec2 normCenter = vec2(position.x / uCenterClearX, position.y / uCenterClearY);
        float centerDist = length(normCenter);
        float centerSoftMask = mix(0.42, 1.0, smoothstep(0.25, 1.25, centerDist));

        // Responsive outer edge fade based on actual viewport frustum width & height
        float edgeX = 1.0 - smoothstep(uHalfWidth * 0.94, uHalfWidth * 1.12, abs(position.x));
        float edgeY = 1.0 - smoothstep(uHalfHeight * 0.90, uHalfHeight * 1.10, abs(position.y));
        float depthScale = clamp(12.5 / -mvPosition.z, 0.78, 1.25);

        vColor = aColor;
        vAlpha = aAlpha * centerSoftMask * edgeX * edgeY;
        gl_PointSize = aSize * uPixelRatio * depthScale;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;

        float circle = smoothstep(0.5, 0.24, d);
        float core = smoothstep(0.32, 0.06, d);
        float alpha = vAlpha * (circle * 0.65 + core * 0.35);
        gl_FragColor = vec4(vColor, alpha);
      }
    `
  });

  const pointsMesh = new THREE.Points(pointsGeo, pointsMaterial);
  scene.add(pointsMesh);

  const linesGeo = new THREE.BufferGeometry();
  const linePosAttr = new THREE.BufferAttribute(linePositions, 3);
  linesGeo.setAttribute('position', linePosAttr);
  linesGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const linesMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.13,
    depthWrite: false
  });
  const linesMesh = new THREE.LineSegments(linesGeo, linesMat);
  scene.add(linesMesh);

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function orbitPoint3D(radius, theta, tiltZ, tiltX) {
    const lx = Math.cos(theta) * radius;
    const ly = Math.sin(theta) * radius * 0.44;
    const cz = Math.cos(tiltZ);
    const sz = Math.sin(tiltZ);
    const rx = lx * cz - ly * sz;
    const ry0 = lx * sz + ly * cz;
    const cx = Math.cos(tiltX);
    const sx = Math.sin(tiltX);
    return [rx, ry0 * cx, ry0 * sx];
  }

  function updateResponsiveLayout() {
    const aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    visibleHalfHeight = Math.tan(THREE.MathUtils.degToRad(FOV_DEG / 2)) * CAMERA_Z;
    visibleHalfWidth = visibleHalfHeight * aspect;

    const pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    pointsMaterial.uniforms.uPixelRatio.value = pr;
    pointsMaterial.uniforms.uHalfWidth.value = visibleHalfWidth;
    pointsMaterial.uniforms.uHalfHeight.value = visibleHalfHeight;

    const isMobile = window.innerWidth <= 640;
    helix.radius = isMobile ? 1.35 : 1.95;
    helix.height = isMobile ? 15.0 : 18.0;
    helix.tiltZ = isMobile ? -0.48 : -0.62;
    linesMat.opacity = isMobile ? 0.09 : 0.13;
    pointsMaterial.uniforms.uCenterClearX.value = isMobile ? 1.85 : 2.75;
  }

  function updateSimulation(elapsedSec, dt) {
    let strandPtr = 0;
    let bridgePtr = TOTAL_STRAND_NODES;
    let linePtr = 0;

    // 1. Single Big Centered Slanted DNA Double Helix
    const cosT = Math.cos(helix.tiltZ);
    const sinT = Math.sin(helix.tiltZ);
    const flowShift = elapsedSec * 0.42;

    for (let p = 0; p < PAIRS_PER_HELIX; p++) {
      const norm = ((p / PAIRS_PER_HELIX) + flowShift / helix.height) % 1;
      const wrappedNorm = norm < 0 ? norm + 1 : norm;
      const localY = (wrappedNorm - 0.5) * helix.height;
      const angle = wrappedNorm * Math.PI * 3.8 + elapsedSec * helix.speed + helix.phaseOffset;

      const axLocal = Math.cos(angle) * helix.radius;
      const az = Math.sin(angle) * helix.radius;
      const ax = helix.baseX + axLocal * cosT - localY * sinT;
      const ay = helix.baseY + axLocal * sinT + localY * cosT;

      const bxLocal = -axLocal;
      const bz = -az;
      const bx = helix.baseX + bxLocal * cosT - localY * sinT;
      const by = helix.baseY + bxLocal * sinT + localY * cosT;

      nodePulse[strandPtr] *= 0.92;
      const pulseA = nodePulse[strandPtr];
      positions[strandPtr * 3] = ax;
      positions[strandPtr * 3 + 1] = ay;
      positions[strandPtr * 3 + 2] = az;
      strandNodePositions[strandPtr * 3] = ax;
      strandNodePositions[strandPtr * 3 + 1] = ay;
      strandNodePositions[strandPtr * 3 + 2] = az;
      sizes[strandPtr] = 19.0 + pulseA * 9.5;
      alphas[strandPtr] = Math.min(0.60, 0.34 + pulseA * 0.24);
      strandPtr++;

      nodePulse[strandPtr] *= 0.92;
      const pulseB = nodePulse[strandPtr];
      positions[strandPtr * 3] = bx;
      positions[strandPtr * 3 + 1] = by;
      positions[strandPtr * 3 + 2] = bz;
      strandNodePositions[strandPtr * 3] = bx;
      strandNodePositions[strandPtr * 3 + 1] = by;
      strandNodePositions[strandPtr * 3 + 2] = bz;
      sizes[strandPtr] = (p % 3 === 1 ? 20.5 : 18.0) + pulseB * 9.5;
      alphas[strandPtr] = Math.min(0.64, (p % 3 === 1 ? 0.36 : 0.32) + pulseB * 0.24);
      strandPtr++;

      for (let b = 0; b < BRIDGE_DOTS_PER_PAIR; b++) {
        const t = (b + 1) / (BRIDGE_DOTS_PER_PAIR + 1);
        positions[bridgePtr * 3] = ax + (bx - ax) * t;
        positions[bridgePtr * 3 + 1] = ay + (by - ay) * t;
        positions[bridgePtr * 3 + 2] = az + (bz - az) * t;
        bridgePtr++;
      }

      linePositions[linePtr++] = ax;
      linePositions[linePtr++] = ay;
      linePositions[linePtr++] = az;
      linePositions[linePtr++] = bx;
      linePositions[linePtr++] = by;
      linePositions[linePtr++] = bz;
    }

    // 2. Moving & Merging Dots into DNA nodes
    for (let i = 0; i < MERGE_DOT_COUNT; i++) {
      const dot = mergeDots[i];
      dot.progress += dot.speed * dt;

      if (dot.progress >= 1) {
        nodePulse[dot.targetNode] = 1.0;
        spawnMergeDot(dot, false);
      }

      const t = easeInOutCubic(dot.progress);
      const targetIdx = dot.targetNode * 3;
      const tx = strandNodePositions[targetIdx];
      const ty = strandNodePositions[targetIdx + 1];
      const tz = strandNodePositions[targetIdx + 2];

      const arc = Math.sin(dot.progress * Math.PI) * dot.curveOffset;
      const idx = mergeStartIdx + i;

      positions[idx * 3] = dot.originX + (tx - dot.originX) * t + arc;
      positions[idx * 3 + 1] = dot.originY + (ty - dot.originY) * t;
      positions[idx * 3 + 2] = dot.originZ + (tz - dot.originZ) * t;

      const birthFade = Math.min(1, dot.progress * 5);
      const mergeFade = dot.progress > 0.78 ? 1 - (dot.progress - 0.78) / 0.22 : 1;
      alphas[idx] = 0.32 * birthFade * mergeFade;
      sizes[idx] = dot.baseSize * (0.65 + 0.45 * Math.sin(dot.progress * Math.PI));
    }

    // 3. Scattered Atoms across full viewport flanks
    const isMobile = window.innerWidth <= 640;
    const atomScaleFactor = isMobile ? 0.68 : 1.0;
    let aDotIdx = atomStartIdx;
    for (let aIdx = 0; aIdx < ATOM_COUNT; aIdx++) {
      const atom = atoms[aIdx];
      const ax = atom.nx * visibleHalfWidth + Math.sin(elapsedSec * 0.28 + atom.phase) * 0.24;
      const ay = atom.ny * visibleHalfHeight + Math.cos(elapsedSec * 0.24 + atom.phase) * 0.26;
      const az = atom.z;
      const rad = atom.radius * atomScaleFactor;

      positions[aDotIdx * 3] = ax;
      positions[aDotIdx * 3 + 1] = ay;
      positions[aDotIdx * 3 + 2] = az;
      aDotIdx++;

      const tilts = [atom.tiltA + elapsedSec * 0.08, atom.tiltB - elapsedSec * 0.08];
      const tiltX = 0.45 + Math.sin(elapsedSec * 0.2 + atom.phase) * 0.15;

      for (let o = 0; o < ORBITS_PER_ATOM; o++) {
        const ringTilt = tilts[o];
        for (let s = 0; s < SEGMENTS_PER_ORBIT; s++) {
          const th1 = (s / SEGMENTS_PER_ORBIT) * Math.PI * 2;
          const th2 = ((s + 1) / SEGMENTS_PER_ORBIT) * Math.PI * 2;
          const p1 = orbitPoint3D(rad, th1, ringTilt, tiltX);
          const p2 = orbitPoint3D(rad, th2, ringTilt, tiltX);
          linePositions[linePtr++] = ax + p1[0];
          linePositions[linePtr++] = ay + p1[1];
          linePositions[linePtr++] = az + p1[2];
          linePositions[linePtr++] = ax + p2[0];
          linePositions[linePtr++] = ay + p2[1];
          linePositions[linePtr++] = az + p2[2];
        }
      }

      for (let e = 0; e < ELECTRONS_PER_ATOM; e++) {
        const o = e % ORBITS_PER_ATOM;
        const theta = elapsedSec * atom.speed * (o === 0 ? 1 : -1.1) + atom.phase + e * (Math.PI * 0.5);
        const ep = orbitPoint3D(rad, theta, tilts[o], tiltX);
        positions[aDotIdx * 3] = ax + ep[0];
        positions[aDotIdx * 3 + 1] = ay + ep[1];
        positions[aDotIdx * 3 + 2] = az + ep[2];
        aDotIdx++;
      }
    }

    // 4. Scattered Molecules across full viewport flanks & corners
    let mDotIdx = moleculeStartIdx;
    const tempMolWorld = [];
    for (let mIdx = 0; mIdx < MOLECULE_COUNT; mIdx++) {
      const mol = molecules[mIdx];
      const mx = mol.nx * visibleHalfWidth + Math.cos(elapsedSec * 0.22 + mol.phase) * 0.22;
      const my = mol.ny * visibleHalfHeight + Math.sin(elapsedSec * 0.26 + mol.phase) * 0.24;
      const mz = mol.z;
      const sc = mol.scale * atomScaleFactor;

      const ry = elapsedSec * mol.rotSpeedY + mol.phase;
      const rz = elapsedSec * mol.rotSpeedZ + mol.phase * 0.5;
      const cy = Math.cos(ry);
      const sy = Math.sin(ry);
      const cz = Math.cos(rz);
      const sz = Math.sin(rz);

      tempMolWorld.length = 0;
      for (let n = 0; n < NODES_PER_MOLECULE; n++) {
        const src = mol.nodes[n];
        const lx = src[0] * sc;
        const ly = src[1] * sc;
        const lz = src[2] * sc;

        const x1 = lx * cy + lz * sy;
        const z1 = -lx * sy + lz * cy;
        const x2 = x1 * cz - ly * sz;
        const y2 = x1 * sz + ly * cz;

        const wx = mx + x2;
        const wy = my + y2;
        const wz = mz + z1;

        tempMolWorld.push([wx, wy, wz]);
        positions[mDotIdx * 3] = wx;
        positions[mDotIdx * 3 + 1] = wy;
        positions[mDotIdx * 3 + 2] = wz;
        mDotIdx++;
      }

      for (let b = 0; b < BONDS_PER_MOLECULE; b++) {
        const [iA, iB] = mol.bonds[b];
        const pA = tempMolWorld[iA];
        const pB = tempMolWorld[iB];
        linePositions[linePtr++] = pA[0];
        linePositions[linePtr++] = pA[1];
        linePositions[linePtr++] = pA[2];
        linePositions[linePtr++] = pB[0];
        linePositions[linePtr++] = pB[1];
        linePositions[linePtr++] = pB[2];
      }
    }

    // 5. Tiny Scattered Ambient Particles across entire viewport width & height
    for (let i = 0; i < TINY_PARTICLE_COUNT; i++) {
      const p = tinyParticles[i];
      const idx = tinyStartIdx + i;

      let ny = ((p.normY + elapsedSec * p.vy + 1.05) % 2.10);
      if (ny < 0) ny += 2.10;
      ny -= 1.05;

      let nx = ((p.normX + elapsedSec * p.vx + 1.05) % 2.10);
      if (nx < 0) nx += 2.10;
      nx -= 1.05;

      const x = nx * visibleHalfWidth + Math.sin(elapsedSec * p.swayFreq + p.phase) * p.swayAmp;
      const y = ny * visibleHalfHeight;

      positions[idx * 3] = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = p.z;
    }

    posAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    linePosAttr.needsUpdate = true;
  }

  updateResponsiveLayout();

  let rafId = null;
  let lastTime = performance.now();
  let elapsed = 0;

  function renderSingleFrame() {
    updateSimulation(elapsed, 0.016);
    renderer.render(scene, camera);
  }

  function tick(now) {
    if (document.hidden || reducedMotionQuery.matches) {
      rafId = null;
      return;
    }

    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    elapsed += dt;

    updateSimulation(elapsed, dt);
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId !== null || document.hidden || reducedMotionQuery.matches) return;
    lastTime = performance.now();
    rafId = window.requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  renderSingleFrame();
  if (!reducedMotionQuery.matches) {
    startLoop();
  }

  window.addEventListener('resize', () => {
    updateResponsiveLayout();
    if (reducedMotionQuery.matches) {
      renderer.render(scene, camera);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  reducedMotionQuery.addEventListener('change', (e) => {
    if (e.matches) {
      stopLoop();
      renderSingleFrame();
    } else {
      startLoop();
    }
  });
})();
