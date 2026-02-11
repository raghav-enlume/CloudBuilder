/**
 * Resource Configuration Extractor
 * Extracts configurable properties from raw AWS resource data (JSON import)
 * Maps AWS properties to editable attributes for display in TopPropertiesBar
 */

interface RawAwsResource {
  resource_property?: Record<string, unknown>;
  [key: string]: unknown;
}

interface TagObject {
  Key: string;
  Value: string;
}

/**
 * Extracts and maps resource properties from raw AWS data to config attributes
 * @param raw - Raw AWS resource data from imported JSON
 * @param resourceTypeId - Resource type ID (vpc, ec2, rds, etc.)
 * @param label - Resource label/name for fallback values
 * @returns Configuration object with mapped properties
 */
export function extractResourceConfig(
  raw: RawAwsResource | undefined,
  resourceTypeId: string,
  label: string
): Record<string, unknown> {
  if (!raw) return {};

  const prop = (raw.resource_property as Record<string, unknown>) || {};
  const tags = Array.isArray(prop.Tags) ? (prop.Tags as TagObject[]) : [];

  const getTagValue = (key: string): string | undefined => {
    const tag = tags.find((t) => t?.Key === key);
    return tag?.Value;
  };

  switch (resourceTypeId) {
    // ========== NETWORKING ==========
    case 'vpc': {
      return {
        vpcName: getTagValue('Name') || label,
        cidrBlock: (prop.CidrBlock as string) || '10.0.0.0/16',
        dnsHostnamesEnabled: (prop.EnableDnsHostnames as boolean) ?? true,
      };
    }

    case 'subnet': {
      const subnetType = getTagValue('Type') || 'private';
      return {
        subnetName: getTagValue('Name') || label,
        cidrBlock: (prop.CidrBlock as string) || '10.0.1.0/24',
        availabilityZone: (prop.AvailabilityZone as string) || 'us-east-1a',
        publicSubnet: subnetType === 'public',
      };
    }

    case 'internetgateway': {
      const attachments = Array.isArray(prop.Attachments)
        ? (prop.Attachments as Array<{ VpcId?: string; State?: string }>)
        : [];
      const attachedVpc = attachments.length > 0 ? (attachments[0].VpcId || '') : '';
      
      return {
        gatewayName: getTagValue('Name') || label,
        attachedVPC: attachedVpc,
        state: (prop.State as string) || 'available',
      };
    }

    case 'natgateway': {
      const natAddresses = Array.isArray(prop.NatGatewayAddresses)
        ? (prop.NatGatewayAddresses as Array<{ PublicIp?: string; AllocationId?: string }>)
        : [];
      const elasticIp = natAddresses.length > 0 ? (natAddresses[0].PublicIp || '') : '';
      
      return {
        gatewayName: getTagValue('Name') || label,
        subnet: (prop.SubnetId as string) || '',
        elasticIP: elasticIp,
        state: (prop.State as string) || 'available',
      };
    }

    case 'securitygroup': {
      const inboundRules = Array.isArray(prop.IpPermissions)
        ? (prop.IpPermissions as unknown[]).length
        : 0;
      const outboundRules = Array.isArray(prop.IpPermissionsEgress)
        ? (prop.IpPermissionsEgress as unknown[]).length
        : 0;
      return {
        groupName: (prop.GroupName as string) || getTagValue('Name') || label,
        groupId: (prop.GroupId as string) || '',
        description: (prop.Description as string) || '',
        vpcId: (prop.VpcId as string) || '',
        inboundRules,
        outboundRules,
      };
    }

    case 'networkacl': {
      return {
        naclName: getTagValue('Name') || label,
        ruleCount: Array.isArray(prop.Entries) ? (prop.Entries as unknown[]).length : 0,
      };
    }

    case 'alb':
    case 'nlb':
    case 'elb': {
      return {
        lbType:
          resourceTypeId === 'nlb'
            ? 'network'
            : resourceTypeId === 'alb'
              ? 'application'
              : 'classic',
        lbName: (prop.LoadBalancerName as string) || getTagValue('Name') || label,
        scheme: (prop.Scheme as string) || 'internet-facing',
      };
    }

    // ========== COMPUTE ==========
    case 'ec2': {
      const securityGroups = Array.isArray(prop.SecurityGroups)
        ? (prop.SecurityGroups as Array<{ GroupId?: string; GroupName?: string }>)
        : [];
      const primarySecurityGroup = securityGroups.length > 0 
        ? (securityGroups[0].GroupId || securityGroups[0].GroupName || '')
        : '';
      
      return {
        instanceType: (prop.InstanceType as string) || 't2.micro',
        region: (prop.Region as string) || 'us-east-1',
        vpc: (prop.VpcId as string) || '',
        subnet: (prop.SubnetId as string) || '',
        securityGroup: primarySecurityGroup,
        instanceCount: 1,
        osType: inferOSFromImageId(prop.ImageId as string) || 'amazon-linux',
      };
    }

    case 'lambda': {
      return {
        runtime: (prop.Runtime as string) || 'python3.11',
        memory: (prop.MemorySize as number) || 128,
        timeout: (prop.Timeout as number) || 30,
      };
    }

    case 'ecs': {
      const containerDefs = prop.ContainerDefinitions as Array<{ Image: string }>;
      return {
        launchType: (prop.LaunchType as string) || 'ec2',
        containerImage: containerDefs?.[0]?.Image || '',
        cpuUnits: (prop.Cpu as number) || 256,
        memory: (prop.Memory as number) || 512,
      };
    }

    case 'eks': {
      return {
        clusterName: (prop.Name as string) || label,
        kubernetesVersion: (prop.Version as string) || '1.27',
        nodeCount: 3,
      };
    }

    case 'fargate': {
      const containerDefs = prop.ContainerDefinitions as Array<{ Image: string }>;
      return {
        cpuUnits: (prop.Cpu as number) || 256,
        memory: (prop.Memory as number) || 512,
        containerImage: containerDefs?.[0]?.Image || '',
      };
    }

    case 'elasticbeanstalk': {
      const osSettings = prop.OptionSettings as Array<{
        OptionName: string;
        Value: string;
      }>;
      return {
        platform: inferPlatformFromDetails(prop),
        environmentName: (prop.EnvironmentName as string) || label,
        instanceType:
          osSettings?.find((o) => o.OptionName === 'InstanceType')?.Value || 't3.micro',
      };
    }

    case 'autoscaling': {
      return {
        minSize: (prop.MinSize as number) || 1,
        maxSize: (prop.MaxSize as number) || 5,
        desiredCapacity: (prop.DesiredCapacity as number) || 2,
        scalingPolicy: 'target-tracking',
      };
    }

    // ========== DATABASE ==========
    case 'rds': {
      return {
        engine: (prop.Engine as string) || 'postgresql',
        instanceClass: (prop.DBInstanceClass as string) || 'db.t3.micro',
        allocatedStorage: (prop.AllocatedStorage as number) || 20,
        multiAZ: (prop.MultiAZ as boolean) ?? false,
      };
    }

    case 'dynamodb': {
      const billingMode =
        (prop.BillingModeSummary as Record<string, string>)?.BillingMode || 'payPerRequest';
      const provisioned = prop.ProvisionedThroughput as Record<string, number>;
      return {
        billingMode,
        readCapacity: provisioned?.ReadCapacityUnits || 5,
        writeCapacity: provisioned?.WriteCapacityUnits || 5,
        ttlEnabled: (prop.TTLDescription as Record<string, boolean>)?.Enabled ?? false,
      };
    }

    case 'elasticache': {
      return {
        cacheEngine: (prop.Engine as string) || 'redis',
        nodeType: (prop.CacheNodeType as string) || 'cache.t3.micro',
        numCacheNodes: (prop.NumCacheNodes as number) || 1,
      };
    }

    case 'aurora': {
      return {
        engine: (prop.Engine as string) || 'aurora-postgresql',
        instanceClass: (prop.DBInstanceClass as string) || 'db.t3.small',
        allocatedStorage: 10,
        multiAZ: (prop.MultiAZ as boolean) ?? true,
      };
    }

    case 'redshift': {
      return {
        clusterIdentifier: (prop.ClusterIdentifier as string) || label,
        nodeType: (prop.NodeType as string) || 'dc2.large',
        numberOfNodes: (prop.NumberOfNodes as number) || 1,
        databaseName: (prop.DBName as string) || 'dev',
      };
    }

    // ========== STORAGE ==========
    case 's3': {
      const versioning = prop.VersioningConfiguration as Record<string, string>;
      return {
        bucketName: getTagValue('Name') || label,
        region: 'us-east-1',
        versioning: versioning?.Status === 'Enabled',
      };
    }

    case 'ebs': {
      return {
        volumeType: (prop.VolumeType as string) || 'gp3',
        size: (prop.Size as number) || 100,
        iops: (prop.Iops as number) || 3000,
        encrypted: (prop.Encrypted as boolean) ?? false,
      };
    }

    case 'efs': {
      return {
        filesystemName: getTagValue('Name') || label,
        performanceMode: (prop.PerformanceMode as string) || 'generalPurpose',
        throughputMode: (prop.ThroughputMode as string) || 'bursting',
        encrypted: (prop.Encrypted as boolean) ?? true,
      };
    }

    case 'glacier': {
      return {
        vaultName: (prop.VaultName as string) || label,
        archiveCount: 0,
        totalSize: 0,
      };
    }

    // ========== ANALYTICS & MESSAGING ==========
    case 'kinesis': {
      const shards = prop.Shards as Array<unknown>;
      return {
        streamName: (prop.StreamName as string) || label,
        shardCount: shards?.length || 1,
        retentionPeriod: (prop.RetentionPeriod as number) || 24,
      };
    }

    case 'kinesis-streams': {
      const shards = prop.Shards as Array<unknown>;
      return {
        streamName: (prop.StreamName as string) || label,
        shardCount: shards?.length || 1,
        retentionPeriod: (prop.RetentionPeriod as number) || 24,
      };
    }

    case 'kinesis-firehose': {
      return {
        deliveryStreamName: (prop.DeliveryStreamName as string) || label,
        deliveryStreamStatus: (prop.DeliveryStreamStatus as string) || 'ACTIVE',
        s3DestinationDescription: !!prop.S3DestinationDescription,
      };
    }

    case 'sqs': {
      return {
        queueName: extractQueueName((prop.QueueArn as string) || ''),
        delaySeconds: (prop.Attributes as Record<string, number>)?.DelaySeconds || 0,
        visibilityTimeout:
          (prop.Attributes as Record<string, number>)?.VisibilityTimeout || 30,
        fifoQueue: ((prop.QueueArn as string) || '').includes('.fifo') ?? false,
      };
    }

    case 'sns': {
      return {
        topicName: extractTopicName((prop.TopicArn as string) || ''),
        subscriptionCount: Array.isArray(prop.Subscriptions)
          ? (prop.Subscriptions as unknown[]).length
          : 0,
      };
    }

    case 'cloudwatch': {
      return {
        logGroupName: (prop.LogGroupName as string) || label,
        retentionDays: (prop.RetentionInDays as number) || 30,
      };
    }

    case 'eventbridge': {
      return {
        ruleName: (prop.Name as string) || label,
        eventBusName: (prop.EventBusName as string) || 'default',
        state: (prop.State as string) || 'ENABLED',
      };
    }

    // ========== SECURITY & MANAGEMENT ==========
    case 'iam':
    case 'iamrole': {
      return {
        roleName: (prop.RoleName as string) || label,
        assumeRolePolicy: !!prop.AssumeRolePolicyDocument,
        maxSessionDuration: (prop.MaxSessionDuration as number) || 3600,
      };
    }

    case 'secretsmanager': {
      return {
        secretName: (prop.Name as string) || label,
        secretType: (prop.SecretType as string) || 'SecureString',
        rotationEnabled: !!prop.RotationRules,
      };
    }

    case 'ssmparameterstore': {
      return {
        parameterName: (prop.Name as string) || label,
        parameterType: (prop.Type as string) || 'String',
        tier: (prop.Tier as string) || 'Standard',
      };
    }

    case 'waf': {
      return {
        wafName: getTagValue('Name') || label,
        wafScope: (prop.Scope as string) || 'CLOUDFRONT',
        ruleGroupCount: Array.isArray(prop.Rules)
          ? (prop.Rules as unknown[]).length
          : 0,
      };
    }

    case 'shield': {
      return {
        shieldLevel:
          (prop.SubscriptionState as string) === 'Active' ? 'Advanced' : 'Standard',
        protectionCount: 0,
      };
    }

    case 'cognito': {
      return {
        userPoolName: (prop.Name as string) || label,
        userCount: (prop.EstimatedUserCount as number) || 0,
      };
    }

    // ========== NETWORKING - API & CDN ==========
    case 'apigateway': {
      return {
        apiName: (prop.Name as string) || getTagValue('Name') || label,
        apiType: prop.ApiKeySelectionExpression ? 'REST' : 'HTTP',
        protocol: (prop.Protocol as string) || 'HTTP',
      };
    }

    case 'cloudfront': {
      return {
        distributionId: (prop.DistributionId as string) || label,
        domainName: (prop.DomainName as string) || '',
        status: (prop.Status as string) || 'InProgress',
      };
    }

    case 'route53': {
      return {
        hostedZoneName: (prop.Name as string) || label,
        zoneId: (prop.Id as string) || '',
        recordCount: (prop.ResourceRecordSetCount as number) || 0,
      };
    }

    case 'vpcpeering': {
      const status = prop.Status as Record<string, string>;
      return {
        peeringConnectionId: (prop.VpcPeeringConnectionId as string) || label,
        status: status?.Code || 'pending-acceptance',
      };
    }

    case 'transitgateway': {
      return {
        transitGatewayId: (prop.TransitGatewayId as string) || label,
        state: (prop.State as string) || 'available',
        attachmentCount: 0,
      };
    }

    // ========== ADDITIONAL NETWORKING - NOT IN SIDEBAR BUT CREATED BY IMPORT ==========
    case 'routetable': {
      const routes = Array.isArray(prop.Routes) ? (prop.Routes as unknown[]).length : 0;
      return {
        routeTableName: getTagValue('Name') || (prop.RouteTableId as string) || label,
        routeTableId: (prop.RouteTableId as string) || (prop.id as string) || '',
        vpcId: (prop.VpcId as string) || '',
        routeCount: routes,
      };
    }

    case 'targetgroup': {
      const targets = Array.isArray(prop.TargetHealth) ? (prop.TargetHealth as unknown[]).length : 0;
      return {
        targetGroupName:
          (prop.TargetGroupName as string) || getTagValue('Name') || label,
        targetGroupArn: (prop.TargetGroupArn as string) || '',
        protocol: (prop.Protocol as string) || 'HTTP',
        port: (prop.Port as number) || 80,
        healthyTargets: targets,
      };
    }

    case 'vpcendpoint': {
      return {
        vpcEndpointId: (prop.VpcEndpointId as string) || label,
        serviceName: (prop.ServiceName as string) || '',
        vpcEndpointType: (prop.VpcEndpointType as string) || 'Gateway',
        state: (prop.State as string) || 'available',
      };
    }

    case 'availabilityzone': {
      return {
        zoneName: (prop.ZoneName as string) || label,
        zoneState: (prop.State as string) || 'available',
        regionName: (prop.RegionName as string) || '',
      };
    }

    // ========== OTHER ==========
    case 'cloudformation': {
      return {
        stackName: (prop.StackName as string) || label,
        stackStatus: (prop.StackStatus as string) || 'CREATE_COMPLETE',
      };
    }

    case 'awscdk': {
      return {
        appName: label,
        stackCount: 1,
      };
    }

    case 'awsorganizations': {
      const arnParts = ((prop.Arn as string) || '').split('/');
      return {
        organizationId: arnParts[1] || '',
        masterAccountId: (prop.MasterAccountId as string) || '',
        accountCount: 0,
      };
    }

    case 'awsbackup': {
      return {
        backupVaultName: (prop.BackupVaultName as string) || label,
        recoveryPoints: (prop.NumberOfRecoveryPoints as number) || 0,
      };
    }

    case 'awsconfig': {
      return {
        configStatus: 'Recording',
        complianceStatus: 'COMPLIANT',
      };
    }

    case 'cloudtrail': {
      return {
        trailName: (prop.Name as string) || label,
        s3BucketName: (prop.S3BucketName as string) || '',
        isMultiRegion: (prop.IsMultiRegionTrail as boolean) ?? true,
      };
    }

    // ========== CATCH ALL ==========
    default: {
      return {
        resourceName: getTagValue('Name') || label,
        resourceId:
          (prop.id as string) ||
          (prop.Id as string) ||
          (prop.Arn as string) ||
          '',
      };
    }
  }
}

/**
 * Infers OS type from EC2 image ID
 */
function inferOSFromImageId(imageId: string | undefined): string | undefined {
  if (!imageId) return undefined;
  if (imageId.includes('ami-')) {
    if (imageId.includes('amzn')) return 'amazon-linux';
    if (imageId.includes('rhel')) return 'rhel';
    if (imageId.includes('ubuntu')) return 'ubuntu';
    if (imageId.includes('windows')) return 'windows';
  }
  return undefined;
}

/**
 * Infers platform from Elastic Beanstalk properties
 */
function inferPlatformFromDetails(prop: Record<string, unknown>): string {
  const platformString = ((prop.PlatformArn as string) || (prop.Description as string) || '').toString();
  if (platformString.includes('Node')) return 'node.js';
  if (platformString.includes('Python')) return 'python';
  if (platformString.includes('Java')) return 'java';
  if (platformString.includes('PHP')) return 'php';
  if (platformString.includes('.NET') || platformString.includes('dotnet'))
    return 'dotnet';
  if (platformString.includes('Ruby')) return 'ruby';
  return 'node.js'; // Default
}

/**
 * Extracts queue name from ARN
 * Example: arn:aws:sqs:us-east-1:123456789012:my-queue
 */
function extractQueueName(arn: string): string {
  const parts = arn.split(':');
  return parts[parts.length - 1] || '';
}

/**
 * Extracts topic name from ARN
 * Example: arn:aws:sns:us-east-1:123456789012:my-topic
 */
function extractTopicName(arn: string): string {
  const parts = arn.split(':');
  return parts[parts.length - 1] || '';
}
