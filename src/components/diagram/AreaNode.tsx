import React from 'react';
import { NodeProps } from 'reactflow';
import './AreaNode.css';

/**
 * Area node component for rendering VPCs, Subnets, and other container areas
 * This allows areas to zoom with the canvas naturally
 */
export const AreaNode: React.FC<NodeProps> = ({ data, xPos, yPos }) => {
  const {
    label,
    width,
    height,
    borderColor,
    borderWidth,
    description,
    opacity,
    borderStyle,
  } = data;

  const rgbColor = hexToRgb(borderColor || '#8C4FFF');
  const fillColor = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${opacity || 0.1})`;
  const strokeColor = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;

  // Determine border style
  let strokeDasharray = 'none';
  if (borderStyle === 'dashed') {
    strokeDasharray = '5,5';
  } else if (borderStyle === 'dotted') {
    strokeDasharray = '2,3';
  }

  return (
    <div
      className="area-node-wrapper"
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      title={description}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        style={{
          display: 'block',
          overflow: 'visible',
          pointerEvents: 'none',
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Area background rectangle */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={borderWidth || 2}
          strokeDasharray={strokeDasharray}
          rx="4"
          ry="4"
        />

        {/* Area label background */}
        {label && (
          <>
            <rect
              x="4"
              y="2"
              width={Math.min(180, width - 8)}
              height="22"
              fill={strokeColor}
              rx="2"
              ry="2"
            />
            {/* Area label text */}
            <text
              x="8"
              y="16"
              fontSize="12"
              fontWeight="600"
              fill="white"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {truncateLabel(label, 20)}
            </text>
          </>
        )}

        {/* Area description as tooltip */}
        {description && <title>{description}</title>}
      </svg>
    </div>
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
