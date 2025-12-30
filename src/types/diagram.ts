export type ResourceCategory = 'compute' | 'storage' | 'database' | 'networking' | 'security' | 'analytics';

export type AttributeType = 'text' | 'number' | 'select' | 'boolean' | 'textarea';

import { ReactNode } from 'react';

export interface EditableAttribute {
  key: string;
  label: string;
  type: AttributeType;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
}

export interface ResourceType {
  id: string;
  name: string;
  category: ResourceCategory;
  icon: string;
  description: string;
  color: string;
  editableAttributes?: EditableAttribute[];
}

export interface DiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    resourceType: ResourceType;
    config?: Record<string, unknown>;
  };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, unknown>;
}

export interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNode: string | null;
}
