import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

export function DraggableIconNode() {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'iconNode',
    data: { type: 'iconNode' },
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
      <i className="fas fa-icons text-purple-600" />
      <span className="text-sm font-medium">Icon</span>
    </div>
  );
}
