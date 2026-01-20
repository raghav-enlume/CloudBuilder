/* eslint-disable @typescript-eslint/no-explicit-any */
import { Node, Edge } from 'reactflow';
import { cloudResources } from '@/data/resources';

// Dynamically import Graphviz for layout calculation
let GraphvizModule: any = null;

export const initGraphviz = async () => {
  if (!GraphvizModule) {
    try {
      const module = await import('@hpcc-js/wasm-graphviz');
      GraphvizModule = module;
    } catch (error) {
      console.warn('Graphviz module not available, using default layout', error);
    }
  }
  return GraphvizModule;
};

interface AWSDataInput {
  [region: string]: {
    region?: string;
    vpcs?: any[];
    subnets?: any[];
    instances?: any[];
    security_groups?: any[];
    route_tables?: any[];
    internet_gateways?: any[];
    nat_gateways?: any[];
    rds_instances?: any[];
    s3_buckets?: any[];
    lambda_functions?: any[];
    ecs_clusters?: any[];
    eks_clusters?: any[];
    ebs_volumes?: any[];
    efs_filesystems?: any[];
    dynamodb_tables?: any[];
    elasticache_clusters?: any[];
    api_gateways?: any[];
    load_balancers?: any[];
    cloudfront_distributions?: any[];
    iam_roles?: any[];
    cognito_user_pools?: any[];
    waf_web_acls?: any[];
    kinesis_streams?: any[];
    sqs_queues?: any[];
    sns_topics?: any[];
    cloudwatch_alarms?: any[];
    autoscaling_groups?: any[];
    fargate_tasks?: any[];
    elasticbeanstalk_apps?: any[];
    route_53_zones?: any[];
    vpc_peering_connections?: any[];
    transit_gateways?: any[];
    availability_zones?: any[];
    network_acls?: any[];
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
 * Get NAT Gateway resource type
 */
const getNATGatewayResourceType = () => {
  const baseVPC = getResourceType('vpc');
  return {
    ...(baseVPC || {}),
    id: 'natgateway',
    name: 'NAT Gateway',
    category: 'networking',
    icon: 'vpc',
    description: 'NAT Gateway',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Gateway ID', type: 'text' },
    ],
  };
};

/**
 * Get RDS resource type
 */
const getRDSResourceType = () => {
  return getResourceType('rds') || {
    id: 'rds',
    name: 'RDS Database',
    category: 'database',
    icon: 'rds',
    description: 'Relational Database Service',
    color: '#527FFF',
    editableAttributes: [
      { key: 'label', label: 'Database Name', type: 'text' },
      { key: 'engine', label: 'Engine', type: 'text' },
      { key: 'instanceClass', label: 'Instance Class', type: 'text' },
    ],
  };
};

/**
 * Get S3 resource type
 */
const getS3ResourceType = () => {
  return getResourceType('s3') || {
    id: 's3',
    name: 'S3 Bucket',
    category: 'storage',
    icon: 's3',
    description: 'Simple Storage Service',
    color: '#569A31',
    editableAttributes: [
      { key: 'label', label: 'Bucket Name', type: 'text' },
      { key: 'region', label: 'Region', type: 'text' },
    ],
  };
};

/**
 * Get Lambda resource type
 */
const getLambdaResourceType = () => {
  return getResourceType('lambda') || {
    id: 'lambda',
    name: 'Lambda',
    category: 'compute',
    icon: 'lambda',
    description: 'Serverless compute',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Function Name', type: 'text' },
    ],
  };
};

/**
 * Get CloudFront resource type
 */
const getCloudFrontResourceType = () => {
  return getResourceType('cloudfront') || {
    id: 'cloudfront',
    name: 'CloudFront',
    category: 'networking',
    icon: 'cloudfront',
    description: 'Content Delivery Network',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Distribution ID', type: 'text' },
    ],
  };
};

/**
 * Get API Gateway resource type
 */
const getAPIGatewayResourceType = () => {
  return getResourceType('apigateway') || {
    id: 'apigateway',
    name: 'API Gateway',
    category: 'networking',
    icon: 'apigateway',
    description: 'API Gateway',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'API Name', type: 'text' },
    ],
  };
};

/**
 * Get ALB/NLB resource type
 */
const getLoadBalancerResourceType = () => {
  return getResourceType('elb') || {
    id: 'loadbalancer',
    name: 'Load Balancer',
    category: 'networking',
    icon: 'elb',
    description: 'Application/Network Load Balancer',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Load Balancer Name', type: 'text' },
    ],
  };
};

/**
 * Get ECS resource type
 */
const getECSResourceType = () => {
  return getResourceType('ecs') || {
    id: 'ecs',
    name: 'ECS Container',
    category: 'compute',
    icon: 'ecs',
    description: 'Container orchestration',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Cluster Name', type: 'text' },
    ],
  };
};

/**
 * Get EKS resource type
 */
const getEKSResourceType = () => {
  return getResourceType('eks') || {
    id: 'eks',
    name: 'Kubernetes',
    category: 'compute',
    icon: 'eks',
    description: 'Managed Kubernetes',
    color: '#326CE5',
    editableAttributes: [
      { key: 'label', label: 'Cluster Name', type: 'text' },
    ],
  };
};

/**
 * Get EBS resource type
 */
const getEBSResourceType = () => {
  return getResourceType('ebs') || {
    id: 'ebs',
    name: 'EBS Volume',
    category: 'storage',
    icon: 'ebs',
    description: 'Block storage',
    color: '#569A31',
    editableAttributes: [
      { key: 'label', label: 'Volume ID', type: 'text' },
    ],
  };
};

/**
 * Get EFS resource type
 */
const getEFSResourceType = () => {
  return getResourceType('efs') || {
    id: 'efs',
    name: 'EFS',
    category: 'storage',
    icon: 'efs',
    description: 'Elastic file system',
    color: '#569A31',
    editableAttributes: [
      { key: 'label', label: 'File System ID', type: 'text' },
    ],
  };
};

/**
 * Get DynamoDB resource type
 */
const getDynamoDBResourceType = () => {
  return getResourceType('dynamodb') || {
    id: 'dynamodb',
    name: 'DynamoDB',
    category: 'database',
    icon: 'dynamodb',
    description: 'NoSQL database',
    color: '#3B48CC',
    editableAttributes: [
      { key: 'label', label: 'Table Name', type: 'text' },
    ],
  };
};

/**
 * Get ElastiCache resource type
 */
const getElastiCacheResourceType = () => {
  return getResourceType('elasticache') || {
    id: 'elasticache',
    name: 'ElastiCache',
    category: 'database',
    icon: 'elasticache',
    description: 'In-memory cache',
    color: '#C925D1',
    editableAttributes: [
      { key: 'label', label: 'Cluster Name', type: 'text' },
    ],
  };
};

/**
 * Get IAM resource type
 */
const getIAMResourceType = () => {
  return getResourceType('iam') || {
    id: 'iam',
    name: 'IAM',
    category: 'security',
    icon: 'iam',
    description: 'Identity management',
    color: '#DD344C',
    editableAttributes: [
      { key: 'label', label: 'Role Name', type: 'text' },
    ],
  };
};

/**
 * Get Cognito resource type
 */
const getCognitoResourceType = () => {
  return getResourceType('cognito') || {
    id: 'cognito',
    name: 'Cognito',
    category: 'security',
    icon: 'cognito',
    description: 'User authentication',
    color: '#DD344C',
    editableAttributes: [
      { key: 'label', label: 'User Pool', type: 'text' },
    ],
  };
};

/**
 * Get WAF resource type
 */
const getWAFResourceType = () => {
  return getResourceType('waf') || {
    id: 'waf',
    name: 'WAF',
    category: 'security',
    icon: 'waf',
    description: 'Web application firewall',
    color: '#DD344C',
    editableAttributes: [
      { key: 'label', label: 'Web ACL', type: 'text' },
    ],
  };
};

/**
 * Get Kinesis resource type
 */
const getKinesisResourceType = () => {
  return getResourceType('kinesis') || {
    id: 'kinesis',
    name: 'Kinesis',
    category: 'analytics',
    icon: 'kinesis',
    description: 'Real-time streaming',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Stream Name', type: 'text' },
    ],
  };
};

/**
 * Get SQS resource type
 */
const getSQSResourceType = () => {
  return getResourceType('sqs') || {
    id: 'sqs',
    name: 'SQS Queue',
    category: 'analytics',
    icon: 'sqs',
    description: 'Message queue',
    color: '#FF4F8B',
    editableAttributes: [
      { key: 'label', label: 'Queue Name', type: 'text' },
    ],
  };
};

/**
 * Get SNS resource type
 */
const getSNSResourceType = () => {
  return getResourceType('sns') || {
    id: 'sns',
    name: 'SNS Topic',
    category: 'analytics',
    icon: 'sns',
    description: 'Message publishing',
    color: '#FF4F8B',
    editableAttributes: [
      { key: 'label', label: 'Topic Name', type: 'text' },
    ],
  };
};

/**
 * Get CloudWatch resource type
 */
const getCloudWatchResourceType = () => {
  return getResourceType('cloudwatch') || {
    id: 'cloudwatch',
    name: 'CloudWatch',
    category: 'analytics',
    icon: 'cloudwatch',
    description: 'Monitoring & logging',
    color: '#FF4F8B',
    editableAttributes: [
      { key: 'label', label: 'Log Group', type: 'text' },
    ],
  };
};

/**
 * Get Auto Scaling Group resource type
 */
const getAutoScalingGroupResourceType = () => {
  return getResourceType('autoscaling') || {
    id: 'autoscaling',
    name: 'Auto Scaling Group',
    category: 'compute',
    icon: 'autoscaling',
    description: 'Automatic scaling',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'ASG Name', type: 'text' },
    ],
  };
};

/**
 * Get Fargate resource type
 */
const getFargateResourceType = () => {
  return getResourceType('fargate') || {
    id: 'fargate',
    name: 'Fargate',
    category: 'compute',
    icon: 'fargate',
    description: 'Serverless container compute',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Task Name', type: 'text' },
    ],
  };
};

/**
 * Get Elastic Beanstalk resource type
 */
const getElasticBeanstalkResourceType = () => {
  return getResourceType('elasticbeanstalk') || {
    id: 'elasticbeanstalk',
    name: 'Elastic Beanstalk',
    category: 'compute',
    icon: 'elasticbeanstalk',
    description: 'Platform as a service',
    color: '#FF9900',
    editableAttributes: [
      { key: 'label', label: 'Environment Name', type: 'text' },
    ],
  };
};

/**
 * Get Route 53 resource type
 */
const getRoute53ResourceType = () => {
  return getResourceType('route53') || {
    id: 'route53',
    name: 'Route 53',
    category: 'networking',
    icon: 'route53',
    description: 'DNS and domain registration',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Hosted Zone', type: 'text' },
    ],
  };
};

/**
 * Get VPC Peering resource type
 */
const getVPCPeeringResourceType = () => {
  return getResourceType('vpcpeering') || {
    id: 'vpcpeering',
    name: 'VPC Peering',
    category: 'networking',
    icon: 'vpcpeering',
    description: 'VPC-to-VPC connectivity',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Peering ID', type: 'text' },
    ],
  };
};

/**
 * Get Transit Gateway resource type
 */
const getTransitGatewayResourceType = () => {
  return getResourceType('transitgateway') || {
    id: 'transitgateway',
    name: 'Transit Gateway',
    category: 'networking',
    icon: 'transitgateway',
    description: 'Hub-and-spoke network',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Gateway ID', type: 'text' },
    ],
  };
};

/**
 * Get Network ACL resource type
 */
const getNetworkACLResourceType = () => {
  return getResourceType('networkacl') || {
    id: 'networkacl',
    name: 'Network ACL',
    category: 'networking',
    icon: 'networkacl',
    description: 'Network access control list',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'NACL ID', type: 'text' },
    ],
  };
};

/**
 * Calculate positions using Graphviz layout algorithm
 * Generates a DOT graph from AWS resources and uses Graphviz to calculate optimal positions
 */
const calculateGraphvizLayout = async (
  data: AWSDataInput
): Promise<Map<string, { x: number; y: number }>> => {
  const positions = new Map<string, { x: number; y: number }>();
  
  try {
    const graphviz = await initGraphviz();
    if (!graphviz) {
      console.warn('Graphviz not available, using default positioning');
      return positions;
    }

    // Build a DOT graph representation of the AWS infrastructure
    let dotGraph = 'digraph AWS {\n';
    dotGraph += '  rankdir=TB;\n';
    dotGraph += '  node [shape=box, style=rounded];\n';
    dotGraph += '  edge [dir=forward];\n\n';

    // Add nodes and edges for each region
    const nodeMap = new Map<string, string>();
    let nodeCounter = 0;

    Object.entries(data).forEach(([regionKey, regionData]) => {
      const regionNodeId = `region_${nodeCounter++}`;
      nodeMap.set(`region-${regionKey}`, regionNodeId);
      dotGraph += `  ${regionNodeId} [label="Region: ${regionKey}", group="region"];\n`;

      // Add VPCs
      if (regionData.vpcs) {
        regionData.vpcs.forEach((vpc: any) => {
          const vpcNodeId = `vpc_${nodeCounter++}`;
          nodeMap.set(`vpc-${vpc.VpcId}`, vpcNodeId);
          dotGraph += `  ${vpcNodeId} [label="${vpc.VpcId}", group="vpc"];\n`;
          dotGraph += `  ${regionNodeId} -> ${vpcNodeId};\n`;

          // Add Subnets
          if (regionData.subnets) {
            regionData.subnets.filter((subnet: any) => subnet.VpcId === vpc.VpcId).forEach((subnet: any) => {
              const subnetNodeId = `subnet_${nodeCounter++}`;
              nodeMap.set(`subnet-${subnet.SubnetId}`, subnetNodeId);
              dotGraph += `  ${subnetNodeId} [label="${subnet.SubnetId}", group="subnet"];\n`;
              dotGraph += `  ${vpcNodeId} -> ${subnetNodeId};\n`;

              // Add EC2 Instances in subnet
              if (regionData.instances) {
                regionData.instances.filter((inst: any) => inst.SubnetId === subnet.SubnetId).forEach((instance: any) => {
                  const instanceNodeId = `instance_${nodeCounter++}`;
                  nodeMap.set(`instance-${instance.InstanceId}`, instanceNodeId);
                  dotGraph += `  ${instanceNodeId} [label="${instance.InstanceId}", group="instance", shape=ellipse];\n`;
                  dotGraph += `  ${subnetNodeId} -> ${instanceNodeId};\n`;
                });
              }
            });
          }

          // Add Security Groups
          if (regionData.security_groups) {
            regionData.security_groups.filter((sg: any) => sg.VpcId === vpc.VpcId).forEach((sg: any) => {
              const sgNodeId = `sg_${nodeCounter++}`;
              nodeMap.set(`sg-${sg.GroupId}`, sgNodeId);
              dotGraph += `  ${sgNodeId} [label="${sg.GroupName || sg.GroupId}", group="sg", shape=diamond];\n`;
            });
          }
        });
      }

      // Add RDS instances
      if (regionData.rds_instances) {
        regionData.rds_instances.forEach((rds: any) => {
          const rdsNodeId = `rds_${nodeCounter++}`;
          nodeMap.set(`rds-${rds.db_instance_name}`, rdsNodeId);
          dotGraph += `  ${rdsNodeId} [label="${rds.db_instance_name}", group="database", shape=cylinder];\n`;
        });
      }

      // Add S3 buckets
      if (regionData.s3_buckets) {
        regionData.s3_buckets.forEach((bucket: any) => {
          const s3NodeId = `s3_${nodeCounter++}`;
          nodeMap.set(`s3-${bucket.Name}`, s3NodeId);
          dotGraph += `  ${s3NodeId} [label="${bucket.Name}", group="storage", shape=folder];\n`;
        });
      }
    });

    dotGraph += '}\n';

    // Use Graphviz to layout
    const viz = new (graphviz as any).Graphviz();
    viz.dot(dotGraph);
    const svg = viz.renderSVG();
    
    // Parse SVG to extract positions
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    const elements = svgDoc.querySelectorAll('[id]');
    
    elements.forEach((el: any) => {
      const transform = el.getAttribute('transform');
      if (transform) {
        const match = transform.match(/translate\(([\d.-]+),([\d.-]+)\)/);
        if (match) {
          const nodeId = Array.from(nodeMap.entries()).find(([_, v]) => v === el.id)?.[0];
          if (nodeId) {
            positions.set(nodeId, {
              x: parseFloat(match[1]),
              y: parseFloat(match[2]),
            });
          }
        }
      }
    });
  } catch (error) {
    console.warn('Error calculating Graphviz layout:', error);
  }

  return positions;
};

/**
 * Parse AWS sample-web-app.json format to nodes and edges
 * Converts Regions, VPCs, Subnets, Instances, RDS, S3, and other AWS resources into diagram nodes with relationships
 * Uses resource type definitions from cloudResources (resources.ts)
 * Leverages Graphviz layout algorithm for optimal node positioning
 */
export const parseAWSDataJSON = async (
  data: AWSDataInput
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodePositions = new Map<string, { x: number; y: number }>();

  // Try to use Graphviz layout if available
  try {
    const graphvizPositions = await calculateGraphvizLayout(data);
    if (graphvizPositions && graphvizPositions.size > 0) {
      nodePositions = graphvizPositions;
    }
  } catch (error) {
    console.warn('Graphviz layout calculation failed, falling back to manual positioning:', error);
  }

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
  const natGatewayResourceType = getNATGatewayResourceType();
  const rdsResourceType = getRDSResourceType();
  const s3ResourceType = getS3ResourceType();
  const lambdaResourceType = getLambdaResourceType();
  const cloudFrontResourceType = getCloudFrontResourceType();
  const apiGatewayResourceType = getAPIGatewayResourceType();
  const loadBalancerResourceType = getLoadBalancerResourceType();
  const ecsResourceType = getECSResourceType();
  const eksResourceType = getEKSResourceType();
  const ebsResourceType = getEBSResourceType();
  const efsResourceType = getEFSResourceType();
  const dynamodbResourceType = getDynamoDBResourceType();
  const elasticacheResourceType = getElastiCacheResourceType();
  const iamResourceType = getIAMResourceType();
  const cognitoResourceType = getCognitoResourceType();
  const wafResourceType = getWAFResourceType();
  const kinesisResourceType = getKinesisResourceType();
  const sqsResourceType = getSQSResourceType();
  const snsResourceType = getSNSResourceType();
  const cloudwatchResourceType = getCloudWatchResourceType();
  const asgResourceType = getAutoScalingGroupResourceType();
  const fargateResourceType = getFargateResourceType();
  const ebResourceType = getElasticBeanstalkResourceType();
  const route53ResourceType = getRoute53ResourceType();
  const vpcPeeringResourceType = getVPCPeeringResourceType();
  const tgwResourceType = getTransitGatewayResourceType();
  const naclResourceType = getNetworkACLResourceType();

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
      const vpcIGWs = regionData.internet_gateways?.filter(
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
      const vpcIGWs = regionData.internet_gateways?.filter((igw: any) =>
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

          // Create edge from VPC to IGW
          edges.push({
            id: `vpc-igw-${vpc.VpcId}-${igw.InternetGatewayId}`,
            source: vpcNodeId,
            target: igwNodeId,
            // animated: true,
            // type: 'smoothstep',
            label: 'Internet Gateway',
            style: { stroke: '#8C4FFF', strokeWidth: 2 },
            markerEnd: 'arrowclosed',
          });
        });
      }

      // Add NAT Gateways inside VPC
      const vpcNATGateways = regionData.nat_gateways?.filter(
        (ngw: any) => regionData.subnets?.some((s: any) => s.SubnetId === ngw.SubnetId && s.VpcId === vpc.VpcId)
      ) || [];
      
      if (vpcNATGateways.length > 0) {
        const natMargin = 25;
        const natWidth = 280;
        vpcNATGateways.forEach((ngw: any, natIndex: number) => {
          const natNodeId = `nat-${ngw.NatGatewayId}`;
          const natX = vpcX + vpcPadding + igwWidth + 30 + natIndex * (natWidth + natMargin);
          const natY = vpcY + vpcPadding;

          nodes.push({
            id: natNodeId,
            type: 'resourceNode',
            position: { x: natX, y: natY },
            data: {
              label: ngw.NatGatewayId,
              resourceType: natGatewayResourceType,
              gatewayId: ngw.NatGatewayId,
              subnetId: ngw.SubnetId,
              state: ngw.State,
              parentId: vpcNodeId,
              config: {
                originalType: 'AWS::EC2::NatGateway',
                region: regionKey,
              },
            },
          });

          // Create edge from VPC to NAT Gateway
          edges.push({
            id: `vpc-nat-${vpc.VpcId}-${ngw.NatGatewayId}`,
            source: vpcNodeId,
            target: natNodeId,
            // animated: true,
            // type: 'smoothstep',
            label: 'NAT Gateway',
            style: { stroke: '#8C4FFF', strokeWidth: 2 },
            markerEnd: 'arrowclosed',
          });
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
                  // animated: true,
                  // type: 'smoothstep',
                  label: 'Routes',
                  style: { stroke: '#FFA000', strokeWidth: 2 },
                  markerEnd: 'arrowclosed',
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
              // animated: true,
              // type: 'smoothstep',
              label: 'Secured by',
              style: { stroke: '#DD344C', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
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
          // animated: true,
          // type: 'smoothstep',
          label: 'Contains',
          style: { stroke: '#8C4FFF', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
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
            // animated: true,
            // type: 'smoothstep',
            label: 'Deployed in',
            style: { stroke: '#FF9900', strokeWidth: 2 },
            markerEnd: 'arrowclosed',
          });
        });
      });
    });

    // Add RDS instances within this VPC (AWS Rule: RDS must be within VPC)
    regionData.vpcs.forEach((vpc: any, vpcIndex: number) => {
      const vpcRDSInstances = regionData.rds_instances?.filter((rds: any) => {
        const rdsSubnet = regionData.subnets?.find((s: any) => s.SubnetId === rds.subnet_id);
        return rdsSubnet?.VpcId === vpc.VpcId;
      }) || [];

      if (vpcRDSInstances.length > 0) {
        const rdsMargin = 25;
        const rdsWidth = 280;
        const vpcNodeId = `vpc-${vpc.VpcId}`;
        const vpcSubnets = regionData.subnets.filter((subnet: any) => subnet.VpcId === vpc.VpcId);
        const vpcRouteTables = regionData.route_tables?.filter((rt: any) => rt.VpcId === vpc.VpcId) || [];
        const rtTableHeight = vpcRouteTables.length > 0 ? 120 : 0;
        const vpcSecurityGroups = regionData.security_groups?.filter((sg: any) => sg.VpcId === vpc.VpcId) || [];
        const sgHeight = vpcSecurityGroups.length > 0 ? 100 : 0;
        const vpcX = regionX + vpcMarginBetween + vpcIndex * (maxVpcWidth + vpcMarginBetween);
        const vpcY = regionY + regionPadding;
        const vpcPadding = 40;
        
        // Recalculate vpcContainerHeight for RDS positioning
        const subnetsPerRow = 2;
        const subnetWidth = 380;
        const subnetMargin = 25;
        const numRows = Math.ceil(vpcSubnets.length / subnetsPerRow);
        let totalSubnetHeight = 0;
        for (let row = 0; row < numRows; row++) {
          let maxHeightInRow = 100;
          for (let col = 0; col < subnetsPerRow; col++) {
            const index = row * subnetsPerRow + col;
            if (index < vpcSubnets.length) {
              const subnetInstances = regionData.instances.filter((instance: any) => instance.SubnetId === vpcSubnets[index].SubnetId);
              const subnetHeight = 120 + Math.max(subnetInstances.length * 80, 80);
              maxHeightInRow = Math.max(maxHeightInRow, subnetHeight);
            }
          }
          totalSubnetHeight += maxHeightInRow + subnetMargin;
        }
        const igwHeight = regionData.internet_gateways?.some((igw: any) => igw.Attachments?.some((att: any) => att.VpcId === vpc.VpcId)) ? 100 : 0;
        const vpcContainerHeight = igwHeight + vpcPadding + totalSubnetHeight + rtTableHeight + sgHeight + vpcPadding;
        
        vpcRDSInstances.forEach((rds: any, rdsIndex: number) => {
          const rdsNodeId = `rds-${rds.db_instance_name}`;
          const rdsX = vpcX + vpcPadding + rdsIndex * (rdsWidth + rdsMargin);
          const rdsY = vpcY + vpcContainerHeight - rtTableHeight - sgHeight - 150;

          nodes.push({
            id: rdsNodeId,
            type: 'resourceNode',
            position: { x: rdsX, y: rdsY },
            data: {
              label: rds.db_instance_name,
              resourceType: rdsResourceType,
              dbInstanceName: rds.db_instance_name,
              engine: rds.engine,
              engineVersion: rds.engine_version,
              dbInstanceClass: rds.db_instance_class,
              port: rds.port,
              allocatedStorage: rds.allocated_storage,
              multiAZ: rds.multi_az,
              subnetId: rds.subnet_id,
              vpcId: vpc.VpcId,
              parentId: vpcNodeId,
              config: {
                originalType: 'AWS::RDS::DBInstance',
                region: regionKey,
                engine: rds.engine,
                port: rds.port,
                instanceClass: rds.db_instance_class,
              },
            },
          });

          // AWS Rule: Connect RDS to associated subnet (DB Subnet Group)
          const rdsSubnet = regionData.subnets?.find((s: any) => s.SubnetId === rds.subnet_id);
          if (rdsSubnet) {
            edges.push({
              id: `subnet-rds-${rds.subnet_id}-${rds.db_instance_name}`,
              source: `subnet-${rds.subnet_id}`,
              target: rdsNodeId,
              // animated: true,
              // type: 'smoothstep',
              label: `DB Subnet (${rds.engine})`,
              style: { stroke: '#527FFF', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
            });
          }

          // AWS Rule: Connect RDS to its security group if specified
          if (rds.security_group?.id) {
            edges.push({
              id: `sg-rds-${rds.security_group.id}-${rds.db_instance_name}`,
              source: `sg-${rds.security_group.id}`,
              target: rdsNodeId,
              // animated: true,
              // type: 'smoothstep',
              label: `Ingress (port ${rds.port})`,
              style: { stroke: '#DD344C', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
            });
          }
        });
      }
    });

    // Add Load Balancers at Region level (AWS Rule: Load balancers are regional)
    if (regionData.load_balancers && regionData.load_balancers.length > 0) {
      const lbMargin = 25;
      const lbWidth = 280;
      const lbX = regionX + regionPadding;
      const lbY = regionY + regionContainerHeight + vpcMarginBetween;

      regionData.load_balancers.forEach((lb: any, lbIndex: number) => {
        const lbNodeId = `lb-${lb.LoadBalancerName}`;
        const lbNodeX = lbX + lbIndex * (lbWidth + lbMargin);
        const lbNodeY = lbY;

        nodes.push({
          id: lbNodeId,
          type: 'resourceNode',
          position: { x: lbNodeX, y: lbNodeY },
          data: {
            label: lb.LoadBalancerName,
            resourceType: loadBalancerResourceType,
            lbName: lb.LoadBalancerName,
            type: lb.Type || 'application',
            scheme: lb.Scheme || 'internet-facing',
            subnets: lb.Subnets || [],
            securityGroups: lb.SecurityGroups || [],
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
              region: regionKey,
              type: lb.Type || 'application',
              scheme: lb.Scheme || 'internet-facing',
            },
          },
        });

        // AWS Rule: Connect Region to Load Balancer (LB is a regional resource)
        edges.push({
          id: `region-lb-${regionKey}-${lb.LoadBalancerName}`,
          source: regionNodeId,
          target: lbNodeId,
          label: 'Load Balancer',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });

        // AWS Rule: Connect Load Balancer to its subnets
        if (lb.Subnets && Array.isArray(lb.Subnets)) {
          lb.Subnets.forEach((subnetId: string) => {
            edges.push({
              id: `lb-subnet-${lb.LoadBalancerName}-${subnetId}`,
              source: lbNodeId,
              target: `subnet-${subnetId}`,
              label: 'Deployed in',
              style: { stroke: '#FF9900', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
            });
          });
        }

        // AWS Rule: Connect Load Balancer to its security groups
        if (lb.SecurityGroups && Array.isArray(lb.SecurityGroups)) {
          lb.SecurityGroups.forEach((sgId: string) => {
            edges.push({
              id: `lb-sg-${lb.LoadBalancerName}-${sgId}`,
              source: lbNodeId,
              target: `sg-${sgId}`,
              label: 'Protected by',
              style: { stroke: '#DD344C', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
            });
          });
        }
      });
    }

    // Add S3 buckets at Region level (AWS Rule: S3 is region-scoped, not VPC-bound)
    if (regionData.s3_buckets && regionData.s3_buckets.length > 0) {
      const s3Margin = 25;
      const s3Width = 280;
      const s3X = regionX + regionPadding;
      const s3Y = regionY + regionContainerHeight + vpcMarginBetween + (regionData.load_balancers?.length ? 120 : 0);

      regionData.s3_buckets.forEach((bucket: any, s3Index: number) => {
        const s3NodeId = `s3-${bucket.Name}`;
        const s3NodeX = s3X + s3Index * (s3Width + s3Margin);
        const s3NodeY = s3Y;

        nodes.push({
          id: s3NodeId,
          type: 'resourceNode',
          position: { x: s3NodeX, y: s3NodeY },
          data: {
            label: bucket.Name,
            resourceType: s3ResourceType,
            bucketName: bucket.Name,
            region: bucket.Region || regionKey,
            creationDate: bucket.CreationDate,
            versioning: bucket.Versioning,
            encryption: bucket.Encryption,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::S3::Bucket',
              region: bucket.Region || regionKey,
              versioning: bucket.Versioning,
              encryption: bucket.Encryption,
            },
          },
        });

        // AWS Rule: Connect Region to S3 (S3 bucket is a regional resource)
        edges.push({
          id: `region-s3-${regionKey}-${bucket.Name}`,
          source: regionNodeId,
          target: s3NodeId,
          // animated: true,
          // type: 'smoothstep',
          label: 'S3 Bucket',
          style: { stroke: '#569A31', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // AWS Rule: Create edges from instances to RDS (via security group ingress rules)
    if (regionData.instances && regionData.rds_instances && regionData.security_groups) {
      for (const instance of regionData.instances) {
        const instanceSgId = instance.SecurityGroups?.[0]?.GroupId;

        for (const rds of regionData.rds_instances) {
          const rdsSgId = rds.security_group?.id;

          // Check if instance SG has permission to RDS
          if (instanceSgId && rdsSgId && rds.security_group?.inbound_rules) {
            const canAccess = rds.security_group.inbound_rules.some(
              (rule: any) => rule.source_security_group === instanceSgId
            );

            if (canAccess) {
              const rdsId = `rds-${rds.db_instance_name}`;
              edges.push({
                id: `instance-rds-${instance.InstanceId}-${rds.db_instance_name}`,
                source: `instance-${instance.InstanceId}`,
                target: rdsId,
                // animated: true,
                // type: 'smoothstep',
                label: `Query ${rds.engine.toUpperCase()} (port ${rds.port})`,
                style: { stroke: '#527FFF', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            }
          }
        }
      }
    }

    // Create edges from route tables to internet gateway (from route entries)
    if (regionData.route_tables && regionData.internet_gateways) {
      for (const rt of regionData.route_tables) {
        const igws = regionData.internet_gateways?.filter((igw: any) =>
          igw.Attachments?.some((att: any) => att.VpcId === rt.VpcId)
        ) || [];

        if (rt.Routes && Array.isArray(rt.Routes)) {
          for (const route of rt.Routes) {
            // AWS Rule: Route to Internet Gateway for public routes (0.0.0.0/0 typically)
            if (route.GatewayId && route.GatewayId.startsWith('igw-')) {
              const igwId = route.GatewayId;
              edges.push({
                id: `rt-igw-${rt.RouteTableId}-${igwId}`,
                source: `rt-${rt.RouteTableId}`,
                target: `igw-${igwId}`,
                // animated: true,
                // type: 'smoothstep',
                label: `Public route to ${route.DestinationCidrBlock}`,
                style: { stroke: '#FF6B6B', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            }

            // AWS Rule: Route to NAT Gateway for private routes (enables egress from private subnets)
            if (route.NatGatewayId) {
              const natId = route.NatGatewayId;
              edges.push({
                id: `rt-nat-${rt.RouteTableId}-${natId}`,
                source: `rt-${rt.RouteTableId}`,
                target: `nat-${natId}`,
                // animated: true,
                // type: 'smoothstep',
                label: `Private route to ${route.DestinationCidrBlock}`,
                style: { stroke: '#4ECDC4', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            }
          }
        }
      }
    }

    // Update position for next region with dynamic spacing (AWS Rule: Account for all resources)
    const s3Height = regionData.s3_buckets?.length ? 150 : 0;
    const regionMargin = 200 + Math.ceil(regionData.vpcs.length * 50);
    currentY += regionContainerHeight + regionMargin + s3Height;
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
