import { memo, useRef, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Trash2, Copy } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';

const GroupNode = memo(({ id, data, selected }: NodeProps) => {
  const { label } = data;
  const { deleteNode, updateNodeLabel, setSelectedNode, updateNodeSize, cloneNode } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  
  // Initialize all refs at the top level (before any conditional renders)
  const resizing = useRef(false);
  const dirRef = useRef<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startW = useRef(0);
  const startH = useRef(0);
  
  // Handle both old string format and new object format for resourceType
  const resourceType = data.resourceType;
  let color = typeof resourceType === 'object' ? resourceType?.color : '#FF9900';
  
  // Use specific colors for different resource types
  if (id.startsWith('vpc-')) {
    color = '#FFA000';
  } else if (id.startsWith('subnet-')) {
    color = '#455A64';
  }

  // Resize handler for container nodes
  const handlePointerDown = (e: React.PointerEvent, dir: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    resizing.current = true;
    dirRef.current = dir;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startW.current = data?.size?.width ?? 600;
    startH.current = data?.size?.height ?? 400;

    const onPointerMove = (ev: PointerEvent) => {
      if (!resizing.current || !dirRef.current) return;
      const dx = ev.clientX - startX.current;
      const dy = ev.clientY - startY.current;
      let newW = startW.current;
      let newH = startH.current;
      const MIN = 100;
      const MAX = 1200;

      if (dirRef.current === 'right') {
        newW = Math.min(MAX, Math.max(MIN, Math.round(startW.current + dx)));
      } else if (dirRef.current === 'left') {
        newW = Math.min(MAX, Math.max(MIN, Math.round(startW.current - dx)));
      } else if (dirRef.current === 'bottom') {
        newH = Math.min(MAX, Math.max(MIN, Math.round(startH.current + dy)));
      } else if (dirRef.current === 'top') {
        newH = Math.min(MAX, Math.max(MIN, Math.round(startH.current - dy)));
      }

      updateNodeSize(id, newW, newH);
    };

    const onPointerUp = (ev: PointerEvent) => {
      resizing.current = false;
      dirRef.current = null;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const width = data?.size?.width ?? 600;
  const height = data?.size?.height ?? 400;
  
  return (
    <div
      data-isContainer="true"
      style={{
        width,
        height,
        position: 'relative',
        boxSizing: 'border-box',
        zIndex: -1,
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        // Only select container if clicking on the border (outer 3px)
        const target = e.target as HTMLElement;
        
        // Don't intercept clicks on child nodes or interactive elements
        if (target === e.currentTarget) {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          const relX = e.clientX - rect.left;
          const relY = e.clientY - rect.top;
          
          // Check if click is within 3px of any border
          const borderSize = 3;
          if (
            relX < borderSize || 
            relX > width - borderSize || 
            relY < borderSize || 
            relY > height - borderSize
          ) {
            setSelectedNode(id);
            e.stopPropagation();
          }
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        // This will be handled by the parent context menu if needed
        // For now, the delete button in the UI handles container deletion
      }}
    >
      {/* Clickable background layer - don't capture hover events */}
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          width: '100%',
          height: '100%',
          border: `3px solid ${color}`,
          borderRadius: '4px',
          backgroundColor: selected ? `${color}20` : 'transparent',
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: selected ? `0 0 0 3px ${color}40, inset 0 0 10px ${color}20` : 'none',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {/* Content area - allows children to be clickable */}
      <div
        style={{
          padding: '8px',
          width: '100%',
          height: '100%',
          position: 'relative',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {/* Placeholder for children rendered by ReactFlow */}
      </div>

      {/* Label at top-left */}
      <div
        className="absolute -top-6 left-2 font-semibold text-sm"
        style={{ color, pointerEvents: 'auto', zIndex: 20 }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-2 py-1 text-xs bg-secondary rounded border border-input focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateNodeLabel(id, editValue);
                setIsEditing(false);
              }
              if (e.key === 'Escape') {
                setEditValue(label);
                setIsEditing(false);
              }
            }}
          />
        ) : (
          <span
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {label}
          </span>
        )}
      </div>

      {/* Actions at top-right - only show on selected */}
      {selected && (
        <div 
          className="absolute -top-8 -right-2 flex gap-1 transition-opacity"
          style={{ 
            pointerEvents: 'auto', 
            zIndex: 20,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              cloneNode(id);
            }}
            className="p-1 rounded-full bg-secondary shadow-md border border-border hover:bg-blue-500 hover:text-blue-foreground transition-colors"
            title="Clone this container and all its children"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            className="p-1 rounded-full bg-secondary shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Handles for connections - hidden for containers */}

      {/* Resize handles for containers */}
      {selected && (
        <>
          {/* Top handle */}
          <div
            data-noDrag
            className="absolute left-1/2 -translate-x-1/2 -top-1 cursor-ns-resize z-50"
            style={{ pointerEvents: 'auto' }}
            onPointerDown={(e) => handlePointerDown(e, 'top')}
          >
            <div className="w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md" />
          </div>

          {/* Right handle */}
          <div
            data-noDrag
            className="absolute -right-1 top-1/2 -translate-y-1/2 cursor-ew-resize z-50"
            style={{ pointerEvents: 'auto' }}
            onPointerDown={(e) => handlePointerDown(e, 'right')}
          >
            <div className="w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md" />
          </div>

          {/* Bottom handle */}
          <div
            data-noDrag
            className="absolute left-1/2 -translate-x-1/2 -bottom-1 cursor-ns-resize z-50"
            style={{ pointerEvents: 'auto' }}
            onPointerDown={(e) => handlePointerDown(e, 'bottom')}
          >
            <div className="w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md" />
          </div>

          {/* Left handle */}
          <div
            data-noDrag
            className="absolute -left-1 top-1/2 -translate-y-1/2 cursor-ew-resize z-50"
            style={{ pointerEvents: 'auto' }}
            onPointerDown={(e) => handlePointerDown(e, 'left')}
          >
            <div className="w-4 h-4 bg-white border-2 border-primary rounded-full shadow-md" />
          </div>
        </>
      )}
    </div>
  );
});

GroupNode.displayName = 'GroupNode';

export default GroupNode;
