/**
 * Parser to convert DB JSON format to AWS region format for diagram visualization
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DBJsonResource {
  region: string;
  cloud_resource_id: string;
  resource_name: string;
  resource_type: string;
  resource_category: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resource_property: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DBJsonInput {
  region: string;
  total_resources: number;
  resources: DBJsonResource[];
}

/**
 * Convert DB JSON format to AWSDataInput format (region-based structure)
 * Transforms flat resource list into hierarchical region structure
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertDBJsonToAWSFormat = (dbJson: DBJsonInput): Record<string, any> => {
  const regionKey = dbJson.region || 'us-east-1';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regionData: Record<string, any> = {
    vpcs: [],
    subnets: [],
    instances: [],
    security_groups: [],
    internet_gateways: [],
    nat_gateways: [],
    route_tables: [],
    rds_instances: [],
    s3_buckets: [],
    load_balancers: [],
    target_groups: [],
    alb_listeners: [],
    db_subnet_groups: [],
    rds_backup_jobs: [],
    iam_roles: [],
  };

  // Map to track relationships
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vpcMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subnetMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sgMap = new Map<string, any>();

  // Process each resource
  dbJson.resources.forEach((resource: DBJsonResource) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (resource.resource_property || resource) as any;

    switch (resource.resource_type) {
      case 'VPC': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const vpc: any = {
          VpcId: props.VpcId || props.id || resource.cloud_resource_id,
          CidrBlock: props.CidrBlock,
          State: props.State || 'available',
          IsDefault: props.IsDefault || false,
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        vpcMap.set(vpc.VpcId, vpc);
        regionData.vpcs.push(vpc);
        break;
      }

      case 'SUBNET': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subnet: any = {
          SubnetId: props.SubnetId || props.id || resource.cloud_resource_id,
          VpcId: props.VpcId,
          CidrBlock: props.CidrBlock,
          AvailabilityZone: props.AvailabilityZone || 'us-east-1a',
          MapPublicIpOnLaunch: props.MapPublicIpOnLaunch || false,
          Type: props.MapPublicIpOnLaunch ? 'public' : 'private',
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        subnetMap.set(subnet.SubnetId, subnet);
        regionData.subnets.push(subnet);
        break;
      }

      case 'EC2': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance: any = {
          InstanceId: props.InstanceId || props.id || resource.cloud_resource_id,
          InstanceType: props.InstanceType || 't3.medium',
          ImageId: props.ImageId || 'ami-0c55b159cbfafe1f0',
          SubnetId: props.SubnetId || props.NetworkInterfaces?.[0]?.SubnetId,
          VpcId: props.VpcId,
          PrivateIpAddress: props.PrivateIpAddress || props.NetworkInterfaces?.[0]?.PrivateIpAddress,
          PublicIpAddress: props.PublicIpAddress || props.NetworkInterfaces?.[0]?.Association?.PublicIp,
          SecurityGroups: props.SecurityGroupIds?.map((id: string) => ({ GroupId: id })) || props.SecurityGroups || [],
          State: props.State?.Name || props.State || 'running',
          // Connection fields for diagram edges
          RelatedRDSInstances: props.RelatedRDSInstances || [],
          InternetGatewayId: props.InternetGatewayId || props.ConnectedIGW,
          NatGatewayId: props.NatGatewayId || props.ConnectedNAT,
          RouteTableId: props.RouteTableId,
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.instances.push(instance);
        console.log('Parsed EC2 instance:', instance);
        break;
      }

      case 'SECURITY_GROUP': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sg: any = {
          GroupId: props.GroupId || props.id || resource.cloud_resource_id,
          GroupName: props.GroupName || resource.resource_name,
          Description: props.Description || props.GroupDescription || 'Security Group',
          VpcId: props.VpcId,
          IpPermissions: props.IpPermissions || props.InboundRules || [],
          IpPermissionsEgress: props.IpPermissionsEgress || props.OutboundRules || [],
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        sgMap.set(sg.GroupId, sg);
        regionData.security_groups.push(sg);
        break;
      }

      case 'INTERNET_GATEWAY': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const igw: any = {
          InternetGatewayId: props.InternetGatewayId || props.id || resource.cloud_resource_id,
          Attachments: props.Attachments || [{ VpcId: props.VpcId, State: 'available' }],
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.internet_gateways.push(igw);
        console.log('Parsed Internet Gateway:', igw);
        break;
      }

      case 'NAT_GATEWAY': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nat: any = {
          NatGatewayId: props.NatGatewayId || props.id || resource.cloud_resource_id,
          SubnetId: props.SubnetId,
          State: props.State || 'available',
          PublicIp: props.PublicIp,
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.nat_gateways.push(nat);
        console.log('Parsed NAT Gateway:', nat);
        break;
      }

      case 'RDS': {
        // Handle DBSubnetGroup nested structure
        const subnets = props.DBSubnetGroup?.Subnets || [];
        const subnetId = subnets.length > 0 
          ? subnets[0].SubnetIdentifier || subnets[0].SubnetId
          : props.SubnetId;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rds: any = {
          DBInstanceIdentifier: props.DBInstanceIdentifier || props.id || resource.cloud_resource_id,
          db_instance_name: props.DBInstanceIdentifier || props.id || resource.cloud_resource_id, // Legacy name
          DBInstanceClass: props.DBInstanceClass || 'db.t3.micro',
          db_instance_class: props.DBInstanceClass?.toLowerCase() || 'db.t3.micro', // Lowercase for parser
          Engine: props.Engine || 'mysql',
          engine: props.Engine?.toLowerCase() || 'mysql', // Lowercase for parser
          EngineVersion: props.EngineVersion || '8.0',
          engine_version: props.EngineVersion || '8.0', // Snake_case for parser
          DBName: props.DBName,
          Port: props.Port || 3306,
          port: props.Port || 3306, // Lowercase for parser
          SubnetId: subnetId,
          subnet_id: subnetId, // Legacy name for compatibility
          VpcId: props.VpcId,
          VpcSecurityGroups: props.VpcSecurityGroups || props.SecurityGroupIds?.map((id: string) => ({ VpcSecurityGroupId: id })) || [],
          DBInstanceStatus: props.DBInstanceStatus || 'available',
          AllocatedStorage: props.AllocatedStorage || 20,
          allocated_storage: props.AllocatedStorage || 20, // Snake_case for parser
          multi_az: props.MultiAZ || false, // Snake_case for parser
          // Connection fields for diagram edges
          ConnectedEC2Instances: props.ConnectedEC2Instances || [],
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.rds_instances.push(rds);
        console.log('Parsed RDS instance:', rds);
        break;
      }

      case 'S3': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s3: any = {
          Name: props.Name || props.BucketName || props.id || resource.cloud_resource_id,
          CreationDate: props.CreationDate,
          Region: props.Region || regionKey,
          Encryption: props.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || 'AES256',
          Versioning: props.VersioningConfiguration?.Status || 'Disabled',
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.s3_buckets.push(s3);
        break;
      }

      case 'LOAD_BALANCER': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lb: any = {
          LoadBalancerName: props.LoadBalancerName || props.id || resource.cloud_resource_id,
          LoadBalancerArn: props.LoadBalancerArn,
          Type: props.Type || props.LoadBalancerType || 'application',
          Scheme: props.Scheme || 'internet-facing',
          Subnets: props.Subnets || props.SubnetIds || [],
          SecurityGroups: props.SecurityGroups || props.SecurityGroupIds || [],
          State: props.State || { Code: 'active' },
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.load_balancers.push(lb);
        break;
      }

      case 'IAM_ROLE': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const role: any = {
          RoleName: props.RoleName || props.id || resource.cloud_resource_id,
          AssumeRolePolicyDocument: props.AssumeRolePolicyDocument,
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.iam_roles.push(role);
        break;
      }

      case 'TARGET_GROUP': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tg: any = {
          TargetGroupName: props.TargetGroupName || props.id || resource.cloud_resource_id,
          TargetGroupArn: props.TargetGroupArn,
          Protocol: props.Protocol || 'HTTP',
          Port: props.Port || 80,
          VpcId: props.VpcId,
          TargetType: props.TargetType || 'instance',
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.target_groups.push(tg);
        break;
      }

      case 'ALB_LISTENER': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const listener: any = {
          ListenerArn: props.ListenerArn || props.id || resource.cloud_resource_id,
          LoadBalancerArn: props.LoadBalancerArn,
          Protocol: props.Protocol || 'HTTP',
          Port: props.Port || 80,
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.alb_listeners.push(listener);
        break;
      }

      case 'DB_SUBNET_GROUP': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbsg: any = {
          DBSubnetGroupName: props.DBSubnetGroupName || props.id || resource.cloud_resource_id,
          DBSubnetGroupDescription: props.DBSubnetGroupDescription || 'DB Subnet Group',
          VpcId: props.VpcId,
          Subnets: props.Subnets || props.SubnetIds || [],
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.db_subnet_groups.push(dbsg);
        break;
      }

      case 'RDS_BACKUP_JOB': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const backup: any = {
          BackupId: props.BackupId || props.id || resource.cloud_resource_id,
          DBInstanceIdentifier: props.DBInstanceIdentifier,
          BackupType: props.BackupType || 'MANUAL',
          SnapshotCreateTime: props.SnapshotCreateTime,
          Tags: props.Tags || [{ Key: 'Name', Value: resource.resource_name }],
        };
        regionData.rds_backup_jobs.push(backup);
        break;
      }

      default:
        // Handle any other resource types gracefully
        console.warn(`Unsupported resource type: ${resource.resource_type}`);
    }
  });

  console.log('Parsed DB JSON resources:', {
    vpcs: regionData.vpcs.length,
    subnets: regionData.subnets.length,
    instances: regionData.instances.length,
    security_groups: regionData.security_groups.length,
    internet_gateways: regionData.internet_gateways.length,
    nat_gateways: regionData.nat_gateways.length,
    rds_instances: regionData.rds_instances.length,
    s3_buckets: regionData.s3_buckets.length,
    load_balancers: regionData.load_balancers.length,
    iam_roles: regionData.iam_roles.length,
  });

  return {
    [regionKey]: regionData,
  };
};

/**
 * Get AWS format data from DB JSON input
 * Handles multiple formats:
 * - Array of wrapped objects (multiple regions): [{region, total_resources, resources: [...]}, ...]
 * - Single wrapped object: {region, total_resources, resources: [...]}
 * - Flat array: [resource, resource, ...]
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAWSDataFromDBJson = (input: any) => {
  // Handle array of wrapped objects (multiple regions)
  if (Array.isArray(input) && input.length > 0) {
    // Check if array contains wrapped objects (each with region and resources)
    if (input[0]?.region && input[0]?.resources && Array.isArray(input[0].resources)) {
      // Multi-region format: [{region, resources}, {region, resources}, ...]
      const result: Record<string, any> = {};
      
      input.forEach((regionData: any) => {
        const converted = convertDBJsonToAWSFormat(regionData as DBJsonInput);
        // Merge all regions into one result object
        Object.assign(result, converted);
      });
      
      return result;
    }
    
    // Check if it's a flat array of resources (each has resource_type)
    if (input[0]?.resource_type && (input[0]?.resource_property || input[0]?.id)) {
      // Flat array format: [resource, resource, ...]
      // Auto-wrap with region information
      const region = input[0]?.region || 'us-east-1';
      const wrappedFormat: DBJsonInput = {
        region,
        total_resources: input.length,
        resources: input,
      };
      return convertDBJsonToAWSFormat(wrappedFormat);
    }
  }
  
  // Handle single wrapped object: {region, total_resources, resources: [...]}
  if (input && typeof input === 'object' && !Array.isArray(input) && input.resources) {
    return convertDBJsonToAWSFormat(input as DBJsonInput);
  }
  
  // Fallback: assume it's already wrapped format
  return convertDBJsonToAWSFormat(input as DBJsonInput);
};
