import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useCallback, useEffect, useState } from 'react';
import { ResourceSidebar } from './ResourceSidebar';
import { DiagramCanvasWrapper } from './DiagramCanvas';
import { Toolbar } from './Toolbar';
import { ResourceInfoPanel } from './ResourceInfoPanel';
import { useDiagramStore } from '@/store/diagramStore';
import { ResourceType } from '@/types/diagram';
import architectureDiagram from '@/lib/graph-upload/sample-web-app.json';
import { parseAWSDataJSON } from '@/lib/awsDataParser';
import { getAWSDataFromDBJson } from '@/lib/dbJsonParser';
import region1Data from '@/lib/aws/region-1-architecture.json';
// import dbJsonData from '@/lib/aws/db.json';
import dbJsonData from '@/lib/aws/clean-db-14.json';

const DiagramBuilderContent = ({ onDragEnd }: { onDragEnd: (event: DragEndEvent) => void }) => {
  const { loadDiagram, setLoadedSecurityGroups, nodes, edges } = useDiagramStore();
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  // Load architecture diagram on component mount
  useEffect(() => {
    const loadAWSData = async () => {
      try {
        // Switch between data sources: 'region1' or 'dbJson'
        const USE_DB_JSON = true; // Set to false to use region-1-architecture.json
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let awsData: any;
        let dataSource: string;
        
        if (USE_DB_JSON) {
          // Convert DB JSON format to AWS format
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          awsData = getAWSDataFromDBJson(dbJsonData as any);
          console.log('awsData', awsData)
          dataSource = 'db.json (DB format)';
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          awsData = region1Data as any;
          dataSource = 'region-1-architecture.json';
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { nodes: parsedNodes, edges } = await parseAWSDataJSON(awsData as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loadDiagram(parsedNodes as any, edges as any);
        console.log(`Loaded ${dataSource} data:`, { nodes: parsedNodes.length, edges: edges.length });

        // Extract and store security groups from the loaded data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allSecurityGroups: any[] = [];
        Object.values(awsData).forEach((regionData) => {
          if (regionData && typeof regionData === 'object' && 'security_groups' in regionData) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sgs = (regionData as any).security_groups;
            if (Array.isArray(sgs)) {
              allSecurityGroups.push(...sgs);
            }
          }
        });
        setLoadedSecurityGroups(allSecurityGroups);

        // Trigger fitView after a longer delay to ensure DOM is ready and find first region
        setTimeout(() => {
          // Find the first region node
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const firstRegionNode = parsedNodes.find((node: any) => node.data?.resourceType?.id === 'region');
          if (firstRegionNode) {
            window.dispatchEvent(new CustomEvent('fitViewOnLoad', {
              detail: { nodeId: firstRegionNode.id }
            }));
            console.log('fitViewOnLoad event dispatched for region:', firstRegionNode.id);
          } else {
            window.dispatchEvent(new CustomEvent('fitViewOnLoad'));
            console.log('fitViewOnLoad event dispatched');
          }
        }, 500);
      } catch (error) {
        console.error('Failed to load architecture data:', error);
      }
    };
    
    loadAWSData();
  }, [loadDiagram, setLoadedSecurityGroups]);

  // useEffect(() => {
  //   try {
  //     const { nodes, edges } = architectureDiagram as { nodes: Record<string, unknown>[]; edges: Record<string, unknown>[] };
  //     loadDiagram(nodes, edges);
  //     console.log('Loaded architecture diagram:', { nodes: nodes.length, edges: edges.length });

  //     // Extract and store security groups from the loaded data
  //     const securityGroups = nodes
  //       .filter((node) => node.data?.resourceType?.id === 'securityGroup')
  //       .map((node) => node.data);
  //     setLoadedSecurityGroups(securityGroups);

  //     // Trigger fitView after a longer delay to ensure DOM is ready and find first region
  //     setTimeout(() => {
  //       // Find the first region node
  //       const firstRegionNode = nodes.find((node) => node.data?.resourceType?.id === 'region');
  //       if (firstRegionNode) {
  //         window.dispatchEvent(new CustomEvent('fitViewOnLoad', {
  //           detail: { nodeId: firstRegionNode.id }
  //         }));
  //         console.log('fitViewOnLoad event dispatched for region:', firstRegionNode.id);
  //       } else {
  //         window.dispatchEvent(new CustomEvent('fitViewOnLoad'));
  //         console.log('fitViewOnLoad event dispatched');
  //       }
  //     }, 500);
  //   } catch (error) {
  //     console.error('Failed to load architecture diagram:', error);
  //   }
  // }, [loadDiagram, setLoadedSecurityGroups]);

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <ResourceSidebar />
      <div className="flex-1 flex flex-col">
        <Toolbar isInfoPanelOpen={isInfoPanelOpen} onToggleInfoPanel={() => setIsInfoPanelOpen(!isInfoPanelOpen)} />
        <div className="flex-1 flex overflow-hidden">
          <DiagramCanvasWrapper />
          <ResourceInfoPanel 
            nodes={nodes} 
            edges={edges} 
            isOpen={isInfoPanelOpen} 
            onClose={() => setIsInfoPanelOpen(false)} 
          />
        </div>
      </div>
    </div>
  );
};

export const DiagramBuilder = () => {
  const { addNode, addTextLabel, addIconNode } = useDiagramStore();

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
        
        // Check the drop type
        if (active.data.current?.type === 'textLabel') {
          addTextLabel(position);
        } else if (active.data.current?.type === 'iconNode') {
          addIconNode(position);
        } else {
          // It's a resource
          const resourceType = active.data.current as ResourceType;
          addNode(resourceType, position);
        }
      }
    },
    [addNode, addTextLabel, addIconNode]
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
