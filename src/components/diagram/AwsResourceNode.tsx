import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Trash2, Cloud, Network, Server, Shield, Copy } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { getIconComponent } from '@/lib/iconMapper';
import { cn } from '@/lib/utils';

const AwsResourceNode = memo(({ id, data, selected }: NodeProps) => {
  const { resourceType, label } = data;
  const { deleteNode, setSelectedNode, cloneNode } = useDiagramStore();
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle both old string format and new object format for resourceType
  const iconId = typeof resourceType === 'object' ? resourceType?.icon : resourceType;
  const color = typeof resourceType === 'object' ? resourceType?.color : '#FF9900';
  
  const IconComponent = getIconComponent(iconId);

  // Fallback icon renderer for when AWS icon is not available
  const getFallbackIcon = () => {
    const iconStyle = { color, fontSize: '24px' };
    switch (iconId) {
      case 'ec2':
        return <Server size={iconSize} style={{ color }} />;
      case 'vpc':
        return <Network size={iconSize} style={{ color }} />;
      case 'subnet':
        return <Shield size={iconSize} style={{ color }} />;
      case 'region':
        return <Cloud size={iconSize} style={{ color }} />;
      default:
        return <span style={iconStyle}>⚙️</span>;
    }
  };

  const handleNodeClick = () => {
    setSelectedNode(id);
  };

  // size from node data (if provided by store)
  const width = 54;
  const height = 54;

  const iconSize = 32;

  return (
    <>
      <div
        className={cn(
          'diagram-node flex flex-col items-center cursor-pointer group transition-all duration-200',
          selected && 'selected'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          zIndex: data?.nestingDepth !== undefined ? data.nestingDepth + 10 : (data?.parentId ? 10 : 5),
          pointerEvents: 'auto',
        }}
      >
        <div
          className="flex items-center justify-center shrink-0 relative transition-all duration-200"
          onClick={handleNodeClick}
          style={{
            width,
            height,
            backgroundColor: selected ? `${color}30` : 'transparent',
            borderRadius: '8px',
            border: selected ? `2px solid ${color}` : '2px solid transparent',
            boxShadow: selected ? `0 0 0 3px ${color}30, inset 0 0 8px ${color}15` : 'none',
            pointerEvents: 'auto',
          }}
        >
          <Handle
            type="target"
            position={Position.Left}
            className="!w-2.5 !h-2.5 !bg-primary !border-2 !border-primary-foreground"
            style={{ zIndex: 1000, pointerEvents: 'auto' }}
          />

          {IconComponent ? (
            <div className="flex items-center justify-center w-full h-full">
              <div
                style={{
                  color,
                  transition: 'opacity 0.2s ease',
                  opacity: selected ? 0.9 : isHovered ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  lineHeight: 1,
                  fontSize: 0 // Prevent any text baseline issues
                }}
              >
                <IconComponent size={iconSize} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div
                style={{
                  color,
                  transition: 'opacity 0.2s ease',
                  opacity: selected ? 0.9 : isHovered ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  lineHeight: 1,
                  fontSize: 0 // Prevent any text baseline issues
                }}
              >
                {getFallbackIcon()}
              </div>
            </div>
          )}

          <Handle
            type="source"
            position={Position.Right}
            className="!w-2.5 !h-2.5 !bg-primary !border-2 !border-primary-foreground"
            style={{ zIndex: 1000, pointerEvents: 'auto' }}
          />

          {/* Actions outside the icon - top right - only show on selection */}
          {selected && (
            <div className="absolute -top-2 -right-2 flex gap-1 transition-opacity">
              <button
                onClick={() => cloneNode(id)}
                className="p-1 rounded-full bg-secondary shadow-md border border-border hover:bg-blue-500 hover:text-blue-foreground transition-colors"
                title="Clone this resource and all its children"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={() => deleteNode(id)}
                className="p-1 rounded-full bg-secondary shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Label outside the node */}
      <div className="text-center" style={{ width: `${width}px`, pointerEvents: 'auto' }}>
        <div className="font-small text-[8px] truncate text-card-foreground">
          {label}
        </div>
      </div>
    </>
  );
});

AwsResourceNode.displayName = 'AwsResourceNode';

export default AwsResourceNode;
