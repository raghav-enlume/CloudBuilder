import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Type } from 'lucide-react';

export const DraggableTextLabel = () => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'textLabel',
    data: { type: 'textLabel' },
  });

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
      <div className="flex items-center justify-center w-10 h-10 rounded bg-purple-500/20 text-purple-600">
        <Type className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">Text Label</div>
        <div className="text-xs text-muted-foreground truncate">Add annotations</div>
      </div>
    </div>
  );
};
