import { X } from 'lucide-react';
import { useDiagramStore } from '@/store/diagramStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState, useMemo } from 'react';
import { calculateResourceCost } from '@/lib/costCalculator';

export const PropertiesPanel = () => {
  const { nodes, selectedNode, updateNodeLabel, updateNodeAttribute, deleteNode, setSelectedNode } =
    useDiagramStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const node = nodes.find((n) => n.id === selectedNode);

  const costEstimate = useMemo(
    () => {
      if (!node) return { hourly: 0, monthly: 0, currency: 'USD', details: [] };
      const { resourceType, config = {} } = node.data;
      return calculateResourceCost(resourceType.id, config);
    },
    [node]
  );

  if (!node) {
    return (
      <div className="w-80 border-l border-border bg-card p-6 flex flex-col items-center justify-center text-center">
        <div className="text-muted-foreground">
          <p className="text-sm">Select a resource to view and edit its properties</p>
        </div>
      </div>
    );
  }

  const { label, resourceType, config = {} } = node.data;
  const { editableAttributes = [] } = resourceType;

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">{resourceType.name}</h3>
          <p className="text-xs text-muted-foreground">{resourceType.description}</p>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 rounded hover:bg-secondary transition-colors ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Cost Estimate */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 uppercase">
            Estimated Monthly Cost
          </h4>
          <div className="space-y-1">
            <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
              ${costEstimate.monthly.toFixed(2)}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              ~${costEstimate.hourly.toFixed(4)}/hour
            </p>
          </div>
          {costEstimate.details.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-1">
              {costEstimate.details.map((detail, idx) => (
                <p key={idx} className="text-xs text-amber-700 dark:text-amber-400">
                  {detail}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Label */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Label</Label>
          <Input
            value={label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            className="h-9"
            placeholder="Node label"
          />
        </div>

        {/* Editable Attributes */}
        {editableAttributes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">
              Configuration
            </h4>
            <div className="space-y-4">
              {editableAttributes.map((attr) => {
                const value = config[attr.key];

                switch (attr.type) {
                  case 'text':
                    return (
                      <div key={attr.key} className="space-y-2">
                        <Label htmlFor={attr.key} className="text-sm">
                          {attr.label}
                          {attr.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id={attr.key}
                          type="text"
                          value={value || ''}
                          onChange={(e) =>
                            updateNodeAttribute(node.id, attr.key, e.target.value)
                          }
                          placeholder={attr.placeholder}
                          className="h-9"
                        />
                      </div>
                    );

                  case 'number':
                    return (
                      <div key={attr.key} className="space-y-2">
                        <Label htmlFor={attr.key} className="text-sm">
                          {attr.label}
                          {attr.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id={attr.key}
                          type="number"
                          value={value || ''}
                          onChange={(e) =>
                            updateNodeAttribute(
                              node.id,
                              attr.key,
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          placeholder={attr.placeholder}
                          className="h-9"
                        />
                      </div>
                    );

                  case 'textarea':
                    return (
                      <div key={attr.key} className="space-y-2">
                        <Label htmlFor={attr.key} className="text-sm">
                          {attr.label}
                          {attr.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Textarea
                          id={attr.key}
                          value={value || ''}
                          onChange={(e) =>
                            updateNodeAttribute(node.id, attr.key, e.target.value)
                          }
                          placeholder={attr.placeholder}
                          className="min-h-20 text-sm"
                        />
                      </div>
                    );

                  case 'select':
                    return (
                      <div key={attr.key} className="space-y-2">
                        <Label htmlFor={attr.key} className="text-sm">
                          {attr.label}
                          {attr.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Select
                          value={String(value || '')}
                          onValueChange={(val) =>
                            updateNodeAttribute(node.id, attr.key, val)
                          }
                        >
                          <SelectTrigger id={attr.key} className="h-9">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {attr.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );

                  case 'boolean':
                    return (
                      <div key={attr.key} className="flex items-center justify-between py-2">
                        <Label htmlFor={attr.key} className="text-sm cursor-pointer">
                          {attr.label}
                        </Label>
                        <input
                          id={attr.key}
                          type="checkbox"
                          checked={Boolean(value)}
                          onChange={(e) =>
                            updateNodeAttribute(node.id, attr.key, e.target.checked)
                          }
                          className="w-4 h-4 rounded border-input cursor-pointer"
                        />
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Delete Resource
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteNode(node.id);
                setSelectedNode(null);
                setShowDeleteConfirm(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
