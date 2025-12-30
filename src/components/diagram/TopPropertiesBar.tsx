import { X, Plus, MapPin, ChevronRight } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getIconComponent } from '@/lib/iconMapper';

export const TopPropertiesBar = () => {
  const { nodes, selectedNode, updateNodeAttribute, setSelectedNode } = useDiagramStore();

  const node = nodes.find((n) => n.id === selectedNode);

  if (!node) {
    return null;
  }

  const { label, resourceType, config = {} } = node.data;
  const { editableAttributes = [] } = resourceType;
  const IconComponent = getIconComponent(resourceType.icon);

  // Group attributes into rows (first 4 in first row, rest in second row)
  const firstRowAttrs = editableAttributes.slice(0, 4);
  const secondRowAttrs = editableAttributes.slice(4);

  const renderAttributeField = (attr: any, index: number) => {
    const value = config[attr.key];
    const isFirstInRow = index === 0;
    const borderClass = isFirstInRow ? '' : 'pl-2 border-l border-border/50';

    switch (attr.type) {
      case 'select':
        return (
          <div key={attr.key} className={`flex items-center gap-2 min-w-fit ${borderClass}`}>
            <span className="text-xs text-muted-foreground font-medium">{attr.label}</span>
            <Select
              value={String(value || '')}
              onValueChange={(val) => updateNodeAttribute(node.id, attr.key, val)}
            >
              <SelectTrigger className="h-7 w-32 text-xs border-0 bg-transparent font-semibold p-0">
                <SelectValue placeholder={`Select ${attr.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {attr.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'text':
        return (
          <div key={attr.key} className={`flex items-center gap-2 min-w-fit ${borderClass}`}>
            <span className="text-xs text-muted-foreground font-medium">{attr.label}</span>
            <Input
              type="text"
              value={String(value || '')}
              onChange={(e) => updateNodeAttribute(node.id, attr.key, e.target.value)}
              placeholder={attr.placeholder}
              className="h-7 w-28 text-xs border-0 bg-transparent font-semibold p-0"
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 rounded-full"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        );

      case 'number':
        return (
          <div key={attr.key} className={`flex items-center gap-2 min-w-fit ${borderClass}`}>
            <span className="text-xs text-muted-foreground font-medium">{attr.label}</span>
            <Input
              type="number"
              value={String(value || '')}
              onChange={(e) =>
                updateNodeAttribute(
                  node.id,
                  attr.key,
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }
              placeholder={attr.placeholder}
              className="h-7 w-20 text-xs border-0 bg-transparent font-semibold p-0"
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={attr.key} className={`flex items-center gap-2 min-w-fit ${borderClass}`}>
            <span className="text-xs text-muted-foreground font-medium">{attr.label}</span>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => updateNodeAttribute(node.id, attr.key, e.target.checked)}
              className="w-4 h-4 rounded"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border-b border-border bg-card">
      {/* First Row - Main Properties */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-border/50">
        {/* Resource Icon and Label */}
        <div className="flex items-center gap-3 min-w-fit">
          <div className="flex items-center gap-2">
            {IconComponent ? (
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${resourceType.color}40` }}>
                <div style={{ color: resourceType.color }}>
                  <IconComponent size={24} />
                </div>
              </div>
            ) : (
              <span className="text-2xl">⚙️</span>
            )}
            <span className="font-bold text-sm">{label}</span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="ml-2 p-1 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Attributes - First Row */}
        {firstRowAttrs.map((attr, index) => renderAttributeField(attr, index))}
      </div>

      {/* Second Row - Additional Properties */}
      {secondRowAttrs.length > 0 && (
        <div className="flex items-center gap-6 px-4 py-3">
          {secondRowAttrs.map((attr, index) => renderAttributeField(attr, index))}

          {/* Pricing */}
          {/* <div className="ml-auto flex items-center gap-2 pr-4">
            <span className="text-xs text-muted-foreground">100%</span>
            <span className="text-lg font-bold text-green-600">$70</span>
          </div> */}
        </div>
      )}
    </div>
  );
};
