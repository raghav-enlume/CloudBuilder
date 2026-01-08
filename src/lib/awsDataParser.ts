/* eslint-disable @typescript-eslint/no-explicit-any */
import { Node, Edge } from 'reactflow';
import { cloudResources } from '@/data/resources';

interface AWSDataInput {
  [region: string]: {
    region: string;
    vpcs: any[];
    subnets: any[];
    instances: any[];
    security_groups: any[];
    route_tables: any[];
    [key: string]: any;
  };
}

/**
 * Get resource type from cloudResources by id
 */
const getResourceType = (resourceId: string) => {
  return cloudResources.find(r => r.id === resourceId);
};

/**
 * Create VPC resource type with AWS-specific attributes
 * References the vpc resource type from resources.ts
 */
const getVPCResourceType = () => {
  const baseVPC = getResourceType('vpc');
  return baseVPC || {
    id: 'vpc',
    name: 'VPC',
    category: 'networking',
    icon: 'vpc',
    description: 'Virtual Private Cloud',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Name', type: 'text', placeholder: 'VPC Name' },
      { key: 'cidrBlock', label: 'CIDR Block', type: 'text', placeholder: '10.0.0.0/16' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'isDefault', label: 'Is Default', type: 'boolean' },
    ],
  };
};

/**
 * Create Subnet resource type with AWS-specific attributes
 * Based on vpc resource from resources.ts but customized for subnets
 */
const getSubnetResourceType = () => {
  const baseVPC = getResourceType('vpc');
  return {
    ...(baseVPC || {}),
    id: 'subnet',
    name: 'Subnet',
    description: 'Virtual Subnet',
    icon: 'vpc',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Name', type: 'text', placeholder: 'Subnet Name' },
      { key: 'cidrBlock', label: 'CIDR Block', type: 'text', placeholder: '10.0.1.0/24' },
      { key: 'availabilityZone', label: 'Availability Zone', type: 'text' },
      { key: 'mapPublicIpOnLaunch', label: 'Map Public IP', type: 'boolean' },
      { key: 'state', label: 'State', type: 'text' },
    ],
  };
};

/**
 * Get EC2 resource type
 * Fetches from resources.ts or uses default
 */
const getEC2ResourceType = () => {
  return getResourceType('ec2') || {
    id: 'ec2',
    name: 'EC2 Instance',
    category: 'compute',
    icon: 'ec2',
    description: 'Virtual server in the cloud',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Instance ID', type: 'text' },
      { key: 'instanceType', label: 'Instance Type', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'privateIp', label: 'Private IP', type: 'text' },
      { key: 'publicIp', label: 'Public IP', type: 'text' },
      { key: 'imageId', label: 'Image ID', type: 'text' },
      { key: 'launchTime', label: 'Launch Time', type: 'text' },
    ],
  };
};

/**
 * Get Security Group resource type
 * Uses WAF resource from resources.ts as base
 */
const getSecurityGroupResourceType = () => {
  const baseWAF = getResourceType('waf');
  return {
    ...(baseWAF || {}),
    id: 'securityGroup',
    name: 'Security Group',
    description: 'Security Group',
    icon: 'waf',
    color: '#DD344C',
    editableAttributes: [
      { key: 'label', label: 'Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'groupId', label: 'Group ID', type: 'text' },
      { key: 'vpcId', label: 'VPC ID', type: 'text' },
    ],
  };
};

/**
 * Get Region resource type
 */
const getRegionResourceType = () => {
  return {
    id: 'region',
    name: 'Region',
    category: 'networking',
    icon: 'vpc',
    description: 'AWS Region',
    color: '#3949AB',
    editableAttributes: [
      { key: 'label', label: 'Region Name', type: 'text' },
      { key: 'region', label: 'Region Code', type: 'text' },
    ],
  };
};

/**
 * Get Internet Gateway resource type
 */
const getIGWResourceType = () => {
  const baseELB = getResourceType('elb');
  return {
    ...(baseELB || {}),
    id: 'internetgateway',
    name: 'Internet Gateway',
    category: 'networking',
    icon: 'elb',
    description: 'Internet Gateway',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Gateway ID', type: 'text' },
    ],
  };
};

/**
 * Get Route Table resource type
 */
const getRouteTableResourceType = () => {
  const baseVPC = getResourceType('vpc');
  return {
    ...(baseVPC || {}),
    id: 'routetable',
    name: 'Route Table',
    category: 'networking',
    icon: 'vpc',
    description: 'Route Table',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Route Table ID', type: 'text' },
    ],
  };
};

/**
 * Parse AWS data.json format to nodes and edges
 * Converts Regions, VPCs, Subnets, and Instances into diagram nodes with relationships
 * Uses resource type definitions from cloudResources (resources.ts)
 */
export const parseAWSDataJSON = (
  data: AWSDataInput
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodePositions = new Map<string, { x: number; y: number }>();

  const currentX = 0;
  let currentY = 0;

  // Get resource types from resources.ts
  const regionResourceType = getRegionResourceType();
  const vpcResourceType = getVPCResourceType();
  const subnetResourceType = getSubnetResourceType();
  const ec2ResourceType = getEC2ResourceType();
  const securityGroupResourceType = getSecurityGroupResourceType();
  const igwResourceType = getIGWResourceType();
  const routeTableResourceType = getRouteTableResourceType();

  // Process each region
  Object.entries(data).forEach(([regionKey, regionData]) => {
    if (!regionData.vpcs || !regionData.subnets || !regionData.instances) {
      return;
    }

    const regionNodeId = `region-${regionKey}`;
    const regionX = currentX;
    const regionY = currentY;

    // First pass: Calculate actual VPC heights by analyzing their content
    const vpcHeights: number[] = [];
    const vpcWidths: number[] = [];
    
    regionData.vpcs.forEach((vpc: any) => {
      const vpcSubnets = regionData.subnets.filter((subnet: any) => subnet.VpcId === vpc.VpcId);
      const vpcIGWs = regionData.igws?.filter(
        (igw: any) => igw.Attachments?.some((att: any) => att.VpcId === vpc.VpcId)
      ) || [];
      const vpcRouteTables = regionData.route_tables?.filter((rt: any) => rt.VpcId === vpc.VpcId) || [];
      const vpcSecurityGroups = regionData.security_groups?.filter((sg: any) => sg.VpcId === vpc.VpcId) || [];
      
      const subnetsPerRow = 2;
      const numRows = Math.ceil(vpcSubnets.length / subnetsPerRow);
      const subnetWidth = 380;
      const subnetMargin = 25;
      const vpcPadding = 40;
      
      // Calculate actual row heights
      const rowHeights: number[] = [];
      for (let row = 0; row < numRows; row++) {
        let maxHeightInRow = 100;
        for (let col = 0; col < subnetsPerRow; col++) {
          const index = row * subnetsPerRow + col;
          if (index < vpcSubnets.length) {
            const subnetInstances = regionData.instances.filter(
              (instance: any) => instance.SubnetId === vpcSubnets[index].SubnetId
            );
            const subnetHeight = 120 + Math.max(subnetInstances.length * 80, 80);
            maxHeightInRow = Math.max(maxHeightInRow, subnetHeight);
          }
        }
        rowHeights.push(maxHeightInRow);
      }
      
      const igwHeight = vpcIGWs.length > 0 ? 100 : 0;
      const rtTableHeight = vpcRouteTables.length > 0 ? 120 : 0;
      
      // Only count security groups that have child instances
      const sgWithChildren = vpcSecurityGroups.filter((sg: any) =>
        regionData.instances.some((instance: any) =>
          instance.VpcId === vpc.VpcId &&
          instance.SecurityGroups &&
          instance.SecurityGroups.some((isg: any) => isg.GroupId === sg.GroupId)
        )
      );
      const sgHeight = sgWithChildren.length > 0 ? 100 : 0;
      
      const vpcContentHeight = igwHeight + vpcPadding + rowHeights.reduce((a, b) => a + b + subnetMargin, 0) + rtTableHeight + sgHeight + vpcPadding;
      
      vpcHeights.push(vpcContentHeight);
      
      // Calculate width
      const subnetGridWidth = subnetsPerRow * subnetWidth + (subnetsPerRow + 1) * subnetMargin;
      const igwWidth = 280;
      const igwsWidth = vpcIGWs.length > 0 ? vpcIGWs.length * igwWidth + (vpcIGWs.length + 1) * 25 : 0;
      const rtWidth = 280;
      const rtTableWidth = vpcRouteTables.length > 0 ? vpcRouteTables.length * rtWidth + (vpcRouteTables.length + 1) * 25 : 0;
      const sgWidth = 280;
      const sgTableWidth = sgWithChildren.length > 0 ? sgWithChildren.length * sgWidth + (sgWithChildren.length + 1) * 25 : 0;
      const vpcContainerWidth = Math.max(subnetGridWidth, igwsWidth, rtTableWidth, sgTableWidth) + vpcPadding * 2;
      
      vpcWidths.push(vpcContainerWidth);
    });
    
    // Calculate region dimensions based on actual VPC heights
    const maxVpcHeight = Math.max(...vpcHeights, 0);
    const maxVpcWidth = Math.max(...vpcWidths, 1100);
    const vpcCount = regionData.vpcs.length;
    const vpcMarginBetween = 100; // Significantly increased spacing between VPCs and from region edges
    const regionPadding = 140; // Increased padding to prevent VPCs from extending beyond region border

    const regionContainerWidth = vpcCount * maxVpcWidth + (vpcCount + 1) * vpcMarginBetween;
    const regionContainerHeight = regionPadding * 2 + maxVpcHeight; // Top and bottom padding with extra space


    // Add Region node as the top-level container
    nodes.push({
      id: regionNodeId,
      type: 'resourceNode',
      position: { x: regionX, y: regionY },
      data: {
        label: `Region: ${regionKey}`,
        resourceType: regionResourceType,
        region: regionKey,
        isContainer: true,
        size: {
          width: regionContainerWidth,
          height: regionContainerHeight,
        },
        config: {
          originalType: 'AWS::EC2::Region',
          region: regionKey,
        },
      },
    });

    // Add VPC nodes
    regionData.vpcs.forEach((vpc: any, vpcIndex: number) => {
      const vpcNodeId = `vpc-${vpc.VpcId}`;
      const vpcX = regionX + vpcMarginBetween + vpcIndex * (maxVpcWidth + vpcMarginBetween);
      const vpcY = regionY + regionPadding; // Use regionPadding directly instead of subtracting 30

      // Calculate VPC container size based on number of subnets
      const vpcSubnets = regionData.subnets.filter(
        (subnet: any) => subnet.VpcId === vpc.VpcId
      );

      // Get route tables for this VPC
      const vpcRouteTables = regionData.route_tables?.filter((rt: any) => rt.VpcId === vpc.VpcId) || [];

      // Get IGWs for this VPC (from Attachments)
      const vpcIGWs = regionData.igws?.filter((igw: any) =>
        igw.Attachments?.some((att: any) => att.VpcId === vpc.VpcId)
      ) || [];

      // Get Security Groups for this VPC
      const vpcSecurityGroups = regionData.security_groups?.filter((sg: any) => sg.VpcId === vpc.VpcId) || [];

      // Calculate subnet layout - use grid layout (2 columns for better spacing)
      const subnetsPerRow = 2;
      const numRows = Math.ceil(vpcSubnets.length / subnetsPerRow);
      const subnetWidth = 380;
      const subnetMargin = 25; // Dynamic margin between subnets
      const subnetHeight = (subnet: any) => {
        const subnetInstances = regionData.instances.filter(
          (instance: any) => instance.SubnetId === subnet.SubnetId
        );
        return 120 + Math.max(subnetInstances.length * 80, 80);
      };

      // Find max height of subnets in each row for proper spacing
      const rowHeights: number[] = [];
      for (let row = 0; row < numRows; row++) {
        let maxHeightInRow = 100;
        for (let col = 0; col < subnetsPerRow; col++) {
          const index = row * subnetsPerRow + col;
          if (index < vpcSubnets.length) {
            maxHeightInRow = Math.max(maxHeightInRow, subnetHeight(vpcSubnets[index]));
          }
        }
        rowHeights.push(maxHeightInRow);
      }

      const vpcPadding = 40; // Dynamic padding inside VPC container
      const igwHeight = vpcIGWs.length > 0 ? 100 : 0; // Space for IGWs at top
      const rtTableHeight = vpcRouteTables.length > 0 ? 120 : 0; // Space for route tables at bottom
      const sgHeight = vpcSecurityGroups.length > 0 ? 100 : 0; // Space for security groups at bottom
      
      // Calculate width needed for subnets
      const subnetGridWidth = subnetsPerRow * subnetWidth + (subnetsPerRow + 1) * subnetMargin;
      
      // Calculate width needed for IGWs (300px each + 30px margin)
      const igwsWidth = vpcIGWs.length > 0 ? vpcIGWs.length * 300 + (vpcIGWs.length + 1) * 30 : 0;
      
      // Calculate width needed for route tables (300px each + 30px margin)
      const rtWidth = vpcRouteTables.length > 0 ? vpcRouteTables.length * 300 + (vpcRouteTables.length + 1) * 30 : 0;
      
      // Calculate width needed for security groups (300px each + 30px margin)
      const sgWidth = vpcSecurityGroups.length > 0 ? vpcSecurityGroups.length * 300 + (vpcSecurityGroups.length + 1) * 30 : 0;
      
      // VPC container width is the maximum of all these widths, plus padding
      const vpcContainerWidth = Math.max(subnetGridWidth, igwsWidth, rtWidth, sgWidth) + vpcPadding * 2;
      
      // VPC container height
      const vpcContentHeight = igwHeight + vpcPadding + rowHeights.reduce((a, b) => a + b + subnetMargin, 0) + rtTableHeight + sgHeight + vpcPadding;
      const vpcContainerHeight = vpcContentHeight;


      nodePositions.set(vpcNodeId, { x: vpcX, y: vpcY });

      nodes.push({
        id: vpcNodeId,
        type: 'resourceNode',
        position: { x: vpcX, y: vpcY },
        data: {
          label: vpc.VpcId,
          resourceType: vpcResourceType,
          vpcId: vpc.VpcId,
          cidrBlock: vpc.CidrBlock,
          state: vpc.State,
          isDefault: vpc.IsDefault,
          isContainer: true,
          parentId: regionNodeId,
          size: {
            width: vpcContainerWidth,
            height: vpcContainerHeight,
          },
          config: {
            originalType: 'AWS::EC2::VPC',
            region: regionKey,
            ownerId: vpc.OwnerId,
            instanceTenancy: vpc.InstanceTenancy,
            dhcpOptionsId: vpc.DhcpOptionsId,
          },
        },
      });

      // Add Internet Gateways inside VPC (at the top)
      const igwMargin = 25; // Dynamic margin between IGWs
      const igwWidth = 280;
      if (vpcIGWs.length > 0) {
        vpcIGWs.forEach((igw: any, igwIndex: number) => {
          const igwNodeId = `igw-${igw.InternetGatewayId}`;
          // Constrain IGWs to stay within VPC width
          const igwX = vpcX + vpcPadding + igwIndex * (igwWidth + igwMargin);
          const igwY = vpcY + vpcPadding;

          nodes.push({
            id: igwNodeId,
            type: 'resourceNode',
            position: { x: igwX, y: igwY },
            data: {
              label: igw.InternetGatewayId,
              resourceType: igwResourceType,
              gatewayId: igw.InternetGatewayId,
              parentId: vpcNodeId,
              config: {
                originalType: 'AWS::EC2::InternetGateway',
                region: regionKey,
                ownerId: igw.OwnerId,
              },
            },
          });

          // No need for explicit edge since it's nested (parentId creates the relationship)
        });
      }

      // Add Route Tables inside VPC
      if (vpcRouteTables.length > 0) {
        const rtMargin = 25; // Dynamic margin between route tables
        const rtWidth = 280;
        vpcRouteTables.forEach((rt: any, rtIndex: number) => {
          const rtNodeId = `rt-${rt.RouteTableId}`;
          // Constrain route tables to stay within VPC width
          const rtX = vpcX + vpcPadding + rtIndex * (rtWidth + rtMargin);
          const rtY = vpcY + vpcContainerHeight - rtTableHeight - sgHeight - vpcPadding + 30; // Moved down

          nodes.push({
            id: rtNodeId,
            type: 'resourceNode',
            position: { x: rtX, y: rtY },
            data: {
              label: rt.RouteTableId,
              resourceType: routeTableResourceType,
              routeTableId: rt.RouteTableId,
              parentId: vpcNodeId,
              vpcId: rt.VpcId,
              config: {
                originalType: 'AWS::EC2::RouteTable',
                region: regionKey,
                vpcId: rt.VpcId,
                ownerId: rt.OwnerId,
              },
            },
          });

          // Create edges from route table to associated subnets
          if (rt.Associations && Array.isArray(rt.Associations)) {
            rt.Associations.forEach((assoc: any) => {
              // Only create connection for explicit subnet associations (not main/default associations)
              if (assoc.SubnetId && !assoc.Main) {
                edges.push({
                  id: `rt-subnet-${rt.RouteTableId}-${assoc.SubnetId}`,
                  source: rtNodeId,
                  target: `subnet-${assoc.SubnetId}`,
                  animated: true,
                  type: 'smoothstep',
                  style: { stroke: '#FFA000', strokeWidth: 2, strokeDasharray: '4,4' },
                });
              }
            });
          }
        });
      }

      // Add Security Groups inside VPC (at the bottom, below route tables) - Show ALL security groups
      const sgMarginBetween = 25; // Dynamic margin between security groups
      const sgNodeWidth = 280;
      const sgNodeHeight = 60; // Height of security group node
      vpcSecurityGroups.forEach((sg: any, sgIndex: number) => {
        const sgNodeId = `sg-${sg.GroupId}`;
        // Constrain security groups to stay within VPC width
        const sgX = vpcX + vpcPadding + sgIndex * (sgNodeWidth + sgMarginBetween);
        const sgY = vpcY + vpcContainerHeight - sgHeight - 50; // Moved up by reducing offset

        nodes.push({
          id: sgNodeId,
          type: 'resourceNode',
          position: { x: sgX, y: sgY },
          data: {
            label: sg.GroupId,
            resourceType: securityGroupResourceType,
            groupId: sg.GroupId,
            groupName: sg.GroupName,
            description: sg.Description,
            vpcId: sg.VpcId,
            parentId: vpcNodeId,
            config: {
              originalType: 'AWS::EC2::SecurityGroup',
              region: regionKey,
              ownerId: sg.OwnerId,
              vpc: sg.VpcId,
              groupName: sg.GroupName,
            },
          },
        });

        // Connect security group to instances that use it in this VPC
        regionData.instances.forEach((instance: any) => {
          if (
            instance.VpcId === vpc.VpcId &&
            instance.SecurityGroups &&
            instance.SecurityGroups.some((isg: any) => isg.GroupId === sg.GroupId)
          ) {
            edges.push({
              id: `sg-instance-${sg.GroupId}-${instance.InstanceId}`,
              source: sgNodeId,
              target: `instance-${instance.InstanceId}`,
              animated: true,
              type: 'smoothstep',
              style: { stroke: '#DD344C', strokeWidth: 1, strokeDasharray: '5,5' },
            });
          }
        });
      });

      // Add subnet nodes under each VPC with grid layout
      vpcSubnets.forEach((subnet: any, subnetIndex: number) => {
        const subnetNodeId = `subnet-${subnet.SubnetId}`;
        
        // Calculate grid position
        const row = Math.floor(subnetIndex / subnetsPerRow);
        const col = subnetIndex % subnetsPerRow;
        
        // Calculate Y position based on row and max heights of previous rows
        let subnetY = vpcY + vpcPadding + igwHeight + 30;
        for (let i = 0; i < row; i++) {
          subnetY += rowHeights[i] + subnetMargin;
        }
        
        const subnetX = vpcX + vpcPadding + col * (subnetWidth + subnetMargin);

        // Calculate subnet container size based on number of instances
        const subnetInstances = regionData.instances.filter(
          (instance: any) => instance.SubnetId === subnet.SubnetId
        );
        const subnetContainerHeight = 120 + Math.max(subnetInstances.length * 80, 80);

        nodePositions.set(subnetNodeId, { x: subnetX, y: subnetY });

        nodes.push({
          id: subnetNodeId,
          type: 'resourceNode',
          position: { x: subnetX, y: subnetY },
          data: {
            label: subnet.SubnetId,
            resourceType: subnetResourceType,
            subnetId: subnet.SubnetId,
            cidrBlock: subnet.CidrBlock,
            availabilityZone: subnet.AvailabilityZone,
            vpcId: subnet.VpcId,
            mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch,
            state: subnet.State,
            isContainer: true,
            size: {
              width: subnetWidth,
              height: subnetContainerHeight,
            },
            parentId: vpcNodeId,
            config: {
              originalType: 'AWS::EC2::Subnet',
              region: regionKey,
              ownerId: subnet.OwnerId,
              availabilityZoneId: subnet.AvailabilityZoneId,
              defaultForAz: subnet.DefaultForAz,
            },
          },
        });

        // Connect subnet to VPC
        edges.push({
          id: `vpc-subnet-${vpc.VpcId}-${subnet.SubnetId}`,
          source: vpcNodeId,
          target: subnetNodeId,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#8C4FFF', strokeWidth: 2 },
        });

        // Add instance nodes under each subnet - use already calculated subnetInstances
        const instanceMargin = 15; // Dynamic margin between instances
        const instancePadding = 10; // Padding inside subnet from border
        const instanceWidth = 160;
        subnetInstances.forEach((instance: any, instanceIndex: number) => {
          const instanceNodeId = `instance-${instance.InstanceId}`;
          // Constrain instances to stay within subnet width
          const instanceX = subnetX + instancePadding + (instanceIndex * (instanceWidth + instanceMargin));
          const instanceY = subnetY + 30; // Top padding inside subnet

          nodePositions.set(instanceNodeId, { x: instanceX, y: instanceY });

          nodes.push({
            id: instanceNodeId,
            type: 'resourceNode',
            position: { x: instanceX, y: instanceY },
            data: {
              label: instance.InstanceId,
              resourceType: ec2ResourceType,
              instanceId: instance.InstanceId,
              instanceType: instance.InstanceType,
              state: instance.State?.Name,
              privateIp: instance.PrivateIpAddress,
              publicIp: instance.PublicIpAddress,
              subnetId: instance.SubnetId,
              vpcId: instance.VpcId,
              imageId: instance.ImageId,
              launchTime: instance.LaunchTime,
              parentId: subnetNodeId,
              config: {
                originalType: 'AWS::EC2::Instance',
                region: regionKey,
                vpc: instance.VpcId,
                subnet: instance.SubnetId,
                securityGroup: instance.SecurityGroups?.[0]?.GroupId || '',
                instanceType: instance.InstanceType,
                architecture: instance.Architecture,
                hypervisor: instance.Hypervisor,
                virtualizationType: instance.VirtualizationType,
                rootDeviceName: instance.RootDeviceName,
                rootDeviceType: instance.RootDeviceType,
                keyName: instance.KeyName,
              },
            },
          });

          // Connect instance to subnet
          edges.push({
            id: `subnet-instance-${subnet.SubnetId}-${instance.InstanceId}`,
            source: subnetNodeId,
            target: instanceNodeId,
            animated: true,
            type: 'smoothstep',
            style: { stroke: '#FF9900', strokeWidth: 2 },
          });
        });
      });
    });

    // Update position for next region with dynamic spacing
    const regionMargin = 200 + Math.ceil(regionData.vpcs.length * 50); // Increased margins for better VPC separation
    currentY += regionContainerHeight + regionMargin;
  });

  return { nodes, edges };
};

/**
 * Convert AWS data.json format to simple-architecture.json format
 */
export const convertAWSDataToArchitectureFormat = (
  data: AWSDataInput
): { architecture: any } => {
  const components: any[] = [];
  const connections: any[] = [];
  const componentMap = new Map<string, string>();

  let componentId = 0;

  // Process regions and create components
  Object.entries(data).forEach(([regionKey, regionData]) => {
    if (!regionData.vpcs || !regionData.subnets || !regionData.instances) {
      return;
    }

    // Add VPC components
    regionData.vpcs.forEach((vpc: any) => {
      const vpcId = `vpc-${componentId++}`;
      componentMap.set(vpc.VpcId, vpcId);

      components.push({
        id: vpcId,
        type: 'AWS::EC2::VPC',
        label: `VPC (${vpc.CidrBlock})`,
        metadata: {
          vpcId: vpc.VpcId,
          cidrBlock: vpc.CidrBlock,
          state: vpc.State,
        },
      });
    });

    // Add Subnet components
    regionData.subnets.forEach((subnet: any) => {
      const subnetId = `subnet-${componentId++}`;
      componentMap.set(subnet.SubnetId, subnetId);

      components.push({
        id: subnetId,
        type: 'AWS::EC2::Subnet',
        label: `Subnet (${subnet.CidrBlock})`,
        metadata: {
          subnetId: subnet.SubnetId,
          cidrBlock: subnet.CidrBlock,
          availabilityZone: subnet.AvailabilityZone,
          vpcId: subnet.VpcId,
        },
      });

      // Connect subnet to VPC
      const vpcId = componentMap.get(subnet.VpcId);
      if (vpcId) {
        connections.push({
          from: vpcId,
          to: subnetId,
          relation: 'contains',
        });
      }
    });

    // Add EC2 Instance components
    regionData.instances.forEach((instance: any) => {
      const instanceId = `instance-${componentId++}`;
      componentMap.set(instance.InstanceId, instanceId);

      components.push({
        id: instanceId,
        type: 'AWS::EC2::Instance',
        label: instance.InstanceId,
        metadata: {
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State?.Name,
          privateIp: instance.PrivateIpAddress,
          publicIp: instance.PublicIpAddress,
        },
      });

      // Connect instance to subnet
      const subnetId = componentMap.get(instance.SubnetId);
      if (subnetId) {
        connections.push({
          from: subnetId,
          to: instanceId,
          relation: 'contains',
        });
      }
    });

    // Add Security Group components
    if (regionData.security_groups) {
      regionData.security_groups.forEach((sg: any) => {
        const sgId = `sg-${componentId++}`;
        componentMap.set(sg.GroupId, sgId);

        components.push({
          id: sgId,
          type: 'AWS::EC2::SecurityGroup',
          label: sg.GroupName || sg.GroupId,
          metadata: {
            groupId: sg.GroupId,
            groupName: sg.GroupName,
            vpcId: sg.VpcId,
          },
        });
      });
    }
  });

  return {
    architecture: {
      name: 'AWS Infrastructure from data.json',
      description: 'Automatically generated architecture from AWS resource data',
      region: Object.keys(data)[0] || 'us-east-1',
      components,
      connections,
    },
  };
};
