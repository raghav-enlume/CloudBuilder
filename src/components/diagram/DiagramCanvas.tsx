import { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
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
  const { nodes, edges, updateNodes, updateEdges, addEdge, setSelectedNode } = useDiagramStore();
  const { screenToFlowPosition } = useReactFlow();

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

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
  }, [setSelectedNode]);

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
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed' as any },
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
    </div>
  );
};

export const DiagramCanvas = () => {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner />
    </ReactFlowProvider>
  );
};
