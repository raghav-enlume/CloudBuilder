import { Download, Upload, Undo, Redo, FileArchive, Library, List } from 'lucide-react';
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
import { ARCHITECTURE_TEMPLATES } from '@/data/templates';
import { convertFlatArrayImport, parseImportFormat } from '@/lib/flatArrayConverter';

export const Toolbar = ({ isInfoPanelOpen, onToggleInfoPanel }: { isInfoPanelOpen: boolean; onToggleInfoPanel: () => void }) => {
  const { nodes, edges, clearDiagram, undo, redo, canUndo, canRedo, loadDiagram, updateNodes } = useDiagramStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [importTab, setImportTab] = useState<'standard' | 'aws-flat'>('standard');

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

      // Auto-detect format and convert if needed
      const format = parseImportFormat(data);
      let nodesToLoad: Node[] = [];
      let edgesToLoad: Edge[] = [];

      if (format === 'flat-array') {
        // Convert flat-array to diagram format with layout
        const converted = await convertFlatArrayImport(data, true);
        if (converted) {
          nodesToLoad = converted.nodes;
          edgesToLoad = converted.edges;
          
          toast({
            title: 'AWS Flat Array imported',
            description: `Converted and loaded ${converted.nodes.length} resources with ${converted.edges.length} connections.`,
          });
        } else {
          throw new Error('Failed to convert flat-array format');
        }
      } else if (format === 'diagram') {
        // Standard diagram format
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
          throw new Error('The file must contain valid nodes and edges arrays.');
        }
        nodesToLoad = data.nodes as Node[];
        edgesToLoad = data.edges as Edge[];
        
        toast({
          title: 'Diagram imported',
          description: `Loaded ${data.nodes.length} nodes and ${data.edges.length} connections.`,
        });
      } else {
        throw new Error('Unknown file format. Expected diagram format or AWS flat-array format.');
      }

      // Load the diagram
      console.log('Loading diagram with nodes and edges:', nodesToLoad, edgesToLoad);
      loadDiagram(nodesToLoad, edgesToLoad);
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import the file.',
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

  // Layout engine removed — layout controls were intentionally dropped.

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
                  <DialogTitle>Import Architecture</DialogTitle>
                  <DialogDescription>
                    Import from standard diagram format or AWS flat-array format
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="flex gap-2 border-b">
                    <button
                      onClick={() => setImportTab('standard')}
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        importTab === 'standard'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setImportTab('aws-flat')}
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        importTab === 'aws-flat'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      AWS Flat Array
                    </button>
                  </div>
                  
                  {importTab === 'standard' && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Import a diagram exported from this application (JSON format with nodes and edges)
                      </p>
                      <Button 
                        onClick={() => {
                          setIsImportDialogOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Select JSON File
                      </Button>
                    </div>
                  )}
                  
                  {importTab === 'aws-flat' && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Import AWS architecture from flat-array JSON format. Auto-converts to diagram format with inferred relationships.
                      </p>
                      <Button 
                        onClick={() => {
                          setIsImportDialogOpen(false);
                          fileInputRef.current?.click();
                        }}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Select AWS Flat Array JSON
                      </Button>
                      <div className="bg-secondary/50 p-3 rounded text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold">Expected format:</p>
                        <code className="block bg-background p-1 rounded mt-1 overflow-auto">
                          {`[{"region": "...", "resources": [...]}]`}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </TooltipTrigger>
          <TooltipContent>Import Diagram or AWS Architecture</TooltipContent>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          aria-label="Import standard diagram"
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
