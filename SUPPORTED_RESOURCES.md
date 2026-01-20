# Supported AWS Resources in Architect Playhouse

This document lists all AWS resource types now supported by the diagram parser and renderer.

## Resource Type Categories

### Compute (10 resources)
- **EC2 Instance** - Virtual servers in the cloud
- **Lambda** - Serverless compute functions
- **ECS Container** - Container orchestration
- **EKS (Kubernetes)** - Managed Kubernetes service
- **Fargate** - Serverless container compute
- **Elastic Beanstalk** - Platform as a service
- **Auto Scaling Group** - Automatic scaling of compute resources

### Storage (4 resources)
- **S3 Bucket** - Object storage
- **EBS Volume** - Block storage for EC2 instances
- **EFS** - Elastic file system for shared access

### Database (4 resources)
- **RDS Database** - Relational database service
- **DynamoDB** - NoSQL database
- **ElastiCache** - In-memory cache (Redis/Memcached)

### Networking (12 resources)
- **VPC** - Virtual private cloud
- **Subnet** - VPC subnet
- **Security Group** - Virtual firewall
- **Network ACL** - Network access control list
- **Internet Gateway** - VPC internet connectivity
- **NAT Gateway** - Network address translation
- **Route Table** - VPC routing
- **Load Balancer** - Elastic load balancer
- **ALB** - Application load balancer
- **NLB** - Network load balancer
- **CloudFront** - CDN distribution
- **API Gateway** - API management and publishing
- **Route 53** - DNS and domain registration
- **VPC Peering** - VPC-to-VPC connectivity
- **Transit Gateway** - Hub-and-spoke network architecture

### Security (3 resources)
- **IAM** - Identity and access management
- **Cognito** - User authentication and authorization
- **WAF** - Web application firewall

### Analytics & Messaging (5 resources)
- **CloudWatch** - Monitoring, logging, and observability
- **Kinesis** - Real-time data streaming
- **SQS Queue** - Message queue service
- **SNS Topic** - Message publishing service

## Usage in AWS Data Parser

All resources are now fully integrated into the `awsDataParser.ts` module with:

1. **Resource Type Getters** - Each resource has a dedicated getter function (e.g., `getLambdaResourceType()`)
2. **AWSDataInput Interface** - Updated to support all resource types in the data structure
3. **Consistent Styling** - Each resource type has predefined colors and icons
4. **Editable Attributes** - All resources support customizable properties

## Data Structure

The `AWSDataInput` interface now supports:

```typescript
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
```

## Resource Type Functions

All resource types are accessible via getter functions:

- `getEC2ResourceType()`
- `getLambdaResourceType()`
- `getECSResourceType()`
- `getEKSResourceType()`
- `getS3ResourceType()`
- `getEBSResourceType()`
- `getEFSResourceType()`
- `getRDSResourceType()`
- `getDynamoDBResourceType()`
- `getElastiCacheResourceType()`
- `getVPCResourceType()`
- `getSubnetResourceType()`
- `getSecurityGroupResourceType()`
- `getNetworkACLResourceType()`
- `getIGWResourceType()`
- `getNATGatewayResourceType()`
- `getRouteTableResourceType()`
- `getLoadBalancerResourceType()`
- `getCloudFrontResourceType()`
- `getAPIGatewayResourceType()`
- `getIAMResourceType()`
- `getCognitoResourceType()`
- `getWAFResourceType()`
- `getKinesisResourceType()`
- `getSQSResourceType()`
- `getSNSResourceType()`
- `getCloudWatchResourceType()`
- `getAutoScalingGroupResourceType()`
- `getFargateResourceType()`
- `getElasticBeanstalkResourceType()`
- `getRoute53ResourceType()`
- `getVPCPeeringResourceType()`
- `getTransitGatewayResourceType()`

## Integration Points

The supported resources are now ready to be:

1. **Parsed from AWS JSON data** - Extended data parser to handle all resource types
2. **Rendered as diagram nodes** - All resource types can be displayed on the canvas
3. **Connected with edges** - All resources can have relationship connections
4. **Styled consistently** - Unified color scheme per category
5. **Made interactive** - Edit properties and create connections

## Next Steps

To fully utilize all resources in diagrams:

1. Add node rendering logic for each resource type
2. Create edge connections between related resources
3. Implement relationship rules (e.g., Lambda → SQS, EC2 → EBS)
4. Add filtering/visibility toggles for resource types
5. Implement resource-specific properties panels
