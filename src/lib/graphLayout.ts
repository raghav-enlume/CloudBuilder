/**
 * Layout Engine using ELK (Eclipse Layout Kernel)
 * Provides automatic hierarchical, layered layout for architecture diagrams
 * Ported from aws-graph-visualizer
 */

import ELK from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "reactflow";

const elk = new ELK();

// ELK Layout Configuration Interface
export interface ElkLayoutConfig {
  // Root level options
  rootDirection?: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';
  rootSpacing?: number;
  rootLayerSpacing?: number;

  // Container options
  vpcDirection?: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';
  subnetDirection?: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';
  containerPadding?: string; // e.g., "[top=40,left=20,bottom=20,right=20]"
  nodeSpacing?: number;

  // Algorithm options
  algorithm?: 'layered' | 'mrtree' | 'radial' | 'force' | 'disco' | 'box' | 'fixed';

  // Advanced positioning options
  nodeNodeBetweenLayers?: number;
  edgeNodeBetweenLayers?: number;
  considerModelOrder?: 'NONE' | 'NODES_AND_EDGES' | 'EDGES';
  cycleBreaking?: 'GREEDY' | 'INTERACTIVE' | 'MODEL_ORDER';
  layering?: 'NETWORK_SIMPLEX' | 'LONGEST_PATH' | 'COFFMAN_Graham';
  crossingMinimization?: 'LAYER_SWEEP' | 'SIMPLE';
  nodePlacement?: 'BRANDES_KOEPF' | 'LINEAR_SEGMENTS' | 'INTERACTIVE' | 'SIMPLE';
}

// Default ELK configuration
const defaultConfig: ElkLayoutConfig = {
  rootDirection: 'DOWN',
  rootSpacing: 60,  // Increased from 30 for better clearance between groups and standalone nodes
  rootLayerSpacing: 50,  // Increased from 40 for better vertical separation
  vpcDirection: 'RIGHT',
  subnetDirection: 'DOWN',
  containerPadding: '[top=25,left=15,bottom=15,right=15]',  // Increased padding
  nodeSpacing: 25,  // Increased from 15 for more space between nodes
  algorithm: 'layered',
  nodeNodeBetweenLayers: 40,  // Increased from 35 for better layer separation
  edgeNodeBetweenLayers: 20,  // Increased from 15 for better edge clearance
  considerModelOrder: 'NONE',
  cycleBreaking: 'GREEDY',
  layering: 'NETWORK_SIMPLEX',
  crossingMinimization: 'LAYER_SWEEP',
  nodePlacement: 'BRANDES_KOEPF',
};

export async function layoutGraphWithELK(
  nodes: Node[],
  edges: Edge[],
  config: ElkLayoutConfig = {}
): Promise<Node[]> {
  // Merge with defaults
  const layoutConfig = { ...defaultConfig, ...config };
  const nodeById = new Map<string, Node>(nodes.map((n) => [n.id, n]));
  const childrenByParent = new Map<string, string[]>();

  for (const n of nodes) {
    const parent = n.parentNode;
    if (!parent) continue;
    const list = childrenByParent.get(parent) ?? [];
    list.push(n.id);
    childrenByParent.set(parent, list);
  }

  const isGroup = (n: Node) => n.type === "group";
  const groupKind = (n: Node): string | undefined => (n?.data as any)?.kind;
  const sizeFor = (n: Node) => {
    if (isGroup(n)) {
      const width = typeof (n.style as any)?.width === "number" ? (n.style as any).width : 800;
      const height =
        typeof (n.style as any)?.height === "number" ? (n.style as any).height : 520;
      return { width, height };
    }
    // Use actual rendered node size for resource nodes (54x54)
    // This matches the AwsResourceNode component dimensions
    return { width: 84, height: 84 };
  };

  const buildElkChild = (id: string): any => {
    const n = nodeById.get(id);
    if (!n) return null;
    const { width, height } = sizeFor(n);
    const childIds = childrenByParent.get(id) ?? [];
    const children = childIds.map(buildElkChild).filter(Boolean);

    const kind = groupKind(n);
    const direction = kind === "vpc" ? layoutConfig.vpcDirection : layoutConfig.subnetDirection;

    return {
      id,
      width,
      height,
      ...(children.length
        ? {
            layoutOptions: {
              "elk.algorithm": layoutConfig.algorithm,
              "elk.direction": direction,
              "elk.padding": layoutConfig.containerPadding,
              "elk.spacing.nodeNode": layoutConfig.nodeSpacing?.toString(),
              "elk.layered.nodeNodeBetweenLayers": layoutConfig.nodeNodeBetweenLayers?.toString(),
              "elk.layered.edgeNodeBetweenLayers": layoutConfig.edgeNodeBetweenLayers?.toString(),
              "elk.considerModelOrder": layoutConfig.considerModelOrder,
              "elk.layered.cycleBreaking": layoutConfig.cycleBreaking,
              "elk.layered.layering": layoutConfig.layering,
              "elk.layered.crossingMinimization": layoutConfig.crossingMinimization,
              "elk.layered.nodePlacement": layoutConfig.nodePlacement,
            },
            children,
          }
        : null),
    };
  };

  const rootChildren = nodes
    .filter((n) => !n.parentNode)
    .map((n) => buildElkChild(n.id))
    .filter(Boolean);

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": layoutConfig.algorithm,
      "elk.direction": layoutConfig.rootDirection,
      "elk.spacing.nodeNode": layoutConfig.rootSpacing?.toString(),
      "elk.layered.spacing.nodeNodeBetweenLayers": layoutConfig.rootLayerSpacing?.toString(),
      "elk.layered.nodeNodeBetweenLayers": layoutConfig.nodeNodeBetweenLayers?.toString(),
      "elk.layered.edgeNodeBetweenLayers": layoutConfig.edgeNodeBetweenLayers?.toString(),
      "elk.considerModelOrder": layoutConfig.considerModelOrder,
      "elk.layered.cycleBreaking": layoutConfig.cycleBreaking,
      "elk.layered.layering": layoutConfig.layering,
      "elk.layered.crossingMinimization": layoutConfig.crossingMinimization,
      "elk.layered.nodePlacement": layoutConfig.nodePlacement,
    },
    children: rootChildren,
    edges: edges
      .filter((e: any) => e?.source && e?.target)
      .map((e: any) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
  };

  const layout = await elk.layout(graph);

  type Box = { x: number; y: number; width: number; height: number; parent?: string };
  const boxes = new Map<string, Box>();

  const walk = (g: any, offsetX: number, offsetY: number, parent?: string) => {
    const children = Array.isArray(g.children) ? g.children : [];
    for (const c of children) {
      const x = (c.x ?? 0) + offsetX;
      const y = (c.y ?? 0) + offsetY;
      boxes.set(c.id, {
        x,
        y,
        width: c.width ?? 54,  // Match actual node width
        height: c.height ?? 54, // Match actual node height
        parent,
      });
      walk(c, x, y, c.id);
    }
  };

  walk(layout, 0, 0);

  return nodes.map((n: Node) => {
    const box = boxes.get(n.id);
    if (!box) return n;

    const parentBox = n.parentNode ? boxes.get(n.parentNode) : undefined;
    const position = parentBox
      ? { x: box.x - parentBox.x, y: box.y - parentBox.y }
      : { x: box.x, y: box.y };

    if (isGroup(n)) {
      return {
        ...n,
        position,
        style: {
          ...(n.style ?? {}),
          width: box.width,
          height: box.height,
        },
      };
    }

    return { ...n, position };
  });
}
