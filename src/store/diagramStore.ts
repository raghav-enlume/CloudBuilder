import { create } from 'zustand';
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection } from 'reactflow';
import { ResourceType } from '@/types/diagram';
import { cloudResources } from '@/data/resources';

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

interface DiagramStore {
  nodes: Node[];
  edges: Edge[];
  selectedNode: string | null;
  history: HistoryState[];
  historyIndex: number;
  loadedSecurityGroups: Record<string, unknown>[];
  addNode: (resourceType: ResourceType, position: { x: number; y: number }, parentId?: string, isContainer?: boolean) => void;
  addTextLabel: (position: { x: number; y: number }, text?: string) => void;
  addIconNode: (position: { x: number; y: number }, iconName?: string) => void;
  updateNodes: (changes: NodeChange[]) => void;
  updateEdges: (changes: EdgeChange[]) => void;
  addEdge: (connection: Connection) => void;
  deleteEdge: (edgeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeAttribute: (nodeId: string, attributeKey: string, value: unknown) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  updateTextLabelStyle: (nodeId: string, fontSize?: number, fontWeight?: string, color?: string) => void;
  updateNodeSize: (nodeId: string, width: number, height: number) => void;
  cloneNode: (nodeId: string, offsetX?: number, offsetY?: number) => void;
  clearDiagram: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  loadDiagram: (nodes: Node[], edges: Edge[]) => void;
  setLoadedSecurityGroups: (groups: Record<string, unknown>[]) => void;
  saveHistory: () => void;
}

let nodeIdCounter = 0;

// Helper function to check if a node is a container/parent type
const isContainerNode = (node: any): boolean => {
  return node?.data?.isContainer || 
         node?.data?.resourceType?.id === 'autoscaling' ||
         node?.data?.resourceType?.id === 'vpc' ||
         node?.data?.resourceType?.id === 'subnet' ||
         node?.data?.resourceType?.id === 'region';
};

// Helper function to calculate nesting depth for a node
const calculateNestingDepth = (nodeId: string, allNodes: Node[]): number => {
  const node = allNodes.find((n) => n.id === nodeId);
  if (!node?.data?.parentId) {
    return 0;
  }
  return 1 + calculateNestingDepth(node.data.parentId, allNodes);
};

// Helper function to auto-detect parent nodes based on position
const autoDetectParents = (nodes: Node[]): Node[] => {
  return nodes.map((node) => {
    // Skip if already has a parent
    if (node.data?.parentId) {
      return node;
    }

    // Find all container nodes
    const containerNodes = nodes.filter((n) => isContainerNode(n));

    // Check if this node is inside any container node (prefer smallest/innermost)
    for (const parentNode of containerNodes.sort((a, b) => {
      const aSize = (a.data?.size?.width || 240) * (a.data?.size?.height || 72);
      const bSize = (b.data?.size?.width || 240) * (b.data?.size?.height || 72);
      return aSize - bSize; // Smaller first
    })) {
      const parentWidth = parentNode.data?.size?.width || 240;
      const parentHeight = parentNode.data?.size?.height || 72;
      const nodeWidth = node.data?.size?.width || 64;
      const nodeHeight = node.data?.size?.height || 64;

      // Check if node is within parent bounds (with padding tolerance)
      const padding = 15;
      if (
        node.position.x >= parentNode.position.x + padding &&
        node.position.x + nodeWidth <= parentNode.position.x + parentWidth - padding &&
        node.position.y >= parentNode.position.y + padding &&
        node.position.y + nodeHeight <= parentNode.position.y + parentHeight - padding &&
        node.id !== parentNode.id
      ) {
        return {
          ...node,
          data: {
            ...node.data,
            parentId: parentNode.id,
          },
        };
      }
    }

    return node;
  });
};

const saveStateToHistory = (state: DiagramStore) => {
  // Remove any redo history after current index
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  
  // Add new state to history
  newHistory.push({
    nodes: state.nodes,
    edges: state.edges,
  });

  return {
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const useDiagramStore = create<DiagramStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  history: [{ nodes: [], edges: [] }],
  historyIndex: 0,
  loadedSecurityGroups: [],

  addNode: (resourceType, position, parentId, isContainer = false) => {
    set((state) => {
      // Auto-detect container types for VPC, Subnet (Security Groups are not containers)
      const shouldBeContainer = isContainer || resourceType.id === 'vpc' || resourceType.id === 'subnet';
      
      let size = undefined;
      
      if (shouldBeContainer) {
        // Container nodes have fixed sizes
        if (resourceType.id === 'region') {
          size = { width: 1000, height: 700 };
        } else if (resourceType.id === 'vpc') {
          size = { width: 700, height: 500 };
        } else if (resourceType.id === 'subnet') {
          size = { width: 450, height: 300 };
        }
      } else if (resourceType?.id === 'autoscaling') {
        // default size only for autoscaling to make it visible
        size = { width: 240, height: 72 };
      } else if (resourceType?.id === 'securitygroup') {
        // Security groups are floating elements, not containers
        size = { width: 200, height: 100 };
      }
      
      const currentPosition = position;
      let currentParentId = parentId;
      let newNodes = [...state.nodes];
      const padding = 20;

      // Define parent containers for each resource type
      const parentContainerMap: Record<string, string> = {
        vpc: 'region',
        subnet: 'vpc',
      };

      const containerSizes: Record<string, { width: number; height: number }> = {
        region: { width: 1000, height: 700 },
        vpc: { width: 700, height: 500 },
        subnet: { width: 450, height: 300 },
      };

      // Auto-create parent containers if needed
      if (!isContainer && (resourceType.id === 'vpc' || resourceType.id === 'subnet')) {
        const parentContainerType = parentContainerMap[resourceType.id];
        
        if (parentContainerType) {
          // Check if parent container already exists
          const existingParent = newNodes.find(
            (n) => n.data?.resourceType?.id === parentContainerType && n.data?.isContainer
          );

          if (!existingParent) {
            // Find the parent resource definition
            const parentResource = cloudResources.find((r) => r.id === parentContainerType);
            
            if (parentResource) {
              const containerSize = containerSizes[parentContainerType] || { width: 600, height: 400 };
              const parentPosition = {
                x: position.x - containerSize.width - padding,
                y: position.y - padding,
              };

              const parentNode: Node = {
                id: `node-${++nodeIdCounter}`,
                type: 'resourceNode',
                position: parentPosition,
                data: {
                  label: parentResource.name,
                  resourceType: parentResource,
                  parentId: currentParentId,
                  isContainer: true,
                  size: containerSize,
                },
              };

              newNodes = [...newNodes, parentNode];
              currentParentId = parentNode.id;
            }
          } else {
            // Use existing parent
            currentParentId = existingParent.id;
          }
        }
      }

      const newNode: Node = {
        id: `node-${++nodeIdCounter}`,
        type: 'resourceNode',
        position: currentPosition,
        data: {
          label: resourceType.name,
          resourceType,
          parentId: currentParentId,
          isContainer: shouldBeContainer,
          size,
          nestingDepth: 0, // Will be calculated after node is added
        },
      };

      newNodes = [...newNodes, newNode];
      
      // Calculate nesting depth for all nodes
      newNodes = newNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          nestingDepth: calculateNestingDepth(node.id, newNodes),
        },
      }));

      const newState = {
        nodes: newNodes,
        edges: state.edges,
        selectedNode: state.selectedNode,
      };
      
      const historyUpdate = saveStateToHistory({
        ...state,
        ...newState,
      });

      return {
        ...newState,
        ...historyUpdate,
      };
    });
  },

  addTextLabel: (position, text = 'Double click to edit') => {
    set((state) => {
      const newNode: Node = {
        id: `text-${++nodeIdCounter}`,
        type: 'textLabel',
        position,
        data: {
          text,
          fontSize: 14,
          fontWeight: '400',
          color: '#000000',
          textAlign: 'left',
        },
      };

      const newNodes = [...state.nodes, newNode];
      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: newNodes,
      });

      return {
        nodes: newNodes,
        selectedNode: newNode.id,
        ...historyUpdate,
      };
    });
  },

  addIconNode: (position, iconName = 'address-card') => {
    set((state) => {
      const newNode: Node = {
        id: `icon-${++nodeIdCounter}`,
        type: 'iconNode',
        position,
        data: {
          iconName,
          iconSet: 'font-awesome',
          size: 48,
          color: '#000000',
          background: 'none',
        },
      };

      const newNodes = [...state.nodes, newNode];
      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: newNodes,
      });

      return {
        nodes: newNodes,
        selectedNode: newNode.id,
        ...historyUpdate,
      };
    });
  },

  updateNodes: (changes) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      
      // Calculate movement for each node
      const nodeMovementMap: Record<string, { dx: number; dy: number }> = {};
      const directlyMovedNodeIds = new Set<string>();
      
      for (const updatedNode of updatedNodes) {
        const originalNode = state.nodes.find((n) => n.id === updatedNode.id);
        if (originalNode) {
          const dx = updatedNode.position.x - originalNode.position.x;
          const dy = updatedNode.position.y - originalNode.position.y;
          
          // Only track if node actually moved
          if (dx !== 0 || dy !== 0) {
            nodeMovementMap[updatedNode.id] = { dx, dy };
            directlyMovedNodeIds.add(updatedNode.id);
          }
        }
      }
      
      // Apply cascading movement to all nodes (including containers) when parent moves
      const nodesAfterParentMovement = updatedNodes.map((node) => {
        // Check if this node or any ancestor moved directly
        let currentParentId = node.data?.parentId;
        let totalDx = 0;
        let totalDy = 0;
        
        while (currentParentId) {
          if (nodeMovementMap[currentParentId]) {
            const { dx, dy } = nodeMovementMap[currentParentId];
            totalDx += dx;
            totalDy += dy;
          }
          
          // Move up the hierarchy
          const parentNode = updatedNodes.find((n) => n.id === currentParentId);
          currentParentId = parentNode?.data?.parentId;
        }
        
        // If any ancestor moved, move this node accordingly
        if (totalDx !== 0 || totalDy !== 0) {
          return {
            ...node,
            position: {
              x: node.position.x + totalDx,
              y: node.position.y + totalDy,
            },
          };
        }
        
        return node;
      });
      
      // Update parent relationships for all nodes that were directly moved
      const finalNodes = nodesAfterParentMovement.map((node) => {
        // If this node was directly moved (not as a child), check if it's inside a parent
        const wasDirectlyMoved = directlyMovedNodeIds.has(node.id);
        
        if (wasDirectlyMoved) {
          // Find all container nodes that could be parents (excluding this node)
          const parentCandidates = nodesAfterParentMovement.filter(
            (n) => isContainerNode(n) && n.id !== node.id
          );
          
          let newParentId: string | undefined;
          
          // Check each potential parent (prefer smallest/innermost)
          for (const parentNode of parentCandidates.sort((a, b) => {
            const aSize = (a.data?.size?.width || 240) * (a.data?.size?.height || 72);
            const bSize = (b.data?.size?.width || 240) * (b.data?.size?.height || 72);
            return aSize - bSize; // Smaller first
          })) {
            const parentWidth = parentNode.data?.size?.width || 240;
            const parentHeight = parentNode.data?.size?.height || 72;
            const nodeWidth = node.data?.size?.width || 64;
            const nodeHeight = node.data?.size?.height || 64;
            
            // Check if node is within parent bounds (with padding)
            const padding = 15;
            if (
              node.position.x >= parentNode.position.x + padding &&
              node.position.x + nodeWidth <= parentNode.position.x + parentWidth - padding &&
              node.position.y >= parentNode.position.y + padding &&
              node.position.y + nodeHeight <= parentNode.position.y + parentHeight - padding
            ) {
              newParentId = parentNode.id;
              break;
            }
          }
          
          // Update parentId if it changed
          if (newParentId !== node.data?.parentId) {
            return {
              ...node,
              data: {
                ...node.data,
                parentId: newParentId,
              },
            };
          }
        }
        
        return node;
      });
      
      // Calculate nesting depth for each node to fix z-index layering
      const nodesWithDepth = finalNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          nestingDepth: calculateNestingDepth(node.id, finalNodes),
        },
      }));
      
      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: nodesWithDepth,
      });

      return {
        nodes: nodesWithDepth,
        ...historyUpdate,
      };
    });
  },

  updateEdges: (changes) => {
    set((state) => {
      const updatedEdges = applyEdgeChanges(changes, state.edges);
      
      const historyUpdate = saveStateToHistory({
        ...state,
        edges: updatedEdges,
      });

      return {
        edges: updatedEdges,
        ...historyUpdate,
      };
    });
  },

  addEdge: (connection) => {
    const newEdge = {
      ...connection,
      id: `edge-${Date.now()}`,
      type: 'smoothstep',
      animated: false,
      style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 1.0 },
      markerEnd: { type: 'arrowclosed' as any },
    };

    set((state) => {
      const updatedEdges = addEdge(newEdge, state.edges);
      
      const historyUpdate = saveStateToHistory({
        ...state,
        edges: updatedEdges,
      });

      return {
        edges: updatedEdges,
        ...historyUpdate,
      };
    });
  },

  deleteEdge: (edgeId) => {
    set((state) => {
      const updatedEdges = state.edges.filter((edge) => edge.id !== edgeId);
      
      const historyUpdate = saveStateToHistory({
        ...state,
        edges: updatedEdges,
      });

      return {
        edges: updatedEdges,
        ...historyUpdate,
      };
    });
  },

  setSelectedNode: (nodeId) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId ? { ...node, selected: true } : { ...node, selected: false }
      );

      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: updatedNodes,
        selectedNode: nodeId,
      });

      return {
        nodes: updatedNodes,
        selectedNode: nodeId,
        ...historyUpdate,
      };
    });
  },

  deleteNode: (nodeId) => {
    set((state) => {
      // Get all child nodes that should also be deleted
      const childNodeIds = state.nodes
        .filter((node) => node.data?.parentId === nodeId)
        .map((node) => node.id);
      
      const nodeIdsToDelete = [nodeId, ...childNodeIds];
      
      const newState = {
        nodes: state.nodes.filter((node) => !nodeIdsToDelete.includes(node.id)),
        edges: state.edges.filter(
          (edge) => !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target)
        ),
        selectedNode: state.selectedNode === nodeId ? null : state.selectedNode,
      };

      const historyUpdate = saveStateToHistory({
        ...state,
        ...newState,
      });

      return {
        ...newState,
        ...historyUpdate,
      };
    });
  },

  updateNodeLabel: (nodeId, label) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label } }
          : node
      );

      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: updatedNodes,
      });

      return {
        nodes: updatedNodes,
        ...historyUpdate,
      };
    });
  },

  updateNodeAttribute: (nodeId, attributeKey, value) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config: {
                  ...node.data.config,
                  [attributeKey]: value,
                },
              },
            }
          : node
      );

      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: updatedNodes,
      });

      return {
        nodes: updatedNodes,
        ...historyUpdate,
      };
    });
  },

  updateNodeData: (nodeId, data) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            }
          : node
      );

      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: updatedNodes,
      });

      return {
        nodes: updatedNodes,
        ...historyUpdate,
      };
    });
  },

  updateNodeSize: (nodeId, width, height) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, size: { width, height } } }
          : node
      );

      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: updatedNodes,
      });

      return {
        nodes: updatedNodes,
        ...historyUpdate,
      };
    });
  },

  updateTextLabelStyle: (nodeId, fontSize, fontWeight, color) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...(fontSize !== undefined && { fontSize }),
                ...(fontWeight !== undefined && { fontWeight }),
                ...(color !== undefined && { color }),
              },
            }
          : node
      );

      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: updatedNodes,
      });

      return {
        nodes: updatedNodes,
        ...historyUpdate,
      };
    });
  },

  cloneNode: (nodeId, offsetX = 20, offsetY = 20) => {
    set((state) => {
      const nodeToClone = state.nodes.find((n) => n.id === nodeId);
      if (!nodeToClone) return state;

      // Map of old node IDs to new node IDs
      const idMap = new Map<string, string>();

      // Get all children of the node being cloned
      const getChildren = (parentId: string): Node[] => {
        return state.nodes.filter((n) => n.data?.parentId === parentId);
      };

      // Recursively collect all nodes to clone (node and all descendants)
      const nodesToClone: Node[] = [];
      const edgesToClone: Edge[] = [];
      
      const collectNodes = (node: Node) => {
        nodesToClone.push(node);
        const children = getChildren(node.id);
        children.forEach(collectNodes);
      };

      collectNodes(nodeToClone);

      // Collect edges between cloned nodes
      edgesToClone.push(
        ...state.edges.filter((edge) => {
          const sourceIsCloned = nodesToClone.some((n) => n.id === edge.source);
          const targetIsCloned = nodesToClone.some((n) => n.id === edge.target);
          return sourceIsCloned && targetIsCloned;
        })
      );

      // Create cloned nodes with new IDs and adjusted positions
      const clonedNodes = nodesToClone.map((node) => {
        const newId = `node-${++nodeIdCounter}`;
        idMap.set(node.id, newId);

        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY,
          },
          data: {
            ...node.data,
            // Update parent ID if it's one of the cloned nodes
            parentId: node.data?.parentId && idMap.has(node.data.parentId)
              ? idMap.get(node.data.parentId)!
              : node.data?.parentId,
          },
        };
      });

      // Create cloned edges with new node IDs
      const clonedEdges = edgesToClone.map((edge) => ({
        ...edge,
        id: `edge-${Math.random().toString(36).substr(2, 9)}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
      }));

      const newNodes = [...state.nodes, ...clonedNodes];
      const newEdges = [...state.edges, ...clonedEdges];

      // Calculate nesting depth for all new nodes
      const updatedNodes = newNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          nestingDepth: calculateNestingDepth(node.id, newNodes),
        },
      }));

      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: updatedNodes,
        edges: newEdges,
      });

      return {
        nodes: updatedNodes,
        edges: newEdges,
        ...historyUpdate,
      };
    });
  },

  clearDiagram: () => {
    set((state) => {
      const historyUpdate = saveStateToHistory({
        ...state,
        nodes: [],
        edges: [],
        selectedNode: null,
      });

      nodeIdCounter = 0;

      return {
        nodes: [],
        edges: [],
        selectedNode: null,
        ...historyUpdate,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const newIndex = state.historyIndex - 1;
      const previousState = state.history[newIndex];

      return {
        nodes: previousState.nodes,
        edges: previousState.edges,
        historyIndex: newIndex,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const newIndex = state.historyIndex + 1;
      const nextState = state.history[newIndex];

      return {
        nodes: nextState.nodes,
        edges: nextState.edges,
        historyIndex: newIndex,
      };
    });
  },

  canUndo: () => {
    const state = get();
    return state.historyIndex > 0;
  },

  canRedo: () => {
    const state = get();
    return state.historyIndex < state.history.length - 1;
  },

  loadDiagram: (nodes, edges) => {
    set((state) => {
      // Ensure security groups are never containers (AWS standards)
      const sanitizedNodes = nodes.map(node => {
        if (node.data?.resourceType?.id === 'securitygroup') {
          return {
            ...node,
            data: {
              ...node.data,
              isContainer: false, // Security groups are floating elements, not containers
            },
          };
        }
        return node;
      });

      // Auto-detect parent relationships based on node positions
      const nodesWithParents = autoDetectParents(sanitizedNodes);

      const newState = {
        nodes: nodesWithParents,
        edges,
        selectedNode: null,
      };

      const historyUpdate = saveStateToHistory({
        ...state,
        ...newState,
      });

      // Update node counter based on loaded nodes
      const maxId = Math.max(
        0,
        ...nodes.map((n) => {
          const match = n.id.match(/node-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
      );
      nodeIdCounter = maxId;

      return {
        ...newState,
        ...historyUpdate,
      };
    });
  },

  saveHistory: () => {
    set((state) => saveStateToHistory(state));
  },

  setLoadedSecurityGroups: (groups: any[]) => {
    set({ loadedSecurityGroups: groups });
  },
}));
