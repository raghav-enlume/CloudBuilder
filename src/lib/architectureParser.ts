import { Node, Edge } from 'reactflow';
import { cloudResources } from '@/data/resources';
import { ResourceType } from '@/types/diagram';

interface ArchitectureComponent {
  id: string;
  type: string;
  label: string;
  count?: number;
}

interface ArchitectureConnection {
  from: string;
  to: string;
  protocol?: string;
  port?: number;
}

interface ArchitectureData {
  architecture: {
    name: string;
    region?: string;
    components: ArchitectureComponent[];
    connections: ArchitectureConnection[];
  };
}

// Mapping of component types to resource IDs
const componentTypeMapping: Record<string, string> = {
  'User': 'ec2',
  'AWS::EC2::Instance': 'ec2',
  'AWS::EC2::AutoScalingGroup': 'ec2',
  'AWS::ElasticLoadBalancingV2::LoadBalancer': 'elb',
  'AWS::ElasticLoadBalancing::LoadBalancer': 'elb',
  'AWS::RDS::DBInstance': 'rds',
  'AWS::DynamoDB::Table': 'dynamodb',
  'AWS::S3::Bucket': 's3',
  'AWS::Lambda::Function': 'lambda',
  'AWS::ECS::Cluster': 'ecs',
  'AWS::ECS::Service': 'ecs',
  'AWS::EC2::SecurityGroup': 'waf',
  'AWS::CloudFront::Distribution': 'cloudfront',
  'AWS::ApiGateway::RestApi': 'apigateway',
  'AWS::ElastiCache::CacheCluster': 'elasticache',
  'AWS::SNS::Topic': 'sqs',
  'AWS::SQS::Queue': 'sqs',
  'AWS::IAM::Role': 'iam',
  'AWS::Cognito::UserPool': 'cognito',
  'AWS::CloudWatch::Alarm': 'cloudwatch',
};

const getResourceByType = (typeString: string): ResourceType | undefined => {
  const resourceId = componentTypeMapping[typeString] || typeString.toLowerCase();
  return cloudResources.find((r) => r.id === resourceId);
};

export const parseArchitectureJSON = (
  data: ArchitectureData
): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const layoutComponents = (components: ArchitectureComponent[]) => {
    const columns = Math.ceil(Math.sqrt(components.length));
    const rows = Math.ceil(components.length / columns);
    const spacing = { x: 300, y: 200 };

    return components.map((component, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        component,
        x: col * spacing.x + 50,
        y: row * spacing.y + 50,
      };
    });
  };

  const componentLayout = layoutComponents(data.architecture.components);

  // Create nodes from components
  componentLayout.forEach(({ component, x, y }) => {
    const resourceType = getResourceByType(component.type);

    const node: Node = {
      id: component.id,
      type: 'resourceNode',
      position: { x, y },
      data: {
        label: component.label,
        resourceType: resourceType || {
          id: component.id,
          name: component.label,
          category: 'compute',
          icon: '🏗️',
          description: component.type,
          color: '#999999',
        },
        config: {
          originalType: component.type,
          count: component.count,
        },
      },
    };

    nodes.push(node);
  });

  // Create edges from connections
  data.architecture.connections.forEach((connection) => {
    const edge: Edge = {
      id: `${connection.from}-${connection.to}-${Date.now()}`,
      source: connection.from,
      target: connection.to,
      type: 'smoothstep',
      animated: true,
      style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      data: {
        protocol: connection.protocol,
        port: connection.port,
      },
    };

    edges.push(edge);
  });

  return { nodes, edges };
};
