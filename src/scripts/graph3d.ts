import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import {
  ANGEL_UNIFORM_COLOR,
  CONCEPT_UNIFORM_COLOR,
  EDGE_COLORS,
  EDGE_SPRING_LENGTH,
  EVA_UNIFORM_COLOR,
  EVENT_UNIFORM_COLOR,
  FAMILY_UNIFORM_COLOR,
  LOCATION_UNIFORM_COLOR,
  MAGI_UNIFORM_COLOR,
  MASK_FILL_COLOR,
  MASK_HALO_COLOR,
  MASK_LABEL_COLOR,
  ORGANIZATION_UNIFORM_COLOR,
  SPOILER_EVENT_NAME,
  SPOILER_PROGRESS_DEFAULT,
  SPOILER_PROGRESS_FULL,
  adjacency,
  colorFor,
  evangelion,
  parseSpoilerProgress,
  isAngel,
  isCharacter,
  isConcept,
  isEdgeMasked,
  isEva,
  isEvent,
  isFamily,
  isLocation,
  isMagi,
  isNodeMasked,
  isOrganization,
  maskLabel,
  nodeIndex,
  nodeRadius,
  validateGraph,
} from "../graph";
import { forceLayout3D } from "../lib/forceLayout";
import type { Edge, GraphNode, SpoilerProgress } from "../graph/types";

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
  /**
   * Apply a new spoiler-progress level to the scene. Repaints node fills,
   * halos, and labels; toggles edge visibility. Idempotent --- safe to call
   * with the current progress.
   */
  applyProgress: (progress: SpoilerProgress) => void;
  /** Whether a node is currently masked under the active progress. */
  isNodeMasked: (id: string) => boolean;
  /** The currently-applied progress (initialized from localStorage). */
  progress: SpoilerProgress;
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
  meshMaterial: THREE.MeshBasicMaterial;
  haloMesh: THREE.Mesh;
  haloMaterial: THREE.MeshBasicMaterial;
  labelSprite: THREE.Sprite;
  labelMaterial: THREE.SpriteMaterial;
  clearLabelTex: THREE.CanvasTexture;
  maskedLabelTex: THREE.CanvasTexture;
  baseColor: THREE.Color;
  baseHaloColor: THREE.Color;
  baseHaloOpacity: number;
  baseScale: number;
  masked: boolean;
}

interface EdgeLineData {
  edge: Edge;
  fromId: string;
  toId: string;
  material: LineMaterial;
  baseOpacity: number;
  masked: boolean;
  /**
   * The opacity the mask + highlight pipeline most recently INTENDED.
   * The render-loop reads this and writes it through to material.opacity,
   * adding the pulse animation for eliminated edges on top. This indirection
   * lets the pulse layer cleanly without fighting whatever applyEdgeMask /
   * applyHighlight last set.
   */
  targetOpacity: number;
  /**
   * Eliminated-edge "kill chain" effect: additive blending plus a slow
   * sine pulse on opacity. The bond between an EVA and an angel it
   * destroyed is the most aggressive tie on the graph; this flag enables
   * the per-frame pulse so the line literally throbs against the dark
   * background while every other edge sits flat.
   */
  isKillChain: boolean;
}

const BG_COLOR = new THREE.Color("#050507");

/**
 * Render a node's displayName onto an offscreen 2D canvas and wrap it as a
 * texture for a billboarded sprite label.
 *
 * Shrink-to-fit keeps long names readable inside the same canvas without
 * inflating the sprite footprint --- short names paint big and bold; longer
 * ones step down in font size until they clear a 90% width margin. A dark
 * stroke keeps the white fill legible over any node color (NERV red, magi
 * green, EVA-orange clusters).
 */
const LABEL_CANVAS_W = 1024;
const LABEL_CANVAS_H = 256;

function makeLabelTexture(
  text: string,
  fillColor: string = "#ffffff",
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = LABEL_CANVAS_W;
  canvas.height = LABEL_CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const fontStack =
    'ui-monospace, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace';
  let fontPx = 140;
  const minFontPx = 56;
  while (fontPx > minFontPx) {
    ctx.font = `bold ${fontPx}px ${fontStack}`;
    if (ctx.measureText(text).width <= LABEL_CANVAS_W * 0.9) break;
    fontPx -= 4;
  }
  ctx.font = `bold ${fontPx}px ${fontStack}`;

  ctx.lineWidth = Math.max(4, fontPx * 0.14);
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = "rgba(5, 5, 7, 0.92)";
  ctx.strokeText(text, LABEL_CANVAS_W / 2, LABEL_CANVAS_H / 2);

  ctx.fillStyle = fillColor;
  ctx.fillText(text, LABEL_CANVAS_W / 2, LABEL_CANVAS_H / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
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
  /** Optional callback when the rendered mask state changes. */
  onProgress?: (progress: SpoilerProgress) => void;
}

export function initGraph3D(options: InitOptions): GraphHandle {
  const { root, canvas, onSelect, onHover, onProgress } = options;
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
    applyProgress: () => {},
    isNodeMasked: () => false,
    progress: { ...SPOILER_PROGRESS_DEFAULT },
    dispose: () => {},
  };
  window.__nggGraph = handle;

  validateGraph(evangelion);

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  root.dataset.reducedMotion = reducedMotion ? "true" : "false";

  // Three.js's WebGLRenderer constructor probes the canvas for a context and
  // throws on failure --- we catch that and surface the no-webgl fallback.
  // We deliberately do not run a separate pre-flight detection: a probe
  // canvas allocates its own WebGL context that mobile browsers (iOS Safari
  // especially) don't reclaim promptly, and the live-context cap is often
  // 4-8. The probe was tipping real phones into "context limit reached"
  // when the actual renderer tried to construct.
  //
  // preserveDrawingBuffer is gated to automation only --- the
  // canvas-pixel-readback test in tests/e2e/_helpers.ts needs it to read
  // back rendered pixels via drawImage, but on iOS Safari the same flag
  // makes context creation flaky under memory pressure. navigator.webdriver
  // is true under Playwright / CDP automation and false for real users.
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: window.devicePixelRatio < 2,
      alpha: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: navigator.webdriver === true,
    });
  } catch (err) {
    console.error("[ngg] WebGL renderer init failed:", err);
    handle.state = "no-webgl";
    root.dataset.state = "no-webgl";
    root.dataset.webglVersion = "0";
    return handle;
  }
  handle.webglVersion = renderer.capabilities.isWebGL2 ? 2 : 1;
  root.dataset.webglVersion = String(handle.webglVersion);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(BG_COLOR, 1);

  const scene = new THREE.Scene();
  scene.background = BG_COLOR;

  // Subtle radial fog for depth. Pulled back to match the wider graph radius
  // (TARGET_RADIUS=12) so the cluster fronts stay crisp and only the far
  // side dims into the void.
  scene.fog = new THREE.Fog(BG_COLOR, 22, 64);

  const camera = new THREE.PerspectiveCamera(
    50,
    1, // re-set on resize
    0.1,
    150,
  );
  camera.position.set(0, 0, 28);
  camera.lookAt(0, 0, 0);

  // Layout the graph. Magi-link rest length is tiny so the triad clusters tight.
  //
  // Layout is computed against SPOILER_PROGRESS_FULL --- every node and edge
  // contributes to the force solver --- so positions are stable regardless of
  // which spoiler tier the user picks. The actual mask state starts at
  // SPOILER_PROGRESS_DEFAULT (everything hidden) and only un-masks when the
  // gate fires its first event. This keeps the gate mandatory on every load
  // without paying re-layout cost when the user reveals.
  //
  // Shinji is pinned at the origin and the center-force is tripled. He is
  // the most magnetic node in the show: every other node gets pulled toward
  // his position more aggressively than the default radial bound, and the
  // sceneGroup + camera (both pivoting on world origin) make him the literal
  // axis the orb rotates around. The thesis of the website is that the
  // protagonist's interiority is the graph --- the visual language has to
  // make him the gravity well, not just one node among many.
  const layoutProgress = { ...SPOILER_PROGRESS_FULL };
  const initialNodesIndex = nodeIndex(evangelion);
  const layoutEdges = evangelion.edges.filter(
    (e) => !isEdgeMasked(e, layoutProgress, initialNodesIndex),
  );
  const layout = forceLayout3D(evangelion.nodes, layoutEdges, {
    springLengthByKind: EDGE_SPRING_LENGTH,
    pinnedNodeId: "char_shinji",
    centerForce: 0.06,
  });

  // Normalize so the full graph fits a fixed bounding sphere from origin,
  // independent of node count. Camera sits at z=28 with FOV 50 -> a radius
  // around 12 keeps everything inside the frustum and away from the fog
  // wall. The radius is intentionally generous: a tighter target would
  // squish the 18-link angel chain (and the 3-magi triangle inside it)
  // until individual nodes overlapped after scaling.
  {
    const TARGET_RADIUS = 12;
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
  const textures: THREE.Texture[] = [];

  // Sprite scale for displayName labels. Width ~3 world units reads at the
  // default camera distance; height preserves the 4:1 canvas aspect.
  const LABEL_SPRITE_W = 3.0;
  const LABEL_SPRITE_H =
    LABEL_SPRITE_W * (LABEL_CANVAS_H / LABEL_CANVAS_W);

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
    const baseColor = new THREE.Color(colorHex);
    const mat = new THREE.MeshBasicMaterial({ color: baseColor.clone() });
    materials.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    const p = layout.positions.get(node.id);
    if (!p) continue;
    mesh.position.set(p.x, p.y, p.z);
    mesh.userData = { nodeId: node.id, node };
    sceneGroup.add(mesh);

    // Faint outer halo --- second sphere, slightly larger, additive transparent.
    const baseHaloColor = baseColor.clone();
    const baseHaloOpacity = 0.18;
    const haloMat = new THREE.MeshBasicMaterial({
      color: baseHaloColor.clone(),
      transparent: true,
      opacity: baseHaloOpacity,
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

    // Display-name label: billboard sprite at the node's center. Depth test
    // is disabled and renderOrder is high so the label always paints on top
    // of the sphere (and any overlapping geometry) regardless of viewing
    // angle. Fog is disabled so labels stay readable on far nodes.
    const clearLabelTex = makeLabelTexture(node.displayName);
    const maskedLabelTex = makeLabelTexture(
      maskLabel(node.displayName),
      MASK_LABEL_COLOR,
    );
    textures.push(clearLabelTex);
    textures.push(maskedLabelTex);
    const labelMat = new THREE.SpriteMaterial({
      map: clearLabelTex,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      fog: false,
    });
    materials.push(labelMat);
    const labelSprite = new THREE.Sprite(labelMat);
    labelSprite.scale.set(LABEL_SPRITE_W, LABEL_SPRITE_H, 1);
    labelSprite.position.copy(mesh.position);
    labelSprite.renderOrder = 999;
    labelSprite.userData = { label: true, nodeId: node.id };
    sceneGroup.add(labelSprite);

    const data: NodeMeshData = {
      node,
      mesh,
      meshMaterial: mat,
      haloMesh: halo,
      haloMaterial: haloMat,
      labelSprite,
      labelMaterial: labelMat,
      clearLabelTex,
      maskedLabelTex,
      baseColor,
      baseHaloColor,
      baseHaloOpacity,
      baseScale: 1,
      masked: false,
    };
    nodeMeshes.push(data);
    nodeMeshById.set(node.id, data);
  }

  // Per-edge-kind base opacity. The ranking is canonical-meaning, not edge
  // count: a connection formed on elimination outranks one formed on
  // family --- the EVA <-> angel-it-killed bond is the single most
  // aggressive tie on the graph.
  //
  //   magi_link        0.95  the 3-in-1 triangle (always-on highlight)
  //   eliminated       0.85  the kill chain --- top ungated bond class
  //   identity_reveal  0.80  late-show 'X is really Y' plot beats
  //   pilots           0.75  pilot <-> EVA continuous identity
  //   caused           0.60  cause -> event arcs (Adam -> Second Impact)
  //   angel_sequence   0.55  canonical ordering chain
  //   member_of_family 0.45  lineage roll-up --- below eliminated by
  //                          design (per-user thesis)
  //   member_of_org    0.40  org-membership chrome
  //   located_in       0.40  spatial nesting chrome
  //   generic          0.32  background structural ties
  const EDGE_OPACITY: Record<typeof evangelion.edges[number]["kind"], number> = {
    magi_link: 0.95,
    eliminated: 0.85,
    identity_reveal: 0.8,
    pilots: 0.75,
    // Attacks read dramatic (just under the kill chain); relationships read
    // warm-prominent; the A.T.-Field and psych-wound hubs sit as chrome.
    attacked: 0.65,
    caused: 0.6,
    angel_sequence: 0.55,
    relationship: 0.5,
    member_of_family: 0.45,
    manifests: 0.45,
    afflicts: 0.42,
    member_of_org: 0.4,
    located_in: 0.4,
    generic: 0.32,
  };

  // Per-edge-kind line width in CSS pixels. Achievable because we render
  // edges as Line2 instanced screen-space quads (LineMaterial), not the
  // GPU-clamped THREE.LineBasicMaterial which is stuck at 1px on every
  // desktop driver. Width tracks meaning the same way opacity does:
  // structural chrome stays thin so the canonical-bond classes (kill chain,
  // magi triangle, identity reveals) read as the visually weighty lines.
  const EDGE_WIDTH: Record<typeof evangelion.edges[number]["kind"], number> = {
    magi_link: 3.0,
    eliminated: 3.5,
    identity_reveal: 3.0,
    pilots: 2.8,
    attacked: 2.6,
    caused: 2.4,
    angel_sequence: 2.4,
    relationship: 2.3,
    member_of_family: 2.2,
    manifests: 2.1,
    afflicts: 2.0,
    member_of_org: 2.0,
    located_in: 2.0,
    generic: 1.8,
  };

  // LineMaterial needs its `resolution` uniform updated whenever the
  // canvas resizes so the screen-space width stays in CSS pixels. We
  // collect every line material (spines + halos) into one array and the
  // resize handler walks it.
  const lineMaterials: LineMaterial[] = [];

  // Build edges.
  const edgeLines: EdgeLineData[] = [];
  const edgesByNode = new Map<string, EdgeLineData[]>();
  // Additional "halo" lines per eliminated edge, drawn fatter at lower
  // opacity with additive blending --- gives the kill-chain edge a
  // luminous body that reads as a glowing stroke. Halos share geometry
  // with the parent so they stay in lockstep through every mask,
  // highlight, and pulse update.
  interface KillChainHalo {
    parent: EdgeLineData;
    material: LineMaterial;
  }
  const killChainHalos: KillChainHalo[] = [];
  // LineGeometry is happy with a flat 6-float buffer per single segment.
  for (const edge of evangelion.edges) {
    const a = layout.positions.get(edge.from);
    const b = layout.positions.get(edge.to);
    if (!a || !b) continue;
    const colorHex = EDGE_COLORS[edge.kind];
    const opacity = EDGE_OPACITY[edge.kind];
    const width = EDGE_WIDTH[edge.kind];
    const isKillChain = edge.kind === "eliminated";
    const mat = new LineMaterial({
      color: new THREE.Color(colorHex).getHex(),
      transparent: true,
      opacity,
      linewidth: width,
      // Resolution gets flushed once the resize handler runs below,
      // and again on every viewport change.
      worldUnits: false,
      // Additive blending makes the kill-chain edge glow against the
      // OLED-black background --- the EVA <-> angel bond literally
      // brightens what's behind it, the way a NERV alert lights up
      // the bridge.
      blending: isKillChain ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: isKillChain ? false : true,
    });
    materials.push(mat);
    lineMaterials.push(mat);
    const geo = new LineGeometry();
    geo.setPositions([a.x, a.y, a.z, b.x, b.y, b.z]);
    geometries.push(geo);
    const line = new Line2(geo, mat);
    line.computeLineDistances();
    line.userData = { edge };
    if (isKillChain) {
      // Render the kill chain ON TOP of every other edge --- the EVA's
      // strike against the angel should read first, before the
      // structural blue family lines or the gray generic chrome.
      line.renderOrder = 5;
    }
    sceneGroup.add(line);
    const data: EdgeLineData = {
      edge,
      fromId: edge.from,
      toId: edge.to,
      material: mat,
      baseOpacity: opacity,
      masked: false,
      targetOpacity: opacity,
      isKillChain,
    };
    edgeLines.push(data);
    for (const id of [edge.from, edge.to]) {
      const list = edgesByNode.get(id) ?? [];
      list.push(data);
      edgesByNode.set(id, list);
    }

    // For eliminated edges: stack two more wider lines on the same
    // geometry, each with additive blending and lower opacity. Together
    // they bloom into a fuzzy red bar of light --- the EVA's overcoming
    // of the angel made literal in pixel space.
    if (isKillChain) {
      const haloPasses: Array<{ opacity: number; widthMul: number }> = [
        { opacity: 0.45, widthMul: 2.4 },
        { opacity: 0.22, widthMul: 4.4 },
      ];
      for (const pass of haloPasses) {
        const haloMat = new LineMaterial({
          color: new THREE.Color(colorHex).getHex(),
          transparent: true,
          opacity: pass.opacity,
          linewidth: width * pass.widthMul,
          worldUnits: false,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        materials.push(haloMat);
        lineMaterials.push(haloMat);
        const haloLine = new Line2(geo, haloMat);
        haloLine.computeLineDistances();
        haloLine.renderOrder = 4;
        haloLine.userData = { killChainHalo: true };
        sceneGroup.add(haloLine);
        killChainHalos.push({ parent: data, material: haloMat });
      }
    }
  }

  // Wireframe AT-field shell --- a faint icosahedron framing the graph.
  {
    const geo = new THREE.IcosahedronGeometry(13.5, 1);
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

  // ---- Spoiler gate: mask state ----
  const nodes = nodeIndex(evangelion);
  const maskedColor = new THREE.Color(MASK_FILL_COLOR);
  const maskedHaloColor = new THREE.Color(MASK_HALO_COLOR);

  function applyNodeMask(data: NodeMeshData, masked: boolean) {
    data.masked = masked;
    if (masked) {
      data.meshMaterial.color.copy(maskedColor);
      data.haloMaterial.color.copy(maskedHaloColor);
      data.haloMaterial.opacity = data.baseHaloOpacity;
      data.labelMaterial.map = data.maskedLabelTex;
    } else {
      data.meshMaterial.color.copy(data.baseColor);
      data.haloMaterial.color.copy(data.baseHaloColor);
      data.haloMaterial.opacity = data.baseHaloOpacity;
      data.labelMaterial.map = data.clearLabelTex;
    }
    data.labelMaterial.needsUpdate = true;
  }

  function applyEdgeMask(data: EdgeLineData, masked: boolean) {
    data.masked = masked;
    data.targetOpacity = masked ? 0 : data.baseOpacity;
    // Non-kill-chain edges get the value flushed straight through ---
    // they don't pulse, so the tick loop has no work to do for them.
    // Kill-chain edges defer to the tick loop, which mixes targetOpacity
    // with the per-frame sine pulse.
    if (!data.isKillChain) {
      data.material.opacity = data.targetOpacity;
    }
  }

  function applyProgress(progress: SpoilerProgress) {
    handle.progress = { ...progress };
    let visibleNodes = 0;
    let visibleEdges = 0;
    for (const data of nodeMeshes) {
      const masked = isNodeMasked(data.node, progress);
      applyNodeMask(data, masked);
      if (!masked) visibleNodes++;
    }
    for (const data of edgeLines) {
      const masked = isEdgeMasked(data.edge, progress, nodes);
      applyEdgeMask(data, masked);
      if (!masked) visibleEdges++;
    }
    root.dataset.visibleNodes = String(visibleNodes);
    root.dataset.visibleEdges = String(visibleEdges);
    root.dataset.spoilerEpisode = String(progress.episode);
    root.dataset.spoilerEoe = progress.eoe ? "true" : "false";
    onProgress?.(progress);
  }

  handle.applyProgress = applyProgress;
  handle.isNodeMasked = (id: string) => {
    return nodeMeshById.get(id)?.masked ?? false;
  };

  /**
   * Apply edge highlighting based on selection (priority) or hover.
   * Connected edges become brighter; others fade. Null clears.
   * Masked edges always stay at opacity 0 regardless of highlight.
   */
  function applyHighlight(highlightId: string | null) {
    // Helper: write through to material if not a pulsing kill chain;
    // kill-chain edges only update their target and let the tick loop
    // re-render with the active pulse on top.
    const setOpacity = (e: EdgeLineData, v: number) => {
      e.targetOpacity = v;
      if (!e.isKillChain) e.material.opacity = v;
    };
    if (!highlightId) {
      for (const e of edgeLines) {
        if (e.masked) {
          setOpacity(e, 0);
        } else {
          setOpacity(e, e.baseOpacity);
        }
      }
      root.dataset.highlightedNode = "";
      return;
    }
    const touched = edgesByNode.get(highlightId);
    const touchedSet = new Set(touched);
    for (const e of edgeLines) {
      if (e.masked) {
        setOpacity(e, 0);
        continue;
      }
      if (touchedSet.has(e)) {
        setOpacity(e, Math.min(1, e.baseOpacity * 2.5 + 0.05));
      } else {
        setOpacity(e, Math.max(0.04, e.baseOpacity * 0.18));
      }
    }
    root.dataset.highlightedNode = highlightId;
  }

  // ---- Interaction: drag to rotate, right-drag to pan, wheel to zoom ----
  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0.18;
  let camDistance = 28;
  let targetCamDistance = 28;
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
    targetCamDistance = Math.max(14, Math.min(64, targetCamDistance * factor));
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
    // LineMaterial extrudes line quads in screen space; without an
    // up-to-date resolution every line renders at a width skewed by
    // whatever the previous viewport was.
    for (const m of lineMaterials) m.resolution.set(w, h);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  // ---- Animation loop ----
  let raf = 0;
  let lastTs = performance.now();
  // Auto-rotation is the graph's resting state --- the slow drift is a
  // feature, not chrome. We don't tie it to prefers-reduced-motion: the
  // pause/play toggle is the user-facing way to stop it. (The kill-chain
  // pulse below still respects reducedMotion, since that one is flashier
  // and primarily decorative.)
  const autoRotateSpeed = 0.13;
  handle.autoRotate = true;
  handle.setAutoRotate = (on: boolean) => {
    handle.autoRotate = on;
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

    // Kill-chain pulse: every eliminated edge throbs at ~0.5 Hz so the
    // EVA's strike against the angel reads as a live, ongoing assertion
    // instead of a static line. Two-thirds bias toward the upper half of
    // the wave keeps the line visible at its dimmest moment; the
    // remaining third sweeps the line up to and slightly past full
    // opacity for the bloom. prefers-reduced-motion freezes the wave at
    // its mean so the visual still pops without animating.
    //
    //   pulseScale = reducedMotion ? 1.0 : 0.78 + 0.32 * sin(...)
    //   range:       reducedMotion ? 1.0  : [0.46, 1.10]
    //
    // The halo lines (additive blended, fatter perceived stroke) ride
    // the same scalar at proportional opacity so the bloom breathes
    // around the spine line.
    const pulsePhase = reducedMotion
      ? 1.0
      : 0.78 + 0.32 * Math.sin(ts * 0.0031);
    for (const e of edgeLines) {
      if (!e.isKillChain) continue;
      // Multiply the pulse against whatever the mask + highlight
      // pipeline last requested, so a masked kill-chain stays at 0
      // and a dimmed-by-highlight kill-chain still pulses (just at
      // a lower amplitude relative to its dimmed target).
      e.material.opacity = Math.min(1, e.targetOpacity * pulsePhase);
    }
    for (const h of killChainHalos) {
      // Halo opacity is independent of the spine target --- it carries
      // its own creation-time opacity (set when the halo material was
      // built). When the parent is masked we drop the halo to zero so
      // it doesn't bloom over a hidden edge; otherwise the halo rides
      // its own base * pulse.
      if (h.parent.masked) {
        h.material.opacity = 0;
        continue;
      }
      // Halo's "base" opacity is whatever it was constructed with;
      // multiplying by the pulse keeps the bloom in lockstep with the
      // spine line. We capture the base on first read since
      // material.opacity gets overwritten each frame.
      const baseHalo = (h.material as unknown as { __baseHalo?: number })
        .__baseHalo ?? h.material.opacity;
      (h.material as unknown as { __baseHalo?: number }).__baseHalo = baseHalo;
      h.material.opacity = Math.min(1, baseHalo * pulsePhase);
    }

    renderer.render(scene, camera);
    handle.frames += 1;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Initial spoiler progress: prefer the localStorage tier (set by a prior
  // reveal in SpoilerGate.astro) if present, otherwise default to fully
  // masked. The renderer is a co-equal reader of the same storage as the
  // gate --- this avoids a script-order race where the gate broadcasts
  // before the renderer has registered its listener. On a returning visit
  // the gate keeps itself closed; on a first visit the gate sits on top
  // and the user must reveal before this default is overridden.
  const STORAGE_KEY = "ngg-spoiler-progress";
  let initialProgress: SpoilerProgress = { ...SPOILER_PROGRESS_DEFAULT };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) initialProgress = parseSpoilerProgress(raw);
  } catch {
    /* localStorage unavailable; fall back to default. */
  }
  applyProgress(initialProgress);

  // Listen for the gate's change event (fired by SpoilerGate.astro).
  const onSpoilerEvent = (e: Event) => {
    const ce = e as CustomEvent<SpoilerProgress>;
    if (!ce.detail || typeof ce.detail !== "object") return;
    applyProgress(ce.detail);
  };
  window.addEventListener(SPOILER_EVENT_NAME, onSpoilerEvent);

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
    window.removeEventListener(SPOILER_EVENT_NAME, onSpoilerEvent);
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    for (const t of textures) t.dispose();
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
  CONCEPT_UNIFORM_COLOR,
  EDGE_COLORS,
  EVA_UNIFORM_COLOR,
  EVENT_UNIFORM_COLOR,
  FAMILY_UNIFORM_COLOR,
  LOCATION_UNIFORM_COLOR,
  MAGI_UNIFORM_COLOR,
  ORGANIZATION_UNIFORM_COLOR,
  evangelion,
  isAngel,
  isCharacter,
  isConcept,
  isEva,
  isEvent,
  isFamily,
  isLocation,
  isMagi,
  isOrganization,
};
