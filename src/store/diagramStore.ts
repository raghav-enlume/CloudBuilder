import { create } from 'zustand';
import { Node, Edge, addEdge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Connection } from 'reactflow';
import { ResourceType } from '@/types/diagram';

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
  addNode: (resourceType: ResourceType, position: { x: number; y: number }) => void;
  updateNodes: (changes: NodeChange[]) => void;
  updateEdges: (changes: EdgeChange[]) => void;
  addEdge: (connection: Connection) => void;
  setSelectedNode: (nodeId: string | null) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeAttribute: (nodeId: string, attributeKey: string, value: unknown) => void;
  clearDiagram: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  loadDiagram: (nodes: Node[], edges: Edge[]) => void;
  saveHistory: () => void;
}

let nodeIdCounter = 0;

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

  addNode: (resourceType, position) => {
    const newNode: Node = {
      id: `node-${++nodeIdCounter}`,
      type: 'resourceNode',
      position,
      data: {
        label: resourceType.name,
        resourceType,
      },
    };

    set((state) => {
      const newState = {
        nodes: [...state.nodes, newNode],
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

  updateNodes: (changes) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.nodes);
      
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
      animated: true,
      style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
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

  setSelectedNode: (nodeId) => {
    set({ selectedNode: nodeId });
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const newState = {
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
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
      const newState = {
        nodes,
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
}));
