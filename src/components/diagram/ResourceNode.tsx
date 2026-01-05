import { memo, useRef, useState } from 'react';
import { Handle, Position, NodeProps, NodeLabel } from 'reactflow';
import { Trash2, Pencil, Check, X, Cloud, Network, Server, Shield } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { getIconComponent } from '@/lib/iconMapper';
import { cn } from '@/lib/utils';

const ResourceNode = memo(({ id, data, selected }: NodeProps) => {
  const { resourceType, label, isContainer } = data;
  const { deleteNode, updateNodeLabel, setSelectedNode, updateNodeSize } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(label);
  
  // Handle both old string format and new object format for resourceType
  const iconId = typeof resourceType === 'object' ? resourceType?.icon : resourceType;
  const color = typeof resourceType === 'object' ? resourceType?.color : '#FF9900';
  const IconComponent = getIconComponent(iconId);

  // Container node rendering
  if (isContainer) {
    const width = data?.size?.width ?? 600;
    const height = data?.size?.height ?? 400;
    
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setSelectedNode(id)}
        style={{
          width,
          height,
          border: `3px solid ${color}`,
          borderRadius: '4px',
          backgroundColor: selected ? `${color}20` : isHovered ? `${color}12` : `${color}08`,
          padding: '8px',
          position: 'relative',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: selected ? `0 0 0 3px ${color}40, inset 0 0 10px ${color}20` : isHovered ? `0 0 0 2px ${color}30` : 'none',
          zIndex: data?.parentId ? 10 : 5,
        }}
      >
        {/* Icon in center */}
        {IconComponent && (
          <div 
            style={{ 
              color, 
              opacity: selected ? 0.5 : isHovered ? 0.4 : 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s ease',
            }}
          >
            <IconComponent size={50} />
          </div>
        )}

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

        {/* Actions at top-right */}
        <div className="absolute -top-8 -right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity" style={{ pointerEvents: 'auto', zIndex: 20 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 rounded-full bg-secondary shadow-md border border-border hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Pencil className="w-3 h-3" />
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

        {/* Handles for connections */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !bg-primary !border-2 !border-primary-foreground"
          style={{ pointerEvents: 'auto' }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2 !h-2 !bg-primary !border-2 !border-primary-foreground"
          style={{ pointerEvents: 'auto' }}
        />
      </div>
    );
  }

  // Fallback icon renderer for when AWS icon is not available
  const getFallbackIcon = () => {
    switch (iconId) {
      case 'ec2':
        return <Server size={32} style={{ color }} />;
      case 'vpc':
        return <Network size={32} style={{ color }} />;
      case 'subnet':
        return <Shield size={32} style={{ color }} />;
      case 'region':
        return <Cloud size={32} style={{ color }} />;
      default:
        return <span className="text-2xl">⚙️</span>;
    }
  };

  const handleSave = () => {
    updateNodeLabel(id, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(label);
    setIsEditing(false);
  };

  const handleNodeClick = () => {
    if (!isEditing) {
      setSelectedNode(id);
    }
  };

  // size from node data (if provided by store)
  const width = data?.size?.width ?? 64;
  const height = data?.size?.height ?? 64;

  // compute icon size based on node dimensions
  const computeIconSize = (w: number, h: number) => {
    const max = Math.min(w * 0.7, h * 0.9);
    return Math.max(16, Math.round(max));
  };

  const iconSize = computeIconSize(width, height);

  // resizing refs
  const resizing = useRef(false);
  const dirRef = useRef<'top' | 'right' | 'bottom' | 'left' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startW = useRef(width);
  const startH = useRef(height);

  const handlePointerDown = (e: React.PointerEvent, dir: 'top' | 'right' | 'bottom' | 'left') => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    resizing.current = true;
    dirRef.current = dir;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startW.current = width;
    startH.current = height;

    const onPointerMove = (ev: PointerEvent) => {
      if (!resizing.current || !dirRef.current) return;
      const dx = ev.clientX - startX.current;
      const dy = ev.clientY - startY.current;
      let newW = startW.current;
      let newH = startH.current;
      const MIN = 32;
      const MAX = 800;

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

  return (
    <>
      <div
        className={cn(
          'diagram-node flex flex-col items-center cursor-pointer group transition-all duration-200',
          selected && 'selected'
        )}
        onClick={handleNodeClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          // Ensure deeper nested children have higher z-index
          // This allows innermost children to be clickable on top of parents
          zIndex: data?.nestingDepth !== undefined ? data.nestingDepth + 10 : (data?.parentId ? 10 : 5),
          pointerEvents: 'auto',
        }}
      >
        <div
          className="flex items-center justify-center shrink-0 relative transition-all duration-200"
          style={{ 
            width, 
            height,
            backgroundColor: selected ? `${color}30` : isHovered ? `${color}15` : 'transparent',
            borderRadius: '8px',
            border: selected ? `2px solid ${color}` : isHovered ? `2px solid ${color}80` : '2px solid transparent',
            boxShadow: selected ? `0 0 0 3px ${color}30, inset 0 0 8px ${color}15` : isHovered ? `0 0 0 2px ${color}30` : 'none',
            padding: '4px',
          }}
        >
          <Handle
            type="target"
            position={Position.Top}
            className="!w-2 !h-2 !bg-primary !border-2 !border-primary-foreground"
          />

          {iconId === 'autoscaling' ? (
            // Inline SVG banner for Auto Scaling (responsive to node width/height)
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selected ? 0.5 : isHovered ? 0.4 : 0.3, transition: 'opacity 0.2s ease' }}>
              <svg viewBox="0 0 300 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                <path d="M30 0 L0 50 L30 100 L60 100 L60 80 L240 80 L240 100 L270 100 L300 50 L270 0 L240 0 L240 20 L60 20 L60 0 Z" fill={color} />
              </svg>
            </div>
          ) : IconComponent ? (
            <div style={{ color, transition: 'opacity 0.2s ease', opacity: selected ? 0.9 : isHovered ? 0.8 : 1 }}>
              <IconComponent size={iconSize} />
            </div>
          ) : (
            getFallbackIcon()
          )}

          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-2 !h-2 !bg-primary !border-2 !border-primary-foreground"
          />

          {/* Actions outside the icon - top right */}
          <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-full bg-secondary shadow-md border border-border hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => deleteNode(id)}
              className="p-1 rounded-full bg-secondary shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* selection handles for autoscaling nodes */}
          {selected && iconId === 'autoscaling' && (
            <>
              <div
                className="absolute left-1/2 -translate-x-1/2 top-2 z-10"
                style={{ pointerEvents: 'auto' }}
                onPointerDown={(e) => handlePointerDown(e, 'top')}
              >
                <div className="w-3 h-3 bg-white border border-border rounded-full shadow-md" />
              </div>

              <div
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                style={{ pointerEvents: 'auto' }}
                onPointerDown={(e) => handlePointerDown(e, 'right')}
              >
                <div className="w-3 h-3 bg-white border border-border rounded-full shadow-md" />
              </div>

              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-2 z-10"
                style={{ pointerEvents: 'auto' }}
                onPointerDown={(e) => handlePointerDown(e, 'bottom')}
              >
                <div className="w-3 h-3 bg-white border border-border rounded-full shadow-md" />
              </div>

              <div
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                style={{ pointerEvents: 'auto' }}
                onPointerDown={(e) => handlePointerDown(e, 'left')}
              >
                <div className="w-3 h-3 bg-white border border-border rounded-full shadow-md" />
              </div>

              {/* small properties badge showing current size */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-secondary text-xs px-2 py-1 rounded shadow-md">
                {width}px × {height}px
              </div>
            </>
          )}
        </div>
      </div>

      {/* Label outside the node */}
      {isEditing ? (
        <div className="flex items-center gap-1 mt-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="px-2 py-1 text-xs bg-secondary rounded border border-input focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <button
            onClick={handleSave}
            className="p-1 rounded hover:bg-secondary text-success"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 rounded hover:bg-secondary text-destructive"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="text-center mt-2 max-w-[120px]">
          <div className="font-medium text-xs truncate text-card-foreground cursor-pointer hover:underline" onClick={() => setIsEditing(true)}>
            {label}
          </div>
        </div>
      )}
    </>
  );
});

ResourceNode.displayName = 'ResourceNode';

export default ResourceNode;
