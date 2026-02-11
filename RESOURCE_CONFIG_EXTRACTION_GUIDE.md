# Resource Configuration Extraction Guide

## Overview
The resource configuration extraction system automatically extracts and displays AWS resource properties from imported flat-array JSON files in the TopPropertiesBar.

## Files Created/Modified

### New File: `src/lib/resourceConfigExtractor.ts`
Core extraction logic that maps raw AWS properties to configurable attributes.

**Key Export:**
- `extractResourceConfig(raw, resourceTypeId, label)` - Main extraction function

## Supported Resource Types (40+)

### NETWORKING (8 types)
- **vpc** - VPC Name, CIDR Block, DNS Hostnames
- **subnet** - Subnet Name, CIDR Block, Availability Zone, Public/Private
- **internetgateway** - Gateway Name, State
- **natgateway** - Gateway Name, State, Subnet ID
- **securitygroup** - Group Name, Group ID, Description, VPC ID, Inbound/Outbound Rules
- **networkacl** - NACL Name, Rule Count
- **alb/nlb/elb** - Load Balancer Type, Name, Scheme

### COMPUTE (7 types)
- **ec2** - Instance Type, Region, Instance Count, OS Type
- **lambda** - Runtime, Memory, Timeout
- **ecs** - Launch Type, Container Image, CPU Units, Memory
- **eks** - Cluster Name, Kubernetes Version, Node Count
- **fargate** - CPU Units, Memory, Container Image
- **elasticbeanstalk** - Platform, Environment Name, Instance Type
- **autoscaling** - Min/Max Size, Desired Capacity, Scaling Policy

### DATABASE (6 types)
- **rds** - Engine, Instance Class, Allocated Storage, Multi-AZ
- **dynamodb** - Billing Mode, Read/Write Capacity, TTL Enabled
- **elasticache** - Cache Engine, Node Type, Number of Nodes
- **aurora** - Engine, Instance Class, Multi-AZ
- **redshift** - Cluster ID, Node Type, Number of Nodes, Database Name

### STORAGE (4 types)
- **s3** - Bucket Name, Region, Versioning
- **ebs** - Volume Type, Size, IOPS, Encryption
- **efs** - Filesystem Name, Performance Mode, Throughput Mode, Encryption
- **glacier** - Vault Name

### ANALYTICS & MESSAGING (6 types)
- **kinesis/kinesis-streams** - Stream Name, Shard Count, Retention Period
- **kinesis-firehose** - Delivery Stream Name, Status, S3 Destination
- **sqs** - Queue Name, Delay Seconds, Visibility Timeout, FIFO Flag
- **sns** - Topic Name, Subscription Count
- **cloudwatch** - Log Group Name, Retention Days
- **eventbridge** - Rule Name, Event Bus Name, State

### SECURITY & MANAGEMENT (7 types)
- **iam/iamrole** - Role Name, Assume Role Policy, Max Session Duration
- **secretsmanager** - Secret Name, Secret Type, Rotation Enabled
- **ssmparameterstore** - Parameter Name, Parameter Type, Tier
- **waf** - WAF Name, Scope, Rule Group Count
- **shield** - Shield Level (Standard/Advanced), Protection Count
- **cognito** - User Pool Name, User Count
- **cloudtrail** - Trail Name, S3 Bucket Name, Multi-Region Flag

### NETWORKING - API & CDN (5 types)
- **apigateway** - API Name, API Type (REST/HTTP), Protocol
- **cloudfront** - Distribution ID, Domain Name, Status
- **route53** - Hosted Zone Name, Zone ID, Record Count
- **vpcpeering** - Peering Connection ID, Status
- **transitgateway** - Transit Gateway ID, State, Attachment Count

### OTHER (3 types)
- **cloudformation** - Stack Name, Stack Status
- **awscdk** - App Name, Stack Count
- **awsorganizations** - Organization ID, Master Account ID, Account Count
- **awsbackup** - Backup Vault Name, Recovery Points
- **awsconfig** - Config Status, Compliance Status

## How It Works

### Property Extraction Flow
1. **Import Process**: When a flat-array JSON is imported, `buildArchitectureGraph()` creates nodes with `raw` property containing original AWS data
2. **Load Diagram**: `loadDiagram()` processes all nodes with raw data
3. **Extract Config**: For each node, `extractResourceConfig()` maps AWS properties to config attributes
4. **Display**: TopPropertiesBar reads `node.data.config` and displays editable attributes

### Example: EC2 Instance
```json
{
  "resource_type": "EC2",
  "resource_property": {
    "InstanceType": "t3.medium",
    "ImageId": "ami-0abcdef1234567890",
    "Tags": [{"Key": "Name", "Value": "my-instance"}]
  }
}
```

Extracted config:
```typescript
{
  instanceType: 't3.medium',
  osType: 'amazon-linux',
  region: 'us-east-1',
  instanceCount: 1
}
```

## Adding New Resource Types

To add a new resource type:

1. **Open** `src/lib/resourceConfigExtractor.ts`
2. **Add case** in the `switch` statement:
```typescript
case 'your-resource-type': {
  return {
    property1: (prop.AwsProperty1 as string) || 'default',
    property2: (prop.AwsProperty2 as number) || 0,
  };
}
```

3. **Property Keys**: Must match the `editableAttributes` keys in `src/data/resources.ts`

## Key Features

✅ **Comprehensive Support**: 40+ AWS resource types  
✅ **Smart Defaults**: Falls back to sensible defaults if data unavailable  
✅ **Tag Extraction**: Automatically extracts Name tags  
✅ **Type-Safe**: Full TypeScript support with proper interfaces  
✅ **Extensible**: Easy to add new resource types  
✅ **Organized**: Clear categorization by AWS service  

## Files Modified
- `src/store/diagramStore.ts` - Updated import and simplified `loadDiagram()`
- **NEW** `src/lib/resourceConfigExtractor.ts` - Resource extraction logic
