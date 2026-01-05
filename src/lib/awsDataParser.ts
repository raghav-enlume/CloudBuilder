import { Node, Edge } from 'reactflow';
import { awsDataLoader, AWSRegion } from '@/lib/awsDataLoader';
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
 * Parse AWS data.json format to nodes and edges
 * Converts VPCs, Subnets, and Instances into diagram nodes with relationships
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
  const vpcResourceType = getVPCResourceType();
  const subnetResourceType = getSubnetResourceType();
  const ec2ResourceType = getEC2ResourceType();
  const securityGroupResourceType = getSecurityGroupResourceType();

  // Process each region
  Object.entries(data).forEach(([regionKey, regionData]) => {
    if (!regionData.vpcs || !regionData.subnets || !regionData.instances) {
      return;
    }

    const regionX = currentX;
    const regionY = currentY;

    // Add VPC nodes
    regionData.vpcs.forEach((vpc: any, vpcIndex: number) => {
      const vpcNodeId = `vpc-${vpc.VpcId}`;
      const vpcX = regionX + vpcIndex * 350;
      const vpcY = regionY;

      nodePositions.set(vpcNodeId, { x: vpcX, y: vpcY });

      nodes.push({
        id: vpcNodeId,
        type: 'resourceNode',
        position: { x: vpcX, y: vpcY },
        data: {
          label: vpc.Tags?.find((t: any) => t.Key === 'Name')?.Value || vpc.VpcId,
          resourceType: vpcResourceType,
          vpcId: vpc.VpcId,
          cidrBlock: vpc.CidrBlock,
          state: vpc.State,
          isDefault: vpc.IsDefault,
          config: {
            originalType: 'AWS::EC2::VPC',
            region: regionKey,
            ownerId: vpc.OwnerId,
            instanceTenancy: vpc.InstanceTenancy,
            dhcpOptionsId: vpc.DhcpOptionsId,
          },
        },
      });

      // Add subnet nodes under each VPC
      const vpcSubnets = regionData.subnets.filter(
        (subnet: any) => subnet.VpcId === vpc.VpcId
      );

      vpcSubnets.forEach((subnet: any, subnetIndex: number) => {
        const subnetNodeId = `subnet-${subnet.SubnetId}`;
        const subnetX = vpcX;
        const subnetY = vpcY + (subnetIndex + 1) * 150;

        nodePositions.set(subnetNodeId, { x: subnetX, y: subnetY });

        nodes.push({
          id: subnetNodeId,
          type: 'resourceNode',
          position: { x: subnetX, y: subnetY },
          data: {
            label: subnet.Tags?.find((t: any) => t.Key === 'Name')?.Value || subnet.SubnetId,
            resourceType: subnetResourceType,
            subnetId: subnet.SubnetId,
            cidrBlock: subnet.CidrBlock,
            availabilityZone: subnet.AvailabilityZone,
            vpcId: subnet.VpcId,
            mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch,
            state: subnet.State,
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

        // Add instance nodes under each subnet
        const subnetInstances = regionData.instances.filter(
          (instance: any) => instance.SubnetId === subnet.SubnetId
        );

        subnetInstances.forEach((instance: any, instanceIndex: number) => {
          const instanceNodeId = `instance-${instance.InstanceId}`;
          const instanceX = subnetX + (instanceIndex + 1) * 180;
          const instanceY = subnetY;

          nodePositions.set(instanceNodeId, { x: instanceX, y: instanceY });

          nodes.push({
            id: instanceNodeId,
            type: 'resourceNode',
            position: { x: instanceX, y: instanceY },
            data: {
              label: instance.Tags?.find((t: any) => t.Key === 'Name')?.Value || instance.InstanceId,
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

    // Add security group nodes
    if (regionData.security_groups && regionData.security_groups.length > 0) {
      regionData.security_groups.forEach((sg: any, sgIndex: number) => {
        const sgNodeId = `sg-${sg.GroupId}`;
        const sgX = regionX + 1200;
        const sgY = regionY + sgIndex * 150;

        nodePositions.set(sgNodeId, { x: sgX, y: sgY });

        nodes.push({
          id: sgNodeId,
          type: 'resourceNode',
          position: { x: sgX, y: sgY },
          data: {
            label: sg.GroupName || sg.GroupId,
            resourceType: securityGroupResourceType,
            groupId: sg.GroupId,
            groupName: sg.GroupName,
            description: sg.Description,
            vpcId: sg.VpcId,
            config: {
              originalType: 'AWS::EC2::SecurityGroup',
              region: regionKey,
              ownerId: sg.OwnerId,
              vpc: sg.VpcId,
              groupName: sg.GroupName,
            },
          },
        });

        // Connect security group to instances that use it
        regionData.instances.forEach((instance: any) => {
          if (
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
    }

    // Update position for next region
    currentY += 600;
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
