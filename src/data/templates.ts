import { Node, Edge } from 'reactflow';
import { cloudResources } from './resources';

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: Node[];
  edges: Edge[];
}

// Helper function to find resource type by name
const findResourceType = (typeName: string) => {
  return cloudResources.find(rt => rt.name === typeName);
};

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: 'web-app-architecture',
    name: 'Web App Architecture',
    description: 'A scalable web application architecture with load balancing, auto-scaling, and database',
    icon: '🌐',
    nodes: [
      {
        id: 'node-alb',
        type: 'resourceNode',
        position: { x: 100, y: 50 },
        data: {
          label: 'ALB',
          resourceType: findResourceType('Load Balancer'),
          config: {
            region: 'us-east-1',
          },
        },
      },
      {
        id: 'node-ec2-1',
        type: 'resourceNode',
        position: { x: -100, y: 200 },
        data: {
          label: 'Web Server 1',
          resourceType: findResourceType('EC2 Instance'),
          config: {
            region: 'us-east-1',
            instanceType: 't2.small',
            osType: 'amazon-linux',
          },
        },
      },
      {
        id: 'node-ec2-2',
        type: 'resourceNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Web Server 2',
          resourceType: findResourceType('EC2 Instance'),
          config: {
            region: 'us-east-1',
            instanceType: 't2.small',
            osType: 'amazon-linux',
          },
        },
      },
      {
        id: 'node-rds',
        type: 'resourceNode',
        position: { x: 0, y: 400 },
        data: {
          label: 'RDS Database',
          resourceType: findResourceType('RDS Database'),
          config: {
            region: 'us-east-1',
            engine: 'mysql',
            instanceClass: 'db.t2.micro',
            multiAZ: true,
          },
        },
      },
      {
        id: 'node-s3',
        type: 'resourceNode',
        position: { x: 400, y: 200 },
        data: {
          label: 'S3 Bucket',
          resourceType: findResourceType('S3 Bucket'),
          config: {
            bucketName: 'app-assets-bucket',
            versioningEnabled: true,
            encryptionType: 'AES256',
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-alb-ec2-1',
        source: 'node-alb',
        target: 'node-ec2-1',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-alb-ec2-2',
        source: 'node-alb',
        target: 'node-ec2-2',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-ec2-rds',
        source: 'node-ec2-1',
        target: 'node-rds',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-ec2-rds-2',
        source: 'node-ec2-2',
        target: 'node-rds',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-ec2-s3',
        source: 'node-ec2-1',
        target: 'node-s3',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'streaming-data-architecture',
    name: 'Streaming Data Architecture',
    description: 'Real-time data streaming with Kinesis, processing, and analytics',
    icon: '📊',
    nodes: [
      {
        id: 'node-producer',
        type: 'resourceNode',
        position: { x: 50, y: 50 },
        data: {
          label: 'Data Producer',
          resourceType: findResourceType('EC2 Instance'),
          config: {
            region: 'us-east-1',
            instanceType: 't2.medium',
          },
        },
      },
      {
        id: 'node-kinesis',
        type: 'resourceNode',
        position: { x: 50, y: 200 },
        data: {
          label: 'Kinesis Stream',
          resourceType: findResourceType('Kinesis'),
          config: {
            region: 'us-east-1',
          },
        },
      },
      {
        id: 'node-lambda-processor',
        type: 'resourceNode',
        position: { x: -150, y: 350 },
        data: {
          label: 'Stream Processor',
          resourceType: findResourceType('Lambda'),
          config: {
            region: 'us-east-1',
            runtime: 'python3.11',
            memory: 1024,
            timeout: 300,
          },
        },
      },
      {
        id: 'node-dynamodb',
        type: 'resourceNode',
        position: { x: 50, y: 350 },
        data: {
          label: 'DynamoDB',
          resourceType: findResourceType('DynamoDB'),
          config: {
            region: 'us-east-1',
            billingMode: 'on-demand',
          },
        },
      },
      {
        id: 'node-s3-analytics',
        type: 'resourceNode',
        position: { x: 250, y: 350 },
        data: {
          label: 'S3 Data Lake',
          resourceType: findResourceType('S3 Bucket'),
          config: {
            bucketName: 'analytics-data-lake',
            versioningEnabled: true,
            encryptionType: 'AES256',
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-producer-kinesis',
        source: 'node-producer',
        target: 'node-kinesis',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-kinesis-lambda',
        source: 'node-kinesis',
        target: 'node-lambda-processor',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-kinesis-dynamodb',
        source: 'node-kinesis',
        target: 'node-dynamodb',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-lambda-s3',
        source: 'node-lambda-processor',
        target: 'node-s3-analytics',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
    ],
  },
  {
    id: 'cache-clustering-architecture',
    name: 'Cache Clustering Architecture',
    description: 'High-performance caching with ElastiCache cluster and application servers',
    icon: '⚡',
    nodes: [
      {
        id: 'node-alb-cache',
        type: 'resourceNode',
        position: { x: 100, y: 50 },
        data: {
          label: 'Load Balancer',
          resourceType: findResourceType('Load Balancer'),
          config: {
            region: 'us-east-1',
          },
        },
      },
      {
        id: 'node-app-1',
        type: 'resourceNode',
        position: { x: -100, y: 200 },
        data: {
          label: 'App Server 1',
          resourceType: findResourceType('EC2 Instance'),
          config: {
            region: 'us-east-1',
            instanceType: 't2.large',
            osType: 'ubuntu',
          },
        },
      },
      {
        id: 'node-app-2',
        type: 'resourceNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'App Server 2',
          resourceType: findResourceType('EC2 Instance'),
          config: {
            region: 'us-east-1',
            instanceType: 't2.large',
            osType: 'ubuntu',
          },
        },
      },
      {
        id: 'node-app-3',
        type: 'resourceNode',
        position: { x: 300, y: 200 },
        data: {
          label: 'App Server 3',
          resourceType: findResourceType('EC2 Instance'),
          config: {
            region: 'us-east-1',
            instanceType: 't2.large',
            osType: 'ubuntu',
          },
        },
      },
      {
        id: 'node-elasticache',
        type: 'resourceNode',
        position: { x: 100, y: 400 },
        data: {
          label: 'ElastiCache',
          resourceType: findResourceType('ElastiCache'),
          config: {
            region: 'us-east-1',
            engine: 'redis',
          },
        },
      },
      {
        id: 'node-db-cache',
        type: 'resourceNode',
        position: { x: 350, y: 400 },
        data: {
          label: 'RDS Database',
          resourceType: findResourceType('RDS Database'),
          config: {
            region: 'us-east-1',
            engine: 'postgres',
            instanceClass: 'db.r5.large',
            multiAZ: true,
          },
        },
      },
    ],
    edges: [
      {
        id: 'edge-lb-app1',
        source: 'node-alb-cache',
        target: 'node-app-1',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-lb-app2',
        source: 'node-alb-cache',
        target: 'node-app-2',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-lb-app3',
        source: 'node-alb-cache',
        target: 'node-app-3',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-app1-cache',
        source: 'node-app-1',
        target: 'node-elasticache',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-app2-cache',
        source: 'node-app-2',
        target: 'node-elasticache',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-app3-cache',
        source: 'node-app-3',
        target: 'node-elasticache',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
      {
        id: 'edge-cache-db',
        source: 'node-elasticache',
        target: 'node-db-cache',
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(210, 100%, 50%)', strokeWidth: 2 },
      },
    ],
  },
];
