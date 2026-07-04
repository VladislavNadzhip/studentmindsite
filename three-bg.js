import * as THREE from 'three';

const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
let camera;
let view = { w: 40, h: 24 };
let graph = { w: 40, h: 24 };

const CYAN = new THREE.Color(0x22d3ee);
const BLUE = new THREE.Color(0x3b82f6);
const WAVE_CYAN = new THREE.Color(0x22d3ee);
const WAVE_GOLD = new THREE.Color(0xf0c040);
const WAVE_DARK_BLUE = new THREE.Color(0x1a4fd0);
const GRAPH_SCALE = 3.2;

function pickWaveColor() {
  const r = Math.random();
  if (r < 0.58) return WAVE_CYAN;
  if (r < 0.79) return WAVE_GOLD;
  return WAVE_DARK_BLUE;
}

const world = new THREE.Group();
scene.add(world);

const edgesGroup = new THREE.Group();
const verticesGroup = new THREE.Group();
const wavesGroup = new THREE.Group();
world.add(edgesGroup, verticesGroup, wavesGroup);

function updateCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const h = 24;
  const w = h * aspect;
  view = { w, h };
  graph = { w: w * GRAPH_SCALE, h: h * GRAPH_SCALE };

  if (!camera) {
    camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 50);
    camera.position.z = 10;
  } else {
    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }
}

const vertices = [];
const edges = [];
const waves = [];

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function bezier(a, b, seed) {
  const mid = a.clone().lerp(b, 0.5);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const perp = len > 0.001
    ? new THREE.Vector3(-dir.y, dir.x, 0).normalize()
    : new THREE.Vector3(1, 0, 0);
  mid.add(perp.multiplyScalar((seed % 5 - 2) * len * 0.16));

  const s = seed * 1.618;
  const c1 = a.clone().lerp(mid, 0.33).add(new THREE.Vector3(Math.sin(s) * 0.6, Math.cos(s * 1.3) * 0.6, 0));
  const c2 = mid.clone().lerp(b, 0.66).add(new THREE.Vector3(Math.cos(s * 0.7) * 0.5, Math.sin(s * 1.1) * 0.5, 0));
  return new THREE.CubicBezierCurve3(a, c1, c2, b);
}

function writeCurve(line, curve, segs) {
  const attr = line.geometry.attributes.position;
  for (let i = 0; i <= segs; i++) {
    const p = curve.getPoint(i / segs);
    attr.array[i * 3] = p.x;
    attr.array[i * 3 + 1] = p.y;
    attr.array[i * 3 + 2] = 0;
  }
  attr.needsUpdate = true;
}

function disposeGroup(group) {
  while (group.children.length) {
    const child = group.children[0];
    child.geometry?.dispose();
    if (child.material) {
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) => m.dispose());
    }
    group.remove(child);
  }
}

const COLS = 56;
const ROWS = 42;
const VERTEX_COUNT = COLS * ROWS;
const NEIGHBORS = 6;
const SEGMENTS = 36;

function buildGraph() {
  disposeGroup(edgesGroup);
  disposeGroup(wavesGroup);
  vertices.length = 0;
  edges.length = 0;
  waves.length = 0;

  const cellW = graph.w / COLS;
  const cellH = graph.h / ROWS;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      vertices.push(new THREE.Vector3(
        -graph.w / 2 + cellW * (c + 0.5) + rand(-cellW * 0.38, cellW * 0.38),
        -graph.h / 2 + cellH * (r + 0.5) + rand(-cellH * 0.38, cellH * 0.38),
        0
      ));
    }
  }

  const linked = new Set();
  let edgeSeed = 0;

  for (let i = 0; i < VERTEX_COUNT; i++) {
    const dists = [];
    for (let j = 0; j < VERTEX_COUNT; j++) {
      if (i === j) continue;
      dists.push({ j, d: vertices[i].distanceTo(vertices[j]) });
    }
    dists.sort((a, b) => a.d - b.d);

    for (let k = 0; k < Math.min(NEIGHBORS, dists.length); k++) {
      const j = dists[k].j;
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (linked.has(key)) continue;
      linked.add(key);

      const curve = bezier(vertices[i], vertices[j], edgeSeed++);
      const positions = new Float32Array((SEGMENTS + 1) * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: edgeSeed % 2 === 0 ? 0x3b82f6 : 0x22d3ee,
        transparent: true,
        opacity: rand(0.048, 0.096),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const line = new THREE.Line(geo, mat);
      line.renderOrder = 0;
      edgesGroup.add(line);
      writeCurve(line, curve, SEGMENTS);

      edges.push({
        from: i,
        to: j,
        curve,
        nextWave: rand(0, 0.25),
        interval: rand(0.04, 0.22),
      });
    }
  }
}

/* ── Static subtle vertices (no animation) ── */
const vertexGeo = new THREE.BufferGeometry();
const vtxPositions = new Float32Array(VERTEX_COUNT * 3);
vertexGeo.setAttribute('position', new THREE.BufferAttribute(vtxPositions, 3));

const vertexMat = new THREE.PointsMaterial({
  color: 0x22d3ee,
  size: 3,
  transparent: true,
  opacity: 0.18,
  sizeAttenuation: false,
  depthWrite: false,
  blending: THREE.NormalBlending,
});

verticesGroup.add(new THREE.Points(vertexGeo, vertexMat));

function updateVertexBuffer() {
  for (let i = 0; i < vertices.length; i++) {
    vtxPositions[i * 3] = vertices[i].x;
    vtxPositions[i * 3 + 1] = vertices[i].y;
    vtxPositions[i * 3 + 2] = 0;
  }
  vertexGeo.attributes.position.needsUpdate = true;
}

/* ── Waves = soft translucent pulse along edge ── */
const WAVE_PTS = 32;
const WAVE_LEN = 0.28;
const WAVE_PEAK = 0.66;
const WAVE_BASE = 0.05;

function createWaveLine() {
  const positions = new Float32Array(WAVE_PTS * 3);
  const colors = new Float32Array(WAVE_PTS * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.54,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const line = new THREE.Line(geo, mat);
  line.renderOrder = 1;
  wavesGroup.add(line);
  return { line, geo, posAttr: geo.attributes.position, colAttr: geo.attributes.color, mat };
}

function spawnWave(edge, dir = Math.random() > 0.5 ? 1 : -1, color = pickWaveColor()) {
  const parts = createWaveLine();
  waves.push({
    edge,
    t: dir > 0 ? 0 : 1,
    dir,
    speed: rand(0.26, 0.42),
    color,
    ...parts,
  });
}

function waveEnvelope(u) {
  const bell = Math.sin(Math.PI * u);
  return bell * bell;
}

function updateWaveGeometry(w) {
  const { posAttr, colAttr } = w;
  const headT = THREE.MathUtils.clamp(w.t, 0, 1);
  const tailT = THREE.MathUtils.clamp(w.t - w.dir * WAVE_LEN, 0, 1);

  for (let i = 0; i < WAVE_PTS; i++) {
    const u = i / (WAVE_PTS - 1);
    const t = tailT + (headT - tailT) * u;
    const p = w.edge.curve.getPoint(t);

    posAttr.array[i * 3] = p.x;
    posAttr.array[i * 3 + 1] = p.y;
    posAttr.array[i * 3 + 2] = 0.01;

    const soft = waveEnvelope(u);
    const intensity = WAVE_BASE + soft * (WAVE_PEAK - WAVE_BASE);

    const c = w.color;
    colAttr.array[i * 3] = c.r * intensity;
    colAttr.array[i * 3 + 1] = c.g * intensity;
    colAttr.array[i * 3 + 2] = c.b * intensity;
  }

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
}

function seedInitialWaves() {
  const shuffled = [...edges].sort(() => Math.random() - 0.5);
  const n = Math.min(1000, shuffled.length);
  for (let i = 0; i < n; i++) {
    spawnWave(shuffled[i], Math.random() > 0.5 ? 1 : -1);
    shuffled[i].nextWave = rand(0.3, 1.2);
  }
}

/* ── Soft mouse parallax ── */
let mouseTargetX = 0;
let mouseTargetY = 0;
let mouseSmoothX = 0;
let mouseSmoothY = 0;

document.addEventListener('mousemove', (e) => {
  mouseTargetX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseTargetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

const clock = new THREE.Clock();
const MAX_WAVES = 2400;
const PAN_STRENGTH = 0.12;
const PAN_LERP = 0.003;
const MOUSE_LERP = 0.04;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  mouseSmoothX += (mouseTargetX - mouseSmoothX) * MOUSE_LERP;
  mouseSmoothY += (mouseTargetY - mouseSmoothY) * MOUSE_LERP;

  const maxPanX = (graph.w - view.w) * PAN_STRENGTH;
  const maxPanY = (graph.h - view.h) * PAN_STRENGTH;
  const destX = mouseSmoothX * maxPanX;
  const destY = -mouseSmoothY * maxPanY;
  world.position.x += (destX - world.position.x) * PAN_LERP;
  world.position.y += (destY - world.position.y) * PAN_LERP;

  edges.forEach((e) => {
    e.nextWave -= dt;
    while (e.nextWave <= 0 && waves.length < MAX_WAVES) {
      spawnWave(e);
      e.nextWave += e.interval * rand(0.4, 0.9);
    }
  });

  for (let i = waves.length - 1; i >= 0; i--) {
    const w = waves[i];
    w.t += w.speed * dt * w.dir;

    const finished = w.dir > 0 ? w.t >= 1 : w.t <= 0;
    if (finished) {
      wavesGroup.remove(w.line);
      w.geo.dispose();
      w.mat.dispose();
      waves.splice(i, 1);

      const dest = w.dir > 0 ? w.edge.to : w.edge.from;
      const outgoing = edges.filter((e) => e.from === dest || e.to === dest);
      if (outgoing.length && waves.length < MAX_WAVES) {
        const next = outgoing[Math.floor(Math.random() * outgoing.length)];
        const nextDir = next.from === dest ? 1 : -1;
        spawnWave(next, nextDir);
        if (waves.length < MAX_WAVES && Math.random() > 0.6) {
          const extra = outgoing[Math.floor(Math.random() * outgoing.length)];
          spawnWave(extra, extra.from === dest ? 1 : -1);
        }
      }
      continue;
    }

    updateWaveGeometry(w);
  }

  renderer.render(scene, camera);
}

function resize() {
  updateCamera();
  renderer.setSize(window.innerWidth, window.innerHeight);
  buildGraph();
  updateVertexBuffer();
  seedInitialWaves();
}

resize();
animate();
window.addEventListener('resize', resize);