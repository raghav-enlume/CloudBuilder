/* eslint-disable @typescript-eslint/no-explicit-any */
import * as AwsIcons from 'aws-react-icons';

const iconComponents: Record<string, any> = {
  ec2: (AwsIcons as any).ArchitectureServiceAmazonEC2,
  lambda: (AwsIcons as any).ArchitectureServiceAWSLambda,
  ecs: (AwsIcons as any).ArchitectureServiceAmazonECSAnywhere,
  eks: (AwsIcons as any).ArchitectureServiceAmazonEKSCloud,
  s3: (AwsIcons as any).ArchitectureServiceAmazonSimpleStorageService,
  ebs: (AwsIcons as any).ArchitectureServiceAmazonElasticBlockStore,
  efs: (AwsIcons as any).ResourceAmazonElasticFileSystemEFSOneZone,
  rds: (AwsIcons as any).ArchitectureServiceAmazonRDS,
  dynamodb: (AwsIcons as any).ArchitectureServiceAmazonDynamoDB,
  elasticache: (AwsIcons as any).ArchitectureServiceAmazonElastiCache,
  vpc: (AwsIcons as any).ArchitectureGroupVirtualprivatecloudVPC,
  elb: (AwsIcons as any).ArchitectureServiceElasticLoadBalancing,
  cloudfront: (AwsIcons as any).ArchitectureServiceAmazonCloudFront,
  apigateway: (AwsIcons as any).ArchitectureServiceAmazonAPIGateway,
  iam: (AwsIcons as any).ArchitectureServiceAWSIdentityandAccessManagement,
  cognito: (AwsIcons as any).ArchitectureServiceAmazonCognito,
  waf: (AwsIcons as any).ArchitectureServiceAWSWAF,
  cloudwatch: (AwsIcons as any).ArchitectureServiceAmazonCloudWatch,
  kinesis: (AwsIcons as any).ArchitectureServiceAmazonKinesis,
  sqs: (AwsIcons as any).ArchitectureServiceAmazonSimpleQueueService,
};

export const getIconComponent = (iconId: string): any => {
  return iconComponents[iconId] || null;
};
