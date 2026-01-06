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
  return {
    id: 'securityGroup',
    name: 'Security Group',
    category: 'networking',
    description: 'Security Group',
    icon: 'securitygroup',
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
 * Create Internet Gateway resource type
 */
const getInternetGatewayResourceType = () => {
  return {
    id: 'igw',
    name: 'Internet Gateway',
    category: 'networking',
    icon: 'internetgateway',
    description: 'Internet Gateway',
    color: '#06B6D4',
    editableAttributes: [
      { key: 'label', label: 'Name', type: 'text' },
      { key: 'gatewayId', label: 'Gateway ID', type: 'text' },
    ],
  };
};

/**
 * Create Route Table resource type
 */
const getRouteTableResourceType = () => {
  return {
    id: 'rt',
    name: 'Route Table',
    category: 'networking',
    icon: 'routetable',
    description: 'Route Table',
    color: '#3B82F6',
    editableAttributes: [
      { key: 'label', label: 'Name', type: 'text' },
      { key: 'tableId', label: 'Table ID', type: 'text' },
    ],
  };
};

/**
 * Create NAT Gateway resource type
 */
const getNATGatewayResourceType = () => {
  return {
    id: 'nat',
    name: 'NAT Gateway',
    category: 'networking',
    icon: 'natgateway',
    description: 'NAT Gateway',
    color: '#10B981',
    editableAttributes: [
      { key: 'label', label: 'Name', type: 'text' },
      { key: 'gatewayId', label: 'Gateway ID', type: 'text' },
    ],
  };
};

/**
 * Create Load Balancer resource type
 */
const getLoadBalancerResourceType = () => {
  return {
    id: 'lb',
    name: 'Load Balancer',
    category: 'networking',
    icon: 'alb',
    description: 'Load Balancer',
    color: '#F59E0B',
    editableAttributes: [
      { key: 'label', label: 'Name', type: 'text' },
      { key: 'arn', label: 'ARN', type: 'text' },
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
): { nodes: Node[]; edges: Edge[]; areas: any[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const areas: any[] = [];
  let areaIdCounter = 0;
  const nodePositions = new Map<string, { x: number; y: number }>();

  const currentX = 0;
  let currentY = 0;

  // Get resource types from resources.ts
  const ec2ResourceType = getEC2ResourceType();
  const securityGroupResourceType = getSecurityGroupResourceType();

  // Process each region
  Object.entries(data).forEach(([regionKey, regionData]) => {
    if (!regionData.vpcs || !regionData.subnets || !regionData.instances) {
      return;
    }

    const regionX = currentX;
    const regionY = currentY;

    // Calculate total dimensions for region area
    const vpcCount = regionData.vpcs.length;
    // Each VPC is 1000px wide, spaced 1100px apart (100px spacing)
    // Total width: (vpcCount - 1) * 1100 + 1000, plus padding on both sides
    const totalVpcWidth = vpcCount > 0 ? (vpcCount - 1) * 1100 + 1000 + 60 : 200;
    
    // Calculate region height based on VPC content
    const regionHeight = regionData.vpcs.length > 0
      ? Math.max(
          ...regionData.vpcs.map((vpc: any) => {
            const vpcSubnets = regionData.subnets.filter((s: any) => s.VpcId === vpc.VpcId);
            return vpcSubnets.length > 0 
              ? 60 + (vpcSubnets.length - 1) * 120 + 100 + 40 + 64 + 40 + 64 + 40 + 64 + 40 + 64 + 40 + 20
              : 200;
          })
        ) + 60
      : 400;

    // Create Region area boundary (largest container)
    const regionArea = {
      id: `area-region-${areaIdCounter++}`,
      type: 'area',
      label: `📍 Region: ${regionKey}`,
      areaType: 'region',
      color: '#F5F3FF',
      x: regionX - 30,
      y: regionY - 30,
      width: totalVpcWidth,
      height: regionHeight,
      opacity: 0.12,
      borderColor: '#3949AB',
      borderWidth: 4,
      borderStyle: 'solid',
      description: `AWS Region: ${regionKey}`
    };
    areas.push(regionArea);

    // Add VPC areas (not nodes)
    regionData.vpcs.forEach((vpc: any, vpcIndex: number) => {
      const vpcX = regionX + vpcIndex * 1100;
      const vpcY = regionY;
      const vpcId = vpc.VpcId;
      const vpcLabel = vpc.Tags?.find((t: any) => t.Key === 'Name')?.Value || vpcId;

      const vpcSubnets = regionData.subnets.filter(
        (subnet: any) => subnet.VpcId === vpcId
      );

      // Create VPC area boundary
      // Height calculation: subnets from Y+60, spaced 120px apart (N subnets)
      // Last subnet: Y = vpcY + 60 + (N-1)*120, height 100
      // Last subnet bottom = vpcY + 60 + (N-1)*120 + 100
      // IGW below: Y = last_subnet_bottom + 40, height ~64
      // RT below IGW: height ~64, gap ~40
      // SG below RT: height ~64, gap ~40
      // NAT below SG: height ~64, gap ~40
      // LB below NAT: height ~64, gap ~40
      // Total = 60 + (N-1)*120 + 100 + 40 + 64 + 40 + 64 + 40 + 64 + 40 + 64 + 40 + 20 padding
      const vpcAreaHeight = vpcSubnets.length > 0 
        ? 60 + (vpcSubnets.length - 1) * 120 + 100 + 40 + 64 + 40 + 64 + 40 + 64 + 40 + 64 + 40 + 20
        : 200;
      
      const vpcArea = {
        id: `area-vpc-${areaIdCounter++}`,
        type: 'area',
        label: `${vpcLabel} (${regionKey})`,
        areaType: 'vpc',
        color: '#E8F5FF',
        x: vpcX,
        y: vpcY,
        width: 1000,
        height: vpcAreaHeight,
        opacity: 0.1,
        borderColor: '#FFA000',
        borderWidth: 2,
        borderStyle: 'solid',
        description: `VPC: ${vpcLabel} (${vpc.CidrBlock})`
      };
      areas.push(vpcArea);

      // Add subnet areas inside VPC
      vpcSubnets.forEach((subnet: any, subnetIndex: number) => {
        const subnetX = vpcX + 20;
        const subnetY = vpcY + 60 + subnetIndex * 120;
        const subnetId = subnet.SubnetId;
        const subnetLabel = subnet.Tags?.find((t: any) => t.Key === 'Name')?.Value || subnetId;
        const azName = subnet.AvailabilityZone;

        // Create subnet area boundary (with AZ info in label)
        const subnetArea = {
          id: `area-subnet-${areaIdCounter++}`,
          type: 'area',
          label: `${subnetLabel} (${azName})`,
          areaType: 'subnet',
          color: '#DBEAFE',
          x: subnetX,
          y: subnetY,
          width: 960,
          height: 100,
          opacity: 0.1,
          borderColor: '#455A64',
          borderWidth: 2,
          borderStyle: 'solid',
          description: `Subnet: ${subnetLabel} (${subnet.CidrBlock})`
        };
        areas.push(subnetArea);
      });
    });

    // Add VPC nodes (invisible, used as connection targets for edges)
    regionData.vpcs.forEach((vpc: any, vpcIndex: number) => {
      const vpcNodeId = `vpc-${vpc.VpcId}`;
      const vpcX = regionX + vpcIndex * 1100 + 500; // Center of VPC area
      const vpcY = regionY + 30; // Near top of VPC area
      
      nodes.push({
        id: vpcNodeId,
        type: 'resourceNode',
        position: { x: vpcX, y: vpcY },
        data: {
          label: vpc.VpcId,
          resourceType: {
            id: 'vpc',
            name: 'VPC',
            category: 'networking',
            icon: 'vpc',
            description: 'Virtual Private Cloud',
            color: '#8C4FFF',
          },
          vpcId: vpc.VpcId,
          isHidden: true, // Mark as hidden - won't render visually
          config: {
            originalType: 'AWS::EC2::VPC',
            region: regionKey,
          },
        },
      });
    });

    // Add EC2 instances as nodes (inside subnets)
    regionData.instances.forEach((instance: any) => {
      const instanceId = `instance-${instance.InstanceId}`;
      const subnetId = instance.SubnetId;
      const subnet = regionData.subnets.find((s: any) => s.SubnetId === subnetId);
      const vpc = regionData.vpcs.find((v: any) => v.VpcId === subnet?.VpcId);

      if (!vpc || !subnet) return;

      const vpcIndex = regionData.vpcs.findIndex((v: any) => v.VpcId === vpc.VpcId);
      const subnetIndex = regionData.subnets.filter(
        (s: any) => s.VpcId === vpc.VpcId
      ).findIndex((s: any) => s.SubnetId === subnetId);

      const vpcX = regionX + vpcIndex * 1100;
      const vpcY = regionY;
      const subnetX = vpcX + 20;
      const subnetY = vpcY + 60 + subnetIndex * 120;
      const instanceX = subnetX + 50 + (regionData.instances.filter(
        (i: any) => i.SubnetId === subnetId
      ).findIndex((i: any) => i.InstanceId === instance.InstanceId) * 80);
      const instanceY = subnetY + 30;

      nodePositions.set(instanceId, { x: instanceX, y: instanceY });

      const instanceLabel = instance.Tags?.find((t: any) => t.Key === 'Name')?.Value || instance.InstanceId;

      nodes.push({
        id: instanceId,
        type: 'resourceNode',
        position: { x: instanceX, y: instanceY },
        data: {
          label: instanceLabel,
          resourceType: ec2ResourceType,
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State?.Name,
          subnetId: instance.SubnetId,
          vpcId: vpc.VpcId,
          config: {
            originalType: 'AWS::EC2::Instance',
            region: regionKey,
            imageId: instance.ImageId,
            launchTime: instance.LaunchTime,
            monitoring: instance.Monitoring?.State,
            architecture: instance.Architecture,
          },
        },
      });
    });

    // Add security group edges if needed
    regionData.security_groups?.forEach((sg: any) => {
      const sgInstances = regionData.instances.filter((inst: any) =>
        inst.SecurityGroups?.some((sg2: any) => sg2.GroupId === sg.GroupId)
      );

      sgInstances.forEach((inst: any) => {
        edges.push({
          id: `sg-${sg.GroupId}-${inst.InstanceId}`,
          source: `instance-${inst.InstanceId}`,
          target: `sg-${sg.GroupId}`,
          type: 'smoothstep',
        });
      });
    });

    // Calculate dynamic positioning for non-area nodes
    const igwCount = regionData.igws?.length || 0;
    const rtCount = regionData.route_tables?.length || 0;
    const sgCount = regionData.security_groups?.length || 0;
    const natCount = regionData.nat_gateways?.length || 0;
    const lbCount = regionData.lbs_v2?.length || 0;

    const nodeTypes = [
      { type: 'igw', count: igwCount, data: regionData.igws },
      { type: 'rt', count: rtCount, data: regionData.route_tables },
      { type: 'sg', count: sgCount, data: regionData.security_groups },
      { type: 'nat', count: natCount, data: regionData.nat_gateways },
      { type: 'lb', count: lbCount, data: regionData.lbs_v2 },
    ];

    const resourceTypes = {
      igw: getInternetGatewayResourceType(),
      rt: getRouteTableResourceType(),
      sg: getSecurityGroupResourceType(),
      nat: getNATGatewayResourceType(),
      lb: getLoadBalancerResourceType(),
    };

    // Calculate grid layout for non-area nodes (position to the right of VPC areas)
    const nodesPerRow = 1;
    const nodeSpacingX = 0; // Not used for vertical layout
    const nodeSpacingY = 80;
    
    // Position nodes to the right of all VPC areas to avoid overlap
    // VPCs are positioned at: regionX + vpcIndex * 1100 with width 1000
    // So rightmost VPC ends at: regionX + 1000 + (number of vpcs - 1) * 1100
    const rightmostVpcEnd = vpcCount > 0 ? regionX + 1000 + (vpcCount - 1) * 1100 : regionX + 1000;
    
    const nodeStartX = rightmostVpcEnd + 80;  // 80px gap from VPC areas
    const nodeStartY = regionY + 100;  // Start from top of region


    let nodeIndex = 0;

    // Add Internet Gateway nodes (positioned inside their attached VPC, below subnets)
    regionData.igws?.forEach((igw: any) => {
      const igwNodeId = `igw-${igw.InternetGatewayId}`;
      
      // Get the VPC this IGW is attached to - check both Attachments and direct VpcId
      const attachedVpc = igw.VpcId || igw.Attachments?.[0]?.VpcId;
      
      // Only create IGW node if it has a valid VPC connection
      if (!attachedVpc) {
        console.warn(`IGW ${igw.InternetGatewayId} has no VPC connection - skipping`);
        return;
      }
      
      const vpcIndex = regionData.vpcs.findIndex((v: any) => v.VpcId === attachedVpc);
      
      // Only create node if VPC exists in this region
      if (vpcIndex < 0) {
        console.warn(`IGW ${igw.InternetGatewayId} references non-existent VPC ${attachedVpc} - skipping`);
        return;
      }

      // Find the VPC area first to position IGW inside it properly
      const vpcAreaForIgw = areas.find(a => a.areaType === 'vpc' && a.label.includes(attachedVpc));
      
      if (!vpcAreaForIgw) {
        console.warn(`IGW ${igw.InternetGatewayId} - could not find VPC area for ${attachedVpc}`);
        return;
      }

      // Get subnet count for this VPC to position IGW below them
      const vpcSubnets = regionData.subnets.filter((s: any) => s.VpcId === attachedVpc);
      
      // Calculate IGW position - below all subnets but inside VPC area
      // Last subnet Y = vpcAreaForIgw.y + 60 + (numSubnets-1)*120
      // Last subnet bottom = vpcAreaForIgw.y + 60 + (numSubnets-1)*120 + 100
      // IGW Y = last subnet bottom + 40px gap
      const igwY = vpcSubnets.length > 0
        ? vpcAreaForIgw.y + 60 + (vpcSubnets.length - 1) * 120 + 100 + 40
        : vpcAreaForIgw.y + 100;
      
      // Position IGW horizontally - left side with subnets
      const igwX = vpcAreaForIgw.x + 50;

      nodes.push({
        id: igwNodeId,
        type: 'resourceNode',
        position: { x: igwX, y: igwY },
        data: {
          label: igw.InternetGatewayId,
          resourceType: resourceTypes.igw,
          gatewayId: igw.InternetGatewayId,
          vpcId: attachedVpc,
          parentAreaId: vpcAreaForIgw.id,
          parentAreaType: 'vpc',
          config: {
            originalType: 'AWS::EC2::InternetGateway',
            region: regionKey,
          },
        },
      });

      // Connect IGW to VPC
      igw.Attachments?.forEach((attachment: any) => {
        edges.push({
          id: `igw-vpc-${igw.InternetGatewayId}-${attachment.VpcId}`,
          source: igwNodeId,
          target: `vpc-${attachment.VpcId}`,
          type: 'smoothstep',
          style: { stroke: '#06B6D4', strokeWidth: 2 },
        });
      });
    });

    // Reset nodeIndex for other resources (RT, SG, etc.) to position on the right
    nodeIndex = 0;

    // Track node counts per VPC for proper spacing of multiple nodes of same type
    const rtCountPerVpc: Record<string, number> = {};
    const sgCountPerVpc: Record<string, number> = {};
    const natCountPerVpc: Record<string, number> = {};
    const lbCountPerVpc: Record<string, number> = {};

    // Add Route Table nodes (positioned inside their parent VPC)
    regionData.route_tables?.forEach((rt: any) => {
      const rtNodeId = `rt-${rt.RouteTableId}`;
      const vpcId = rt.VpcId;
      const vpcIndex = regionData.vpcs.findIndex((v: any) => v.VpcId === vpcId);
      
      if (vpcIndex >= 0) {
        // Track RT count for this VPC
        rtCountPerVpc[vpcId] = (rtCountPerVpc[vpcId] || 0) + 1;
        const rtIndexInVpc = rtCountPerVpc[vpcId] - 1;

        // Position Route Table inside the VPC, below IGW
        const vpcX = regionX + vpcIndex * 1100;
        const vpcY = regionY;
        const vpcSubnets = regionData.subnets.filter((s: any) => s.VpcId === vpcId);
        
        // RT Y: position below IGW
        // Last subnet bottom + 40 gap + IGW height(64) + 40 gap for RT
        const rtY = vpcY + 60 + (vpcSubnets.length - 1) * 120 + 100 + 40 + 64 + 40;
        // RT X: spread horizontally when multiple RTs exist in same VPC
        const rtX = vpcX + 50 + (rtIndexInVpc * 200);  // 200px spacing between RTs

        nodes.push({
          id: rtNodeId,
          type: 'resourceNode',
          position: { x: rtX, y: rtY },
          data: {
            label: rt.Tags?.find((t: any) => t.Key === 'Name')?.Value || rt.RouteTableId,
            resourceType: resourceTypes.rt,
            tableId: rt.RouteTableId,
            vpcId: vpcId,
            config: {
              originalType: 'AWS::EC2::RouteTable',
              region: regionKey,
            },
          },
        });

        // Connect Route Table to VPC
        edges.push({
          id: `rt-vpc-${rt.RouteTableId}-${vpcId}`,
          source: rtNodeId,
          target: `vpc-${vpcId}`,
          type: 'smoothstep',
          style: { stroke: '#3B82F6', strokeWidth: 1.5 },
        });
      }

      nodeIndex++;
    });

    // Add Security Group nodes (positioned inside their parent VPC)
    regionData.security_groups?.forEach((sg: any) => {
      const sgNodeId = `sg-${sg.GroupId}`;
      const vpcId = sg.VpcId;
      const vpcIndex = regionData.vpcs.findIndex((v: any) => v.VpcId === vpcId);
      
      if (vpcIndex >= 0) {
        // Track SG count for this VPC
        sgCountPerVpc[vpcId] = (sgCountPerVpc[vpcId] || 0) + 1;
        const sgIndexInVpc = sgCountPerVpc[vpcId] - 1;

        // Position Security Group inside the VPC, below Route Table
        const vpcX = regionX + vpcIndex * 1100;
        const vpcY = regionY;
        const vpcSubnets = regionData.subnets.filter((s: any) => s.VpcId === vpcId);
        
        // SG Y: position below Route Table
        // Last subnet bottom + 40 + IGW(64) + 40 + RT(64) + 40 gap for SG
        const sgY = vpcY + 60 + (vpcSubnets.length - 1) * 120 + 100 + 40 + 64 + 40 + 64 + 40;
        // SG X: spread horizontally when multiple SGs exist in same VPC
        const sgX = vpcX + 50 + (sgIndexInVpc * 200);  // 200px spacing between SGs

        nodes.push({
          id: sgNodeId,
          type: 'resourceNode',
          position: { x: sgX, y: sgY },
          data: {
            label: sg.GroupName || sg.GroupId,
            resourceType: resourceTypes.sg,
            groupId: sg.GroupId,
            groupName: sg.GroupName,
            description: sg.Description,
            vpcId: vpcId,
            config: {
              originalType: 'AWS::EC2::SecurityGroup',
              region: regionKey,
            },
          },
        });

        // Connect Security Group to VPC
        edges.push({
          id: `sg-vpc-${sg.GroupId}-${vpcId}`,
          source: sgNodeId,
          target: `vpc-${vpcId}`,
          type: 'smoothstep',
          style: { stroke: '#DD344C', strokeWidth: 1.5, strokeDasharray: '5,5' },
        });

        // Connect Security Group to instances that use it
        regionData.instances?.forEach((inst: any) => {
          if (inst.SecurityGroups?.some((isg: any) => isg.GroupId === sg.GroupId)) {
            edges.push({
              id: `sg-inst-${sg.GroupId}-${inst.InstanceId}`,
              source: sgNodeId,
              target: `instance-${inst.InstanceId}`,
              type: 'smoothstep',
              style: { stroke: '#DD344C', strokeWidth: 1 },
            });
          }
        });
      }

      nodeIndex++;
    });

    // Add NAT Gateway nodes (positioned inside their parent VPC/Subnet)
    regionData.nat_gateways?.forEach((nat: any) => {
      const natNodeId = `nat-${nat.NatGatewayId}`;
      const subnetId = nat.SubnetId;
      const subnet = regionData.subnets.find((s: any) => s.SubnetId === subnetId);
      const vpcId = subnet?.VpcId;
      const vpcIndex = vpcId ? regionData.vpcs.findIndex((v: any) => v.VpcId === vpcId) : -1;
      
      if (vpcIndex >= 0 && vpcId) {
        // Track NAT count for this VPC
        natCountPerVpc[vpcId] = (natCountPerVpc[vpcId] || 0) + 1;
        const natIndexInVpc = natCountPerVpc[vpcId] - 1;

        // Position NAT Gateway inside the VPC, below Security Groups
        const vpcX = regionX + vpcIndex * 1100;
        const vpcY = regionY;
        const vpcSubnets = regionData.subnets.filter((s: any) => s.VpcId === vpcId);
        
        // NAT Y: position below Security Groups
        const natY = vpcY + 60 + (vpcSubnets.length - 1) * 120 + 100 + 40 + 64 + 40 + 64 + 40 + 64 + 40;
        // NAT X: spread horizontally when multiple NATs exist in same VPC
        const natX = vpcX + 50 + (natIndexInVpc * 200);  // 200px spacing between NATs

        nodes.push({
          id: natNodeId,
          type: 'resourceNode',
          position: { x: natX, y: natY },
          data: {
            label: nat.NatGatewayId,
            resourceType: resourceTypes.nat,
            gatewayId: nat.NatGatewayId,
            subnetId: nat.SubnetId,
            vpcId: vpcId,
            config: {
              originalType: 'AWS::EC2::NatGateway',
              region: regionKey,
            },
          },
        });
      }

      nodeIndex++;
    });

    // Add Load Balancer nodes (positioned inside their parent VPC)
    regionData.lbs_v2?.forEach((lb: any) => {
      const lbNodeId = `lb-${lb.LoadBalancerArn?.split('/')[1] || nodeIndex}`;
      
      // Get the first associated subnet's VPC
      const subnet = regionData.subnets.find((s: any) => 
        lb.AvailabilityZones?.some((az: any) => az.ZoneName === s.AvailabilityZone)
      );
      const vpcId = subnet?.VpcId;
      const vpcIndex = vpcId ? regionData.vpcs.findIndex((v: any) => v.VpcId === vpcId) : -1;
      
      if (vpcIndex >= 0 && vpcId) {
        // Track LB count for this VPC
        lbCountPerVpc[vpcId] = (lbCountPerVpc[vpcId] || 0) + 1;
        const lbIndexInVpc = lbCountPerVpc[vpcId] - 1;

        // Position Load Balancer inside the VPC, below NAT Gateways
        const vpcX = regionX + vpcIndex * 1100;
        const vpcY = regionY;
        const vpcSubnets = regionData.subnets.filter((s: any) => s.VpcId === vpcId);
        
        // LB Y: position below NAT Gateways
        const lbY = vpcY + 60 + (vpcSubnets.length - 1) * 120 + 100 + 40 + 64 + 40 + 64 + 40 + 64 + 40 + 64 + 40;
        // LB X: spread horizontally when multiple LBs exist in same VPC
        const lbX = vpcX + 50 + (lbIndexInVpc * 200);  // 200px spacing between LBs

        nodes.push({
          id: lbNodeId,
          type: 'resourceNode',
          position: { x: lbX, y: lbY },
          data: {
            label: lb.LoadBalancerName || 'Load Balancer',
            resourceType: resourceTypes.lb,
            arn: lb.LoadBalancerArn,
            type: lb.Type,
            scheme: lb.Scheme,
            vpcId: vpcId,
            config: {
              originalType: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
              region: regionKey,
            },
          },
        });

        // Connect LB to subnets
        lb.AvailabilityZones?.forEach((az: any) => {
          const associatedSubnet = regionData.subnets?.find((s: any) => s.AvailabilityZone === az.ZoneName);
          if (associatedSubnet) {
            edges.push({
              id: `lb-subnet-${lbNodeId}-${associatedSubnet.SubnetId}`,
              source: lbNodeId,
              target: `subnet-${associatedSubnet.SubnetId}`,
              type: 'smoothstep',
              style: { stroke: '#F59E0B', strokeWidth: 1.5 },
            });
          }
        });

        // Connect LB to parent VPC (for hierarchy)
        edges.push({
          id: `lb-vpc-${lbNodeId}-${vpcId}`,
          source: lbNodeId,
          target: `vpc-${vpcId}`,
          type: 'smoothstep',
          style: { stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '5,5' },
          hidden: true,
        });
      }

      nodeIndex++;
    });

    // Update position for next region (nodes are positioned to the right, so account for VPC width)
    currentY += Math.max(
      ...regionData.vpcs.map((vpc: any) => {
        const vpcSubnets = regionData.subnets.filter((s: any) => s.VpcId === vpc.VpcId);
        if (vpcSubnets.length === 0) return 400;
        return 60 + (vpcSubnets.length - 1) * 120 + 100 + 50;
      }),
      400
    );
  });

  // Build parent-child relationship map
  const parentChildMap = new Map<string, string>();
  const resourceParentMap = new Map<string, { areaId: string; areaType: string }>();

  // Map instances to subnets
  nodes.forEach(node => {
    if (node.id.startsWith('instance-')) {
      const subnetId = node.data.subnetId;
      const subnetArea = areas.find(a => a.id.includes(subnetId) && a.areaType === 'subnet');
      if (subnetArea) {
        resourceParentMap.set(node.id, { areaId: subnetArea.id, areaType: 'subnet' });
      }
    }
  });

  // Map VPC-related resources (IGW, RT, SG, NAT, LB) to VPCs
  nodes.forEach(node => {
    const vpcId = node.data.vpcId;
    if (vpcId && (node.id.startsWith('igw-') || node.id.startsWith('rt-') || 
                  node.id.startsWith('sg-') || node.id.startsWith('nat-') || 
                  node.id.startsWith('lb-'))) {
      const vpcArea = areas.find(a => a.areaType === 'vpc' && a.label.includes(vpcId));
      if (vpcArea) {
        resourceParentMap.set(node.id, { areaId: vpcArea.id, areaType: 'vpc' });
      }
    }
  });

  // Map subnets to VPCs
  areas.forEach(area => {
    if (area.areaType === 'subnet') {
      // Extract VPC ID from subnet area label or find parent VPC area
      const parentVpcArea = areas.find(a => 
        a.areaType === 'vpc' && 
        a.x <= area.x && 
        a.y <= area.y && 
        (a.x + a.width) >= (area.x + area.width) &&
        (a.y + a.height) >= (area.y + area.height)
      );
      if (parentVpcArea) {
        resourceParentMap.set(area.id, { areaId: parentVpcArea.id, areaType: 'vpc' });
      }
    }
  });

  // Validate and clamp node positions to ensure children stay within parent areas
  const clampedNodes = nodes.map(node => {
    const nodeId = node.id;
    let parentArea = null;

    // Get parent area from relationship map
    const parentInfo = resourceParentMap.get(nodeId);
    if (parentInfo) {
      parentArea = areas.find(a => a.id === parentInfo.areaId);
    }

    // If no parent area found through relationship map, try direct lookup
    if (!parentArea) {
      if (nodeId.startsWith('instance-')) {
        const subnetId = node.data.subnetId;
        parentArea = areas.find(a => a.id.includes(subnetId));
      } else if (nodeId.startsWith('igw-') || nodeId.startsWith('rt-') || 
                 nodeId.startsWith('sg-') || nodeId.startsWith('nat-') || 
                 nodeId.startsWith('lb-')) {
        const vpcId = node.data.vpcId;
        parentArea = areas.find(a => a.areaType === 'vpc' && a.label.includes(vpcId));
      }
    }

    // If parent area found, clamp node position to stay within bounds
    if (parentArea) {
      const nodeWidth = node.data?.size?.width ?? 64;
      const nodeHeight = node.data?.size?.height ?? 64;
      
      // Calculate bounds with padding
      const minX = parentArea.x + 10;
      const minY = parentArea.y + 30;
      const maxX = parentArea.x + parentArea.width - nodeWidth - 10;
      const maxY = parentArea.y + parentArea.height - nodeHeight - 10;

      // Clamp position
      const clampedX = Math.max(minX, Math.min(maxX, node.position.x));
      const clampedY = Math.max(minY, Math.min(maxY, node.position.y));

      // Return node with parent relationship info
      return {
        ...node,
        position: { x: clampedX, y: clampedY },
        data: {
          ...node.data,
          parentAreaId: parentArea.id,
          parentAreaType: parentArea.areaType,
        },
      };
    }

    return node;
  });

  // Filter out orphaned nodes (nodes that should have a parent but don't)
  const filteredNodes = clampedNodes.filter(node => {
    const nodeId = node.id;
    
    // Nodes that must have a parent
    const requiresParent = nodeId.startsWith('instance-') || 
                           nodeId.startsWith('igw-') || 
                           nodeId.startsWith('rt-') || 
                           nodeId.startsWith('sg-') || 
                           nodeId.startsWith('nat-') || 
                           nodeId.startsWith('lb-');
    
    // Don't filter if node already has a parentAreaId (from re-imported exported diagrams)
    // This prevents filtering of IGWs and other resources from previously exported JSONs
    if (node.data.parentAreaId) {
      return true;
    }
    
    if (requiresParent && !node.data.parentAreaId) {
      console.warn(`Filtering out orphaned node ${nodeId} - no parent area found`);
      return false;
    }
    
    return true;
  });

  // Filter edges that reference orphaned nodes
  const validNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(edge => 
    validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
  );

  return { nodes: filteredNodes, edges: filteredEdges, areas };
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
