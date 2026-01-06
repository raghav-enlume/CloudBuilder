import React, { useMemo, useEffect, useState } from 'react';
import { useViewport } from 'reactflow';
import { AreaElement, useDiagramStore } from '@/store/diagramStore';

interface AreaRendererProps {
  areas: AreaElement[];
}

/**
 * Renders areas (VPCs, Subnets, etc.) as SVG rectangles with viewport zooming
 * Uses React Flow's useViewport hook to apply transforms for zoom/pan
 * Areas are draggable and when moved, child nodes are repositioned with them
 */
export const AreaRenderer: React.FC<AreaRendererProps> = ({ areas }) => {
  const viewport = useViewport();
  const { updateArea, nodes, updateNodes } = useDiagramStore();
  const [draggingArea, setDraggingArea] = useState<{ 
    areaId: string
    startX: number
    startY: number
    initialX: number
    initialY: number
    initialNodePositions: Record<string, { x: number; y: number }>
    initialAreaPositions: Record<string, { x: number; y: number }>
  } | null>(null);

  // Handle area drag start
  const handleAreaMouseDown = (e: React.MouseEvent, areaId: string) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    e.stopPropagation();
    
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    // Store initial positions of all nodes and areas when drag starts
    const initialNodePositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach(node => {
      initialNodePositions[node.id] = { ...node.position };
    });

    const initialAreaPositions: Record<string, { x: number; y: number }> = {};
    areas.forEach(a => {
      initialAreaPositions[a.id] = { x: a.x, y: a.y };
    });

    setDraggingArea({
      areaId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: area.x,
      initialY: area.y,
      initialNodePositions,
      initialAreaPositions,
    });
  };

  // Handle area drag move
  useEffect(() => {
    if (!draggingArea) return;

    const handleMouseMove = (e: MouseEvent) => {
      const area = areas.find(a => a.id === draggingArea.areaId);
      if (!area) return;

      // Calculate delta from initial mouse position
      const deltaX = (e.clientX - draggingArea.startX) / viewport.zoom;
      const deltaY = (e.clientY - draggingArea.startY) / viewport.zoom;

      // Calculate new position from initial position
      const newX = draggingArea.initialX + deltaX;
      const newY = draggingArea.initialY + deltaY;

      // Update area position
      updateArea(draggingArea.areaId, { x: newX, y: newY });

      // Move child nodes with the area
      const updatedNodes = nodes.map(node => {
        if (node.data?.parentAreaId === draggingArea.areaId) {
          const initialPos = draggingArea.initialNodePositions[node.id];
          if (initialPos) {
            return {
              ...node,
              position: {
                x: initialPos.x + deltaX,
                y: initialPos.y + deltaY,
              },
            };
          }
        }
        return node;
      });
      
      // Move child areas with the parent area
      areas.forEach(childArea => {
        if (childArea.id !== draggingArea.areaId) {
          const initialChildPos = draggingArea.initialAreaPositions[childArea.id];
          if (initialChildPos) {
            // Check if this area is a child of the dragging area (spatial containment)
            if (area && 
                childArea.x >= area.x && 
                childArea.y >= area.y && 
                (childArea.x + childArea.width) <= (area.x + area.width) &&
                (childArea.y + childArea.height) <= (area.y + area.height)) {
              updateArea(childArea.id, {
                x: initialChildPos.x + deltaX,
                y: initialChildPos.y + deltaY,
              });
            }
          }
        }
      });

      updateNodes(updatedNodes);
    };

    const handleMouseUp = () => {
      setDraggingArea(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingArea, areas, nodes, viewport.zoom, updateArea, updateNodes]);

  // Create SVG elements for each area
  const areaElements = useMemo(() => {
    return areas.map((area) => {
      // Get color with opacity
      const rgbColor = hexToRgb(area.borderColor);
      const borderColor = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
      const fillColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${area.opacity})`;

      // Create clip-path ID for this area
      const clipPathId = `clip-${area.id}`;

      return (
        <g key={area.id} data-area-id={area.id} clipPath={`url(#${clipPathId})`}>
          {/* Define clip-path for this area */}
          <defs>
            <clipPath id={clipPathId}>
              <rect
                x={area.x}
                y={area.y}
                width={area.width}
                height={area.height}
                rx={4}
                ry={4}
              />
            </clipPath>
          </defs>

          {/* Area background rectangle - draggable */}
          <rect
            x={area.x}
            y={area.y}
            width={area.width}
            height={area.height}
            fill={fillColor}
            strokeDasharray={area.borderStyle === 'dashed' ? '5,5' : area.borderStyle === 'dotted' ? '2,3' : 'none'}
            stroke={borderColor}
            strokeWidth={area.borderWidth}
            rx={4}
            ry={4}
            style={{ cursor: 'move', pointerEvents: 'auto' }}
            onMouseDown={(e) => handleAreaMouseDown(e as any, area.id)}
          />

          {/* Area label background */}
          {area.label && (
            <>
              <rect
                x={area.x + 4}
                y={area.y + 2}
                width={Math.min(180, area.width - 8)}
                height={22}
                fill={borderColor}
                rx={2}
                ry={2}
                pointerEvents="none"
              />
              {/* Area label text */}
              <text
                x={area.x + 8}
                y={area.y + 16}
                fontSize="12"
                fontWeight="600"
                fill="white"
                pointerEvents="none"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {truncateLabel(area.label, 20)}
              </text>
            </>
          )}

          {/* Area description as tooltip */}
          {area.description && (
            <title>{area.description}</title>
          )}
        </g>
      );
    });
  }, [areas]);

  if (areas.length === 0) {
    return null;
  }

  // Calculate bounds of all areas
  const allAreas = areas;
  const minX = Math.min(...allAreas.map(a => a.x), 0);
  const minY = Math.min(...allAreas.map(a => a.y), 0);
  const maxX = Math.max(...allAreas.map(a => a.x + a.width), 1000);
  const maxY = Math.max(...allAreas.map(a => a.y + a.height), 800);

  // Apply viewport transform for zooming
  const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'none',
        transformOrigin: '0 0',
        transform: transform,
      }}
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
    >
      <defs>
        <filter id="area-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
      </defs>
      <g filter="url(#area-shadow)">
        {areaElements}
      </g>
    </svg>
  );
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Truncate label to specified length
 */
function truncateLabel(label: string, maxLength: number): string {
  return label.length > maxLength ? label.substring(0, maxLength - 3) + '...' : label;
}

