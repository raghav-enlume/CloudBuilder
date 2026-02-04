/**
 * Example: Using Custom ELK Layout Configuration
 * This shows how to customize the layout positioning in CloudBuilder
 */

import { convertFlatArrayImport } from '../lib/flatArrayConverter';
import { compactLayout, wideLayout, verticalLayout } from '../lib/elkConfigs';

// Example flat array data
const sampleData = [
  {
    region: "us-east-1",
    total_resources: 5,
    resources: [
      {
        region: "us-east-1",
        cloud_resource_id: "vpc-12345",
        resource_name: "Production VPC",
        resource_type: "VPC",
        resource_property: {
          VpcId: "vpc-12345",
          CidrBlock: "10.0.0.0/16"
        }
      },
      {
        region: "us-east-1",
        cloud_resource_id: "subnet-public",
        resource_name: "Public Subnet",
        resource_type: "SUBNET",
        resource_property: {
          SubnetId: "subnet-public",
          VpcId: "vpc-12345",
          CidrBlock: "10.0.1.0/24"
        }
      },
      {
        region: "us-east-1",
        cloud_resource_id: "i-12345",
        resource_name: "web-server",
        resource_type: "EC2",
        resource_property: {
          InstanceId: "i-12345",
          VpcId: "vpc-12345",
          SubnetId: "subnet-public"
        }
      }
    ]
  }
];

// Example 1: Default layout (current behavior)
async function useDefaultLayout() {
  const result = await convertFlatArrayImport(sampleData, true);
  console.log('Default layout:', result);
}

// Example 2: Compact layout (smaller spacing)
async function useCompactLayout() {
  const result = await convertFlatArrayImport(sampleData, true, compactLayout);
  console.log('Compact layout:', result);
}

// Example 3: Wide layout (more horizontal space)
async function useWideLayout() {
  const result = await convertFlatArrayImport(sampleData, true, wideLayout);
  console.log('Wide layout:', result);
}

// Example 4: Vertical layout (everything flows down)
async function useVerticalLayout() {
  const result = await convertFlatArrayImport(sampleData, true, verticalLayout);
  console.log('Vertical layout:', result);
}

// Example 5: Custom configuration
async function useCustomConfig() {
  const customConfig = {
    rootDirection: 'RIGHT',      // Horizontal root layout
    vpcDirection: 'DOWN',        // Vertical VPC containers
    subnetDirection: 'RIGHT',    // Horizontal subnets
    rootSpacing: 60,             // More space between root elements
    nodeSpacing: 40,             // More space between nodes
    algorithm: 'layered' as const,
  };

  const result = await convertFlatArrayImport(sampleData, true, customConfig);
  console.log('Custom layout:', result);
}

// Example 6: Force-directed layout (organic positioning)
async function useForceLayout() {
  const forceConfig = {
    algorithm: 'force' as const,
    rootDirection: 'DOWN' as const,
    rootSpacing: 50,
  };

  const result = await convertFlatArrayImport(sampleData, true, forceConfig);
  console.log('Force layout:', result);
}

// Usage:
// Call any of these functions with your data
// useCompactLayout();