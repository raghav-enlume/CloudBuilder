import { cloudResources, categoryLabels, categoryColors } from '@/data/resources';
import { DraggableResource } from './DraggableResource';
import { ResourceCategory } from '@/types/diagram';
import { Server, Database, HardDrive, Network, Shield, BarChart3, GripVertical } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const categoryIcons: Record<ResourceCategory, React.ReactNode> = {
  compute: <Server className="w-4 h-4" />,
  storage: <HardDrive className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  networking: <Network className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  analytics: <BarChart3 className="w-4 h-4" />,
};

export const ResourceSidebar = () => {
  const groupedResources = cloudResources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, typeof cloudResources>);

  return (
    <div className="w-72 h-full flex flex-col" style={{ background: 'var(--gradient-sidebar)' }}>
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-primary" />
          Resources
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Drag components to the canvas
        </p>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-2">
        {Object.entries(groupedResources).map(([category, resources]) => (
          <div key={category} className="sidebar-section">
            <div className="flex items-center gap-2 px-2 mb-2">
              <div
                className="p-1.5 rounded"
                style={{ backgroundColor: `${categoryColors[category]}20`, color: categoryColors[category] }}
              >
                {categoryIcons[category as ResourceCategory]}
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                {categoryLabels[category]}
              </span>
            </div>
            <div className="space-y-2">
              {resources.map((resource) => (
                <DraggableResource key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
};
