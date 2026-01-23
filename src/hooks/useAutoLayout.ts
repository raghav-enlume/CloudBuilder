/**
 * useAutoLayout Hook
 * 
 * Provides automatic layout functionality for AWS diagrams
 * Integrates with ReactFlow and manages layout state
 */

import { useCallback, useEffect, useState } from 'react';
import { Node, Edge, useReactFlow } from 'reactflow';
import {
  layoutAWSResources,
  LayoutConfig,
  shouldApplyLayout,
} from '@/lib/layoutEngine';

export interface UseAutoLayoutOptions {
  enabled?: boolean;
  strategy?: 'hierarchical' | 'grid' | 'force';
  autoApply?: boolean;
  config?: Partial<LayoutConfig>;
}

/**
 * Hook for automatic layout of AWS resources
 * 
 * @example
 * ```tsx
 * const { layout, isLayouting } = useAutoLayout({ enabled: true });
 * 
 * const handleLayout = () => {
 *   const layoutedNodes = layout(nodes, edges);
 *   updateNodes(layoutedNodes);
 * };
 * ```
 */
export const useAutoLayout = (options: UseAutoLayoutOptions = {}) => {
  const {
    enabled = true,
    strategy = 'hierarchical',
    autoApply = false,
    config,
  } = options;

  const { getNodes, setNodes } = useReactFlow();
  const [isLayouting, setIsLayouting] = useState(false);

  /**
   * Apply layout to nodes
   */
  const layout = useCallback(
    (nodes: Node[], edges: Edge[]): Node[] => {
      if (!enabled || nodes.length === 0) return nodes;

      setIsLayouting(true);
      try {
        const layoutedNodes = layoutAWSResources(
          nodes.map((n) => ({ ...n })), // Clone nodes
          edges,
          strategy,
          config
        );
        return layoutedNodes;
      } catch (error) {
        console.error('Layout error:', error);
        return nodes;
      } finally {
        setIsLayouting(false);
      }
    },
    [enabled, strategy, config]
  );

  /**
   * Apply layout and update nodes in the diagram
   */
  const applyLayout = useCallback(() => {
    const nodes = getNodes();
    const layoutedNodes = layout(nodes, []);

    if (layoutedNodes !== nodes) {
      setNodes(layoutedNodes);
    }
  }, [getNodes, layout, setNodes]);

  /**
   * Auto-apply layout on node changes
   */
  useEffect(() => {
    if (!autoApply || !enabled) return;

    const timer = setTimeout(() => {
      const nodes = getNodes();
      if (shouldApplyLayout(nodes)) {
        applyLayout();
      }
    }, 500); // Debounce

    return () => clearTimeout(timer);
  }, [autoApply, enabled, getNodes, applyLayout]);

  return {
    layout,
    applyLayout,
    isLayouting,
  };
};

/**
 * Hook for hierarchical layout specifically
 */
export const useHierarchicalLayout = (options: Omit<UseAutoLayoutOptions, 'strategy'> = {}) => {
  return useAutoLayout({ ...options, strategy: 'hierarchical' });
};

/**
 * Hook for grid layout specifically
 */
export const useGridLayout = (options: Omit<UseAutoLayoutOptions, 'strategy'> = {}) => {
  return useAutoLayout({ ...options, strategy: 'grid' });
};

/**
 * Hook for force-directed layout specifically
 */
export const useForceDirectedLayout = (options: Omit<UseAutoLayoutOptions, 'strategy'> = {}) => {
  return useAutoLayout({ ...options, strategy: 'force' });
};
