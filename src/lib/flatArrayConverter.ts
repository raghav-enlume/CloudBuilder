/**
 * Flat Array Format Converter
 * Auto-detects and converts AWS flat-array JSON format to diagram nodes and edges
 * Integrates with buildArchitectureGraph for full feature support
 */

import { Node, Edge } from "reactflow";
import {
  convertFlatArrayToArchitectureDatasets,
  buildArchitectureGraph,
  type ArchitectureDataset,
} from "./buildArchitectureGraph";
import { layoutGraphWithELK, type ElkLayoutConfig } from "./graphLayout";

export interface FlatArrayRegion {
  region: string;
  total_resources: number;
  resources: any[];
}

export type FlatArrayInput = FlatArrayRegion[];

/**
 * Auto-detect the import format
 */
export function parseImportFormat(data: any): "flat-array" | "diagram" | "unknown" {
  // Check if it's a diagram format (has nodes and edges arrays)
  if (data && typeof data === "object") {
    if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
      return "diagram";
    }
    // Check if it's a flat-array format (array of regions with resources)
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (
        firstItem.region &&
        firstItem.total_resources &&
        Array.isArray(firstItem.resources)
      ) {
        return "flat-array";
      }
    }
  }
  return "unknown";
}

/**
 * Convert flat-array to architecture datasets
 */
export async function convertFlatArrayImport(
  data: any,
  applyLayout: boolean = true,
  elkConfig?: ElkLayoutConfig
): Promise<{ nodes: Node[]; edges: Edge[] } | null> {
  const format = parseImportFormat(data);

  if (format === "flat-array") {
    try {
      // Convert to architecture datasets
      const datasets = convertFlatArrayToArchitectureDatasets(data as FlatArrayInput);

      if (datasets.length === 0) {
        throw new Error("No valid VPC architectures found in the input data");
      }

      let allNodes: Node[] = [];
      let allEdges: Edge[] = [];

      // Build graph for each dataset (usually one per region)
      for (const dataset of datasets) {
        const { nodes, edges } = buildArchitectureGraph(dataset);
        allNodes = allNodes.concat(nodes);
        allEdges = allEdges.concat(edges);
      }

      // Apply ELK layout if requested
      if (applyLayout && allNodes.length > 0) {
        allNodes = await layoutGraphWithELK(allNodes, allEdges, elkConfig);
      }

      return { nodes: allNodes, edges: allEdges };
    } catch (error) {
      console.error("Conversion error:", error);
      throw error;
    }
  }

  if (format === "diagram") {
    // Already in diagram format
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
    };
  }

  return null;
}

/**
 * Legacy API for sync conversion (without layout)
 */
export function convertFlatArrayToNodes(flatArray: FlatArrayInput): {
  nodes: Node[];
  edges: Edge[];
} {
  const datasets = convertFlatArrayToArchitectureDatasets(flatArray);
  let allNodes: Node[] = [];
  let allEdges: Edge[] = [];

  for (const dataset of datasets) {
    const { nodes, edges } = buildArchitectureGraph(dataset);
    allNodes = allNodes.concat(nodes);
    allEdges = allEdges.concat(edges);
  }

  return { nodes: allNodes, edges: allEdges };
}
