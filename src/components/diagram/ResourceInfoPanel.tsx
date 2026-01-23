import { X, ChevronDown, AlertCircle, Link2, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResourceInfoPanelProps {
  nodes: Node[];
  edges: Edge[];
  isOpen: boolean;
  onClose: () => void;
}

interface ResourceInfo {
  id: string;
  label: string;
  type: string;
  category?: string;
  properties: Record<string, any>;
}

interface RelationInfo {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
  type?: string;
}

export const ResourceInfoPanel = ({ nodes, edges, isOpen, onClose }: ResourceInfoPanelProps) => {
  const [expandedResources, setExpandedResources] = useState<string[]>([]);

  // Debug logging when nodes/edges change
  useEffect(() => {
    if (isOpen && nodes.length > 0) {
      console.log('📊 ResourceInfoPanel Debug:');
      console.log('Total nodes:', nodes.length);
      console.log('Total edges:', edges.length);
      
      const validNodes = nodes.filter(node => node.data?.resourceType?.id && node.data.resourceType.id !== 'region');
      const validNodeIds = validNodes.map(node => node.id);
      
      console.log('Valid resource nodes:', validNodes.length);
      console.log('Valid resource node IDs:', validNodeIds);
      
      // Show VPC nodes specifically
      const vpcNodes = nodes.filter(n => n.id.startsWith('vpc-'));
      console.log('VPC nodes found:', vpcNodes.length);
      vpcNodes.forEach(vpc => {
        console.log('  -', vpc.id, '| resourceType:', vpc.data?.resourceType?.id, '| label:', vpc.data?.label);
      });
      
      // Show subnet nodes specifically
      const subnetNodes = nodes.filter(n => n.id.startsWith('subnet-'));
      console.log('Subnet nodes found:', subnetNodes.length);
      subnetNodes.slice(0, 3).forEach(subnet => {
        console.log('  -', subnet.id, '| resourceType:', subnet.data?.resourceType?.id, '| label:', subnet.data?.label);
      });
      
      // Show IGW nodes specifically
      const igwNodes = nodes.filter(n => n.id.startsWith('igw-'));
      console.log('IGW nodes found:', igwNodes.length);
      igwNodes.forEach(igw => {
        console.log('  -', igw.id, '| resourceType:', igw.data?.resourceType?.id, '| label:', igw.data?.label);
      });
    }
  }, [nodes, edges, isOpen]);

  // Parse resources from nodes
  const getResourceList = (): ResourceInfo[] => {
    return nodes
      .filter(node => node.data?.resourceType?.id && node.data.resourceType.id !== 'region')
      .map(node => ({
        id: node.id,
        label: node.data?.label || node.id,
        type: node.data?.resourceType?.label || node.data?.resourceType?.id || 'Unknown',
        category: node.data?.resourceType?.category,
        properties: node.data || {},
      }));
  };

  // Get resource relations (only between identified resources)
  const getRelations = (): RelationInfo[] => {
    const validResourceIds = new Set(
      nodes
        .filter(node => node.data?.resourceType?.id && node.data.resourceType.id !== 'region')
        .map(node => node.id)
    );

    return edges
      .filter(edge => 
        edge.source && 
        edge.target &&
        validResourceIds.has(edge.source) &&
        validResourceIds.has(edge.target)
      )
      .map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        return {
          from: edge.source,
          to: edge.target,
          fromLabel: sourceNode?.data?.label || edge.source,
          toLabel: targetNode?.data?.label || edge.target,
          type: edge.label || 'connected',
        };
      });
  };

  // Get orphaned relations (relations with unknown or missing resources)
  const getOrphanedRelations = (): RelationInfo[] => {
    const validResourceIds = new Set(
      nodes
        .filter(node => node.data?.resourceType?.id && node.data.resourceType.id !== 'region')
        .map(node => node.id)
    );

    const orphanedEdges = edges.filter(edge => 
      edge.source && 
      edge.target &&
      (!validResourceIds.has(edge.source) || !validResourceIds.has(edge.target))
    );

    if (orphanedEdges.length > 0) {
      console.warn('🔍 ORPHANED EDGES FOUND:', orphanedEdges.length);
      orphanedEdges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        console.warn('   - Edge:', {
          edgeId: edge.id,
          source: edge.source,
          target: edge.target,
          sourceExists: validResourceIds.has(edge.source),
          targetExists: validResourceIds.has(edge.target),
          sourceLabel: sourceNode?.data?.label,
          targetLabel: targetNode?.data?.label,
          edgeLabel: edge.label,
        });
      });
    }

    return orphanedEdges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        return {
          from: edge.source,
          to: edge.target,
          fromLabel: sourceNode?.data?.label || edge.source,
          toLabel: targetNode?.data?.label || edge.target,
          type: edge.label || 'connected',
        };
      });
  };

  // Get unidentified resources
  const getUnidentifiedResources = (): ResourceInfo[] => {
    return nodes
      .filter(
        node =>
          !node.data?.resourceType?.id ||
          node.data.resourceType.id === 'unknown' ||
          node.data.resourceType.id === ''
      )
      .map(node => ({
        id: node.id,
        label: node.data?.label || node.id,
        type: node.data?.resourceType?.label || 'Unknown Type',
        properties: node.data || {},
      }));
  };

  const resources = getResourceList();
  const relations = getRelations();
  const orphanedRelations = getOrphanedRelations();
  const unidentified = getUnidentifiedResources();

  // Group resources by type
  const groupedResources = resources.reduce(
    (acc, resource) => {
      const type = resource.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(resource);
      return acc;
    },
    {} as Record<string, ResourceInfo[]>
  );

  // Group relations by source type
  const groupedRelations = relations.reduce(
    (acc, relation) => {
      const sourceNode = nodes.find(n => n.id === relation.from);
      const sourceType = sourceNode?.data?.resourceType?.label || 'Unknown';

      if (!acc[sourceType]) {
        acc[sourceType] = [];
      }
      acc[sourceType].push(relation);
      return acc;
    },
    {} as Record<string, RelationInfo[]>
  );

  const toggleResource = (resourceId: string) => {
    setExpandedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-14 h-[calc(100vh-56px)] w-96 border-l border-border bg-card shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Resource Information</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 w-full">
        <div className="p-4 space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-primary/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{resources.length}</div>
              <div className="text-xs text-muted-foreground">Resources</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{relations.length}</div>
              <div className="text-xs text-muted-foreground">Relations</div>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-orange-600">{unidentified.length}</div>
              <div className="text-xs text-muted-foreground">Unidentified</div>
            </div>
          </div>

          {/* Resources Section */}
          {resources.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Database className="h-4 w-4" />
                Resources ({resources.length})
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(groupedResources).map(([type, typeResources]) => (
                  <AccordionItem key={type} value={type}>
                    <AccordionTrigger className="text-sm">
                      <span>{type}</span>
                      <Badge className="ml-2" variant="secondary">
                        {typeResources.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2">
                        {typeResources.map(resource => (
                          <div key={resource.id} className="text-xs">
                            <button
                              onClick={() => toggleResource(resource.id)}
                              className="flex items-center gap-2 p-2 rounded hover:bg-secondary w-full text-left"
                            >
                              <ChevronDown
                                className={`h-3 w-3 transition-transform ${
                                  expandedResources.includes(resource.id)
                                    ? 'transform rotate-180'
                                    : ''
                                }`}
                              />
                              <span className="font-medium truncate">
                                {resource.label}
                              </span>
                            </button>
                            {expandedResources.includes(resource.id) && (
                              <div className="ml-6 text-muted-foreground space-y-1 mt-1 border-l border-border pl-2">
                                {Object.entries(resource.properties)
                                  .filter(([key]) => !key.startsWith('resourceType') && key !== 'label')
                                  .slice(0, 5)
                                  .map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">{key}:</span>{' '}
                                      <span className="truncate">
                                        {typeof value === 'object'
                                          ? JSON.stringify(value).substring(0, 20)
                                          : String(value).substring(0, 30)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Relations Section */}
          {relations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Relations ({relations.length})
              </h3>
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(groupedRelations).map(([sourceType, typeRelations]) => (
                  <AccordionItem key={sourceType} value={sourceType}>
                    <AccordionTrigger className="text-sm">
                      <span>{sourceType}</span>
                      <Badge className="ml-2" variant="secondary">
                        {typeRelations.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2">
                        {typeRelations.map((relation, idx) => (
                          <div
                            key={`${relation.from}-${relation.to}-${idx}`}
                            className="text-xs bg-secondary/50 rounded p-2 space-y-1"
                          >
                            <div className="font-medium">
                              <span className="text-primary truncate">
                                {relation.fromLabel}
                              </span>
                            </div>
                            <div className="text-center text-muted-foreground">
                              ↓ {relation.type}
                            </div>
                            <div className="font-medium">
                              <span className="text-blue-600 truncate">
                                {relation.toLabel}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Orphaned Relations Section */}
          {orphanedRelations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-red-200 bg-red-50 dark:bg-red-950/20 rounded-lg p-3">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                Orphaned Relations ({orphanedRelations.length})
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                These relations reference unknown or missing resources:
              </p>
              <div className="space-y-2">
                {orphanedRelations.map((relation, idx) => {
                  const sourceNode = nodes.find(n => n.id === relation.from);
                  const targetNode = nodes.find(n => n.id === relation.to);
                  const sourceIsIdentified = sourceNode?.data?.resourceType?.id && 
                                            sourceNode.data.resourceType.id !== 'region' &&
                                            sourceNode.data.resourceType.id !== 'unknown';
                  const targetIsIdentified = targetNode?.data?.resourceType?.id && 
                                            targetNode.data.resourceType.id !== 'region' &&
                                            targetNode.data.resourceType.id !== 'unknown';

                  return (
                    <div
                      key={`${relation.from}-${relation.to}-${idx}`}
                      className="text-xs bg-red-100 dark:bg-red-900/30 rounded p-2 border border-red-300 dark:border-red-700"
                    >
                      <div className={`font-medium truncate ${sourceIsIdentified ? 'text-red-800' : 'text-red-700'} dark:text-red-200`}>
                        {relation.fromLabel} {!sourceIsIdentified && ' ⚠️'}
                      </div>
                      <div className="text-center text-red-600 dark:text-red-400 my-1">
                        ↓ {relation.type}
                      </div>
                      <div className={`font-medium truncate ${targetIsIdentified ? 'text-red-800' : 'text-red-700'} dark:text-red-200`}>
                        {relation.toLabel} {!targetIsIdentified && ' ⚠️'}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1 text-center">
                        {!sourceIsIdentified && 'Source unknown'} {!sourceIsIdentified && !targetIsIdentified && ' | '} {!targetIsIdentified && 'Target unknown'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Unidentified Resources Section */}
          {unidentified.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-orange-200 bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                Unidentified Resources ({unidentified.length})
              </h3>
              <div className="space-y-2">
                {unidentified.map(resource => (
                  <div
                    key={resource.id}
                    className="text-xs bg-orange-100 dark:bg-orange-900/30 rounded p-2 border border-orange-200 dark:border-orange-800"
                  >
                    <div className="font-medium text-orange-800 dark:text-orange-200">
                      {resource.label}
                    </div>
                    <div className="text-orange-700 dark:text-orange-300 mt-1">
                      Type: {resource.type}
                    </div>
                    <div className="text-orange-600 dark:text-orange-400 text-xs mt-1">
                      ID: {resource.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {resources.length === 0 && relations.length === 0 && orphanedRelations.length === 0 && unidentified.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No resources loaded</p>
              <p className="text-xs mt-2">
                Upload or draw a diagram to see resource information
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
