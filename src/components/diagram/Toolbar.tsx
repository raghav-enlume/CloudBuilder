import { Trash2, Download, Upload, Undo, Redo, FileArchive, Zap, Library } from 'lucide-react';
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
import { ARCHITECTURE_TEMPLATES } from '@/data/templates';

export const Toolbar = () => {
  const { nodes, edges, clearDiagram, undo, redo, canUndo, canRedo, loadDiagram } = useDiagramStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const architectureFileInputRef = useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

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
      </div>
    </div>
  );
};
