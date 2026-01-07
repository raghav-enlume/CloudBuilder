import React, { useState } from 'react';
import { useReactFlow, Handle, Position } from 'reactflow';
import { FontAwesomePicker } from '../ui/font-awesome-picker';
import { Button } from '../ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';

interface IconNodeProps {
  id: string;
  data: {
    iconName: string;
    iconSet: string;
    size: number;
    color: string;
    background: 'none' | 'square' | 'circle';
  };
  isConnectable?: boolean;
  selected?: boolean;
}

export function IconNode({
  id,
  data,
  selected = false,
}: IconNodeProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { setCenter } = useReactFlow();
  const { deleteNode, updateNodeData, setSelectedNode } = useDiagramStore();

  const {
    iconName = 'address-card',
    iconSet = 'font-awesome',
    size = 48,
    color = '#000000',
    background = 'none',
  } = data;

  const handleIconSelect = (newIcon: string) => {
    updateNodeData(id, { ...data, iconName: newIcon });
    setIsPickerOpen(false);
  };

  const handleSizeChange = (newSize: number) => {
    updateNodeData(id, { ...data, size: newSize });
  };

  const handleColorChange = (newColor: string) => {
    updateNodeData(id, { ...data, color: newColor });
  };

  const handleBackgroundChange = (newBackground: 'none' | 'square' | 'circle') => {
    updateNodeData(id, { ...data, background: newBackground });
  };

  const handleDelete = () => {
    deleteNode(id);
  };

  // Calculate node dimensions and background based on icon size
  const getNodeDimensions = () => {
    const padding = size * 0.4;
    return size + padding * 2;
  };

  const getBackgroundStyle = () => {
    const padding = size * 0.4;
    const bgSize = size + padding * 2;

    const baseStyle = {
      width: `${bgSize}px`,
      height: `${bgSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    if (background === 'square') {
      return {
        ...baseStyle,
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        border: '2px solid #e5e7eb',
      };
    }

    if (background === 'circle') {
      return {
        ...baseStyle,
        backgroundColor: '#f3f4f6',
        borderRadius: '50%',
        border: '2px solid #e5e7eb',
      };
    }

    return baseStyle;
  };

  return (
    <div
      onClick={() => setSelectedNode(id)}
      className={`
        rounded-lg transition-all cursor-pointer
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 z-50' : ''}
      `}
      style={{ width: `${getNodeDimensions()}px`, height: `${getNodeDimensions()}px`, position: 'relative' }}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} style={{ background: '#0ea5e9', width: '8px', height: '8px' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#0ea5e9', width: '8px', height: '8px' }} />

      {/* Main Icon Container */}
      <div
        className="w-full h-full flex flex-col items-center justify-center relative"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div style={getBackgroundStyle() as React.CSSProperties}>
          <i
            className={`fas fa-${iconName}`}
            style={{
              fontSize: `${size}px`,
              color: color,
            }}
          />
        </div>
      </div>

      {/* Action Buttons - Show on Selection */}
      {selected && (
        <div className="absolute -top-10 left-0 right-0 flex gap-1 justify-center z-50">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-1 bg-blue-50 border-blue-300 hover:bg-blue-100"
            title="Edit icon"
          >
            <Pencil size={14} />
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            title="Delete icon"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}

      {/* Icon Settings Panel - Show when picker is open */}
      {selected && isPickerOpen && (
        <div className="absolute top-0 left-full ml-6 bg-white rounded-lg shadow-2xl border-2 border-blue-300 p-4 z-[9999] w-96 max-h-[600px] overflow-y-auto">
          <div className="space-y-4">
            {/* Icon Picker Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Icon Settings</h3>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                title="Close settings"
              >
                ×
              </button>
            </div>

            {/* Icon Picker */}
            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 mb-3 px-2">Select Icon</p>
              <FontAwesomePicker
                currentIcon={iconName}
                onSelect={handleIconSelect}
                onClose={() => setIsPickerOpen(false)}
              />
            </div>

            {/* Size Control */}
            <div className="pt-2 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Icon Size: <span className="text-blue-600 font-bold">{size}px</span>
              </label>
              <input
                type="range"
                min="16"
                max="96"
                step="4"
                value={size}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="flex gap-2 mt-2">
                {[24, 48, 64, 96].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSizeChange(s)}
                    className={`px-2 py-1 text-xs rounded border ${
                      size === s
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            {/* Color Control */}
            <div className="pt-2 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Icon Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-10 cursor-pointer rounded border border-gray-300"
                  title="Pick a color"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Background Style */}
            <div className="pt-2 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Background Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'square', 'circle'] as const).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => handleBackgroundChange(bg)}
                    className={`
                      py-2 px-2 rounded border-2 text-xs font-medium transition-colors
                      ${background === bg
                        ? 'bg-blue-500 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }
                    `}
                  >
                    {bg === 'none' ? '📭' : bg === 'square' ? '⬜' : '⭕'}
                    <div className="text-xs mt-1">{bg}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-600 mb-2">Preview</p>
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div style={getBackgroundStyle() as React.CSSProperties}>
                  <i
                    className={`fas fa-${iconName}`}
                    style={{
                      fontSize: `${size}px`,
                      color: color,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview in node */}
      {!selected && (
        <p className="text-xs text-gray-400 text-center mt-1">Click to edit</p>
      )}
    </div>
  );
}
