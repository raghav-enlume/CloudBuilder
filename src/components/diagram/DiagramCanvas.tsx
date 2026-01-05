import { useCallback, useRef, useState, useMemo } from 'react';
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
import { TopPropertiesBar } from './TopPropertiesBar';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  resourceNode: ResourceNode,
};

const DiagramCanvasInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, updateNodes, updateEdges, addEdge, setSelectedNode, deleteEdge } = useDiagramStore();
  const { screenToFlowPosition } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; edgeId: string } | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  // Enhanced edges with better arrow markers
  const enhancedEdges = useMemo(() => {
    return edges.map((edge: any) => ({
      ...edge,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'hsl(210, 100%, 50%)',
      },
      style: {
        stroke: 'hsl(210, 100%, 50%)',
        strokeWidth: 2.5,
      },
    }));
  }, [edges]);

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
      event.preventDefault();
      setContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
    },
    []
  );

  const handleDeleteEdge = useCallback(() => {
    if (contextMenu) {
      deleteEdge(contextMenu.edgeId);
      setContextMenu(null);
    }
  }, [contextMenu, deleteEdge]);

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
        nodeTypes={nodeTypes}
        fitView
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

      {/* Context Menu for Edges */}
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
            <button
              onClick={handleDeleteEdge}
              className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-secondary transition-colors"
            >
              Delete Connection
            </button>
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
