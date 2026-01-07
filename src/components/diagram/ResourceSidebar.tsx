import { cloudResources, categoryLabels, categoryColors } from '@/data/resources';
import { DraggableResource } from './DraggableResource';
import { DraggableTextLabel } from './DraggableTextLabel';
import { DraggableIconNode } from './DraggableIconNode';
import { ResourceCategory } from '@/types/diagram';
import { Server, Database, HardDrive, Network, Shield, BarChart3, GripVertical, MessageSquare, GitBranch, Eye, Search, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const categoryIcons: Record<ResourceCategory, React.ReactNode> = {
  compute: <Server className="w-4 h-4" />,
  storage: <HardDrive className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
  networking: <Network className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  analytics: <BarChart3 className="w-4 h-4" />,
  messaging: <MessageSquare className="w-4 h-4" />,
  devops: <GitBranch className="w-4 h-4" />,
  monitoring: <Eye className="w-4 h-4" />,
};

export const ResourceSidebar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = cloudResources.filter((resource) =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedResources = filteredResources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, typeof cloudResources>);

  const hasResults = Object.keys(groupedResources).length > 0;

  return (
    <div className="w-72 h-full flex flex-col" style={{ background: 'var(--gradient-sidebar)' }}>
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <h2 className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
          <GripVertical className="w-5 h-5 text-primary" />
          Resources
        </h2>
        <p className="text-xs text-muted-foreground">
          Drag components to the canvas
        </p>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            className="pl-8 pr-8 h-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-2">
        {/* Text Label Section */}
        <div className="sidebar-section mb-4">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="p-1.5 rounded" style={{ backgroundColor: '#9333ea20', color: '#9333ea' }}>
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
              Annotations
            </span>
          </div>
          <div className="space-y-2">
            <DraggableTextLabel />
            <DraggableIconNode />
          </div>
        </div>

        {hasResults ? (
          Object.entries(groupedResources).map(([category, resources]) => (
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
          ))
        ) : (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-xs text-center">No resources found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
