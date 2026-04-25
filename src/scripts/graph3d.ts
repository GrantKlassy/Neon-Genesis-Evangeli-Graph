import * as THREE from "three";
import {
  ANGEL_UNIFORM_COLOR,
  EDGE_COLORS,
  EDGE_SPRING_LENGTH,
  MAGI_UNIFORM_COLOR,
  adjacency,
  colorFor,
  evangelion,
  isAngel,
  isCharacter,
  isMagi,
  nodeRadius,
  validateGraph,
} from "../graph";
import { forceLayout3D } from "../lib/forceLayout";
import type { GraphNode } from "../graph/types";

export type RendererState = "init" | "ready" | "no-webgl" | "error";

export interface GraphHandle {
  state: RendererState;
  nodeCount: number;
  edgeCount: number;
  webglVersion: 1 | 2 | null;
  frames: number;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  autoRotate: boolean;
  /** All node ids in the scene (for tests / external pickers). */
  nodeIds: string[];
  /** Programmatically select a node by id (or pass null to clear). */
  selectNodeById: (id: string | null) => void;
  /** Programmatically set the hover state by id. */
  hoverNodeById: (id: string | null) => void;
  /** Toggle auto-rotation. */
  setAutoRotate: (on: boolean) => void;
  /** Dispose all resources (called on hot-reload / teardown). */
  dispose: () => void;
}

declare global {
  interface Window {
    __nggGraph?: GraphHandle;
  }
}

interface NodeMeshData {
  node: GraphNode;
  mesh: THREE.Mesh;
  baseScale: number;
}

interface EdgeLineData {
  fromId: string;
  toId: string;
  material: THREE.LineBasicMaterial;
  baseOpacity: number;
}

const BG_COLOR = new THREE.Color("#050507");

function detectWebGL(): { ok: boolean; version: 1 | 2 | null } {
  try {
    const c = document.createElement("canvas");
    if (c.getContext("webgl2")) return { ok: true, version: 2 };
    if (c.getContext("webgl") || c.getContext("experimental-webgl")) {
      return { ok: true, version: 1 };
    }
  } catch {
    // fallthrough
  }
  return { ok: false, version: null };
}

export interface InitOptions {
  /** Element receiving state via data-state, hosting the canvas. */
  root: HTMLElement;
  /** Canvas element used for rendering. */
  canvas: HTMLCanvasElement;
  /** Optional callback when a node is selected (clicked). */
  onSelect?: (node: GraphNode | null) => void;
  /** Optional callback when a node is hovered (null on hover-out). */
  onHover?: (node: GraphNode | null) => void;
}

export function initGraph3D(options: InitOptions): GraphHandle {
  const { root, canvas, onSelect, onHover } = options;
  const handle: GraphHandle = {
    state: "init",
    nodeCount: 0,
    edgeCount: 0,
    webglVersion: null,
    frames: 0,
    selectedNodeId: null,
    hoveredNodeId: null,
    autoRotate: true,
    nodeIds: [],
    selectNodeById: () => {},
    hoverNodeById: () => {},
    setAutoRotate: () => {},
    dispose: () => {},
  };
  window.__nggGraph = handle;

  validateGraph(evangelion);

  const webgl = detectWebGL();
  if (!webgl.ok) {
    handle.state = "no-webgl";
    root.dataset.state = "no-webgl";
    root.dataset.webglVersion = "0";
    return handle;
  }
  handle.webglVersion = webgl.version;
  root.dataset.webglVersion = String(webgl.version);

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  root.dataset.reducedMotion = reducedMotion ? "true" : "false";

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.devicePixelRatio < 2,
      alpha: false,
      powerPreference: "low-power",
      // Keep the framebuffer readable after present() so screenshot/pixel-readback
      // tests can verify rendering. Modest perf cost on integrated GPUs.
      preserveDrawingBuffer: true,
    });
  } catch (err) {
    console.error("[ngg] WebGL renderer init failed:", err);
    handle.state = "error";
    root.dataset.state = "error";
    return handle;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BG_COLOR, 1);

  const scene = new THREE.Scene();
  scene.background = BG_COLOR;

  // Subtle radial fog for depth.
  scene.fog = new THREE.Fog(BG_COLOR, 14, 42);

  const camera = new THREE.PerspectiveCamera(
    50,
    1, // re-set on resize
    0.1,
    100,
  );
  camera.position.set(0, 0, 18);
  camera.lookAt(0, 0, 0);

  // Layout the graph. Magi-link rest length is tiny so the triad clusters tight.
  const layout = forceLayout3D(evangelion.nodes, evangelion.edges, {
    springLengthByKind: EDGE_SPRING_LENGTH,
  });

  // Normalize so the full graph fits a fixed bounding sphere from origin,
  // independent of node count. Camera sits at z=18 with FOV 50 -> a radius
  // around 7 keeps everything inside the frustum and away from the fog wall.
  {
    const TARGET_RADIUS = 7;
    let maxR = 0;
    for (const p of layout.positions.values()) {
      const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      if (r > maxR) maxR = r;
    }
    if (maxR > TARGET_RADIUS && maxR > 0) {
      const k = TARGET_RADIUS / maxR;
      for (const p of layout.positions.values()) {
        p.x *= k;
        p.y *= k;
        p.z *= k;
      }
    }
  }

  // Group everything that should rotate together.
  const sceneGroup = new THREE.Group();
  scene.add(sceneGroup);

  // Build node meshes.
  const nodeMeshes: NodeMeshData[] = [];
  const nodeMeshById = new Map<string, NodeMeshData>();
  const sphereGeoCache = new Map<string, THREE.SphereGeometry>();
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  for (const node of evangelion.nodes) {
    const radius = nodeRadius(node);
    const segKey = `${radius.toFixed(2)}`;
    let geo = sphereGeoCache.get(segKey);
    if (!geo) {
      geo = new THREE.SphereGeometry(radius, 24, 18);
      sphereGeoCache.set(segKey, geo);
      geometries.push(geo);
    }
    const colorHex = colorFor(node);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
    });
    materials.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    const p = layout.positions.get(node.id);
    if (!p) continue;
    mesh.position.set(p.x, p.y, p.z);
    mesh.userData = { nodeId: node.id, node };
    sceneGroup.add(mesh);

    // Faint outer halo --- second sphere, slightly larger, additive transparent.
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    materials.push(haloMat);
    const haloGeo = new THREE.SphereGeometry(radius * 1.7, 16, 12);
    geometries.push(haloGeo);
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(mesh.position);
    halo.userData = { halo: true };
    sceneGroup.add(halo);

    const data: NodeMeshData = { node, mesh, baseScale: 1 };
    nodeMeshes.push(data);
    nodeMeshById.set(node.id, data);
  }

  // Build edges.
  const edgeLines: EdgeLineData[] = [];
  const edgesByNode = new Map<string, EdgeLineData[]>();
  for (const edge of evangelion.edges) {
    const a = layout.positions.get(edge.from);
    const b = layout.positions.get(edge.to);
    if (!a || !b) continue;
    const colorHex = EDGE_COLORS[edge.kind];
    const opacity = edge.kind === "magi_link" ? 0.95 : 0.5;
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity,
    });
    materials.push(mat);
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x, a.y, a.z),
      new THREE.Vector3(b.x, b.y, b.z),
    ]);
    geometries.push(geo);
    const line = new THREE.Line(geo, mat);
    line.userData = { edge };
    sceneGroup.add(line);
    const data: EdgeLineData = {
      fromId: edge.from,
      toId: edge.to,
      material: mat,
      baseOpacity: opacity,
    };
    edgeLines.push(data);
    for (const id of [edge.from, edge.to]) {
      const list = edgesByNode.get(id) ?? [];
      list.push(data);
      edgesByNode.set(id, list);
    }
  }

  // Wireframe AT-field shell --- a faint icosahedron framing the graph.
  {
    const geo = new THREE.IcosahedronGeometry(8.5, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ff2a3c"),
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    materials.push(mat);
    geometries.push(geo);
    sceneGroup.add(mesh);
  }

  handle.nodeCount = nodeMeshes.length;
  handle.edgeCount = evangelion.edges.length;
  handle.nodeIds = nodeMeshes.map((m) => m.node.id);

  /**
   * Apply edge highlighting based on selection (priority) or hover.
   * Connected edges become brighter; others fade. Null clears.
   */
  function applyHighlight(highlightId: string | null) {
    if (!highlightId) {
      for (const e of edgeLines) e.material.opacity = e.baseOpacity;
      root.dataset.highlightedNode = "";
      return;
    }
    const touched = edgesByNode.get(highlightId);
    const touchedSet = new Set(touched);
    for (const e of edgeLines) {
      if (touchedSet.has(e)) {
        e.material.opacity = Math.min(1, e.baseOpacity * 2.5 + 0.05);
      } else {
        e.material.opacity = Math.max(0.04, e.baseOpacity * 0.18);
      }
    }
    root.dataset.highlightedNode = highlightId;
  }

  // ---- Interaction: drag to rotate, right-drag to pan, wheel to zoom ----
  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0.18;
  let camDistance = 18;
  let targetCamDistance = 18;
  let panX = 0;
  let panY = 0;
  let targetPanX = 0;
  let targetPanY = 0;
  let pointerDown = false;
  let panMode = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let userInteracting = false;
  let lastInteractionTs = 0;

  const onPointerDown = (e: PointerEvent) => {
    pointerDown = true;
    panMode = e.button === 2;
    userInteracting = true;
    lastInteractionTs = performance.now();
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    updateHover(e);
    if (!pointerDown) return;
    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    if (panMode) {
      // Map pixel delta to world units at the focal plane (origin) so 1px of
      // mouse travel = 1px of scene travel on screen.
      const fovRad = (camera.fov * Math.PI) / 180;
      const visibleHeight = 2 * camDistance * Math.tan(fovRad / 2);
      const worldPerPixel =
        visibleHeight / (canvas.clientHeight || canvas.height || 1);
      targetPanX += dx * worldPerPixel;
      targetPanY -= dy * worldPerPixel;
    } else {
      targetYaw += dx * 0.0055;
      targetPitch += dy * 0.0055;
      targetPitch = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, targetPitch),
      );
    }
    lastInteractionTs = performance.now();
  };
  const onPointerUp = (e: PointerEvent) => {
    pointerDown = false;
    panMode = false;
    canvas.releasePointerCapture?.(e.pointerId);
    setTimeout(() => {
      userInteracting = false;
    }, 800);
  };
  // Right-click drags the camera; the native context menu would interrupt that.
  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };
  const onRootEnter = () => {
    root.dataset.graphHovered = "true";
  };
  const onRootLeave = () => {
    root.dataset.graphHovered = "false";
  };
  const onWheel = (e: WheelEvent) => {
    // Plain wheel scrolls the page (so the pin runway can release the
    // viewport). Hold ctrl/cmd to zoom the camera instead.
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const factor = Math.exp(e.deltaY * 0.001);
    targetCamDistance = Math.max(8, Math.min(40, targetCamDistance * factor));
    lastInteractionTs = performance.now();
    userInteracting = true;
    setTimeout(() => {
      userInteracting = false;
    }, 1200);
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", onContextMenu);
  root.addEventListener("pointerenter", onRootEnter);
  root.addEventListener("pointerleave", onRootLeave);

  // Click selection (raycaster).
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  function pointerToNdc(e: { clientX: number; clientY: number }) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickNode(e: { clientX: number; clientY: number }): GraphNode | null {
    pointerToNdc(e);
    raycaster.setFromCamera(ndc, camera);
    const meshes = nodeMeshes.map((m) => m.mesh);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return null;
    const node = hits[0]!.object.userData.node as GraphNode | undefined;
    return node ?? null;
  }

  function refreshScales() {
    for (const m of nodeMeshes) {
      const isSelected = m.node.id === handle.selectedNodeId;
      const isHover = m.node.id === handle.hoveredNodeId;
      m.baseScale = isSelected ? 1.45 : isHover ? 1.25 : 1;
    }
  }

  function refreshHighlight() {
    applyHighlight(handle.selectedNodeId ?? handle.hoveredNodeId);
  }

  function setHovered(id: string | null) {
    if (id === handle.hoveredNodeId) return;
    handle.hoveredNodeId = id;
    canvas.style.cursor = id ? "pointer" : "grab";
    refreshScales();
    refreshHighlight();
    if (id) {
      const node = nodeMeshById.get(id)?.node ?? null;
      onHover?.(node);
    } else {
      onHover?.(null);
    }
  }

  function selectNode(node: GraphNode | null) {
    handle.selectedNodeId = node?.id ?? null;
    refreshScales();
    refreshHighlight();
    onSelect?.(node);
  }

  function updateHover(e: PointerEvent) {
    const node = pickNode(e);
    setHovered(node?.id ?? null);
  }

  const onClick = (e: MouseEvent) => {
    const node = pickNode(e);
    selectNode(node);
  };
  canvas.addEventListener("click", onClick);

  // Programmatic APIs (used by UI controls and tests).
  handle.selectNodeById = (id: string | null) => {
    if (id === null) {
      selectNode(null);
      return;
    }
    const node = nodeMeshById.get(id)?.node ?? null;
    selectNode(node);
  };
  handle.hoverNodeById = (id: string | null) => {
    setHovered(id);
  };

  // ---- Resize ----
  const resize = () => {
    const w = canvas.clientWidth || root.clientWidth;
    const h = canvas.clientHeight || root.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  // ---- Animation loop ----
  let raf = 0;
  let lastTs = performance.now();
  const autoRotateSpeed = reducedMotion ? 0 : 0.13;
  handle.autoRotate = !reducedMotion;
  handle.setAutoRotate = (on: boolean) => {
    handle.autoRotate = on && !reducedMotion;
    root.dataset.autoRotate = handle.autoRotate ? "on" : "off";
  };
  root.dataset.autoRotate = handle.autoRotate ? "on" : "off";

  const tick = (ts: number) => {
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    // Auto-rotate when user not interacting.
    const idleFor = ts - lastInteractionTs;
    if (handle.autoRotate && !userInteracting && idleFor > 100) {
      targetYaw += autoRotateSpeed * dt;
    }

    // Smoothly approach targets.
    yaw += (targetYaw - yaw) * Math.min(1, dt * 6);
    pitch += (targetPitch - pitch) * Math.min(1, dt * 6);
    camDistance += (targetCamDistance - camDistance) * Math.min(1, dt * 6);
    panX += (targetPanX - panX) * Math.min(1, dt * 6);
    panY += (targetPanY - panY) * Math.min(1, dt * 6);

    sceneGroup.rotation.y = yaw;
    sceneGroup.rotation.x = pitch;
    sceneGroup.position.set(panX, panY, 0);

    camera.position.setFromSpherical(
      new THREE.Spherical(camDistance, Math.PI / 2, 0),
    );
    camera.lookAt(0, 0, 0);

    // Animate node scale ease (avoids snappy resize).
    for (const m of nodeMeshes) {
      const cur = m.mesh.scale.x;
      const next = cur + (m.baseScale - cur) * Math.min(1, dt * 12);
      m.mesh.scale.setScalar(next);
    }

    renderer.render(scene, camera);
    handle.frames += 1;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  handle.state = "ready";
  root.dataset.state = "ready";
  root.dataset.nodeCount = String(handle.nodeCount);
  root.dataset.edgeCount = String(handle.edgeCount);

  handle.dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("click", onClick);
    canvas.removeEventListener("contextmenu", onContextMenu);
    root.removeEventListener("pointerenter", onRootEnter);
    root.removeEventListener("pointerleave", onRootLeave);
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    renderer.dispose();
  };

  return handle;
}

/** Convenience: count adjacency for a node id (used in side panel). */
export function neighborCount(nodeId: string): number {
  const adj = adjacency(evangelion);
  return adj.get(nodeId)?.length ?? 0;
}

/** Re-export for the page UI. */
export {
  ANGEL_UNIFORM_COLOR,
  EDGE_COLORS,
  MAGI_UNIFORM_COLOR,
  evangelion,
  isAngel,
  isCharacter,
  isMagi,
};
