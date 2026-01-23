import { Trash2, Download, Upload, Undo, Redo, FileArchive, Zap, Library, Cloud, Layout, Maximize2, Grid3x3, List } from 'lucide-react';
import JSZip from 'jszip';
import { useRef, useState } from 'react';
import { Node, Edge } from 'reactflow';
import { Button } from '@/components/ui/button';
import { useDiagramStore } from '@/store/diagramStore';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { parseArchitectureJSON } from '@/lib/architectureParser';
import { parseAWSDataJSON } from '@/lib/awsDataParser';
import { ARCHITECTURE_TEMPLATES } from '@/data/templates';
import { layoutAWSResources } from '@/lib/layoutEngine';

export const Toolbar = ({ isInfoPanelOpen, onToggleInfoPanel }: { isInfoPanelOpen: boolean; onToggleInfoPanel: () => void }) => {
  const { nodes, edges, clearDiagram, undo, redo, canUndo, canRedo, loadDiagram, updateNodes } = useDiagramStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const architectureFileInputRef = useRef<HTMLInputElement>(null);
  const awsDataFileInputRef = useRef<HTMLInputElement>(null);
  const dbJsonFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isLayouting, setIsLayouting] = useState(false);

  const handleExportJSON = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'architecture-diagram.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Diagram exported',
      description: 'Your architecture diagram has been saved as JSON.',
    });
  };

  const handleExportZip = async () => {
    if (nodes.length === 0) {
      toast({
        title: 'Nothing to export',
        description: 'Add some resources to your diagram first.',
        variant: 'destructive',
      });
      return;
    }

    const zip = new JSZip();
    
    // Add diagram data as JSON
    const diagramData = { nodes, edges, exportedAt: new Date().toISOString() };
    zip.file('diagram.json', JSON.stringify(diagramData, null, 2));
    
    // Add a README file
    const readme = `# Architecture Diagram Export

Exported on: ${new Date().toLocaleString()}

## Contents
- diagram.json: The diagram data (nodes and connections)

## Statistics
- Nodes: ${nodes.length}
- Connections: ${edges.length}

## How to Import
1. Open the Architecture Diagram Builder
2. Click the Import button
3. Select the diagram.json file

## Node Types Used
${[...new Set(nodes.map(n => n.data.resourceType))].map(type => `- ${type}`).join('\n')}
`;
    zip.file('README.md', readme);

    // Generate and download the ZIP
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `architecture-diagram-${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'ZIP exported',
      description: 'Your diagram has been downloaded as a ZIP file.',
    });
  };

  const handleClear = () => {
    if (nodes.length === 0) {
      toast({
        title: 'Canvas is empty',
        description: 'There are no nodes to clear.',
        variant: 'destructive',
      });
      return;
    }
    
    clearDiagram();
    toast({
      title: 'Canvas cleared',
      description: 'All nodes and connections have been removed.',
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);

      // Validate the imported data
      if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        toast({
          title: 'Invalid format',
          description: 'The file must contain valid nodes and edges arrays.',
          variant: 'destructive',
        });
        return;
      }

      // Load the diagram
      loadDiagram(data.nodes as Node[], data.edges as Edge[]);

      toast({
        title: 'Diagram imported',
        description: `Loaded ${data.nodes.length} nodes and ${data.edges.length} connections.`,
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import the diagram file.',
        variant: 'destructive',
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleArchitectureImportClick = () => {
    architectureFileInputRef.current?.click();
  };

  const handleArchitectureImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const data = JSON.parse(fileContent);

      // Validate the imported architecture data
      if (!data.architecture || !Array.isArray(data.architecture.components) || !Array.isArray(data.architecture.connections)) {
        toast({
          title: 'Invalid architecture format',
          description: 'The file must contain valid architecture.components and architecture.connections arrays.',
          variant: 'destructive',
        });
        return;
      }

      // Parse architecture JSON to nodes and edges
      const { nodes: parsedNodes, edges: parsedEdges } = parseArchitectureJSON(data);

      // Load the diagram
      loadDiagram(parsedNodes, parsedEdges);

      toast({
        title: 'Architecture imported',
        description: `Loaded ${data.architecture.name || 'diagram'} with ${parsedNodes.length} components and ${parsedEdges.length} connections.`,
      });

      setIsImportDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import the architecture file.',
        variant: 'destructive',
      });
    }

    // Reset file input
    if (architectureFileInputRef.current) {
      architectureFileInputRef.current.value = '';
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = ARCHITECTURE_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      toast({
        title: 'Template not found',
        description: 'The selected template could not be loaded.',
        variant: 'destructive',
      });
      return;
    }

    loadDiagram(template.nodes, template.edges);
    
    toast({
      title: 'Template loaded',
      description: `${template.name} has been loaded into your diagram.`,
    });

    setIsTemplateDialogOpen(false);
  };

  const handleAWSDataImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      const data = JSON.parse(fileContent) as Record<string, unknown>;

      // Validate the AWS data format - sample-web-app.json format
      // Format: { [regionKey]: { vpcs, subnets, instances, security_groups, rds_instances, s3_buckets, ... } }
      const isValidAWSData = Object.values(data).some((region: unknown) => {
        if (typeof region !== 'object' || region === null) return false;
        const regionObj = region as Record<string, unknown>;
        // Check if it has any AWS resource arrays
        return (
          Array.isArray(regionObj.vpcs) ||
          Array.isArray(regionObj.subnets) ||
          Array.isArray(regionObj.instances) ||
          Array.isArray(regionObj.security_groups) ||
          Array.isArray(regionObj.rds_instances) ||
          Array.isArray(regionObj.s3_buckets) ||
          Array.isArray(regionObj.internet_gateways) ||
          Array.isArray(regionObj.nat_gateways)
        );
      });

      if (!isValidAWSData) {
        toast({
          title: 'Invalid AWS data format',
          description: 'The file must be in sample-web-app.json format with AWS region data containing at least one resource type (VPCs, Subnets, EC2 Instances, Security Groups, RDS, S3, Internet Gateway, or NAT Gateway).',
          variant: 'destructive',
        });
        return;
      }

      // Parse AWS data to nodes and edges
      const { nodes: parsedNodes, edges: parsedEdges } = await parseAWSDataJSON(data);

      // Load the diagram
      loadDiagram(parsedNodes, parsedEdges);

      // Count resources
      const vpcCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'vpc').length;
      const subnetCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'subnet').length;
      const instanceCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'ec2').length;
      const rdsCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'rds').length;
      const s3Count = parsedNodes.filter(n => n.data?.resourceType?.id === 's3').length;
      const sgCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'securitygroup').length;

      const resourceSummary = [
        vpcCount > 0 && `${vpcCount} VPCs`,
        subnetCount > 0 && `${subnetCount} Subnets`,
        instanceCount > 0 && `${instanceCount} EC2 Instances`,
        rdsCount > 0 && `${rdsCount} RDS Databases`,
        s3Count > 0 && `${s3Count} S3 Buckets`,
        sgCount > 0 && `${sgCount} Security Groups`,
      ]
        .filter(Boolean)
        .join(', ');

      toast({
        title: 'AWS data imported',
        description: `Loaded ${resourceSummary || 'resources'} with ${parsedEdges.length} connections.`,
      });

      setIsImportDialogOpen(false);

      // Auto-apply hierarchical layout
      setTimeout(() => {
        handleApplyLayout('hierarchical');
      }, 300);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import the AWS data file.',
        variant: 'destructive',
      });
    }

    // Reset file input
    if (awsDataFileInputRef.current) {
      awsDataFileInputRef.current.value = '';
    }
  };

  const handleDBJsonImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await file.text();
      let data = JSON.parse(fileContent);

      // Import the parser function
      const { getAWSDataFromDBJson } = await import('@/lib/dbJsonParser');
      
      // Handle multiple formats:
      // 1. Array of wrapped objects (multiple regions): [{region, resources}, ...]
      // 2. Single wrapped object: {region, resources}
      // 3. Flat array of resources: [resource, ...]
      
      let resourcesArray: any[] = [];
      let isMultiRegion = false;
      
      // Check if array of wrapped objects (each with region and resources)
      if (Array.isArray(data) && data.length > 0 && data[0]?.region && data[0]?.resources && Array.isArray(data[0].resources)) {
        isMultiRegion = true;
        // Flatten all resources from all regions for validation
        resourcesArray = data.flatMap((region: any) => region.resources || []);
      }
      // Check if wrapped single object
      else if (data.resources && Array.isArray(data.resources)) {
        resourcesArray = data.resources;
      }
      // Check if flat array
      else if (Array.isArray(data)) {
        resourcesArray = data;
      }
      
      // Validate the DB JSON format
      const isValidDBJson = resourcesArray.length > 0 && resourcesArray.some((item: any) => 
        item.resource_type && (item.resource_property || item.id)
      );

      if (!isValidDBJson) {
        toast({
          title: 'Invalid DB JSON format',
          description: 'The file must contain resources with resource_type and resource_property fields.',
          variant: 'destructive',
        });
        return;
      }

      // Convert DB JSON to AWS format (handles all formats internally)
      const awsData = getAWSDataFromDBJson(data);
      
      // Parse AWS data to nodes and edges
      const { nodes: parsedNodes, edges: parsedEdges } = await parseAWSDataJSON(awsData);

      // Load the diagram
      loadDiagram(parsedNodes, parsedEdges);

      // Count resources
      const vpcCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'vpc').length;
      const subnetCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'subnet').length;
      const instanceCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'ec2').length;
      const rdsCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'rds').length;
      const natCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'nat').length;
      const igwCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'igw').length;
      const s3Count = parsedNodes.filter(n => n.data?.resourceType?.id === 's3').length;
      const sgCount = parsedNodes.filter(n => n.data?.resourceType?.id === 'securitygroup').length;

      const resourceSummary = [
        vpcCount > 0 && `${vpcCount} VPCs`,
        subnetCount > 0 && `${subnetCount} Subnets`,
        instanceCount > 0 && `${instanceCount} EC2 Instances`,
        rdsCount > 0 && `${rdsCount} RDS Databases`,
        natCount > 0 && `${natCount} NAT Gateways`,
        igwCount > 0 && `${igwCount} Internet Gateways`,
        s3Count > 0 && `${s3Count} S3 Buckets`,
        sgCount > 0 && `${sgCount} Security Groups`,
      ]
        .filter(Boolean)
        .join(', ');

      toast({
        title: 'DB JSON imported',
        description: `Loaded ${resourceSummary || 'resources'} with ${parsedEdges.length} connections.${isMultiRegion ? ' (Multi-region)' : ''}`,
      });

      setIsImportDialogOpen(false);

      // Auto-apply hierarchical layout
      setTimeout(() => {
        handleApplyLayout('hierarchical');
      }, 300);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import the DB JSON file.',
        variant: 'destructive',
      });
    }

    // Reset file input
    if (dbJsonFileInputRef.current) {
      dbJsonFileInputRef.current.value = '';
    }
  };

  const handleApplyLayout = (strategy: 'hierarchical' | 'grid' | 'force') => {
    if (nodes.length === 0) {
      toast({
        title: 'Empty diagram',
        description: 'Add some resources before applying layout.',
        variant: 'destructive',
      });
      return;
    }

    setIsLayouting(true);
    try {
      const layoutedNodes = layoutAWSResources(
        nodes.map((n) => ({ ...n })),
        edges,
        strategy
      );
      updateNodes(layoutedNodes);

      // Dispatch event to fit view (handled in DiagramCanvas which is inside ReactFlowProvider)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('layoutApplied', { detail: { strategy } }));
      }, 100);

      toast({
        title: 'Layout applied',
        description: `Resources arranged using ${strategy} layout.`,
      });
    } catch (error) {
      console.error('Layout error:', error);
      toast({
        title: 'Layout failed',
        description: 'Could not apply layout to diagram.',
        variant: 'destructive',
      });
    } finally {
      setIsLayouting(false);
    }
  };

  return (
    <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">
            {nodes.length} nodes
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {edges.length} connections
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => undo()}
              disabled={!canUndo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => redo()}
              disabled={!canRedo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExportJSON}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export JSON</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExportZip}>
              <FileArchive className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download ZIP</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Import Diagram</DialogTitle>
                  <DialogDescription>
                    Choose the format of your diagram file to import
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  <Button 
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Standard Diagram Format
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      architectureFileInputRef.current?.click();
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Architecture Format
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      awsDataFileInputRef.current?.click();
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    AWS Data Format
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      dbJsonFileInputRef.current?.click();
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Cloud className="h-4 w-4 mr-2" />
                    DB Format (Flat Array)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>Import Diagram</TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          aria-label="Import standard diagram"
        />

        <input
          ref={architectureFileInputRef}
          type="file"
          accept=".json"
          onChange={handleArchitectureImport}
          className="hidden"
          aria-label="Import architecture diagram"
        />

        <input
          ref={awsDataFileInputRef}
          type="file"
          accept=".json"
          onChange={handleAWSDataImport}
          className="hidden"
          aria-label="Import AWS data"
        />

        <input
          ref={dbJsonFileInputRef}
          type="file"
          accept=".json"
          onChange={handleDBJsonImport}
          className="hidden"
          aria-label="Import DB JSON format"
        />

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                >
                  <Library className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Architecture Templates</DialogTitle>
                  <DialogDescription>
                    Select a template to load a pre-configured architecture into your diagram
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                  {ARCHITECTURE_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleLoadTemplate(template.id)}
                      className="p-4 border border-border rounded-lg hover:bg-secondary transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{template.icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">{template.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          <p className="text-xs text-primary mt-2">{template.nodes.length} components • {template.edges.length} connections</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>Template Library</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => handleApplyLayout('hierarchical')}
              disabled={isLayouting || nodes.length === 0}
            >
              <Layout className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Hierarchical Layout (Python diagrams style)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => handleApplyLayout('grid')}
              disabled={isLayouting || nodes.length === 0}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Grid Layout</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => handleApplyLayout('force')}
              disabled={isLayouting || nodes.length === 0}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Force-Directed Layout</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isInfoPanelOpen ? "default" : "ghost"}
              size="icon" 
              className="h-9 w-9"
              onClick={onToggleInfoPanel}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Resource Information</TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-border mx-1" />
      </div>
    </div>
  );
};
