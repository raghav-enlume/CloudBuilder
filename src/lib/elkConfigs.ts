/**
 * ELK Layout Configuration Examples
 * Customize positioning and layout behavior for CloudBuilder diagrams
 */

import type { ElkLayoutConfig } from './graphLayout';

// Default Configuration (Current Behavior)
export const defaultLayout: ElkLayoutConfig = {
  rootDirection: 'DOWN',
  rootSpacing: 60,  // Increased for better clearance between groups and standalone nodes
  rootLayerSpacing: 50,  // Increased for better vertical separation
  vpcDirection: 'RIGHT',
  subnetDirection: 'DOWN',
  containerPadding: '[top=25,left=15,bottom=15,right=15]',  // More generous padding
  nodeSpacing: 25,  // Increased spacing between resource nodes
  algorithm: 'layered',
  nodeNodeBetweenLayers: 40,  // Increased for better layer separation
  edgeNodeBetweenLayers: 20,  // Increased for better edge clearance
  considerModelOrder: 'NONE',
  cycleBreaking: 'GREEDY',
  layering: 'NETWORK_SIMPLEX',
  crossingMinimization: 'LAYER_SWEEP',
  nodePlacement: 'BRANDES_KOEPF',
};

// Compact Layout - Smaller spacing, more dense
export const compactLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootSpacing: 10,  // Very tight spacing
  rootLayerSpacing: 15,
  nodeSpacing: 8,   // Minimal node spacing
  containerPadding: '[top=10,left=5,bottom=5,right=5]',
};

// Wide Layout - More horizontal space
export const wideLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootDirection: 'RIGHT',
  rootSpacing: 30,        // Moderate spacing for smaller nodes
  rootLayerSpacing: 40,
  nodeSpacing: 25,        // Comfortable spacing
  containerPadding: '[top=20,left=15,bottom=15,right=15]',
};

// Vertical Layout - Everything flows vertically
export const verticalLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootDirection: 'DOWN',
  vpcDirection: 'DOWN',
  subnetDirection: 'DOWN',
};

// Horizontal Layout - Everything flows horizontally
export const horizontalLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootDirection: 'RIGHT',
  vpcDirection: 'RIGHT',
  subnetDirection: 'RIGHT',
};

// Force-Directed Layout - Organic, connection-based positioning
export const forceLayout: ElkLayoutConfig = {
  ...defaultLayout,
  algorithm: 'force',
  rootDirection: 'DOWN',
};

// Radial Layout - Circular arrangement
export const radialLayout: ElkLayoutConfig = {
  ...defaultLayout,
  algorithm: 'radial',
  rootDirection: 'DOWN',
};

// Minimal Spacing - Very tight layout
export const minimalLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootSpacing: 10,
  rootLayerSpacing: 15,
  nodeSpacing: 8,
  containerPadding: '[top=10,left=5,bottom=5,right=5]',
  nodeNodeBetweenLayers: 20,
  edgeNodeBetweenLayers: 10,
};

// Presentation Layout - Clean, spacious for presentations
export const presentationLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootSpacing: 50,        // Very spacious
  rootLayerSpacing: 60,
  nodeSpacing: 40,        // Lots of space between nodes
  containerPadding: '[top=35,left=25,bottom=25,right=25]',
  nodeNodeBetweenLayers: 50,
  edgeNodeBetweenLayers: 25,
};

// Spacious Layout - Maximum breathing room between nodes
export const spaciousLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootSpacing: 80,        // Maximum spacing for groups and standalone nodes
  rootLayerSpacing: 100,  // Very generous vertical separation
  nodeSpacing: 50,        // Very generous spacing between nodes
  containerPadding: '[top=40,left=30,bottom=30,right=30]',
  nodeNodeBetweenLayers: 80,  // Maximum layer separation
  edgeNodeBetweenLayers: 40,  // Maximum edge clearance
};

// Internet-Friendly Layout - Extra clearance for internet gateways and external nodes
export const internetFriendlyLayout: ElkLayoutConfig = {
  ...defaultLayout,
  rootDirection: 'DOWN',
  rootSpacing: 100,       // Maximum clearance between groups and internet nodes
  rootLayerSpacing: 80,   // Good vertical separation
  nodeSpacing: 35,        // Comfortable spacing between nodes
  containerPadding: '[top=30,left=25,bottom=25,right=25]',
  nodeNodeBetweenLayers: 60,  // Good layer separation
  edgeNodeBetweenLayers: 30,  // Good edge clearance
};

// Usage Example:
/*
// In your component or import function:
import { convertFlatArrayImport } from './lib/flatArrayConverter';
import { compactLayout, spaciousLayout, presentationLayout, internetFriendlyLayout } from './lib/elkConfigs';

// Use internet-friendly layout to prevent overlap between groups and internet nodes
const result = await convertFlatArrayImport(data, true, internetFriendlyLayout);

// Use spacious layout for maximum breathing room between nodes
const result = await convertFlatArrayImport(data, true, spaciousLayout);

// Use presentation layout for clean, professional spacing
const result = await convertFlatArrayImport(data, true, presentationLayout);

// Use compact layout for dense arrangements
const result = await convertFlatArrayImport(data, true, compactLayout);
*/