// AWS pricing estimates (as of 2024, us-east-1 region)
// These are approximate values for demonstration purposes
// Actual pricing may vary by region and should be verified with AWS pricing page

export interface CostEstimate {
  hourly: number;
  monthly: number;
  currency: string;
  details: string[];
}

const EC2_INSTANCE_PRICES: Record<string, number> = {
  't2.micro': 0.0116,
  't2.small': 0.023,
  't2.medium': 0.0464,
  'm5.large': 0.096,
  'm5.xlarge': 0.192,
};

const RDS_INSTANCE_PRICES: Record<string, number> = {
  'db.t3.micro': 0.017,
  'db.t3.small': 0.034,
  'db.m5.large': 0.196,
  'db.m5.xlarge': 0.392,
};

const ELASTICACHE_PRICES: Record<string, number> = {
  'cache.t3.micro': 0.017,
  'cache.t3.small': 0.034,
  'cache.m5.large': 0.152,
};

const calculateEC2Cost = (config: Record<string, unknown>): CostEstimate => {
  const instanceType = (config.instanceType as string) || 't2.micro';
  const count = (config.instanceCount as number) || 1;
  
  const hourlyPrice = (EC2_INSTANCE_PRICES[instanceType] || 0.05) * count;
  const monthlyPrice = hourlyPrice * 730; // 730 hours per month

  return {
    hourly: hourlyPrice,
    monthly: monthlyPrice,
    currency: 'USD',
    details: [
      `Instance Type: ${instanceType}`,
      `Count: ${count}`,
      `Hourly Rate: $${hourlyPrice.toFixed(4)}`,
      `Note: Pricing based on Linux on-demand, excludes data transfer`,
    ],
  };
};

const calculateLambdaCost = (config: Record<string, unknown>): CostEstimate => {
  // Assume 1 million invocations per month and 128MB memory (estimated)
  const invocations = 1000000;
  const duration = 100; // ms per invocation
  const memory = 128; // MB

  // Lambda pricing: $0.20 per 1M requests + $0.0000166667 per GB-second
  const requestCost = (invocations / 1000000) * 0.2;
  const gbSeconds = (invocations * duration * memory) / (1000 * 1024);
  const computeCost = gbSeconds * 0.0000166667;
  const monthlyPrice = requestCost + computeCost;

  return {
    hourly: monthlyPrice / 730,
    monthly: monthlyPrice,
    currency: 'USD',
    details: [
      `Memory: ${memory}MB`,
      `Estimated Invocations: 1M/month`,
      `Request Cost: $${requestCost.toFixed(4)}`,
      `Compute Cost: $${computeCost.toFixed(4)}`,
      `Note: Assumes 100ms execution time`,
    ],
  };
};

const calculateECSCost = (config: Record<string, unknown>): CostEstimate => {
  const launchType = (config.launchType as string) || 'ec2';
  const cpuUnits = (config.cpuUnits as number) || 256;
  const memory = (config.memory as number) || 512;

  let monthlyCost = 0;
  let details: string[] = [];

  if (launchType === 'fargate') {
    // Fargate pricing: vCPU and Memory per second
    const vcpu = cpuUnits / 1024;
    const hourlyVcpuCost = vcpu * 0.04048;
    const hourlyMemoryCost = (memory / 1024) * 0.004445;
    const monthlyCpu = hourlyVcpuCost * 730;
    const monthlyMemory = hourlyMemoryCost * 730;
    monthlyCost = monthlyCpu + monthlyMemory;

    details = [
      `Launch Type: Fargate`,
      `vCPU: ${vcpu}`,
      `Memory: ${memory}MB`,
      `Monthly vCPU Cost: $${monthlyCpu.toFixed(2)}`,
      `Monthly Memory Cost: $${monthlyMemory.toFixed(2)}`,
    ];
  } else {
    // EC2 launch type - assumes you already have EC2 instances
    monthlyCost = 0;
    details = [
      `Launch Type: EC2`,
      `vCPU: ${cpuUnits / 1024}`,
      `Memory: ${memory}MB`,
      `Note: Costs depend on underlying EC2 instances`,
    ];
  }

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details,
  };
};

const calculateEKSCost = (config: Record<string, unknown>): CostEstimate => {
  const nodeCount = (config.nodeCount as number) || 1;
  const clusterCost = 0.10; // $0.10 per hour for the cluster
  const nodeCost = nodeCount * 0.05; // Estimated at $0.05/hour per node

  const monthlyCost = (clusterCost + nodeCost) * 730;

  return {
    hourly: clusterCost + nodeCost,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Cluster Control Plane: $0.10/hour`,
      `Nodes: ${nodeCount} @ $0.05/hour each`,
      `Note: Node pricing depends on instance type`,
    ],
  };
};

const calculateS3Cost = (config: Record<string, unknown>): CostEstimate => {
  // Assume 100GB storage (placeholder, user should specify)
  const storageGB = 100;
  const monthlyStorageCost = storageGB * 0.023; // $0.023 per GB

  return {
    hourly: monthlyStorageCost / 730,
    monthly: monthlyStorageCost,
    currency: 'USD',
    details: [
      `Storage: ${storageGB}GB`,
      `Standard Storage Rate: $0.023/GB`,
      `Note: Add ~${(storageGB * 0.0004).toFixed(2)} for PUT/GET requests (1000 ops)`,
      `Versioning and encryption may increase costs`,
    ],
  };
};

const calculateEBSCost = (config: Record<string, unknown>): CostEstimate => {
  const volumeSize = (config.volumeSize as number) || 100;
  const volumeType = (config.volumeType as string) || 'gp3';
  const iops = (config.iops as number) || 3000;

  let monthlyCost = 0;
  let details: string[] = [];

  switch (volumeType) {
    case 'gp3': {
      const baseCost = volumeSize * 0.1; // $0.10 per GB
      const iopsCost = Math.max(0, (iops - 3000) * 0.015 / 1000); // $0.015 per IOPS above 3000
      monthlyCost = baseCost + iopsCost;
      details = [
        `Volume Size: ${volumeSize}GB @ $0.10/GB`,
        `Volume Type: GP3`,
        `IOPS: ${iops}`,
        `Monthly Storage Cost: $${baseCost.toFixed(2)}`,
        `Monthly IOPS Cost: $${iopsCost.toFixed(2)}`,
      ];
      break;
    }
    case 'gp2':
      monthlyCost = volumeSize * 0.1;
      details = [
        `Volume Size: ${volumeSize}GB @ $0.1/GB`,
        `Volume Type: GP2`,
        `Note: 3 IOPS per GB included`,
      ];
      break;
    case 'io1': {
      const io1Cost = volumeSize * 0.125 + (iops * 0.065 / 1000);
      monthlyCost = io1Cost;
      details = [
        `Volume Size: ${volumeSize}GB @ $0.125/GB`,
        `Volume Type: IO1`,
        `IOPS: ${iops} @ $0.065/IOPS`,
      ];
      break;
    }
    default:
      monthlyCost = volumeSize * 0.1;
  }

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details,
  };
};

const calculateRDSCost = (config: Record<string, unknown>): CostEstimate => {
  const instanceClass = (config.instanceClass as string) || 'db.t3.micro';
  const storage = (config.allocatedStorage as number) || 20;
  const multiAZ = (config.multiAZ as boolean) || false;

  const hourlyInstance = (RDS_INSTANCE_PRICES[instanceClass] || 0.02) * (multiAZ ? 2 : 1);
  const monthlyCost = (hourlyInstance * 730) + (storage * 0.23);

  return {
    hourly: hourlyInstance,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Instance Class: ${instanceClass}`,
      `Storage: ${storage}GB @ $0.23/GB`,
      `Multi-AZ: ${multiAZ ? 'Yes (2x cost)' : 'No'}`,
      `Hourly Rate: $${hourlyInstance.toFixed(4)}`,
      `Note: Excludes backup storage and data transfer`,
    ],
  };
};

const calculateDynamoDBCost = (config: Record<string, unknown>): CostEstimate => {
  const billingMode = (config.billingMode as string) || 'provisioned';
  const readCapacity = (config.readCapacity as number) || 5;
  const writeCapacity = (config.writeCapacity as number) || 5;

  let monthlyCost = 0;
  let details: string[] = [];

  if (billingMode === 'provisioned') {
    const readCost = readCapacity * 0.25; // $0.25 per RCU per month
    const writeCost = writeCapacity * 1.25; // $1.25 per WCU per month
    monthlyCost = readCost + writeCost;

    details = [
      `Billing Mode: Provisioned`,
      `Read Capacity: ${readCapacity} RCU @ $0.25/RCU`,
      `Write Capacity: ${writeCapacity} WCU @ $1.25/WCU`,
      `Monthly Read Cost: $${readCost.toFixed(2)}`,
      `Monthly Write Cost: $${writeCost.toFixed(2)}`,
    ];
  } else {
    // Pay-per-request (approximate: $1.25 per 1M writes, $0.25 per 1M reads)
    const estimatedReads = 1000000;
    const estimatedWrites = 1000000;
    monthlyCost = (estimatedWrites / 1000000) * 1.25 + (estimatedReads / 1000000) * 0.25;

    details = [
      `Billing Mode: Pay-per-request`,
      `Estimated Monthly Writes: 1M @ $1.25/M`,
      `Estimated Monthly Reads: 1M @ $0.25/M`,
      `Note: Adjust based on actual usage`,
    ];
  }

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details,
  };
};

const calculateElastiCacheCost = (config: Record<string, unknown>): CostEstimate => {
  const nodeType = (config.nodeType as string) || 'cache.t3.micro';
  const nodeCount = (config.numCacheNodes as number) || 1;

  const hourlyPrice = (ELASTICACHE_PRICES[nodeType] || 0.017) * nodeCount;
  const monthlyCost = hourlyPrice * 730;

  return {
    hourly: hourlyPrice,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Node Type: ${nodeType}`,
      `Number of Nodes: ${nodeCount}`,
      `Hourly Rate: $${hourlyPrice.toFixed(4)}`,
      `Note: Excludes data transfer costs`,
    ],
  };
};

const calculateVPCCost = (config: Record<string, unknown>): CostEstimate => {
  // VPC itself is free, but NAT Gateway is $0.045/hour
  const natGatewayHourly = 0.045; // Estimated 1 NAT Gateway
  const monthlyCost = natGatewayHourly * 730;

  return {
    hourly: natGatewayHourly,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `VPC: Free`,
      `NAT Gateway (estimated): $0.045/hour`,
      `Monthly Total: $${monthlyCost.toFixed(2)}`,
      `Note: Add data transfer costs (~$0.045/GB out)`,
    ],
  };
};

const calculateELBCost = (config: Record<string, unknown>): CostEstimate => {
  const lbType = (config.lbType as string) || 'application';
  let hourlyPrice = 0;
  let details: string[] = [];

  switch (lbType) {
    case 'application':
      hourlyPrice = 0.0225; // ALB $0.0225/hour
      details = ['Load Balancer Type: Application (ALB)', 'Hourly Rate: $0.0225'];
      break;
    case 'network':
      hourlyPrice = 0.006; // NLB $0.006/hour
      details = ['Load Balancer Type: Network (NLB)', 'Hourly Rate: $0.006'];
      break;
    case 'gateway':
      hourlyPrice = 0.01; // GLB $0.01/hour
      details = ['Load Balancer Type: Gateway (GLB)', 'Hourly Rate: $0.01'];
      break;
  }

  const monthlyCost = hourlyPrice * 730;
  details.push(`Note: Add $0.006/hour per LB capacity unit`);

  return {
    hourly: hourlyPrice,
    monthly: monthlyCost,
    currency: 'USD',
    details,
  };
};

const calculateCloudFrontCost = (config: Record<string, unknown>): CostEstimate => {
  // Estimate based on 1TB data transfer
  const dataTransferGB = 1024; // 1TB
  const monthlyCost = dataTransferGB * 0.085; // $0.085 per GB (first 10TB)

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Estimated Data Transfer: ${dataTransferGB}GB`,
      `Rate (US/EU): $0.085/GB`,
      `Monthly Cost: $${monthlyCost.toFixed(2)}`,
      `Note: Pricing varies by region`,
    ],
  };
};

const calculateAPIGatewayCost = (config: Record<string, unknown>): CostEstimate => {
  // Assume 1M requests per month
  const requestsPerMonth = 1000000;
  const monthlyCost = (requestsPerMonth / 1000000) * 3.5; // $3.50 per 1M requests

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `API Type: ${config.apiType || 'REST'}`,
      `Estimated Requests: 1M/month`,
      `Rate: $3.50 per 1M requests`,
      `Note: Add data transfer costs`,
    ],
  };
};

const calculateIAMCost = (): CostEstimate => {
  return {
    hourly: 0,
    monthly: 0,
    currency: 'USD',
    details: ['IAM is Free', 'No additional charges for basic IAM usage'],
  };
};

const calculateCognitoCost = (config: Record<string, unknown>): CostEstimate => {
  // Assume 100 monthly active users
  const monthlyActiveUsers = 100;
  const monthlyCost = monthlyActiveUsers * 0.025; // First 50k MAU at $0.025/MAU

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Monthly Active Users: ${monthlyActiveUsers}`,
      `Rate: $0.025 per MAU (first 50k)`,
      `Monthly Cost: $${monthlyCost.toFixed(2)}`,
    ],
  };
};

const calculateWAFCost = (): CostEstimate => {
  // WAF pricing: $5/month + $0.60 per million requests
  const monthlyCost = 5 + (1000000 / 1000000) * 0.6;

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Web ACL: $5.00/month`,
      `Rule Cost: $0.60 per 1M requests`,
      `Monthly Total: $${monthlyCost.toFixed(2)}`,
    ],
  };
};

const calculateCloudWatchCost = (): CostEstimate => {
  // Basic monitoring is free, custom metrics $0.10/metric
  const customMetrics = 5;
  const monthlyCost = customMetrics * 0.1;

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Custom Metrics: ${customMetrics} @ $0.10/metric`,
      `Basic Monitoring: Free`,
      `Log Storage: ~$0.50/GB`,
    ],
  };
};

const calculateKinesisCost = (config: Record<string, unknown>): CostEstimate => {
  const shardCount = (config.shardCount as number) || 1;
  const monthlyCost = shardCount * 0.36; // $0.36 per shard per hour

  return {
    hourly: (shardCount * 0.36) / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Shard Count: ${shardCount}`,
      `Hourly Rate: ${shardCount} @ $0.36/hour`,
      `Monthly Total: $${monthlyCost.toFixed(2)}`,
    ],
  };
};

const calculateSQSCost = (config: Record<string, unknown>): CostEstimate => {
  // Assume 1M messages per month
  const messagesPerMonth = 1000000;
  const monthlyCost = (messagesPerMonth / 1000000) * 0.4; // $0.40 per 1M requests

  return {
    hourly: monthlyCost / 730,
    monthly: monthlyCost,
    currency: 'USD',
    details: [
      `Estimated Messages: ${messagesPerMonth.toLocaleString()}/month`,
      `Rate: $0.40 per 1M requests`,
      `Monthly Cost: $${monthlyCost.toFixed(2)}`,
      config.fifoQueue ? 'FIFO Queue: Add $0.50 per 1M requests' : '',
    ].filter(Boolean),
  };
};

export const calculateResourceCost = (
  resourceId: string,
  config: Record<string, unknown> = {}
): CostEstimate => {
  switch (resourceId) {
    case 'ec2':
      return calculateEC2Cost(config);
    case 'lambda':
      return calculateLambdaCost(config);
    case 'ecs':
      return calculateECSCost(config);
    case 'eks':
      return calculateEKSCost(config);
    case 's3':
      return calculateS3Cost(config);
    case 'ebs':
      return calculateEBSCost(config);
    case 'rds':
      return calculateRDSCost(config);
    case 'dynamodb':
      return calculateDynamoDBCost(config);
    case 'elasticache':
      return calculateElastiCacheCost(config);
    case 'vpc':
      return calculateVPCCost(config);
    case 'elb':
      return calculateELBCost(config);
    case 'cloudfront':
      return calculateCloudFrontCost(config);
    case 'apigateway':
      return calculateAPIGatewayCost(config);
    case 'iam':
      return calculateIAMCost();
    case 'cognito':
      return calculateCognitoCost(config);
    case 'waf':
      return calculateWAFCost();
    case 'cloudwatch':
      return calculateCloudWatchCost();
    case 'kinesis':
      return calculateKinesisCost(config);
    case 'sqs':
      return calculateSQSCost(config);
    default:
      return {
        hourly: 0,
        monthly: 0,
        currency: 'USD',
        details: ['Cost calculation not available for this resource type'],
      };
  }
};
