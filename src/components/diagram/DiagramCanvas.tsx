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
import GroupNode1 from './GroupNode1';
import { TopPropertiesBar } from './TopPropertiesBar';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  resource: ResourceNode,
  resourceNode: ResourceNode,
  textLabel: TextLabel,
  iconNode: IconNode,
  group: GroupNode1,
};

const DiagramCanvasInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes: storeNodes, edges, updateNodes, updateEdges, addEdge, setSelectedNode, selectedNode, deleteEdge, deleteNode } = useDiagramStore();
  const { screenToFlowPosition, fitView } = useReactFlow();
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

  // Listen for fitView event from page load
  useEffect(() => {
    const handleFitViewOnLoad = () => {
      console.log('fitViewOnLoad event received, calling fitView');
      setTimeout(() => {
        fitView({ padding: 0.15, minZoom: 0.05, maxZoom: 1 });
        console.log('fitView called');
      }, 300);
    };
    
    window.addEventListener('fitViewOnLoad', handleFitViewOnLoad);
    return () => window.removeEventListener('fitViewOnLoad', handleFitViewOnLoad);
  }, [fitView]);

  // Listen for layout applied event
  useEffect(() => {
    const handleLayoutApplied = () => {
      console.log('Layout applied, fitting view');
      setTimeout(() => {
        fitView({ padding: 0.15, minZoom: 0.05, maxZoom: 1 });
      }, 100);
    };
    
    window.addEventListener('layoutApplied', handleLayoutApplied);
    return () => window.removeEventListener('layoutApplied', handleLayoutApplied);
  }, [fitView]);

  // Ensure edges always appear on top of all layers and receive events
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-flow__edge {
        z-index: -1 !important;
        pointer-events: auto !important;
      }
      .react-flow__edge-path {
        z-index: -1 !important;
        pointer-events: auto !important;
      }
      .react-flow__edge-background {
        z-index: -1 !important;
        pointer-events: auto !important;
      }
      .react-flow__edge-label {
        z-index: 10000 !important;
        pointer-events: auto !important;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        background-color: transparent;
        padding: 3px 6px;
        border-radius: 3px;
        font-size: 8px;
        font-weight: 500;
        color: #000;
        border: 1px solid rgba(0, 0, 0, 0.1);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }
      .react-flow__edge:hover .react-flow__edge-label {
        opacity: 1;
      }
      .react-flow__edge-text{
        font-size: 8px;
      }
      .react-flow__edge-textbg {
        fill: white;
        opacity: 0.5;
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
        z-index: 1 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Enhanced edges with better arrow markers and hover effects
  const enhancedEdges = useMemo(() => {
    return edges.map((edge: any) => {
      const connectionType = edge.data?.connectionType || 'default';
      const isHovered = hoveredEdgeId === edge.id;

      // Dynamic styling based on connection type
      const getEdgeColor = (type: string) => {
        const colors = {
          internet: '#2196F3',
          loadbalancer: '#8C4FFF',
          targetgroup: '#FF6B35',
          database: '#4CAF50',
          routing: '#757575',
          vpcendpoint: '#00ACC1',
          security: '#F44336',
          default: '#2196F3',
        };
        return colors[type as keyof typeof colors] || colors.default;
      };

      const baseColor = getEdgeColor(connectionType);
      const hoverColor = baseColor;

      return {
        ...edge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 12,
          height: 12,
          color: isHovered ? hoverColor : baseColor,
        },
        style: {
          ...edge.style,
          stroke: isHovered ? hoverColor : baseColor,
          strokeWidth: isHovered ? (edge.style?.strokeWidth || 1.0) + 0.5 : edge.style?.strokeWidth || 1.0,
          filter: isHovered ? `drop-shadow(0 0 6px ${baseColor}40)` : edge.style?.filter,
          transition: 'all 0.2s ease-in-out',
        },
        animated: connectionType === 'internet', // Animate internet connections
      };
    });
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
          // animated: false,
          // style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
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
