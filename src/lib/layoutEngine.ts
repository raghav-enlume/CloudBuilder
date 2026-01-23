/**
 * Layout Engine for AWS Diagram - Similar to Python Diagrams Package
 * 
 * Provides hierarchical and structured layout algorithms for AWS resource diagrams
 * Mimics the clean, aligned layout of the Python diagrams package
 */

import { Node, Edge } from 'reactflow';

export interface LayoutConfig {
  direction?: 'TB' | 'LR' | 'BT' | 'RL'; // Top-Bottom, Left-Right, etc.
  spacing?: {
    nodeWidth?: number;
    nodeHeight?: number;
    horizontalGap?: number;
    verticalGap?: number;
    containerPadding?: number;
  };
  hierarchyLevels?: {
    region?: number;
    vpc?: number;
    subnet?: number;
    resource?: number;
  };
}

export const DEFAULT_CONFIG: LayoutConfig = {
  direction: 'TB',
  spacing: {
    nodeWidth: 200,
    nodeHeight: 100,
    horizontalGap: 60,
    verticalGap: 100,
    containerPadding: 50,
  },
  hierarchyLevels: {
    region: 0,
    vpc: 1,
    subnet: 2,
    resource: 3,
  },
};

/**
 * AWS Resource Hierarchy Levels
 * Defines the nesting structure of AWS resources
 */
export const AWS_HIERARCHY = {
  region: { level: 0, label: 'Region' },
  vpc: { level: 1, label: 'VPC' },
  subnet: { level: 2, label: 'Subnet' },
  securitygroup: { level: 2.5, label: 'Security Group' },
  ec2: { level: 3, label: 'EC2 Instance' },
  rds: { level: 3, label: 'RDS Database' },
  s3: { level: 3, label: 'S3 Bucket' },
  lambda: { level: 3, label: 'Lambda Function' },
  elasticache: { level: 3, label: 'ElastiCache Cluster' },
  dynamodb: { level: 3, label: 'DynamoDB Table' },
  sqs: { level: 3, label: 'SQS Queue' },
  sns: { level: 3, label: 'SNS Topic' },
  kinesis: { level: 3, label: 'Kinesis Stream' },
  internetgateway: { level: 1, label: 'Internet Gateway' },
  natgateway: { level: 2, label: 'NAT Gateway' },
  routetable: { level: 2, label: 'Route Table' },
  vpcendpoint: { level: 2, label: 'VPC Endpoint' },
  efs: { level: 3, label: 'EFS' },
  ebs: { level: 3, label: 'EBS Volume' },
  elb: { level: 2.5, label: 'Load Balancer' },
  apigateway: { level: 3, label: 'API Gateway' },
  cloudfront: { level: 1, label: 'CloudFront' },
  iam: { level: 0, label: 'IAM Role' },
} as const;

/**
 * Get hierarchy level for a resource type
 */
export const getHierarchyLevel = (resourceTypeId: string): number => {
  const key = resourceTypeId.toLowerCase() as keyof typeof AWS_HIERARCHY;
  return AWS_HIERARCHY[key]?.level ?? 3;
};

/**
 * Get hierarchy label for a resource type
 */
export const getHierarchyLabel = (resourceTypeId: string): string => {
  const key = resourceTypeId.toLowerCase() as keyof typeof AWS_HIERARCHY;
  return AWS_HIERARCHY[key]?.label ?? resourceTypeId;
};

/**
 * Hierarchical Layout Engine
 * Positions nodes based on AWS resource hierarchy (Region > VPC > Subnet > Resources)
 */
export class HierarchicalLayoutEngine {
  private config: LayoutConfig;
  private nodeMap: Map<string, Node>;
  private edgeMap: Map<string, Edge>;
  private parentChildMap: Map<string, string[]>;
  private childParentMap: Map<string, string>;
  private levelGroups: Map<number, string[]>;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.nodeMap = new Map();
    this.edgeMap = new Map();
    this.parentChildMap = new Map();
    this.childParentMap = new Map();
    this.levelGroups = new Map();
  }

  /**
   * Main layout method - positions all nodes
   */
  public layout(nodes: Node[], edges: Edge[]): Node[] {
    this.initializeDataStructures(nodes, edges);
    this.buildHierarchy(nodes);
    this.positionNodes(nodes);
    return nodes;
  }

  /**
   * Initialize internal data structures
   */
  private initializeDataStructures(nodes: Node[], edges: Edge[]): void {
    this.nodeMap.clear();
    this.edgeMap.clear();
    this.parentChildMap.clear();
    this.childParentMap.clear();
    this.levelGroups.clear();

    nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
    });

    edges.forEach((edge) => {
      this.edgeMap.set(edge.id, edge);
    });
  }

  /**
   * Build parent-child relationships based on containment and edges
   */
  private buildHierarchy(nodes: Node[]): void {
    nodes.forEach((node) => {
      const parentId = node.data?.parentId;
      const resourceType = node.data?.resourceType?.id?.toLowerCase();

      if (parentId && this.nodeMap.has(parentId)) {
        // Parent-child relationship via parentId
        const children = this.parentChildMap.get(parentId) || [];
        children.push(node.id);
        this.parentChildMap.set(parentId, children);
        this.childParentMap.set(node.id, parentId);
      }

      // Group by hierarchy level
      const level = getHierarchyLevel(resourceType);
      const group = this.levelGroups.get(level) || [];
      group.push(node.id);
      this.levelGroups.set(level, group);
    });
  }

  /**
   * Position nodes based on hierarchy
   */
  private positionNodes(nodes: Node[]): void {
    const rootNodes = nodes.filter(
      (node) => !this.childParentMap.has(node.id)
    );

    const config = this.config.spacing!;
    let currentY = config.containerPadding!;

    // Process by hierarchy level
    const sortedLevels = Array.from(this.levelGroups.keys()).sort((a, b) => a - b);

    for (const level of sortedLevels) {
      const levelNodes = this.levelGroups.get(level)!;
      const nodeIds = levelNodes.filter((id) => this.nodeMap.has(id));

      if (nodeIds.length === 0) continue;

      let currentX = config.containerPadding!;
      const levelHeight = config.nodeHeight! + config.verticalGap!;

      for (const nodeId of nodeIds) {
        const node = this.nodeMap.get(nodeId)!;
        const parent = this.childParentMap.get(nodeId);

        if (parent) {
          // Child nodes: position relative to parent
          const parentNode = this.nodeMap.get(parent)!;
          const children = this.parentChildMap.get(parent) || [];
          const childIndex = children.indexOf(nodeId);
          const childCount = children.length;

          const parentWidth = parentNode.width || config.nodeWidth!;
          const totalChildrenWidth =
            childCount * config.nodeWidth! + (childCount - 1) * config.horizontalGap!;

          const startX =
            parentNode.position.x +
            (parentWidth - totalChildrenWidth) / 2;

          node.position = {
            x: startX + childIndex * (config.nodeWidth! + config.horizontalGap!),
            y: parentNode.position.y + (parentNode.height || config.nodeHeight!) + config.verticalGap!,
          };
        } else {
          // Root/top-level nodes: position in grid
          node.position = {
            x: currentX,
            y: currentY,
          };
          currentX += config.nodeWidth! + config.horizontalGap!;
        }
      }

      currentY += levelHeight + config.verticalGap!;
    }

    // Update container sizes for nested nodes
    this.updateContainerSizes(nodes);
  }

  /**
   * Update container node sizes to fit their children
   */
  private updateContainerSizes(nodes: Node[]): void {
    const config = this.config.spacing!;

    // Process containers (regions, VPCs, subnets)
    const containers = nodes.filter(
      (node) => node.data?.isContainer
    );

    containers.forEach((container) => {
      const children = this.parentChildMap.get(container.id) || [];
      if (children.length === 0) return;

      const childNodes = children
        .map((id) => this.nodeMap.get(id))
        .filter((node) => node !== undefined) as Node[];

      if (childNodes.length === 0) return;

      // Calculate bounding box of children
      const minX = Math.min(...childNodes.map((n) => n.position.x));
      const maxX = Math.max(
        ...childNodes.map((n) => n.position.x + (n.width || this.config.spacing!.nodeWidth!))
      );
      const minY = Math.min(...childNodes.map((n) => n.position.y));
      const maxY = Math.max(
        ...childNodes.map((n) => n.position.y + (n.height || this.config.spacing!.nodeHeight!))
      );

      // Set container dimensions with padding
      container.width = maxX - minX + config.containerPadding! * 2;
      container.height = maxY - minY + config.containerPadding! * 2;

      // Calculate new container position
      const newContainerX = minX - config.containerPadding!;
      const newContainerY = minY - config.containerPadding!;

      // Adjust child positions to maintain proper spacing within container
      const offsetX = newContainerX - container.position.x;
      const offsetY = newContainerY - container.position.y;

      childNodes.forEach((child) => {
        child.position = {
          x: child.position.x + offsetX,
          y: child.position.y + offsetY,
        };
      });

      // Reposition container to encompass all children
      container.position = {
        x: newContainerX,
        y: newContainerY,
      };

      // Update size property for React Flow
      container.data = {
        ...container.data,
        size: {
          width: container.width,
          height: container.height,
        },
      };
    });
  }
}

/**
 * Grid Layout Engine
 * Positions nodes in a simple grid arrangement
 */
export class GridLayoutEngine {
  private config: LayoutConfig;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public layout(nodes: Node[]): Node[] {
    const config = this.config.spacing!;
    const nodesPerRow = 4;

    nodes.forEach((node, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;

      node.position = {
        x: col * (config.nodeWidth! + config.horizontalGap!),
        y: row * (config.nodeHeight! + config.verticalGap!),
      };
    });

    return nodes;
  }
}

/**
 * Force-Directed Layout Engine
 * Uses physics-based positioning for organic node arrangement
 */
export class ForceDirectedLayoutEngine {
  private config: LayoutConfig;
  private iterations = 50;
  private repulsiveForce = 100;
  private attractiveForce = 0.5;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public layout(nodes: Node[], edges: Edge[]): Node[] {
    // Initialize velocities
    const velocities: Map<string, { x: number; y: number }> = new Map();
    nodes.forEach((node) => {
      velocities.set(node.id, { x: 0, y: 0 });
    });

    // Run force simulation
    for (let iteration = 0; iteration < this.iterations; iteration++) {
      const forces: Map<string, { x: number; y: number }> = new Map();
      nodes.forEach((node) => {
        forces.set(node.id, { x: 0, y: 0 });
      });

      // Repulsive forces (between all nodes)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const force = this.repulsiveForce / (distance * distance);
          const fx = (force * dx) / distance;
          const fy = (force * dy) / distance;

          const forceA = forces.get(nodeA.id)!;
          const forceB = forces.get(nodeB.id)!;

          forceA.x -= fx;
          forceA.y -= fy;
          forceB.x += fx;
          forceB.y += fy;
        }
      }

      // Attractive forces (connected nodes)
      edges.forEach((edge) => {
        const nodeA = nodes.find((n) => n.id === edge.source);
        const nodeB = nodes.find((n) => n.id === edge.target);

        if (!nodeA || !nodeB) return;

        const dx = nodeB.position.x - nodeA.position.x;
        const dy = nodeB.position.y - nodeA.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        const force = this.attractiveForce * distance;
        const fx = (force * dx) / distance;
        const fy = (force * dy) / distance;

        const forceA = forces.get(nodeA.id)!;
        const forceB = forces.get(nodeB.id)!;

        forceA.x += fx;
        forceA.y += fy;
        forceB.x -= fx;
        forceB.y -= fy;
      });

      // Apply forces
      nodes.forEach((node) => {
        const velocity = velocities.get(node.id)!;
        const force = forces.get(node.id)!;

        velocity.x = velocity.x * 0.8 + force.x * 0.2;
        velocity.y = velocity.y * 0.8 + force.y * 0.2;

        node.position.x += velocity.x;
        node.position.y += velocity.y;
      });
    }

    return nodes;
  }
}

/**
 * Main layout function - applies appropriate layout based on AWS structure
 */
export function layoutAWSResources(
  nodes: Node[],
  edges: Edge[],
  strategy: 'hierarchical' | 'grid' | 'force' = 'hierarchical',
  config?: Partial<LayoutConfig>
): Node[] {
  let engine:
    | HierarchicalLayoutEngine
    | GridLayoutEngine
    | ForceDirectedLayoutEngine;

  switch (strategy) {
    case 'grid':
      engine = new GridLayoutEngine(config);
      return engine.layout(nodes);
    case 'force':
      engine = new ForceDirectedLayoutEngine(config);
      return engine.layout(nodes, edges);
    case 'hierarchical':
    default:
      engine = new HierarchicalLayoutEngine(config);
      return engine.layout(nodes, edges);
  }
}

/**
 * Utility function to check if layout is needed
 */
export function shouldApplyLayout(nodes: Node[]): boolean {
  // Check if nodes have meaningful positions or need layout
  const hasPositions = nodes.every((node) => node.position.x !== 0 && node.position.y !== 0);
  return !hasPositions || nodes.length > 1;
}
