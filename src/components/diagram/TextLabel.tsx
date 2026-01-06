import { memo, useState, useEffect } from 'react';
import { NodeProps } from 'reactflow';
import { useDiagramStore } from '@/store/diagramStore';
import { cn } from '@/lib/utils';
import { Pencil, X, Check } from 'lucide-react';

const TextLabel = memo(({ id, data, selected }: NodeProps) => {
  const { deleteNode, updateNodeLabel, setSelectedNode, updateTextLabelStyle } = useDiagramStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isStyleEditing, setIsStyleEditing] = useState(false);
  const [editValue, setEditValue] = useState(data?.label || data?.text || 'Double click to edit');
  const [tempFontSize, setTempFontSize] = useState(data?.fontSize || 14);
  const [tempFontWeight, setTempFontWeight] = useState(data?.fontWeight || '400');
  const [tempColor, setTempColor] = useState(data?.color || '#000000');

  // Sync editValue with data when it changes (e.g., on JSON import)
  useEffect(() => {
    if (data?.label || data?.text) {
      setEditValue(data.label || data.text);
    }
  }, [data?.label, data?.text]);

  // Sync styling values when data changes
  useEffect(() => {
    if (data?.fontSize) setTempFontSize(data.fontSize);
    if (data?.fontWeight) setTempFontWeight(data.fontWeight);
    if (data?.color) setTempColor(data.color);
  }, [data?.fontSize, data?.fontWeight, data?.color]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(id);
  };

  const handleSave = () => {
    updateNodeLabel(id, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(data?.label || data?.text || 'Double click to edit');
    setIsEditing(false);
  };

  const handleStyleSave = () => {
    updateTextLabelStyle(id, tempFontSize, tempFontWeight, tempColor);
    setIsStyleEditing(false);
  };

  const handleStyleCancel = () => {
    setTempFontSize(data?.fontSize || 14);
    setTempFontWeight(data?.fontWeight || '400');
    setTempColor(data?.color || '#000000');
    setIsStyleEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const fontSize = data?.fontSize || 14;
  const fontWeight = data?.fontWeight || '400';
  const color = data?.color || '#000000';
  const textAlign = data?.textAlign || 'left';

  return (
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'text-label relative cursor-pointer transition-all duration-200 p-2 group',
        selected && 'ring-2 ring-primary ring-offset-2 rounded'
      )}
      style={{
        minWidth: '100px',
        minHeight: '30px',
        pointerEvents: 'auto',
        borderRadius: '4px',
        border: selected ? '2px dashed #3b82f6' : '2px dashed transparent',
        backgroundColor: selected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
        zIndex: selected ? 9999 : 'auto',
      }}
    >
      {isStyleEditing ? (
        <div
          className="absolute bottom-full left-0 bg-white border border-primary rounded shadow-lg p-3 z-50 mb-2"
          onClick={(e) => e.stopPropagation()}
          style={{ minWidth: '200px' }}
        >
          <div className="space-y-3">
            {/* Font Size */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Font Size: {tempFontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="32"
                value={tempFontSize}
                onChange={(e) => setTempFontSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Font Weight */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Font Weight
              </label>
              <select
                value={tempFontWeight}
                onChange={(e) => setTempFontWeight(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="300">Light (300)</option>
                <option value="400">Regular (400)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800)</option>
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="h-8 w-12 border border-input rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={tempColor}
                  onChange={(e) => setTempColor(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs border border-input rounded focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div
                style={{
                  fontSize: `${tempFontSize}px`,
                  fontWeight: tempFontWeight,
                  color: tempColor,
                }}
              >
                {editValue}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 border-t pt-2">
              <button
                onClick={handleStyleSave}
                className="flex-1 p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center justify-center gap-1"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={handleStyleCancel}
                className="flex-1 p-1 rounded bg-secondary hover:bg-secondary/90 text-xs font-medium flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full h-full px-2 py-1 text-sm bg-white border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            color,
            textAlign,
          }}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex-1 whitespace-pre-wrap break-words user-select-none"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight,
              color,
              textAlign,
              minHeight: '30px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {editValue}
          </div>

          {/* Edit Icon - show on hover or selection */}
          {selected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsStyleEditing(true);
              }}
              className="p-1 rounded hover:bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="Edit styling"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

TextLabel.displayName = 'TextLabel';

export default TextLabel;

