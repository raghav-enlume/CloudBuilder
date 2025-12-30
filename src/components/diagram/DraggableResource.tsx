import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ResourceType } from '@/types/diagram';
import { getIconComponent } from '@/lib/iconMapper';
import { cn } from '@/lib/utils';

interface DraggableResourceProps {
  resource: ResourceType;
}

export const DraggableResource = ({ resource }: DraggableResourceProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: resource.id,
    data: resource,
  });
  const IconComponent = getIconComponent(resource.icon);

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'resource-card flex items-center gap-3 select-none',
        isDragging && 'opacity-50 scale-105'
      )}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${resource.color}20` }}
      >
        {IconComponent ? (
          <div style={{ color: resource.color }}>
            <IconComponent size={20} />
          </div>
        ) : (
          <span className="text-sm">⚙️</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate text-card-foreground">
          {resource.name}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {resource.description}
        </div>
      </div>
    </div>
  );
};
