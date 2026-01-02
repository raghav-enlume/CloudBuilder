import { useCallback, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { ResourceSidebar } from './ResourceSidebar';
import { DiagramCanvas } from './DiagramCanvas';
import { Toolbar } from './Toolbar';
import { useDiagramStore } from '@/store/diagramStore';
import { ResourceType } from '@/types/diagram';

export const DiagramBuilder = () => {
  const { addNode } = useDiagramStore();
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over?.id === 'canvas' && active.data.current) {
        const resourceType = active.data.current as ResourceType;
        
        // Get the canvas element
        const canvasElement = document.querySelector('.react-flow__viewport') as HTMLElement;
        if (!canvasElement) {
          console.error('Canvas element not found');
          return;
        }

        // Get the canvas rect and transform
        const canvasRect = canvasElement.getBoundingClientRect();
        
        // Calculate the drop screen position
        const dropScreenX = dragStartPosRef.current.x + event.delta.x;
        const dropScreenY = dragStartPosRef.current.y + event.delta.y;
        
        // Convert screen coordinates to canvas local coordinates
        const canvasX = dropScreenX - canvasRect.left;
        const canvasY = dropScreenY - canvasRect.top;
        
        // Get the canvas transform (scale and pan)
        const transform = canvasElement.style.transform;
        const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
        
        let scaleX = 1;
        let scaleY = 1;
        let panX = 0;
        let panY = 0;
        
        if (matrixMatch) {
          const values = matrixMatch[1].split(', ').map(Number);
          scaleX = values[0];
          scaleY = values[3];
          panX = values[4];
          panY = values[5];
        }
        
        // Convert to flow coordinates
        const flowX = (canvasX - panX) / scaleX;
        const flowY = (canvasY - panY) / scaleY;
        
        const position = {
          x: flowX,
          y: flowY,
        };
        
        console.log('Drop position:', position);
        addNode(resourceType, position);
      }
    },
    [addNode]
  );

  // Track the initial drag start position
  const handleDragStart = useCallback(
    (event: any) => {
      const element = event.active.node.activatorNode as HTMLElement;
      const rect = element.getBoundingClientRect();
      dragStartPosRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    },
    []
  );

  return (
    <DndContext 
      sensors={sensors} 
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="flex h-screen bg-canvas overflow-hidden">
        <ResourceSidebar />
        <div className="flex-1 flex flex-col">
          <Toolbar />
          <div className="flex-1 flex overflow-hidden">
            <DiagramCanvas />
          </div>
        </div>
      </div>
    </DndContext>
  );
};
