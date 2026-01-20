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
    vpc_endpoints?: any[];
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
 * Get VPC Endpoint resource type
 */
const getVPCEndpointResourceType = () => {
  return {
    id: 'vpcendpoint',
    name: 'VPC Endpoint',
    category: 'networking',
    icon: 'vpc',
    description: 'VPC Endpoint for AWS services',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'label', label: 'Endpoint ID', type: 'text' },
      { key: 'serviceName', label: 'Service Name', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
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
): Promise<Map<string, { x: number; y: number; width?: number; height?: number }>> => {
  const positions = new Map<string, { x: number; y: number; width?: number; height?: number }>();
  
  try {
    const graphviz = await initGraphviz();
    if (!graphviz) {
      console.warn('Graphviz not available, using default positioning');
      return positions;
    }

    // Build a DOT graph representation of the AWS infrastructure with hierarchical constraints
    let dotGraph = 'digraph AWS {\n';
    dotGraph += '  rankdir=TB;\n';
    dotGraph += '  compound=true;\n';
    dotGraph += '  nodesep=1.0;\n';
    dotGraph += '  ranksep=1.5;\n';
    dotGraph += '  node [shape=box, style="rounded,filled", fillcolor=white, height=0.6, width=1.2];\n';
    dotGraph += '  edge [dir=forward, penwidth=1.5];\n\n';

    // Create a mapping for node IDs to track positions and dimensions later
    const nodeMap = new Map<string, { id: string; width: number; height: number; isContainer?: boolean }>();
    let nodeCounter = 0;

    // Helper to add a node to graph
    const addNode = (nodeId: string, label: string, shape: string = 'box', group?: string, isContainer: boolean = false) => {
      const dotNodeId = `n${nodeCounter++}`;
      nodeMap.set(dotNodeId, { id: nodeId, width: 1.2, height: 0.6, isContainer });
      const nodeAttrs = [
        `label="${label}"`,
        `shape="${shape}"`,
        group ? `group="${group}"` : '',
      ].filter(a => a).join(', ');
      dotGraph += `  ${dotNodeId} [${nodeAttrs}];\n`;
      return dotNodeId;
    };

    // Helper to add an edge
    const addEdge = (fromDotId: string, toDotId: string) => {
      dotGraph += `  ${fromDotId} -> ${toDotId};\n`;
    };

    // Process each region
    Object.entries(data).forEach(([regionKey, regionData]) => {
      const regionDotId = addNode(`region-${regionKey}`, `Region: ${regionKey}`, 'box', 'region', true);

      // Process VPCs in region
      if (regionData.vpcs && Array.isArray(regionData.vpcs)) {
        regionData.vpcs.forEach((vpc: any) => {
          const vpcDotId = addNode(`vpc-${vpc.VpcId}`, `VPC: ${vpc.VpcId}`, 'box', 'vpc', true);
          addEdge(regionDotId, vpcDotId);

          // Process Internet Gateways for this VPC
          if (regionData.internet_gateways && Array.isArray(regionData.internet_gateways)) {
            regionData.internet_gateways
              .filter((igw: any) => igw.Attachments?.some((att: any) => att.VpcId === vpc.VpcId))
              .forEach((igw: any) => {
                const igwDotId = addNode(`igw-${igw.InternetGatewayId}`, `IGW: ${igw.InternetGatewayId}`, 'box', 'igw');
                addEdge(vpcDotId, igwDotId);
              });
          }

          // Process Subnets
          if (regionData.subnets && Array.isArray(regionData.subnets)) {
            regionData.subnets
              .filter((subnet: any) => subnet.VpcId === vpc.VpcId)
              .forEach((subnet: any) => {
                const subnetDotId = addNode(`subnet-${subnet.SubnetId}`, `Subnet: ${subnet.SubnetId}`, 'box', 'subnet', true);
                addEdge(vpcDotId, subnetDotId);

                // Add EC2 instances in subnet
                if (regionData.instances && Array.isArray(regionData.instances)) {
                  regionData.instances
                    .filter((inst: any) => inst.SubnetId === subnet.SubnetId)
                    .forEach((instance: any) => {
                      const instDotId = addNode(`instance-${instance.InstanceId}`, `EC2: ${instance.InstanceId}`, 'ellipse', 'instance');
                      addEdge(subnetDotId, instDotId);
                    });
                }

                // Add Load Balancers in subnet
                if (regionData.load_balancers && Array.isArray(regionData.load_balancers)) {
                  regionData.load_balancers
                    .filter((lb: any) => lb.Subnets?.includes(subnet.SubnetId))
                    .forEach((lb: any) => {
                      const lbDotId = addNode(`lb-${lb.LoadBalancerArn}`, `LB: ${lb.LoadBalancerName}`, 'box', 'loadbalancer');
                      addEdge(subnetDotId, lbDotId);
                    });
                }

                // Add NAT Gateways in subnet
                if (regionData.nat_gateways && Array.isArray(regionData.nat_gateways)) {
                  regionData.nat_gateways
                    .filter((nat: any) => nat.SubnetId === subnet.SubnetId)
                    .forEach((nat: any) => {
                      const natDotId = addNode(`nat-${nat.NatGatewayId}`, `NAT: ${nat.NatGatewayId}`, 'box', 'nat');
                      addEdge(subnetDotId, natDotId);
                    });
                }

                // Add RDS instances in subnet
                if (regionData.rds_instances && Array.isArray(regionData.rds_instances)) {
                  regionData.rds_instances
                    .filter((rds: any) => rds.DBSubnetGroupDescription?.includes(subnet.SubnetId) || rds.AvailabilityZone?.includes(regionKey))
                    .forEach((rds: any) => {
                      const rdsDotId = addNode(`rds-${rds.DBInstanceIdentifier}`, `RDS: ${rds.DBInstanceIdentifier}`, 'cylinder', 'database');
                      addEdge(subnetDotId, rdsDotId);
                    });
                }
              });
          }

          // Process Security Groups for this VPC
          if (regionData.security_groups && Array.isArray(regionData.security_groups)) {
            regionData.security_groups
              .filter((sg: any) => sg.VpcId === vpc.VpcId)
              .forEach((sg: any) => {
                const sgDotId = addNode(`sg-${sg.GroupId}`, `SG: ${sg.GroupName || sg.GroupId}`, 'diamond', 'sg');
                addEdge(vpcDotId, sgDotId);
              });
          }

          // Process Route Tables
          if (regionData.route_tables && Array.isArray(regionData.route_tables)) {
            regionData.route_tables
              .filter((rt: any) => rt.VpcId === vpc.VpcId)
              .forEach((rt: any) => {
                const rtDotId = addNode(`rt-${rt.RouteTableId}`, `RT: ${rt.RouteTableId}`, 'box', 'routetable');
                addEdge(vpcDotId, rtDotId);
              });
          }
        });
      }

      // Regional-level resources
      if (regionData.s3_buckets && Array.isArray(regionData.s3_buckets)) {
        regionData.s3_buckets.forEach((bucket: any) => {
          const s3DotId = addNode(`s3-${bucket.Name}`, `S3: ${bucket.Name}`, 'folder', 'storage');
          addEdge(regionDotId, s3DotId);
        });
      }

      if (regionData.lambda_functions && Array.isArray(regionData.lambda_functions)) {
        regionData.lambda_functions.forEach((lambda: any) => {
          const lambdaDotId = addNode(`lambda-${lambda.FunctionName}`, `Lambda: ${lambda.FunctionName}`, 'ellipse', 'compute');
          addEdge(regionDotId, lambdaDotId);
        });
      }

      if (regionData.cloudfront_distributions && Array.isArray(regionData.cloudfront_distributions)) {
        regionData.cloudfront_distributions.forEach((cf: any) => {
          const cfDotId = addNode(`cf-${cf.Id}`, `CloudFront: ${cf.Id}`, 'box', 'cdn');
          addEdge(regionDotId, cfDotId);
        });
      }

      if (regionData.api_gateways && Array.isArray(regionData.api_gateways)) {
        regionData.api_gateways.forEach((api: any) => {
          const apiDotId = addNode(`api-${api.id || api.name}`, `API Gateway: ${api.name || api.id}`, 'box', 'api');
          addEdge(regionDotId, apiDotId);
        });
      }

      if (regionData.ecs_clusters && Array.isArray(regionData.ecs_clusters)) {
        regionData.ecs_clusters.forEach((ecs: any) => {
          const ecsDotId = addNode(`ecs-${ecs.clusterName}`, `ECS: ${ecs.clusterName}`, 'box', 'compute', true);
          addEdge(regionDotId, ecsDotId);
        });
      }

      if (regionData.eks_clusters && Array.isArray(regionData.eks_clusters)) {
        regionData.eks_clusters.forEach((eks: any) => {
          const eksDotId = addNode(`eks-${eks.name}`, `EKS: ${eks.name}`, 'box', 'compute', true);
          addEdge(regionDotId, eksDotId);
        });
      }

      if (regionData.dynamodb_tables && Array.isArray(regionData.dynamodb_tables)) {
        regionData.dynamodb_tables.forEach((ddb: any) => {
          const ddbDotId = addNode(`ddb-${ddb.TableName}`, `DynamoDB: ${ddb.TableName}`, 'box', 'database');
          addEdge(regionDotId, ddbDotId);
        });
      }

      if (regionData.elasticache_clusters && Array.isArray(regionData.elasticache_clusters)) {
        regionData.elasticache_clusters.forEach((ec: any) => {
          const ecDotId = addNode(`ec-${ec.CacheClusterId}`, `ElastiCache: ${ec.CacheClusterId}`, 'box', 'database');
          addEdge(regionDotId, ecDotId);
        });
      }

      if (regionData.autoscaling_groups && Array.isArray(regionData.autoscaling_groups)) {
        regionData.autoscaling_groups.forEach((asg: any) => {
          const asgDotId = addNode(`asg-${asg.AutoScalingGroupName}`, `ASG: ${asg.AutoScalingGroupName}`, 'box', 'compute', true);
          addEdge(regionDotId, asgDotId);
        });
      }

      if (regionData.fargate_tasks && Array.isArray(regionData.fargate_tasks)) {
        regionData.fargate_tasks.forEach((fargate: any) => {
          const fargateDotId = addNode(`fargate-${fargate.taskDefinitionArn}`, `Fargate: ${fargate.family}`, 'ellipse', 'compute');
          addEdge(regionDotId, fargateDotId);
        });
      }

      if (regionData.kinesis_streams && Array.isArray(regionData.kinesis_streams)) {
        regionData.kinesis_streams.forEach((stream: any) => {
          const kDotId = addNode(`kinesis-${stream.StreamName}`, `Kinesis: ${stream.StreamName}`, 'box', 'analytics');
          addEdge(regionDotId, kDotId);
        });
      }

      if (regionData.sqs_queues && Array.isArray(regionData.sqs_queues)) {
        regionData.sqs_queues.forEach((queue: any) => {
          const sqsDotId = addNode(`sqs-${queue.QueueUrl}`, `SQS: ${queue.QueueUrl.split('/').pop()}`, 'box', 'messaging');
          addEdge(regionDotId, sqsDotId);
        });
      }

      if (regionData.sns_topics && Array.isArray(regionData.sns_topics)) {
        regionData.sns_topics.forEach((topic: any) => {
          const snsDotId = addNode(`sns-${topic.TopicArn}`, `SNS: ${topic.TopicArn.split(':').pop()}`, 'box', 'messaging');
          addEdge(regionDotId, snsDotId);
        });
      }

      if (regionData.iam_roles && Array.isArray(regionData.iam_roles)) {
        regionData.iam_roles.forEach((role: any) => {
          const iamDotId = addNode(`iam-${role.RoleName}`, `IAM: ${role.RoleName}`, 'box', 'security');
          addEdge(regionDotId, iamDotId);
        });
      }

      if (regionData.cognito_user_pools && Array.isArray(regionData.cognito_user_pools)) {
        regionData.cognito_user_pools.forEach((pool: any) => {
          const cognitoDotId = addNode(`cognito-${pool.Id}`, `Cognito: ${pool.Name}`, 'box', 'security');
          addEdge(regionDotId, cognitoDotId);
        });
      }

      if (regionData.vpc_endpoints && Array.isArray(regionData.vpc_endpoints)) {
        regionData.vpc_endpoints.forEach((endpoint: any) => {
          const vpceDotId = addNode(`vpce-${endpoint.VpcEndpointId}`, `VPC Endpoint: ${endpoint.VpcEndpointId}`, 'box', 'networking');
          addEdge(regionDotId, vpceDotId);
        });
      }
    });

    dotGraph += '}\n';

    // Use Graphviz layout engine
    const Graphviz = (graphviz as any).Graphviz;
    const viz = new Graphviz();
    viz.dot(dotGraph);
    
    // Render to get layout information
    const svg = viz.renderSVG();
    
    // Parse SVG to extract node positions and dimensions
    if (typeof svg === 'string' && typeof globalThis !== 'undefined' && globalThis.DOMParser) {
      const parser = new globalThis.DOMParser();
      const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
      
      // Extract positions and dimensions from SVG elements
      const titleElements = svgDoc.querySelectorAll('title');
      titleElements.forEach((titleEl: any) => {
        const nodeId = titleEl.textContent?.trim();
        const parentG = titleEl.closest('g[id]') || titleEl.parentElement;
        
        if (nodeId && parentG) {
          const transform = parentG.getAttribute('transform');
          if (transform) {
            // Extract translate coordinates from transform
            const translateMatch = transform.match(/translate\(([\d.-]+),([\d.-]+)\)/);
            if (translateMatch) {
              const x = parseFloat(translateMatch[1]);
              const y = parseFloat(translateMatch[2]);
              
              // Look up the actual node ID and metadata from our mapping
              const mapEntry = Array.from(nodeMap.entries()).find(
                ([_, data]) => data.id === nodeId
              );
              
              if (mapEntry) {
                const [_, metadata] = mapEntry;
                const positionData: any = {
                  x: !isNaN(x) ? x * 1.5 : 0,  // Scale factor for ReactFlow, default to 0 if NaN
                  y: !isNaN(y) ? y * 1.5 : 0,
                };
                
                // Extract width and height for container nodes from the polygon/ellipse/path elements
                if (metadata.isContainer) {
                  // Find the shape element (polygon, ellipse, or path) within this group
                  const shapeElement = parentG.querySelector('polygon, ellipse, path');
                  if (shapeElement) {
                    // Extract bounding box from shape
                    if (shapeElement.tagName === 'polygon') {
                      const points = shapeElement.getAttribute('points');
                      if (points) {
                        const coordPairs = points.trim().split(/\s+/).map((p: string) => {
                          const [x, y] = p.split(',').map(Number);
                          return { x, y };
                        });
                        
                        if (coordPairs.length > 0) {
                          const xs = coordPairs.map((p: any) => p.x).filter(x => !isNaN(x));
                          const ys = coordPairs.map((p: any) => p.y).filter(y => !isNaN(y));
                          if (xs.length > 0 && ys.length > 0) {
                            const minX = Math.min(...xs);
                            const maxX = Math.max(...xs);
                            const minY = Math.min(...ys);
                            const maxY = Math.max(...ys);
                            
                            positionData.width = (maxX - minX) * 1.5;
                            positionData.height = (maxY - minY) * 1.5;
                          }
                        }
                      }
                    } else if (shapeElement.tagName === 'ellipse') {
                      const rx = parseFloat(shapeElement.getAttribute('rx') || '0');
                      const ry = parseFloat(shapeElement.getAttribute('ry') || '0');
                      if (!isNaN(rx) && !isNaN(ry)) {
                        positionData.width = rx * 2 * 1.5;
                        positionData.height = ry * 2 * 1.5;
                      }
                    }
                  }
                }
                
                positions.set(nodeId, positionData);
              }
            }
          }
        }
      });
    }
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
  let graphvizPositions = new Map<string, { x: number; y: number }>();
  let useGraphvizLayout = false;

  // Calculate graphviz layout for all nodes
  try {
    console.log('Calculating Graphviz layout...');
    const positions = await calculateGraphvizLayout(data);
    if (positions && positions.size > 0) {
      graphvizPositions = positions;
      useGraphvizLayout = true;
      console.log(`Graphviz layout calculated for ${positions.size} nodes`);
    }
  } catch (error) {
    console.warn('Graphviz layout calculation failed, falling back to manual positioning:', error);
  }

  // Helper function to get position and dimensions - uses graphviz if available, otherwise manual calculation
  const getNodePosition = (
    nodeId: string, 
    defaultX: number, 
    defaultY: number,
    defaultWidth?: number,
    defaultHeight?: number
  ): { x: number; y: number; width?: number; height?: number } => {
    if (useGraphvizLayout && graphvizPositions.has(nodeId)) {
      const graphvizData = graphvizPositions.get(nodeId)! as any;
      // Use Graphviz dimensions if available, otherwise use defaults
      return {
        x: graphvizData.x,
        y: graphvizData.y,
        width: graphvizData.width || defaultWidth,
        height: graphvizData.height || defaultHeight,
      };
    }
    return { x: defaultX, y: defaultY, width: defaultWidth, height: defaultHeight };
  };

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
    // Support both VPC-based and serverless (VPC-less) architectures
    const hasVPCs = regionData.vpcs && regionData.vpcs.length > 0;
    
    // Skip only if there's no VPCs AND no region-level resources
    const hasRegionResources = regionData.s3_buckets?.length || 
                               regionData.lambda_functions?.length ||
                               regionData.api_gateways?.length ||
                               regionData.dynamodb_tables?.length ||
                               regionData.sqs_queues?.length ||
                               regionData.cloudfront_distributions?.length ||
                               regionData.ecs_clusters?.length ||
                               regionData.eks_clusters?.length;
    
    if (!hasVPCs && !hasRegionResources) {
      return;
    }

    // Initialize instances as empty array if not provided
    if (!regionData.instances) {
      regionData.instances = [];
    }

    const regionNodeId = `region-${regionKey}`;
    const regionX = currentX;
    const regionY = currentY;

    // Define layout variables with defaults (will be updated if VPCs exist)
    let maxVpcWidth = 1100;
    let vpcMarginBetween = 100;
    let regionPadding = 140;

    // Calculate region dimensions based on VPCs (if any) or region-level resources
    let regionContainerWidth = 1100;
    let regionContainerHeight = 400;
    let regionResourcesStartY = regionY + 140; // Default start position for resources

    if (hasVPCs) {
      // VPC-based architecture - calculate dimensions from VPCs
      const vpcHeights: number[] = [];
      const vpcWidths: number[] = [];
      
      regionData.vpcs.forEach((vpc: any) => {
        const vpcSubnets = regionData.subnets?.filter((subnet: any) => subnet.VpcId === vpc.VpcId) || [];
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
              const subnet = vpcSubnets[index];
              const subnetInstances = regionData.instances.filter(
                (instance: any) => instance.SubnetId === subnet.SubnetId
              );
              
              const subnetLoadBalancers = regionData.load_balancers?.filter(
                (lb: any) => lb.Subnets?.includes(subnet.SubnetId)
              ) || [];
              const subnetNATGateways = regionData.nat_gateways?.filter(
                (ngw: any) => ngw.SubnetId === subnet.SubnetId
              ) || [];
              const subnetRDSInstances = regionData.rds_instances?.filter(
                (rds: any) => rds.subnet_ids?.includes(subnet.SubnetId)
              ) || [];
              
              const instancesHeight = subnetInstances.length > 0 ? Math.max(subnetInstances.length * 80, 80) : 0;
              const lbHeight = subnetLoadBalancers.length > 0 ? 100 : 0;
              const natHeight = subnetNATGateways.length > 0 ? 100 : 0;
              const rdsHeight = subnetRDSInstances.length > 0 ? 100 : 0;
              const subnetHeight = 120 + instancesHeight + lbHeight + natHeight + rdsHeight;
              
              maxHeightInRow = Math.max(maxHeightInRow, subnetHeight);
            }
          }
          rowHeights.push(maxHeightInRow);
        }
        
        const igwHeight = vpcIGWs.length > 0 ? 100 : 0;
        const rtTableHeight = vpcRouteTables.length > 0 ? 120 : 0;
        const sgHeight = 0;
        
        const vpcContentHeight = igwHeight + vpcPadding + rowHeights.reduce((a, b) => a + b + subnetMargin, 0) + rtTableHeight + sgHeight + vpcPadding;
        
        vpcHeights.push(vpcContentHeight);
        
        const subnetGridWidth = subnetsPerRow * subnetWidth + (subnetsPerRow + 1) * subnetMargin;
        const igwWidth = 280;
        const igwsWidth = vpcIGWs.length > 0 ? vpcIGWs.length * igwWidth + (vpcIGWs.length + 1) * 25 : 0;
        const rtWidth = 280;
        const rtTableWidth = vpcRouteTables.length > 0 ? vpcRouteTables.length * rtWidth + (vpcRouteTables.length + 1) * 25 : 0;
        const sgWidth = 280;
        const sgTableWidth = vpcSecurityGroups.length > 0 ? vpcSecurityGroups.length * sgWidth + (vpcSecurityGroups.length + 1) * 25 : 0;
        const vpcContainerWidth = Math.max(subnetGridWidth, igwsWidth, rtTableWidth, sgTableWidth) + vpcPadding * 2;
        
        vpcWidths.push(vpcContainerWidth);
      });
      
      const maxVpcHeightLocal = vpcHeights.length > 0 ? Math.max(...vpcHeights) : 800;
      maxVpcWidth = vpcWidths.length > 0 ? Math.max(...vpcWidths) : 1100;
      const vpcCount = regionData.vpcs?.length || 0;
      vpcMarginBetween = 100;
      regionPadding = 140;

      // Calculate height for region-level resources that appear after VPCs
      const resourceHeight = 150;
      const resourceTypes = [
        regionData.lambda_functions?.length || 0,
        regionData.api_gateways?.length || 0,
        regionData.cloudfront_distributions?.length || 0,
        regionData.dynamodb_tables?.length || 0,
        regionData.elasticache_clusters?.length || 0,
        regionData.ecs_clusters?.length || 0,
        regionData.eks_clusters?.length || 0,
        regionData.autoscaling_groups?.length || 0,
        regionData.fargate_tasks?.length || 0,
        regionData.kinesis_streams?.length || 0,
        regionData.sqs_queues?.length || 0,
        regionData.sns_topics?.length || 0,
        regionData.vpc_endpoints?.length || 0,
        regionData.s3_buckets?.length || 0,
      ];
      const hasRegionResources = resourceTypes.some(count => count > 0);
      const regionResourcesHeight = hasRegionResources ? resourceTypes.length * resourceHeight + (resourceTypes.length - 1) * vpcMarginBetween : 0;

      regionContainerWidth = Math.max(vpcCount * maxVpcWidth + (vpcCount + 1) * vpcMarginBetween, 1100);
      regionContainerHeight = Math.max(regionPadding * 2 + maxVpcHeightLocal + (regionResourcesHeight > 0 ? 50 + regionResourcesHeight : 0), 400);
      regionResourcesStartY = regionY + regionPadding + maxVpcHeightLocal + 50;
    } else {
      // Serverless architecture - calculate dimensions from region-level resources
      regionPadding = 60;
      vpcMarginBetween = 80;
      const resourcesPerRow = 3;
      const resourceHeight = 150;
      const resourceWidth = 280;
      const resourceMargin = 25;
      
      // Count total resources
      const totalResources = 
        (regionData.load_balancers?.length || 0) +
        (regionData.lambda_functions?.length || 0) +
        (regionData.api_gateways?.length || 0) +
        (regionData.cloudfront_distributions?.length || 0) +
        (regionData.dynamodb_tables?.length || 0) +
        (regionData.elasticache_clusters?.length || 0) +
        (regionData.ecs_clusters?.length || 0) +
        (regionData.eks_clusters?.length || 0) +
        (regionData.autoscaling_groups?.length || 0) +
        (regionData.fargate_tasks?.length || 0) +
        (regionData.kinesis_streams?.length || 0) +
        (regionData.sqs_queues?.length || 0) +
        (regionData.sns_topics?.length || 0) +
        (regionData.vpc_endpoints?.length || 0) +
        (regionData.s3_buckets?.length || 0);
      
      const numRows = Math.ceil(totalResources / resourcesPerRow);
      const contentWidth = resourcesPerRow * resourceWidth + (resourcesPerRow + 1) * resourceMargin;
      const contentHeight = numRows * resourceHeight + (numRows + 1) * vpcMarginBetween;
      
      regionContainerWidth = contentWidth + regionPadding * 2;
      regionContainerHeight = contentHeight + regionPadding * 2;
      regionResourcesStartY = regionY + regionPadding;
    }


    // Add Region node as the top-level container
    const regionNodePosition = getNodePosition(
      regionNodeId, 
      regionX, 
      regionY,
      regionContainerWidth,
      regionContainerHeight
    );
    nodes.push({
      id: regionNodeId,
      type: 'resourceNode',
      position: regionNodePosition,
      data: {
        label: `Region: ${regionKey}`,
        resourceType: regionResourceType,
        region: regionKey,
        isContainer: true,
        size: {
          width: regionNodePosition.width || regionContainerWidth,
          height: regionNodePosition.height || regionContainerHeight,
        },
        config: {
          originalType: 'AWS::EC2::Region',
          region: regionKey,
        },
      },
    });

    // Add VPC nodes (only if VPCs exist)
    if (hasVPCs) {
      regionData.vpcs.forEach((vpc: any, vpcIndex: number) => {
      const vpcNodeId = `vpc-${vpc.VpcId}`;
      const vpcX = regionX + vpcMarginBetween + vpcIndex * (maxVpcWidth + vpcMarginBetween);
      const vpcY = regionY + regionPadding; // Use regionPadding directly instead of subtracting 30

      // Calculate VPC container size based on number of subnets
      const vpcSubnets = regionData.subnets?.filter(
        (subnet: any) => subnet.VpcId === vpc.VpcId
      ) || [];

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
        const subnetLoadBalancers = regionData.load_balancers?.filter(
          (lb: any) => lb.Subnets?.includes(subnet.SubnetId)
        ) || [];
        const subnetNATGateways = regionData.nat_gateways?.filter(
          (ngw: any) => ngw.SubnetId === subnet.SubnetId
        ) || [];
        const subnetRDSInstances = regionData.rds_instances?.filter(
          (rds: any) => rds.subnet_id === subnet.SubnetId
        ) || [];
        
        const instancesHeight = subnetInstances.length > 0 ? Math.max(subnetInstances.length * 80, 80) : 0;
        const lbHeight = subnetLoadBalancers.length > 0 ? 100 : 0;
        const natHeight = subnetNATGateways.length > 0 ? 100 : 0;
        const rdsHeight = subnetRDSInstances.length > 0 ? 100 : 0;
        return 120 + instancesHeight + lbHeight + natHeight + rdsHeight;
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
      const sgHeight = 0; // Security groups not displayed as nodes anymore
      
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

      const vpcNodePosition = getNodePosition(vpcNodeId, vpcX, vpcY, vpcContainerWidth, vpcContainerHeight);

      nodes.push({
        id: vpcNodeId,
        type: 'resourceNode',
        position: vpcNodePosition,
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
            width: vpcNodePosition.width || vpcContainerWidth,
            height: vpcNodePosition.height || vpcContainerHeight,
          },
          config: {
            originalType: 'AWS::EC2::VPC',
            region: regionKey,
            ownerId: vpc.OwnerId,
            instanceTenancy: vpc.InstanceTenancy,
            dhcpOptionsId: vpc.DhcpOptionsId,
          },
        },
      });      // Add Internet Gateways inside VPC (at the top)
      const igwMargin = 25; // Dynamic margin between IGWs
      const igwWidth = 280;
      if (vpcIGWs.length > 0) {
        vpcIGWs.forEach((igw: any, igwIndex: number) => {
          const igwNodeId = `igw-${igw.InternetGatewayId}`;
          // Constrain IGWs to stay within VPC width
          const igwX = vpcX + vpcPadding + igwIndex * (igwWidth + igwMargin);
          const igwY = vpcY + vpcPadding;
          const igwPosition = getNodePosition(igwNodeId, igwX, igwY);

          nodes.push({
            id: igwNodeId,
            type: 'resourceNode',
            position: igwPosition,
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

      // Add NAT Gateways inside their respective subnets
      const vpcNATGateways = regionData.nat_gateways?.filter(
        (ngw: any) => regionData.subnets?.some((s: any) => s.SubnetId === ngw.SubnetId && s.VpcId === vpc.VpcId)
      ) || [];
      
      if (vpcNATGateways.length > 0) {
        const natMargin = 15;
        const natWidth = 160;
        vpcNATGateways.forEach((ngw: any, natIndex: number) => {
          const natNodeId = `nat-${ngw.NatGatewayId}`;
          
          // Find the subnet this NAT Gateway is in
          const natSubnetNode = nodes.find((n: any) => n.id === `subnet-${ngw.SubnetId}`);
          let natX = vpcX + vpcPadding + igwWidth + 30 + natIndex * (natWidth + natMargin);
          let natY = vpcY + vpcPadding;
          
          if (natSubnetNode) {
            // Position inside the subnet, constrained within boundaries
            const subnetData = natSubnetNode.data;
            const subnetX = natSubnetNode.position.x;
            const subnetY = natSubnetNode.position.y;
            const subnetWidth = subnetData.size?.width || 380;
            const subnetHeight = subnetData.size?.height || 120;
            const natNodeWidth = 160;
            const natNodeHeight = 80;
            const internalPadding = 10;
            
            // Position NAT at top-right inside subnet
            natX = Math.min(subnetX + subnetWidth - natNodeWidth - internalPadding, subnetX + 10 + natIndex * 180);
            natY = Math.max(subnetY + internalPadding, subnetY + subnetHeight - natNodeHeight - internalPadding);
          }
          
          const natPosition = getNodePosition(natNodeId, natX, natY);

          nodes.push({
            id: natNodeId,
            type: 'resourceNode',
            position: natPosition,
            data: {
              label: ngw.NatGatewayId,
              resourceType: natGatewayResourceType,
              gatewayId: ngw.NatGatewayId,
              subnetId: ngw.SubnetId,
              state: ngw.State,
              parentId: `subnet-${ngw.SubnetId}`,
              config: {
                originalType: 'AWS::EC2::NatGateway',
                region: regionKey,
              },
            },
          });

          // Create edge from Subnet to NAT Gateway
          if (natSubnetNode) {
            edges.push({
              id: `subnet-nat-${ngw.SubnetId}-${ngw.NatGatewayId}`,
              source: `subnet-${ngw.SubnetId}`,
              target: natNodeId,
              label: 'Contains',
              style: { stroke: '#8C4FFF', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
            });
          }
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
          const rtPosition = getNodePosition(rtNodeId, rtX, rtY);

          nodes.push({
            id: rtNodeId,
            type: 'resourceNode',
            position: rtPosition,
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

      // Security Groups are used only for creating connections (not displayed as nodes in UI)
      vpcSecurityGroups.forEach((sg: any, sgIndex: number) => {
        const sgNodeId = `sg-${sg.GroupId}`;

        // Connect security group to instances that use it in this VPC
        regionData.instances.forEach((instance: any) => {
          if (
            instance.VpcId === vpc.VpcId &&
            instance.SecurityGroups &&
            instance.SecurityGroups.some((isg: any) => isg.GroupId === sg.GroupId)
          ) {
            edges.push({
              id: `sg-instance-${sg.GroupId}-${instance.InstanceId}`,
              source: `instance-${instance.InstanceId}`,
              target: `instance-${instance.InstanceId}`,
              label: `SG: ${sg.GroupName || sg.GroupId}`,
              style: { stroke: '#DD344C', strokeWidth: 2, strokeDasharray: '3,3' },
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

        // Calculate subnet container size based on number of instances and other resources
        const subnetInstances = regionData.instances.filter(
          (instance: any) => instance.SubnetId === subnet.SubnetId
        );
        
        // Count load balancers in this subnet
        const subnetLoadBalancers = regionData.load_balancers?.filter(
          (lb: any) => lb.Subnets?.includes(subnet.SubnetId)
        ) || [];
        
        // Count NAT gateways in this subnet
        const subnetNATGateways = regionData.nat_gateways?.filter(
          (ngw: any) => ngw.SubnetId === subnet.SubnetId
        ) || [];
        
        // Count RDS instances in this subnet
        const subnetRDSInstances = regionData.rds_instances?.filter(
          (rds: any) => rds.subnet_id === subnet.SubnetId
        ) || [];
        
        // Calculate height: only add for existing resources
        const instancesHeight = subnetInstances.length > 0 ? Math.max(subnetInstances.length * 80, 80) : 0;
        const lbHeight = subnetLoadBalancers.length > 0 ? 100 : 0;
        const natHeight = subnetNATGateways.length > 0 ? 100 : 0;
        const rdsHeight = subnetRDSInstances.length > 0 ? 100 : 0;
        const subnetContainerHeight = 120 + instancesHeight + lbHeight + natHeight + rdsHeight;

        const subnetPosition = getNodePosition(subnetNodeId, subnetX, subnetY, subnetWidth, subnetContainerHeight);

        nodes.push({
          id: subnetNodeId,
          type: 'resourceNode',
          position: subnetPosition,
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
              width: subnetPosition.width || subnetWidth,
              height: subnetPosition.height || subnetContainerHeight,
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

          const instancePosition = getNodePosition(instanceNodeId, instanceX, instanceY);

          nodes.push({
            id: instanceNodeId,
            type: 'resourceNode',
            position: instancePosition,
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
      }); // End of subnets forEach
    }); // End of VPC forEach
    } // End of if (hasVPCs)

    // Add RDS instances within this VPC (AWS Rule: RDS must be within VPC)
    if (hasVPCs) {
      regionData.vpcs.forEach((vpc: any, vpcIndex: number) => {
      const vpcRDSInstances = regionData.rds_instances?.filter((rds: any) => {
        const rdsSubnet = regionData.subnets?.find((s: any) => s.SubnetId === rds.subnet_id);
        return rdsSubnet?.VpcId === vpc.VpcId;
      }) || [];

      if (vpcRDSInstances.length > 0) {
        const rdsMargin = 25;
        const rdsWidth = 280;
        const vpcNodeId = `vpc-${vpc.VpcId}`;
        const vpcSubnets = regionData.subnets?.filter((subnet: any) => subnet.VpcId === vpc.VpcId) || [];
        const vpcRouteTables = regionData.route_tables?.filter((rt: any) => rt.VpcId === vpc.VpcId) || [];
        const rtTableHeight = vpcRouteTables.length > 0 ? 120 : 0;
        const vpcSecurityGroups = regionData.security_groups?.filter((sg: any) => sg.VpcId === vpc.VpcId) || [];
        const sgHeight = 0; // Security groups not displayed as nodes anymore
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
          
          // Find the subnet this RDS is in
          const rdsSubnetNode = nodes.find((n: any) => n.id === `subnet-${rds.subnet_id}`);
          let rdsX = vpcX + vpcPadding + rdsIndex * (rdsWidth + rdsMargin);
          let rdsY = vpcY + vpcContainerHeight - rtTableHeight - sgHeight - 150;
          
          if (rdsSubnetNode) {
            // Position inside the subnet, constrained within boundaries
            const subnetData = rdsSubnetNode.data;
            const subnetWidth = subnetData.size?.width || 380;
            const subnetHeight = subnetData.size?.height || 120;
            const subnetX = rdsSubnetNode.position.x;
            const subnetY = rdsSubnetNode.position.y;
            
            // Position RDS at bottom-right inside subnet, keeping padding
            const rdsNodeWidth = 160;
            const rdsNodeHeight = 80;
            const internalPadding = 10;
            
            rdsX = Math.min(subnetX + subnetWidth - rdsNodeWidth - internalPadding, subnetX + 10 + rdsIndex * 180);
            rdsY = Math.max(subnetY + internalPadding, subnetY + subnetHeight - rdsNodeHeight - internalPadding);
          }

          const rdsPosition = getNodePosition(rdsNodeId, rdsX, rdsY);

          nodes.push({
            id: rdsNodeId,
            type: 'resourceNode',
            position: rdsPosition,
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
              parentId: `subnet-${rds.subnet_id}`,
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

          // Security groups are used only for connections, not displayed as separate nodes
        });
      } // End of if (vpcRDSInstances.length > 0)
      }); // End of VPC forEach for RDS
    } // End of if (hasVPCs)

    // Add Load Balancers inside their subnets
    if (regionData.load_balancers && regionData.load_balancers.length > 0) {
      regionData.load_balancers.forEach((lb: any) => {
        // Place LB in the first assigned subnet
        const lbSubnetId = lb.Subnets?.[0];
        if (lbSubnetId) {
          const lbNodeId = `lb-${lb.LoadBalancerName}`;
          const lbMargin = 15;
          const lbWidth = 160;

          // Find subnet position to place LB inside it
          const subnet = regionData.subnets?.find((s: any) => s.SubnetId === lbSubnetId);
          if (subnet) {
            // Position LB inside the subnet
            const subnetNodeId = `subnet-${lbSubnetId}`;
            const subnetNode = nodes.find((n: any) => n.id === subnetNodeId);
            
            if (subnetNode) {
              const subnetX = subnetNode.position.x;
              const subnetY = subnetNode.position.y;
              const subnetWidth = subnetNode.data.size?.width || 380;
              const subnetHeight = subnetNode.data.size?.height || 120;
              const lbNodeWidth = 160;
              const lbNodeHeight = 100;
              const internalPadding = 10;
              
              // Position LB inside subnet at bottom-right with padding
              const lbNodeX = Math.min(subnetX + subnetWidth - lbNodeWidth - internalPadding, subnetX + 10);
              const lbNodeY = Math.max(subnetY + internalPadding, subnetY + subnetHeight - lbNodeHeight - internalPadding);
              const lbPosition = getNodePosition(lbNodeId, lbNodeX, lbNodeY);

              nodes.push({
                id: lbNodeId,
                type: 'resourceNode',
                position: lbPosition,
                data: {
                  label: lb.LoadBalancerName,
                  resourceType: loadBalancerResourceType,
                  lbName: lb.LoadBalancerName,
                  type: lb.Type || 'application',
                  scheme: lb.Scheme || 'internet-facing',
                  subnets: lb.Subnets || [],
                  securityGroups: lb.SecurityGroups || [],
                  parentId: lbSubnetId,
                  config: {
                    originalType: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
                    region: regionKey,
                    type: lb.Type || 'application',
                    scheme: lb.Scheme || 'internet-facing',
                  },
                },
              });

              // AWS Rule: Connect Subnet to Load Balancer
              edges.push({
                id: `subnet-lb-${lbSubnetId}-${lb.LoadBalancerName}`,
                source: subnetNodeId,
                target: lbNodeId,
                label: 'Contains',
                style: { stroke: '#FF9900', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });

              // Security groups are used only for connections, not displayed as separate nodes
            }
          }
        }
      });
    }

    // Add Lambda Functions at Region level
    if (regionData.lambda_functions && regionData.lambda_functions.length > 0) {
      const lambdaMargin = 25;
      const lambdaWidth = 280;
      const lambdaX = regionX + regionPadding;
      const lambdaY = regionResourcesStartY;

      regionData.lambda_functions.forEach((lambda: any, lambdaIndex: number) => {
        const lambdaNodeId = `lambda-${lambda.FunctionName}`;
        const lambdaNodeX = lambdaX + lambdaIndex * (lambdaWidth + lambdaMargin);
        const lambdaNodeY = lambdaY;
        const lambdaPosition = getNodePosition(lambdaNodeId, lambdaNodeX, lambdaNodeY);

        nodes.push({
          id: lambdaNodeId,
          type: 'resourceNode',
          position: lambdaPosition,
          data: {
            label: lambda.FunctionName,
            resourceType: lambdaResourceType,
            functionName: lambda.FunctionName,
            runtime: lambda.Runtime,
            handler: lambda.Handler,
            timeout: lambda.Timeout,
            memorySize: lambda.MemorySize,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::Lambda::Function',
              region: regionKey,
              runtime: lambda.Runtime,
              handler: lambda.Handler,
              codeSize: lambda.CodeSize,
            },
          },
        });

        edges.push({
          id: `region-lambda-${regionKey}-${lambda.FunctionName}`,
          source: regionNodeId,
          target: lambdaNodeId,
          label: 'Lambda Function',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add API Gateways at Region level
    if (regionData.api_gateways && regionData.api_gateways.length > 0) {
      const apiMargin = 25;
      const apiWidth = 280;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiX = regionX + regionPadding;
      const apiY = regionResourcesStartY + lambdaHeight + vpcMarginBetween;

      regionData.api_gateways.forEach((api: any, apiIndex: number) => {
        const apiId = api.id || api.ApiId || api.ApiName || `api-${apiIndex}`;
        const apiName = api.name || api.ApiName || api.ApiId || apiId;
        const apiNodeId = `api-${apiId}`;
        const apiNodeX = apiX + apiIndex * (apiWidth + apiMargin);
        const apiNodeY = apiY;
        const apiPosition = getNodePosition(apiNodeId, apiNodeX, apiNodeY);

        nodes.push({
          id: apiNodeId,
          type: 'resourceNode',
          position: apiPosition,
          data: {
            label: apiName,
            resourceType: apiGatewayResourceType,
            apiId: apiId,
            apiName: apiName,
            stage: api.stage || api.Stages?.[0] || 'prod',
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::ApiGateway::RestApi',
              region: regionKey,
              apiId: apiId,
            },
          },
        });

        edges.push({
          id: `region-api-${regionKey}-${apiId}`,
          source: regionNodeId,
          target: apiNodeId,
          label: 'API Gateway',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add CloudFront Distributions at Region level
    if (regionData.cloudfront_distributions && regionData.cloudfront_distributions.length > 0) {
      const cfMargin = 25;
      const cfWidth = 280;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfX = regionX + regionPadding;
      const cfY = regionResourcesStartY + lambdaHeight + apiHeight + vpcMarginBetween * 2;

      regionData.cloudfront_distributions.forEach((cf: any, cfIndex: number) => {
        const cfId = cf.DistributionId || cf.Id || cf.DomainName || `cf-${cfIndex}`;
        const cfNodeId = `cf-${cfId}`;
        const cfNodeX = cfX + cfIndex * (cfWidth + cfMargin);
        const cfNodeY = cfY;
        const cfPosition = getNodePosition(cfNodeId, cfNodeX, cfNodeY);

        nodes.push({
          id: cfNodeId,
          type: 'resourceNode',
          position: cfPosition,
          data: {
            label: cf.DomainName || cfId,
            resourceType: cloudFrontResourceType,
            distributionId: cfId,
            domainName: cf.DomainName,
            origin: cf.Origin || cf.Origins?.[0]?.DomainName,
            enabled: cf.Enabled !== false,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::CloudFront::Distribution',
              region: regionKey,
              distributionId: cfId,
            },
          },
        });

        edges.push({
          id: `region-cf-${regionKey}-${cfId}`,
          source: regionNodeId,
          target: cfNodeId,
          label: 'CloudFront Distribution',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add DynamoDB Tables at Region level
    if (regionData.dynamodb_tables && regionData.dynamodb_tables.length > 0) {
      const ddbMargin = 25;
      const ddbWidth = 280;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfHeight = regionData.cloudfront_distributions?.length ? 150 : 0;
      const ddbX = regionX + regionPadding;
      const ddbY = regionResourcesStartY + lambdaHeight + apiHeight + cfHeight + vpcMarginBetween * 3;

      regionData.dynamodb_tables.forEach((ddb: any, ddbIndex: number) => {
        const ddbNodeId = `ddb-${ddb.TableName}`;
        const ddbNodeX = ddbX + ddbIndex * (ddbWidth + ddbMargin);
        const ddbNodeY = ddbY;
        const ddbPosition = getNodePosition(ddbNodeId, ddbNodeX, ddbNodeY);

        nodes.push({
          id: ddbNodeId,
          type: 'resourceNode',
          position: ddbPosition,
          data: {
            label: ddb.TableName,
            resourceType: dynamodbResourceType,
            tableName: ddb.TableName,
            itemCount: ddb.ItemCount,
            tableSize: ddb.TableSizeBytes,
            billingMode: ddb.BillingModeSummary?.BillingMode || ddb.BillingMode,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::DynamoDB::Table',
              region: regionKey,
              tableName: ddb.TableName,
              billingMode: ddb.BillingModeSummary?.BillingMode || ddb.BillingMode,
            },
          },
        });

        edges.push({
          id: `region-ddb-${regionKey}-${ddb.TableName}`,
          source: regionNodeId,
          target: ddbNodeId,
          label: 'DynamoDB Table',
          style: { stroke: '#527FFF', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add ElastiCache Clusters at Region level
    if (regionData.elasticache_clusters && regionData.elasticache_clusters.length > 0) {
      const ecMargin = 25;
      const ecWidth = 280;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfHeight = regionData.cloudfront_distributions?.length ? 150 : 0;
      const ddbHeight = regionData.dynamodb_tables?.length ? 150 : 0;
      const ecX = regionX + regionPadding;
      const ecY = regionResourcesStartY + lambdaHeight + apiHeight + cfHeight + ddbHeight + vpcMarginBetween * 4;

      regionData.elasticache_clusters.forEach((ec: any, ecIndex: number) => {
        const ecNodeId = `ec-${ec.CacheClusterId}`;
        const ecNodeX = ecX + ecIndex * (ecWidth + ecMargin);
        const ecNodeY = ecY;
        const ecPosition = getNodePosition(ecNodeId, ecNodeX, ecNodeY);

        nodes.push({
          id: ecNodeId,
          type: 'resourceNode',
          position: ecPosition,
          data: {
            label: ec.CacheClusterId,
            resourceType: elasticacheResourceType,
            clusterId: ec.CacheClusterId,
            engine: ec.Engine,
            nodeType: ec.CacheNodeType,
            numCacheNodes: ec.NumCacheNodes,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::ElastiCache::CacheCluster',
              region: regionKey,
              engine: ec.Engine,
              nodeType: ec.CacheNodeType,
            },
          },
        });

        edges.push({
          id: `region-ec-${regionKey}-${ec.CacheClusterId}`,
          source: regionNodeId,
          target: ecNodeId,
          label: 'ElastiCache',
          style: { stroke: '#C925D1', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add ECS Clusters at Region level
    if (regionData.ecs_clusters && regionData.ecs_clusters.length > 0) {
      const ecsMargin = 25;
      const ecsWidth = 380;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfHeight = regionData.cloudfront_distributions?.length ? 150 : 0;
      const ddbHeight = regionData.dynamodb_tables?.length ? 150 : 0;
      const ecHeight = regionData.elasticache_clusters?.length ? 150 : 0;
      const ecsX = regionX + regionPadding;
      const ecsY = regionResourcesStartY + lambdaHeight + apiHeight + cfHeight + ddbHeight + ecHeight + vpcMarginBetween * 5;

      regionData.ecs_clusters.forEach((ecs: any, ecsIndex: number) => {
        const ecsNodeId = `ecs-${ecs.clusterName}`;
        const ecsNodeX = ecsX + ecsIndex * (ecsWidth + ecsMargin);
        const ecsNodeY = ecsY;
        const ecsPosition = getNodePosition(ecsNodeId, ecsNodeX, ecsNodeY, ecsWidth, 120);

        nodes.push({
          id: ecsNodeId,
          type: 'resourceNode',
          position: ecsPosition,
          data: {
            label: ecs.clusterName,
            resourceType: ecsResourceType,
            clusterName: ecs.clusterName,
            status: ecs.status,
            registeredContainerInstancesCount: ecs.registeredContainerInstancesCount,
            runningCount: ecs.runningCount,
            pendingCount: ecs.pendingCount,
            isContainer: true,
            parentId: regionNodeId,
            size: {
              width: ecsWidth,
              height: 120,
            },
            config: {
              originalType: 'AWS::ECS::Cluster',
              region: regionKey,
              clusterName: ecs.clusterName,
              status: ecs.status,
            },
          },
        });

        edges.push({
          id: `region-ecs-${regionKey}-${ecs.clusterName}`,
          source: regionNodeId,
          target: ecsNodeId,
          label: 'ECS Cluster',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add EKS Clusters at Region level
    if (regionData.eks_clusters && regionData.eks_clusters.length > 0) {
      const eksMargin = 25;
      const eksWidth = 380;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfHeight = regionData.cloudfront_distributions?.length ? 150 : 0;
      const ddbHeight = regionData.dynamodb_tables?.length ? 150 : 0;
      const ecHeight = regionData.elasticache_clusters?.length ? 150 : 0;
      const ecsHeight = regionData.ecs_clusters?.length ? 150 : 0;
      const eksX = regionX + regionPadding;
      const eksY = regionResourcesStartY + lambdaHeight + apiHeight + cfHeight + ddbHeight + ecHeight + ecsHeight + vpcMarginBetween * 6;

      regionData.eks_clusters.forEach((eks: any, eksIndex: number) => {
        const eksNodeId = `eks-${eks.name}`;
        const eksNodeX = eksX + eksIndex * (eksWidth + eksMargin);
        const eksNodeY = eksY;
        const eksPosition = getNodePosition(eksNodeId, eksNodeX, eksNodeY, eksWidth, 120);

        nodes.push({
          id: eksNodeId,
          type: 'resourceNode',
          position: eksPosition,
          data: {
            label: eks.name,
            resourceType: eksResourceType,
            clusterName: eks.name,
            version: eks.version,
            status: eks.status,
            endpoint: eks.endpoint,
            isContainer: true,
            parentId: regionNodeId,
            size: {
              width: eksWidth,
              height: 120,
            },
            config: {
              originalType: 'AWS::EKS::Cluster',
              region: regionKey,
              clusterName: eks.name,
              version: eks.version,
            },
          },
        });

        edges.push({
          id: `region-eks-${regionKey}-${eks.name}`,
          source: regionNodeId,
          target: eksNodeId,
          label: 'EKS Cluster',
          style: { stroke: '#326CE5', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add Auto Scaling Groups at Region level
    if (regionData.autoscaling_groups && regionData.autoscaling_groups.length > 0) {
      const asgMargin = 25;
      const asgWidth = 380;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfHeight = regionData.cloudfront_distributions?.length ? 150 : 0;
      const ddbHeight = regionData.dynamodb_tables?.length ? 150 : 0;
      const ecHeight = regionData.elasticache_clusters?.length ? 150 : 0;
      const ecsHeight = regionData.ecs_clusters?.length ? 150 : 0;
      const eksHeight = regionData.eks_clusters?.length ? 150 : 0;
      const asgX = regionX + regionPadding;
      const asgY = regionResourcesStartY + lambdaHeight + apiHeight + cfHeight + ddbHeight + ecHeight + ecsHeight + eksHeight + vpcMarginBetween * 7;

      regionData.autoscaling_groups.forEach((asg: any, asgIndex: number) => {
        const asgNodeId = `asg-${asg.AutoScalingGroupName}`;
        const asgNodeX = asgX + asgIndex * (asgWidth + asgMargin);
        const asgNodeY = asgY;
        const asgPosition = getNodePosition(asgNodeId, asgNodeX, asgNodeY, asgWidth, 120);

        nodes.push({
          id: asgNodeId,
          type: 'resourceNode',
          position: asgPosition,
          data: {
            label: asg.AutoScalingGroupName,
            resourceType: asgResourceType,
            asgName: asg.AutoScalingGroupName,
            minSize: asg.MinSize,
            maxSize: asg.MaxSize,
            desiredCapacity: asg.DesiredCapacity,
            isContainer: true,
            parentId: regionNodeId,
            size: {
              width: asgWidth,
              height: 120,
            },
            config: {
              originalType: 'AWS::AutoScaling::AutoScalingGroup',
              region: regionKey,
              minSize: asg.MinSize,
              maxSize: asg.MaxSize,
            },
          },
        });

        edges.push({
          id: `region-asg-${regionKey}-${asg.AutoScalingGroupName}`,
          source: regionNodeId,
          target: asgNodeId,
          label: 'Auto Scaling Group',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add Fargate Tasks at Region level
    if (regionData.fargate_tasks && regionData.fargate_tasks.length > 0) {
      const fargateMargin = 25;
      const fargateWidth = 280;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfHeight = regionData.cloudfront_distributions?.length ? 150 : 0;
      const ddbHeight = regionData.dynamodb_tables?.length ? 150 : 0;
      const ecHeight = regionData.elasticache_clusters?.length ? 150 : 0;
      const ecsHeight = regionData.ecs_clusters?.length ? 150 : 0;
      const eksHeight = regionData.eks_clusters?.length ? 150 : 0;
      const asgHeight = regionData.autoscaling_groups?.length ? 150 : 0;
      const fargateX = regionX + regionPadding;
      const fargateY = regionResourcesStartY + lambdaHeight + apiHeight + cfHeight + ddbHeight + ecHeight + ecsHeight + eksHeight + asgHeight + vpcMarginBetween * 8;

      regionData.fargate_tasks.forEach((fargate: any, fargateIndex: number) => {
        const fargateNodeId = `fargate-${fargate.taskDefinitionArn}`;
        const fargateNodeX = fargateX + fargateIndex * (fargateWidth + fargateMargin);
        const fargateNodeY = fargateY;
        const fargatePosition = getNodePosition(fargateNodeId, fargateNodeX, fargateNodeY);

        nodes.push({
          id: fargateNodeId,
          type: 'resourceNode',
          position: fargatePosition,
          data: {
            label: fargate.family || fargate.taskDefinitionArn.split('/').pop(),
            resourceType: fargateResourceType,
            family: fargate.family,
            taskDefinitionArn: fargate.taskDefinitionArn,
            cpu: fargate.cpu,
            memory: fargate.memory,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::ECS::TaskDefinition',
              region: regionKey,
              family: fargate.family,
              cpu: fargate.cpu,
              memory: fargate.memory,
            },
          },
        });

        edges.push({
          id: `region-fargate-${regionKey}-${fargate.family}`,
          source: regionNodeId,
          target: fargateNodeId,
          label: 'Fargate Task',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add Kinesis Streams at Region level
    if (regionData.kinesis_streams && regionData.kinesis_streams.length > 0) {
      const kinesisMargin = 25;
      const kinesisWidth = 280;
      const lambdaHeight = regionData.lambda_functions?.length ? 150 : 0;
      const apiHeight = regionData.api_gateways?.length ? 150 : 0;
      const cfHeight = regionData.cloudfront_distributions?.length ? 150 : 0;
      const ddbHeight = regionData.dynamodb_tables?.length ? 150 : 0;
      const ecHeight = regionData.elasticache_clusters?.length ? 150 : 0;
      const ecsHeight = regionData.ecs_clusters?.length ? 150 : 0;
      const eksHeight = regionData.eks_clusters?.length ? 150 : 0;
      const asgHeight = regionData.autoscaling_groups?.length ? 150 : 0;
      const fargateHeight = regionData.fargate_tasks?.length ? 150 : 0;
      const kinesisX = regionX + regionPadding;
      const kinesisY = regionResourcesStartY + lambdaHeight + apiHeight + cfHeight + ddbHeight + ecHeight + ecsHeight + eksHeight + asgHeight + fargateHeight + vpcMarginBetween * 9;

      regionData.kinesis_streams.forEach((stream: any, kinesisIndex: number) => {
        const kinesisNodeId = `kinesis-${stream.StreamName}`;
        const kinesisNodeX = kinesisX + kinesisIndex * (kinesisWidth + kinesisMargin);
        const kinesisNodeY = kinesisY;
        const kinesisPosition = getNodePosition(kinesisNodeId, kinesisNodeX, kinesisNodeY);

        nodes.push({
          id: kinesisNodeId,
          type: 'resourceNode',
          position: kinesisPosition,
          data: {
            label: stream.StreamName,
            resourceType: kinesisResourceType,
            streamName: stream.StreamName,
            streamArn: stream.StreamArn,
            streamStatus: stream.StreamStatus,
            shardCount: stream.Shards?.length || 1,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::Kinesis::Stream',
              region: regionKey,
              streamName: stream.StreamName,
            },
          },
        });

        edges.push({
          id: `region-kinesis-${regionKey}-${stream.StreamName}`,
          source: regionNodeId,
          target: kinesisNodeId,
          label: 'Kinesis Stream',
          style: { stroke: '#8C4FFF', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add SQS Queues at Region level
    if (regionData.sqs_queues && regionData.sqs_queues.length > 0) {
      const sqsMargin = 25;
      const sqsWidth = 280;
      let offsetY = 0;
      const resourceHeights = [
        regionData.lambda_functions?.length ? 150 : 0,
        regionData.api_gateways?.length ? 150 : 0,
        regionData.cloudfront_distributions?.length ? 150 : 0,
        regionData.dynamodb_tables?.length ? 150 : 0,
        regionData.elasticache_clusters?.length ? 150 : 0,
        regionData.ecs_clusters?.length ? 150 : 0,
        regionData.eks_clusters?.length ? 150 : 0,
        regionData.autoscaling_groups?.length ? 150 : 0,
        regionData.fargate_tasks?.length ? 150 : 0,
        regionData.kinesis_streams?.length ? 150 : 0,
      ];
      offsetY = resourceHeights.reduce((a, b) => a + b, 0) + vpcMarginBetween * (resourceHeights.filter(h => h > 0).length);
      const sqsX = regionX + regionPadding;
      const sqsY = regionResourcesStartY + offsetY;

      regionData.sqs_queues.forEach((queue: any, sqsIndex: number) => {
        const queueUrl = queue.QueueUrl || queue.QueueName || `queue-${sqsIndex}`;
        const sqsNodeId = `sqs-${queueUrl}`;
        const queueName = queue.QueueName || (typeof queueUrl === 'string' ? queueUrl.split('/').pop() : queueUrl) || queueUrl;
        const sqsNodeX = sqsX + sqsIndex * (sqsWidth + sqsMargin);
        const sqsNodeY = sqsY;
        const sqsPosition = getNodePosition(sqsNodeId, sqsNodeX, sqsNodeY);

        nodes.push({
          id: sqsNodeId,
          type: 'resourceNode',
          position: sqsPosition,
          data: {
            label: queueName,
            resourceType: sqsResourceType,
            queueUrl: queueUrl,
            visibilityTimeout: queue.VisibilityTimeout,
            messageRetentionPeriod: queue.MessageRetentionPeriod,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::SQS::Queue',
              region: regionKey,
              queueUrl: queueUrl,
            },
          },
        });

        edges.push({
          id: `region-sqs-${regionKey}-${queueName}`,
          source: regionNodeId,
          target: sqsNodeId,
          label: 'SQS Queue',
          style: { stroke: '#FF4F8B', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add SNS Topics at Region level
    if (regionData.sns_topics && regionData.sns_topics.length > 0) {
      const snsMargin = 25;
      const snsWidth = 280;
      let offsetY = 0;
      const resourceHeights = [
        regionData.lambda_functions?.length ? 150 : 0,
        regionData.api_gateways?.length ? 150 : 0,
        regionData.cloudfront_distributions?.length ? 150 : 0,
        regionData.dynamodb_tables?.length ? 150 : 0,
        regionData.elasticache_clusters?.length ? 150 : 0,
        regionData.ecs_clusters?.length ? 150 : 0,
        regionData.eks_clusters?.length ? 150 : 0,
        regionData.autoscaling_groups?.length ? 150 : 0,
        regionData.fargate_tasks?.length ? 150 : 0,
        regionData.kinesis_streams?.length ? 150 : 0,
        regionData.sqs_queues?.length ? 150 : 0,
      ];
      offsetY = resourceHeights.reduce((a, b) => a + b, 0) + vpcMarginBetween * (resourceHeights.filter(h => h > 0).length);
      const snsX = regionX + regionPadding;
      const snsY = regionResourcesStartY + offsetY;

      regionData.sns_topics.forEach((topic: any, snsIndex: number) => {
        const topicArn = topic.TopicArn || topic.TopicName || `topic-${snsIndex}`;
        const snsNodeId = `sns-${topicArn}`;
        const topicName = topic.TopicName || (typeof topicArn === 'string' ? topicArn.split(':').pop() : topicArn) || topicArn;
        const snsNodeX = snsX + snsIndex * (snsWidth + snsMargin);
        const snsNodeY = snsY;
        const snsPosition = getNodePosition(snsNodeId, snsNodeX, snsNodeY);

        nodes.push({
          id: snsNodeId,
          type: 'resourceNode',
          position: snsPosition,
          data: {
            label: topicName,
            resourceType: snsResourceType,
            topicArn: topicArn,
            subscriptions: topic.Subscriptions?.length || 0,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::SNS::Topic',
              region: regionKey,
              topicArn: topicArn,
            },
          },
        });

        edges.push({
          id: `region-sns-${regionKey}-${topicName}`,
          source: regionNodeId,
          target: snsNodeId,
          label: 'SNS Topic',
          style: { stroke: '#FF4F8B', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Add VPC Endpoints (AWS Rule: Gateway endpoints provide S3 and DynamoDB access)
    if (regionData.vpc_endpoints && regionData.vpc_endpoints.length > 0) {
      const vpcEndpointMargin = 25;
      const vpcEndpointWidth = 280;
      const vpcEndpointX = regionX + regionPadding;
      let offsetY = (regionData.load_balancers?.length ? 150 : 0);
      const resourceHeights = [
        regionData.lambda_functions?.length ? 150 : 0,
        regionData.api_gateways?.length ? 150 : 0,
        regionData.dynamodb_tables?.length ? 150 : 0,
        regionData.elasticache_clusters?.length ? 150 : 0,
        regionData.ecs_clusters?.length ? 150 : 0,
        regionData.eks_clusters?.length ? 150 : 0,
        regionData.autoscaling_groups?.length ? 150 : 0,
        regionData.fargate_tasks?.length ? 150 : 0,
        regionData.kinesis_streams?.length ? 150 : 0,
        regionData.sqs_queues?.length ? 150 : 0,
        regionData.sns_topics?.length ? 150 : 0,
      ];
      offsetY += resourceHeights.reduce((a, b) => a + b, 0);
      const vpcEndpointY = regionY + regionContainerHeight + vpcMarginBetween + offsetY;

      regionData.vpc_endpoints.forEach((endpoint: any, vpceIndex: number) => {
        const vpceNodeId = `vpce-${endpoint.VpcEndpointId}`;
        const vpceNodeX = vpcEndpointX + vpceIndex * (vpcEndpointWidth + vpcEndpointMargin);
        const vpceNodeY = vpcEndpointY;
        const vpcePosition = getNodePosition(vpceNodeId, vpceNodeX, vpceNodeY);

        nodes.push({
          id: vpceNodeId,
          type: 'resourceNode',
          position: vpcePosition,
          data: {
            label: endpoint.VpcEndpointId,
            resourceType: getVPCEndpointResourceType(),
            endpointId: endpoint.VpcEndpointId,
            serviceName: endpoint.ServiceName,
            endpointType: endpoint.VpcEndpointType,
            vpcId: endpoint.VpcId,
            routeTableIds: endpoint.RouteTableIds,
            state: endpoint.State,
            parentId: regionNodeId,
            config: {
              originalType: 'AWS::EC2::VPCEndpoint',
              region: regionKey,
              serviceName: endpoint.ServiceName,
              endpointType: endpoint.VpcEndpointType,
            },
          },
        });

        // AWS Rule: Connect VPC Endpoint to associated Route Tables
        if (endpoint.RouteTableIds && Array.isArray(endpoint.RouteTableIds)) {
          endpoint.RouteTableIds.forEach((rtId: string) => {
            edges.push({
              id: `vpce-rt-${endpoint.VpcEndpointId}-${rtId}`,
              source: vpceNodeId,
              target: `rt-${rtId}`,
              label: 'Gateway',
              style: { stroke: '#8C4FFF', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
            });
          });
        }

        // AWS Rule: Connect S3 buckets to VPC Endpoint (if S3 endpoint)
        if (endpoint.ServiceName?.includes('s3')) {
          if (regionData.s3_buckets && Array.isArray(regionData.s3_buckets)) {
            regionData.s3_buckets.forEach((bucket: any) => {
              const s3NodeId = `s3-${bucket.Name}`;
              // Check if bucket uses this endpoint
              if (bucket.Access?.includes(endpoint.VpcEndpointId) || bucket.Access?.includes('vpce')) {
                edges.push({
                  id: `vpce-s3-${endpoint.VpcEndpointId}-${bucket.Name}`,
                  source: vpceNodeId,
                  target: s3NodeId,
                  label: 'S3 Access',
                  style: { stroke: '#569A31', strokeWidth: 2 },
                  markerEnd: 'arrowclosed',
                });

                // AWS Rule: Connect EC2 instances to S3 buckets through VPC Endpoint
                if (regionData.instances && Array.isArray(regionData.instances)) {
                  regionData.instances.forEach((instance: any) => {
                    // Only create edge for instances in the VPC that has this endpoint
                    if (instance.VpcId === endpoint.VpcId) {
                      edges.push({
                        id: `instance-s3-${instance.InstanceId}-${bucket.Name}`,
                        source: `instance-${instance.InstanceId}`,
                        target: s3NodeId,
                        label: `Access S3 via Endpoint`,
                        style: { stroke: '#569A31', strokeWidth: 2, strokeDasharray: '5,5' },
                        markerEnd: 'arrowclosed',
                      });
                    }
                  });
                }
              }
            });
          }
        }

        // AWS Rule: Connect DynamoDB tables to VPC Endpoint (if DynamoDB endpoint)
        if (endpoint.ServiceName?.includes('dynamodb')) {
          if (regionData.dynamodb_tables && Array.isArray(regionData.dynamodb_tables)) {
            regionData.dynamodb_tables.forEach((table: any) => {
              const ddbNodeId = `ddb-${table.TableName}`;
              edges.push({
                id: `vpce-ddb-${endpoint.VpcEndpointId}-${table.TableName}`,
                source: vpceNodeId,
                target: ddbNodeId,
                label: 'Access via Endpoint',
                style: { stroke: '#527FFF', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            });
          }
        }
      });
    }

    // Add S3 buckets at Region level (AWS Rule: S3 is region-scoped, not VPC-bound)
    if (regionData.s3_buckets && regionData.s3_buckets.length > 0) {
      const s3Margin = 25;
      const s3Width = 280;
      const s3X = regionX + regionPadding;
      
      // Calculate S3 Y position accounting for all resources before it
      let s3OffsetY = 0;
      const s3ResourceHeights = [
        regionData.lambda_functions?.length ? 150 : 0,
        regionData.api_gateways?.length ? 150 : 0,
        regionData.cloudfront_distributions?.length ? 150 : 0,
        regionData.dynamodb_tables?.length ? 150 : 0,
        regionData.elasticache_clusters?.length ? 150 : 0,
        regionData.ecs_clusters?.length ? 150 : 0,
        regionData.eks_clusters?.length ? 150 : 0,
        regionData.autoscaling_groups?.length ? 150 : 0,
        regionData.fargate_tasks?.length ? 150 : 0,
        regionData.kinesis_streams?.length ? 150 : 0,
        regionData.sqs_queues?.length ? 150 : 0,
        regionData.sns_topics?.length ? 150 : 0,
        regionData.vpc_endpoints?.length ? 150 : 0, // Add VPC Endpoint height
      ];
      s3OffsetY = s3ResourceHeights.reduce((a, b) => a + b, 0) + vpcMarginBetween * (s3ResourceHeights.filter(h => h > 0).length);
      const s3Y = regionResourcesStartY + s3OffsetY;

      regionData.s3_buckets.forEach((bucket: any, s3Index: number) => {
        const s3NodeId = `s3-${bucket.Name}`;
        const s3NodeX = s3X + s3Index * (s3Width + s3Margin);
        const s3NodeY = s3Y;
        const s3Position = getNodePosition(s3NodeId, s3NodeX, s3NodeY);

        nodes.push({
          id: s3NodeId,
          type: 'resourceNode',
          position: s3Position,
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

    // === SERVERLESS ARCHITECTURE CONNECTIONS ===
    
    // AWS Rule: S3 bucket serves as origin for CloudFront distribution
    if (regionData.s3_buckets && regionData.cloudfront_distributions) {
      regionData.cloudfront_distributions.forEach((cf: any) => {
        const cfId = cf.DistributionId || cf.Id || cf.DomainName || `cf-${regionData.cloudfront_distributions.indexOf(cf)}`;
        const origin = cf.Origin || cf.Origins?.[0]?.DomainName;
        
        if (origin) {
          // Find matching S3 bucket by name
          const s3Bucket = regionData.s3_buckets.find((bucket: any) => 
            bucket.Name === origin || bucket.name === origin
          );
          
          if (s3Bucket) {
            edges.push({
              id: `s3-cf-${s3Bucket.Name}-${cfId}`,
              source: `s3-${s3Bucket.Name}`,
              target: `cf-${cfId}`,
              label: 'CDN Origin',
              style: { stroke: '#FF9900', strokeWidth: 2 },
              markerEnd: 'arrowclosed',
            });
          }
        }
      });
    }

    // AWS Rule: API Gateway routes to Lambda functions
    if (regionData.api_gateways && regionData.lambda_functions) {
      regionData.api_gateways.forEach((api: any) => {
        const apiId = api.id || api.ApiId || api.ApiName || `api-${regionData.api_gateways.indexOf(api)}`;
        
        // Extract lambda function names from routes
        if (api.Routes && Array.isArray(api.Routes)) {
          const integrations = new Set<string>();
          api.Routes.forEach((route: any) => {
            if (route.Integration) {
              integrations.add(route.Integration);
            }
          });

          integrations.forEach((integration: string) => {
            // Find matching Lambda function
            const lambdaFunc = regionData.lambda_functions.find((lambda: any) => 
              lambda.FunctionName === integration || lambda.functionName === integration
            );
            
            if (lambdaFunc) {
              edges.push({
                id: `api-lambda-${apiId}-${lambdaFunc.FunctionName}`,
                source: `api-${apiId}`,
                target: `lambda-${lambdaFunc.FunctionName}`,
                label: 'Invokes',
                style: { stroke: '#FF9900', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            }
          });
        }
      });
    }

    // AWS Rule: Lambda functions access DynamoDB tables
    if (regionData.lambda_functions && regionData.dynamodb_tables) {
      regionData.lambda_functions.forEach((lambda: any) => {
        if (lambda.Permissions && Array.isArray(lambda.Permissions)) {
          const hasDynamoDBAccess = lambda.Permissions.some((perm: string) => 
            perm.toLowerCase().includes('dynamodb')
          );

          if (hasDynamoDBAccess && lambda.EnvironmentVariables?.TABLE_NAME) {
            const tableName = lambda.EnvironmentVariables.TABLE_NAME;
            const ddbTable = regionData.dynamodb_tables.find((table: any) => 
              table.TableName === tableName || table.tableName === tableName
            );

            if (ddbTable) {
              edges.push({
                id: `lambda-ddb-${lambda.FunctionName}-${ddbTable.TableName}`,
                source: `lambda-${lambda.FunctionName}`,
                target: `ddb-${ddbTable.TableName}`,
                label: 'Read/Write',
                style: { stroke: '#527FFF', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            }
          }
        }
      });
    }

    // AWS Rule: Lambda functions triggered by or publish to SQS
    if (regionData.lambda_functions && regionData.sqs_queues) {
      regionData.lambda_functions.forEach((lambda: any) => {
        if (lambda.Triggers && Array.isArray(lambda.Triggers)) {
          const hasSQSTrigger = lambda.Triggers.includes('sqs');
          
          if (hasSQSTrigger) {
            // Connect to first SQS queue as a generic trigger
            const sqsQueue = regionData.sqs_queues[0];
            if (sqsQueue) {
              const queueName = sqsQueue.QueueName || sqsQueue.QueueUrl || `queue-0`;
              edges.push({
                id: `sqs-lambda-${queueName}-${lambda.FunctionName}`,
                source: `sqs-${queueName}`,
                target: `lambda-${lambda.FunctionName}`,
                label: 'Event Source',
                style: { stroke: '#FF4F8B', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            }
          }
        }
      });
    }

    // AWS Rule: Lambda functions publish to SNS topics
    if (regionData.lambda_functions && regionData.sns_topics) {
      regionData.lambda_functions.forEach((lambda: any) => {
        if (lambda.Triggers && Array.isArray(lambda.Triggers)) {
          const hasSNSTrigger = lambda.Triggers.includes('sns');
          
          if (hasSNSTrigger) {
            // Connect to first SNS topic as a generic trigger
            const snsTopic = regionData.sns_topics[0];
            if (snsTopic) {
              const topicName = snsTopic.TopicName || snsTopic.TopicArn || `topic-0`;
              edges.push({
                id: `lambda-sns-${lambda.FunctionName}-${topicName}`,
                source: `lambda-${lambda.FunctionName}`,
                target: `sns-${topicName}`,
                label: 'Publishes',
                style: { stroke: '#FF4F8B', strokeWidth: 2 },
                markerEnd: 'arrowclosed',
              });
            }
          }
        }
      });
    }

    // AWS Rule: CloudFront connects to API Gateway (for dynamic content)
    if (regionData.cloudfront_distributions && regionData.api_gateways && regionData.api_gateways.length > 0) {
      regionData.cloudfront_distributions.forEach((cf: any) => {
        const cfId = cf.DistributionId || cf.Id || cf.DomainName || `cf-${regionData.cloudfront_distributions.indexOf(cf)}`;
        const firstApi = regionData.api_gateways[0];
        const apiId = firstApi.id || firstApi.ApiId || firstApi.ApiName || `api-0`;
        
        edges.push({
          id: `cf-api-${cfId}-${apiId}`,
          source: `cf-${cfId}`,
          target: `api-${apiId}`,
          label: 'Routes to',
          style: { stroke: '#FF9900', strokeWidth: 2 },
          markerEnd: 'arrowclosed',
        });
      });
    }

    // Update position for next region with dynamic spacing (AWS Rule: Account for all resources)
    const s3Height = regionData.s3_buckets?.length ? 150 : 0;
    const regionMargin = 200 + Math.ceil((regionData.vpcs?.length || 0) * 50);
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
