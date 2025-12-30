import { memo, useState } from 'react';
import { Handle, Position, NodeProps, NodeLabel } from 'reactflow';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { getIconComponent } from '@/lib/iconMapper';
import { cn } from '@/lib/utils';

const ResourceNode = memo(({ id, data, selected }: NodeProps) => {
  const { resourceType, label } = data;
  const { deleteNode, updateNodeLabel, setSelectedNode } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const IconComponent = getIconComponent(resourceType.icon);

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

  return (
    <>
      <div
        className={cn(
          'diagram-node flex flex-col items-center cursor-pointer group w-16',
          selected && 'selected'
        )}
        onClick={handleNodeClick}
      >
        <div
          className="flex items-center justify-center shrink-0 relative"
        >
          <Handle
            type="target"
            position={Position.Top}
            className="!w-2 !h-2 !bg-primary !border-2 !border-primary-foreground"
          />
          
          {IconComponent ? (
            <div style={{ color: resourceType.color }}>
              <IconComponent size={32} />
            </div>
          ) : (
            <span className="text-2xl">⚙️</span>
          )}

          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-2 !h-2 !bg-primary !border-2 !border-primary-foreground"
          />
        </div>

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
