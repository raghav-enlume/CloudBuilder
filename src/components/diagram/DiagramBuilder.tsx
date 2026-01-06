import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useCallback } from 'react';
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
  const { addNode, addTextLabel, addArea } = useDiagramStore();

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
        // Get the canvas viewport element
        const canvasElement = document.querySelector('.react-flow__viewport');
        if (!canvasElement) {
          console.warn('Canvas element not found');
          return;
        }

        // Get the drop screen position from DnD event
        const dropScreenX = event.collisions[0]?.data?.activatorNode?.getBoundingClientRect?.().left ?? 0;
        const dropScreenY = event.collisions[0]?.data?.activatorNode?.getBoundingClientRect?.().top ?? 0;

        // Simple fallback: use screen coordinates relative to canvas container
        const parentRect = (canvasElement.parentElement as HTMLElement)?.getBoundingClientRect?.();
        if (!parentRect) {
          console.warn('Parent rect not found');
          return;
        }

        // Get viewport transform for coordinate conversion
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

        // Get the center of the canvas in screen coordinates
        const centerX = parentRect.left + parentRect.width / 2;
        const centerY = parentRect.top + parentRect.height / 2;

        // Convert from screen space to flow space
        const position = {
          x: (centerX - parentRect.left - offsetX) / scale,
          y: (centerY - parentRect.top - offsetY) / scale,
        };
        
        console.log('Drop position:', position);
        
        // Check if it's a text label
        if (active.data.current?.type === 'textLabel') {
          addTextLabel(position);
        } else {
          // It's a resource
          const resourceType = active.data.current as ResourceType;
          
          // Create areas for container-like resources (VPC, Subnet, Region)
          if (['vpc', 'subnet', 'region'].includes(resourceType.id)) {
            // Define area dimensions and styling based on resource type
            const areaConfig: Record<string, any> = {
              vpc: {
                width: 600,
                height: 400,
                borderColor: '#FFA000',
                borderWidth: 2,
                borderStyle: 'solid' as const,
                opacity: 0.05,
                areaType: 'vpc',
              },
              subnet: {
                width: 500,
                height: 300,
                borderColor: '#455A64',
                borderWidth: 2,
                borderStyle: 'solid' as const,
                opacity: 0.05,
                areaType: 'subnet',
              },
              region: {
                width: 800,
                height: 600,
                borderColor: '#3949AB',
                borderWidth: 2,
                borderStyle: 'solid' as const,
                opacity: 0.02,
                areaType: 'region',
              },
            };

            const config = areaConfig[resourceType.id];
            if (config) {
              addArea({
                id: `area-${Date.now()}`,
                type: 'area',
                label: resourceType.name,
                areaType: config.areaType,
                color: resourceType.color,
                x: position.x - config.width / 2,
                y: position.y - config.height / 2,
                width: config.width,
                height: config.height,
                opacity: config.opacity,
                borderColor: config.borderColor,
                borderWidth: config.borderWidth,
                borderStyle: config.borderStyle,
                description: resourceType.description,
              });
            }
          } else {
            // Regular resource - create a node
            addNode(resourceType, position);
          }
        }
      }
    },
    [addNode, addTextLabel, addArea]
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
