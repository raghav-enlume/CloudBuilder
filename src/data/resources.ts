import { ResourceType } from '@/types/diagram';

export const cloudResources: ResourceType[] = [
  // Compute
  {
    id: 'ec2',
    name: 'EC2 Instance',
    category: 'compute',
    icon: 'ec2',
    description: 'Virtual server in the cloud',
    color: '#FF9900',
    editableAttributes: [
      { key: 'region', label: 'Region', type: 'select', options: [
        { value: 'us-east-1', label: 'US East (N. Virginia)' },
        { value: 'us-west-2', label: 'US West (Oregon)' },
        { value: 'eu-west-1', label: 'EU (Ireland)' },
        { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
      ]},
      { key: 'vpc', label: 'VPC', type: 'text', placeholder: 'vpc-12345678' },
      { key: 'subnet', label: 'Subnet', type: 'text', placeholder: 'subnet-12345678' },
      { key: 'securityGroup', label: 'Security Group', type: 'text', placeholder: 'sg-12345678' },
      { key: 'instanceType', label: 'Instance Type', type: 'select', options: [
        { value: 't2.micro', label: 't2.micro' },
        { value: 't2.small', label: 't2.small' },
        { value: 't2.medium', label: 't2.medium' },
        { value: 'm5.large', label: 'm5.large' },
        { value: 'm5.xlarge', label: 'm5.xlarge' },
      ]},
      { key: 'instanceCount', label: 'Instance Count', type: 'number', placeholder: '1' },
      { key: 'osType', label: 'Operating System', type: 'select', options: [
        { value: 'amazon-linux', label: 'Amazon Linux' },
        { value: 'ubuntu', label: 'Ubuntu' },
        { value: 'windows', label: 'Windows' },
        { value: 'rhel', label: 'RHEL' },
      ]},
    ],
  },
  {
    id: 'lambda',
    name: 'Lambda',
    category: 'compute',
    icon: 'lambda',
    description: 'Serverless compute',
    color: '#FF9900',
    editableAttributes: [
      { key: 'runtime', label: 'Runtime', type: 'select', options: [
        { value: 'python3.11', label: 'Python 3.11' },
        { value: 'node.js18', label: 'Node.js 18' },
        { value: 'java11', label: 'Java 11' },
        { value: 'dotnet6', label: '.NET 6' },
      ]},
      { key: 'memory', label: 'Memory (MB)', type: 'select', options: [
        { value: '128', label: '128 MB' },
        { value: '256', label: '256 MB' },
        { value: '512', label: '512 MB' },
        { value: '1024', label: '1 GB' },
        { value: '2048', label: '2 GB' },
      ]},
      { key: 'timeout', label: 'Timeout (seconds)', type: 'number', placeholder: '30' },
    ],
  },
  {
    id: 'ecs',
    name: 'ECS Container',
    category: 'compute',
    icon: 'ecs',
    description: 'Container orchestration',
    color: '#FF9900',
    editableAttributes: [
      { key: 'launchType', label: 'Launch Type', type: 'select', options: [
        { value: 'ec2', label: 'EC2' },
        { value: 'fargate', label: 'Fargate' },
      ]},
      { key: 'containerImage', label: 'Container Image', type: 'text', placeholder: 'docker.io/myapp:latest' },
      { key: 'cpuUnits', label: 'CPU Units', type: 'number', placeholder: '256' },
      { key: 'memory', label: 'Memory (MB)', type: 'number', placeholder: '512' },
    ],
  },
  {
    id: 'eks',
    name: 'Kubernetes',
    category: 'compute',
    icon: 'eks',
    description: 'Managed Kubernetes',
    color: '#326CE5',
    editableAttributes: [
      { key: 'clusterName', label: 'Cluster Name', type: 'text', placeholder: 'my-cluster' },
      { key: 'kubernetesVersion', label: 'Kubernetes Version', type: 'select', options: [
        { value: '1.24', label: 'v1.24' },
        { value: '1.25', label: 'v1.25' },
        { value: '1.26', label: 'v1.26' },
        { value: '1.27', label: 'v1.27' },
      ]},
      { key: 'nodeCount', label: 'Node Count', type: 'number', placeholder: '3' },
    ],
  },
  
  // Storage
  {
    id: 's3',
    name: 'S3 Bucket',
    category: 'storage',
    icon: 's3',
    description: 'Object storage',
    color: '#569A31',
    editableAttributes: [
      { key: 'bucketName', label: 'Bucket Name', type: 'text', placeholder: 'my-bucket-name' },
      { key: 'versioningEnabled', label: 'Versioning Enabled', type: 'boolean' },
      { key: 'encryptionType', label: 'Encryption', type: 'select', options: [
        { value: 'none', label: 'None' },
        { value: 'sse-s3', label: 'SSE-S3' },
        { value: 'sse-kms', label: 'SSE-KMS' },
      ]},
    ],
  },
  {
    id: 'ebs',
    name: 'EBS Volume',
    category: 'storage',
    icon: 'ebs',
    description: 'Block storage',
    color: '#569A31',
    editableAttributes: [
      { key: 'volumeSize', label: 'Volume Size (GB)', type: 'number', placeholder: '100' },
      { key: 'volumeType', label: 'Volume Type', type: 'select', options: [
        { value: 'gp3', label: 'GP3' },
        { value: 'gp2', label: 'GP2' },
        { value: 'io1', label: 'IO1' },
        { value: 'st1', label: 'ST1' },
      ]},
      { key: 'iops', label: 'IOPS', type: 'number', placeholder: '3000' },
    ],
  },
  {
    id: 'efs',
    name: 'EFS',
    category: 'storage',
    icon: 'efs',
    description: 'Elastic file system',
    color: '#569A31',
    editableAttributes: [
      { key: 'fileSystemName', label: 'File System Name', type: 'text', placeholder: 'my-efs' },
      { key: 'performanceMode', label: 'Performance Mode', type: 'select', options: [
        { value: 'generalPurpose', label: 'General Purpose' },
        { value: 'maxIO', label: 'Max IO' },
      ]},
      { key: 'throughputMode', label: 'Throughput Mode', type: 'select', options: [
        { value: 'bursting', label: 'Bursting' },
        { value: 'provisioned', label: 'Provisioned' },
      ]},
    ],
  },
  
  // Database
  {
    id: 'rds',
    name: 'RDS Database',
    category: 'database',
    icon: 'rds',
    description: 'Relational database',
    color: '#3B48CC',
    editableAttributes: [
      { key: 'engine', label: 'Database Engine', type: 'select', options: [
        { value: 'mysql', label: 'MySQL' },
        { value: 'postgresql', label: 'PostgreSQL' },
        { value: 'mariadb', label: 'MariaDB' },
        { value: 'oracle', label: 'Oracle' },
        { value: 'sqlserver', label: 'SQL Server' },
      ]},
      { key: 'instanceClass', label: 'Instance Class', type: 'select', options: [
        { value: 'db.t3.micro', label: 'db.t3.micro' },
        { value: 'db.t3.small', label: 'db.t3.small' },
        { value: 'db.m5.large', label: 'db.m5.large' },
        { value: 'db.m5.xlarge', label: 'db.m5.xlarge' },
      ]},
      { key: 'allocatedStorage', label: 'Allocated Storage (GB)', type: 'number', placeholder: '20' },
      { key: 'multiAZ', label: 'Multi-AZ', type: 'boolean' },
    ],
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    category: 'database',
    icon: 'dynamodb',
    description: 'NoSQL database',
    color: '#3B48CC',
    editableAttributes: [
      { key: 'billingMode', label: 'Billing Mode', type: 'select', options: [
        { value: 'payPerRequest', label: 'Pay-per-request' },
        { value: 'provisioned', label: 'Provisioned' },
      ]},
      { key: 'readCapacity', label: 'Read Capacity Units', type: 'number', placeholder: '5' },
      { key: 'writeCapacity', label: 'Write Capacity Units', type: 'number', placeholder: '5' },
      { key: 'ttlEnabled', label: 'TTL Enabled', type: 'boolean' },
    ],
  },
  {
    id: 'elasticache',
    name: 'ElastiCache',
    category: 'database',
    icon: 'elasticache',
    description: 'In-memory cache',
    color: '#C925D1',
    editableAttributes: [
      { key: 'cacheEngine', label: 'Cache Engine', type: 'select', options: [
        { value: 'redis', label: 'Redis' },
        { value: 'memcached', label: 'Memcached' },
      ]},
      { key: 'nodeType', label: 'Node Type', type: 'select', options: [
        { value: 'cache.t3.micro', label: 'cache.t3.micro' },
        { value: 'cache.t3.small', label: 'cache.t3.small' },
        { value: 'cache.m5.large', label: 'cache.m5.large' },
      ]},
      { key: 'numCacheNodes', label: 'Number of Nodes', type: 'number', placeholder: '1' },
    ],
  },
  
  // Networking
  {
    id: 'vpc',
    name: 'VPC',
    category: 'networking',
    icon: 'vpc',
    description: 'Virtual private cloud',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'vpcName', label: 'VPC Name', type: 'text', placeholder: 'my-vpc' },
      { key: 'cidrBlock', label: 'CIDR Block', type: 'text', placeholder: '10.0.0.0/16' },
      { key: 'dnsHostnamesEnabled', label: 'DNS Hostnames', type: 'boolean' },
    ],
  },
  {
    id: 'elb',
    name: 'Load Balancer',
    category: 'networking',
    icon: 'elb',
    description: 'Elastic load balancer',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'lbType', label: 'Load Balancer Type', type: 'select', options: [
        { value: 'application', label: 'Application (ALB)' },
        { value: 'network', label: 'Network (NLB)' },
        { value: 'gateway', label: 'Gateway (GLB)' },
      ]},
      { key: 'lbName', label: 'Load Balancer Name', type: 'text', placeholder: 'my-alb' },
      { key: 'scheme', label: 'Scheme', type: 'select', options: [
        { value: 'internet-facing', label: 'Internet-facing' },
        { value: 'internal', label: 'Internal' },
      ]},
    ],
  },
  {
    id: 'cloudfront',
    name: 'CloudFront',
    category: 'networking',
    icon: 'cloudfront',
    description: 'CDN distribution',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'httpVersion', label: 'HTTP Version', type: 'select', options: [
        { value: 'http1.1', label: 'HTTP/1.1' },
        { value: 'http2', label: 'HTTP/2' },
        { value: 'http3', label: 'HTTP/3' },
      ]},
      { key: 'priceClass', label: 'Price Class', type: 'select', options: [
        { value: 'PriceClass_All', label: 'All Regions' },
        { value: 'PriceClass_100', label: 'US, Europe, Asia' },
        { value: 'PriceClass_200', label: 'US, Europe, Asia, Middle East, Africa' },
      ]},
      { key: 'cachingEnabled', label: 'Caching Enabled', type: 'boolean' },
    ],
  },
  {
    id: 'apigateway',
    name: 'API Gateway',
    category: 'networking',
    icon: 'apigateway',
    description: 'API management',
    color: '#FF4F8B',
    editableAttributes: [
      { key: 'apiType', label: 'API Type', type: 'select', options: [
        { value: 'rest', label: 'REST API' },
        { value: 'http', label: 'HTTP API' },
        { value: 'websocket', label: 'WebSocket API' },
      ]},
      { key: 'apiName', label: 'API Name', type: 'text', placeholder: 'my-api' },
      { key: 'stageName', label: 'Stage Name', type: 'text', placeholder: 'prod' },
    ],
  },
  
  // Security
  {
    id: 'iam',
    name: 'IAM',
    category: 'security',
    icon: 'iam',
    description: 'Identity management',
    color: '#DD344C',
    editableAttributes: [
      { key: 'roleName', label: 'Role Name', type: 'text', placeholder: 'MyRole' },
      { key: 'trustRelationships', label: 'Trust Relationships', type: 'textarea', placeholder: 'AWS service principals' },
      { key: 'maxSessionDuration', label: 'Max Session Duration (hours)', type: 'number', placeholder: '1' },
    ],
  },
  {
    id: 'cognito',
    name: 'Cognito',
    category: 'security',
    icon: 'cognito',
    description: 'User authentication',
    color: '#DD344C',
    editableAttributes: [
      { key: 'poolName', label: 'User Pool Name', type: 'text', placeholder: 'MyUserPool' },
      { key: 'passwordMinLength', label: 'Min Password Length', type: 'number', placeholder: '8' },
      { key: 'mfaRequired', label: 'MFA Required', type: 'boolean' },
    ],
  },
  {
    id: 'waf',
    name: 'WAF',
    category: 'security',
    icon: 'waf',
    description: 'Web application firewall',
    color: '#DD344C',
    editableAttributes: [
      { key: 'wafScope', label: 'WAF Scope', type: 'select', options: [
        { value: 'cloudfront', label: 'CloudFront' },
        { value: 'alb', label: 'ALB' },
        { value: 'api', label: 'API Gateway' },
      ]},
      { key: 'ruleGroupCount', label: 'Number of Rule Groups', type: 'number', placeholder: '1' },
    ],
  },
  
  // Analytics
  {
    id: 'cloudwatch',
    name: 'CloudWatch',
    category: 'analytics',
    icon: 'cloudwatch',
    description: 'Monitoring & logging',
    color: '#FF4F8B',
    editableAttributes: [
      { key: 'logGroupName', label: 'Log Group Name', type: 'text', placeholder: '/aws/lambda/my-function' },
      { key: 'retentionDays', label: 'Log Retention (days)', type: 'select', options: [
        { value: '1', label: '1 day' },
        { value: '7', label: '7 days' },
        { value: '30', label: '30 days' },
        { value: '90', label: '90 days' },
        { value: 'never', label: 'Never expire' },
      ]},
    ],
  },
  {
    id: 'kinesis',
    name: 'Kinesis',
    category: 'analytics',
    icon: 'kinesis',
    description: 'Real-time streaming',
    color: '#8C4FFF',
    editableAttributes: [
      { key: 'streamName', label: 'Stream Name', type: 'text', placeholder: 'my-stream' },
      { key: 'shardCount', label: 'Shard Count', type: 'number', placeholder: '1' },
      { key: 'retentionPeriod', label: 'Retention Period (hours)', type: 'number', placeholder: '24' },
    ],
  },
  {
    id: 'sqs',
    name: 'SQS Queue',
    category: 'analytics',
    icon: 'sqs',
    description: 'Message queue',
    color: '#FF4F8B',
    editableAttributes: [
      { key: 'queueName', label: 'Queue Name', type: 'text', placeholder: 'my-queue' },
      { key: 'delaySeconds', label: 'Message Delay (seconds)', type: 'number', placeholder: '0' },
      { key: 'visibilityTimeout', label: 'Visibility Timeout (seconds)', type: 'number', placeholder: '30' },
      { key: 'fifoQueue', label: 'FIFO Queue', type: 'boolean' },
    ],
  },
];

export const categoryLabels: Record<string, string> = {
  compute: 'Compute',
  storage: 'Storage',
  database: 'Database',
  networking: 'Networking',
  security: 'Security',
  analytics: 'Analytics',
};

export const categoryColors: Record<string, string> = {
  compute: '#FF9900',
  storage: '#569A31',
  database: '#3B48CC',
  networking: '#8C4FFF',
  security: '#DD344C',
  analytics: '#FF4F8B',
};
