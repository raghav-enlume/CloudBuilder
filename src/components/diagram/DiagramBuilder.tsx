import { useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { ResourceSidebar } from './ResourceSidebar';
import { DiagramCanvas } from './DiagramCanvas';
import { Toolbar } from './Toolbar';
import { useDiagramStore } from '@/store/diagramStore';
import { ResourceType } from '@/types/diagram';

export const DiagramBuilder = () => {
  const { addNode } = useDiagramStore();

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
        
        // Get the drop position relative to the canvas
        const canvasElement = document.querySelector('.react-flow');
        if (canvasElement) {
          const rect = canvasElement.getBoundingClientRect();
          const position = {
            x: (event.delta.x + rect.width / 2) - 80,
            y: (event.delta.y + rect.height / 2) - 40,
          };
          
          addNode(resourceType, position);
        }
      }
    },
    [addNode]
  );

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
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
