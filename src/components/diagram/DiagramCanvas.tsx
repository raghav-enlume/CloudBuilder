import { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDroppable } from '@dnd-kit/core';
import { useDiagramStore } from '@/store/diagramStore';
import ResourceNode from './ResourceNode';
import TextLabel from './TextLabel';
import { IconNode } from './IconNode';
import { TopPropertiesBar } from './TopPropertiesBar';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  resourceNode: ResourceNode,
  textLabel: TextLabel,
  iconNode: IconNode,
};

const DiagramCanvasInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes: storeNodes, edges, updateNodes, updateEdges, addEdge, setSelectedNode, selectedNode, deleteEdge, deleteNode } = useDiagramStore();
  const { screenToFlowPosition } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; edgeId?: string; nodeId?: string } | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Compute nodes with selected property based on store's selectedNode
  const nodes = useMemo(() => {
    return storeNodes.map((node) => ({
      ...node,
      selected: node.id === selectedNode,
    }));
  }, [storeNodes, selectedNode]);

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  // Ensure edges always appear on top of all layers and receive events
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-flow__edge {
        z-index: 10000 !important;
        pointer-events: auto !important;
      }
      .react-flow__edge-path {
        z-index: 10000 !important;
        pointer-events: auto !important;
      }
      .react-flow__edge-background {
        z-index: 10000 !important;
        pointer-events: auto !important;
      }
      .react-flow__edge-label {
        z-index: 10000 !important;
        pointer-events: auto !important;
      }
      .react-flow__node {
        z-index: -1 !important;
      }
      .react-flow__node-resourceNode {
        z-index: -1 !important;
      }
      .react-flow__node-resourceNode[data-isContainer="true"] {
        z-index: -1 !important;
      }
      .nopan {
        z-index: -1 !important;
      }
      .selectable {
        z-index: -1 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Enhanced edges with better arrow markers and hover effects
  const enhancedEdges = useMemo(() => {
    return edges.map((edge: any) => ({
      ...edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: hoveredEdgeId === edge.id ? '#000000' : '#000000',
      },
      style: {
        stroke: hoveredEdgeId === edge.id ? '#000000' : '#000000',
        strokeWidth: hoveredEdgeId === edge.id ? 1.5 : 1,
      },
    }));
  }, [edges, hoveredEdgeId]);

  const onNodesChange = useCallback(
    (changes: any) => {
      updateNodes(changes);
    },
    [updateNodes]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      updateEdges(changes);
    },
    [updateEdges]
  );

  const onConnect = useCallback(
    (connection: any) => {
      addEdge(connection);
    },
    [addEdge]
  );

  const onNodeClick = useCallback(
    (_: any, node: any) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setContextMenu(null);
  }, [setSelectedNode]);

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: any) => {
      console.log('Edge context menu:', edge);
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
    },
    []
  );

  const onEdgeMouseEnter = useCallback(
    (_: any, edge: any) => {
      setHoveredEdgeId(edge.id);
    },
    []
  );

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdgeId(null);
  }, []);

  const handleDeleteEdge = useCallback(() => {
    if (contextMenu?.edgeId) {
      deleteEdge(contextMenu.edgeId);
      setContextMenu(null);
    }
  }, [contextMenu, deleteEdge]);

  const handleDeleteNode = useCallback(() => {
    if (contextMenu?.nodeId) {
      deleteNode(contextMenu.nodeId);
      setContextMenu(null);
    }
  }, [contextMenu, deleteNode]);

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        (reactFlowWrapper as any).current = el;
      }}
      className={cn(
        'flex-1 h-full transition-colors duration-200 relative',
        isOver && 'ring-2 ring-primary ring-inset'
      )}
    >
      <ReactFlow
        nodes={nodes}
        edges={enhancedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onEdgeContextMenu={onEdgeContextMenu}
        onEdgeMouseEnter={onEdgeMouseEnter}
        onEdgeMouseLeave={onEdgeMouseLeave}
        nodeTypes={nodeTypes}
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(210, 100%, 50%)',
          },
        }}
        proOptions={{ hideAttribution: true }}
        className="canvas-grid"
      >
        <Background
          color="hsl(220, 15%, 85%)"
          gap={20}
          size={1}
        />
        <Controls
          className="!bg-card !border-border !shadow-md [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground hover:[&>button]:!bg-secondary"
        />
        <MiniMap
          nodeColor={(node) => node.data?.resourceType?.color || '#888'}
          maskColor="hsl(220, 25%, 10%, 0.8)"
          className="!bg-card !border-border !shadow-md"
        />
      </ReactFlow>
      
      {/* Top Properties Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <TopPropertiesBar />
      </div>

      {/* Context Menu for Edges and Nodes */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="fixed bg-card border border-border rounded-md shadow-lg py-1 z-50"
            style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          >
            {contextMenu.edgeId && (
              <button
                onClick={handleDeleteEdge}
                className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-secondary transition-colors"
              >
                Delete Connection
              </button>
            )}
            {contextMenu.nodeId && (
              <button
                onClick={handleDeleteNode}
                className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-secondary transition-colors"
              >
                Delete Container
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export const DiagramCanvasWrapper = () => {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner />
    </ReactFlowProvider>
  );
};
