import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';

const GroupNode1 = memo((props: NodeProps) => {
  const { id, data, selected } = props;
  const { label } = data;
  const {setSelectedNode } = useDiagramStore();
  
  // Handle both old string format and new object format for resourceType
  const resourceType = data.resourceType;
  let color = typeof resourceType === 'object' ? resourceType?.color : '#FF9900';
  
  // Use specific colors for different resource types
  if (id.startsWith('vpc-')) {
    color = 'rgb(140, 79, 255)';
  } else if (id.startsWith('subnet-')) {
    color = '#455A64';
  }

  const width = data?.width ?? 600;
  const height = data?.height ?? 400;
  
  return (
    <div
      data-isContainer="true"
      style={{
        width: width ??'100%',
        height: height ??'100%',
        position: 'absolute',
        top: 0,
        left: 0,
        boxSizing: 'border-box',
        zIndex: 1, // Changed from -1 to allow click events
        pointerEvents: 'auto',
        // border: selected ? `2px solid ${color}` : '2px solid transparent',
        borderRadius: '4px',
      }}
      onClick={() => setSelectedNode(id)}
      onContextMenu={(e) => {
        e.preventDefault();
        // This will be handled by the parent context menu if needed
        // For now, the delete button in the UI handles container deletion
      }}
    >

      {/* Label at top-left */}
      <div
        className="absolute -top-5 left-2  text-[10px] font-medium"
        style={{ color, pointerEvents: 'auto', zIndex: 20 }}
      >
          <span
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {label}
          </span>
      </div>

    </div>
  );
});

GroupNode1.displayName = 'GroupNode1';

export default GroupNode1;
