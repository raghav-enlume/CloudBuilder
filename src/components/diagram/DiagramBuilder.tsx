import { useCallback, useEffect, useRef } from 'react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { ResourceSidebar } from './ResourceSidebar';
import { DiagramCanvasWrapper } from './DiagramCanvas';
import { Toolbar } from './Toolbar';
import { useDiagramStore } from '@/store/diagramStore';
import { ResourceType } from '@/types/diagram';

const DiagramBuilderContent = ({ onDragEnd }: { onDragEnd: (event: DragEndEvent) => void }) => {
  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <ResourceSidebar />
      <div className="flex-1 flex flex-col">
        <Toolbar />
        <div className="flex-1 flex overflow-hidden">
          <DiagramCanvasWrapper />
        </div>
      </div>
    </div>
  );
};

export const DiagramBuilder = () => {
  const { addNode } = useDiagramStore();
  const pointerPosRef = useRef({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Track pointer position globally
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      pointerPosRef.current = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over?.id === 'canvas' && active.data.current) {
        const resourceType = active.data.current as ResourceType;
        
        // Get the canvas element to convert coordinates
        const canvasElement = document.querySelector('.react-flow__viewport');
        if (!canvasElement) {
          console.warn('Canvas element not found');
          // Fallback: use basic positioning
          const position = {
            x: pointerPosRef.current.x + event.delta.x,
            y: pointerPosRef.current.y + event.delta.y,
          };
          addNode(resourceType, position);
          return;
        }
        
        // Get the drop screen position
        const dropScreenX = pointerPosRef.current.x + event.delta.x;
        const dropScreenY = pointerPosRef.current.y + event.delta.y;
        
        // Get viewport transform
        const style = window.getComputedStyle(canvasElement);
        const transform = style.transform;
        const match = transform.match(/matrix\((.+)\)/);
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        
        if (match) {
          const values = match[1].split(', ').map(Number);
          scale = values[0];
          offsetX = values[4];
          offsetY = values[5];
        }
        
        // Get canvas bounds
        const canvasRect = canvasElement.getBoundingClientRect();
        
        // Convert to flow coordinates
        const position = {
          x: (dropScreenX - canvasRect.left - offsetX) / scale,
          y: (dropScreenY - canvasRect.top - offsetY) / scale,
        };
        
        console.log('Drop position:', position);
        addNode(resourceType, position);
      }
    },
    [addNode]
  );

  return (
    <DndContext 
      sensors={sensors} 
      onDragEnd={handleDragEnd}
    >
      <DiagramBuilderContent onDragEnd={handleDragEnd} />
    </DndContext>
  );
};
