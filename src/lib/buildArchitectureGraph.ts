/**
 * Build Architecture Graph from AWS Flat Array Format
 * Ported from aws-graph-visualizer with full feature parity
 */

import type { Edge, Node } from "reactflow";
import { cloudResources } from "@/data/resources";

export type ArchitectureDataset = {
  region?: string;
  architecture_name?: string;
  vpc?: ArchitectureVpc;
};

export type ArchitectureVpc = {
  vpc_id: string;
  cidr?: string;
  name?: string;
  internet?: { type?: string; label?: string };
  internet_gateway?: { id: string; type?: string; label?: string };
  subnets?: {
    public?: ArchitectureSubnet;
    private?: ArchitectureSubnet;
  };
  storage?: Array<{ id: string; type?: string; name?: string; access?: string }>;
  vpc_endpoints?: Array<{ id: string; type?: string; service?: string; note?: string }>;
  traffic_flows?: Array<{ from: string; to: string; protocol?: string }>;
};

export type ArchitectureSubnet = {
  subnet_id: string;
  cidr?: string;
  name?: string;
  route_table?: {
    id: string;
    routes?: Array<{ destination: string; target: string }>;
  };
  resources?: Array<Record<string, any>>;
};

type FlatRegionDataset = {
  region?: string;
  resources?: Array<any>;
};

type FlatArrayInput = FlatRegionDataset[];

function tagValue(tags: any[] | undefined, key: string): string | undefined {
  if (!Array.isArray(tags)) return undefined;
  const hit = tags.find((t) => t?.Key === key);
  return typeof hit?.Value === "string" ? hit.Value : undefined;
}

function normalizeId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function inferSubnetKindFromFlat(subnet: any): "public" | "private" | undefined {
  const tags = subnet?.resource_property?.Tags;
  const typeFromTag = normalizeId(tagValue(tags, "Type"));
  if (typeFromTag === "public" || typeFromTag === "private") return typeFromTag;

  const mapPublic = subnet?.resource_property?.MapPublicIpOnLaunch;
  if (typeof mapPublic === "boolean") return mapPublic ? "public" : "private";

  const name = (normalizeId(subnet?.resource_name) ?? "").toLowerCase();
  if (name.includes("public")) return "public";
  if (name.includes("private")) return "private";

  return undefined;
}

function bestIdFromFlatResource(r: any): string | undefined {
  const p = r?.resource_property ?? {};
  return (
    normalizeId(p.id) ||
    normalizeId(p.VpcId) ||
    normalizeId(p.SubnetId) ||
    normalizeId(p.RouteTableId) ||
    normalizeId(p.InternetGatewayId) ||
    normalizeId(p.NatGatewayId) ||
    normalizeId(p.InstanceId) ||
    normalizeId(p.DBInstanceIdentifier) ||
    normalizeId(p.BucketId) ||
    normalizeId(p.VpcEndpointId) ||
    normalizeId(r?.cloud_resource_id)
  );
}

function normalizeEndpointService(serviceName: unknown): string | undefined {
  if (typeof serviceName !== "string") return undefined;
  const lower = serviceName.toLowerCase();
  if (lower.endsWith(".s3") || lower.includes(".s3")) return "S3";
  if (lower.includes("execute-api") || lower.includes("apigateway") || lower.includes("api gateway"))
    return "API Gateway";

  const parts = serviceName.split(".");
  const last = parts[parts.length - 1];
  return last ? last : serviceName;
}

function isVpcEndpointFlatResource(r: any): boolean {
  const p = r?.resource_property;
  return Boolean(p && typeof p === "object" && (p.VpcEndpointId || p.ServiceName));
}

function routeTableToSchemaFromFlat(rt: any) {
  const p = rt?.resource_property ?? {};
  const routes = Array.isArray(p.Routes) ? p.Routes : [];

  const schemaRoutes: Array<{ destination: string; target: string }> = [];
  for (const r of routes) {
    const destination =
      normalizeId(r?.destination_cidr) ||
      normalizeId(r?.DestinationCidrBlock) ||
      normalizeId(r?.destination);
    const targetType =
      normalizeId(r?.target_type) ||
      normalizeId(r?.GatewayId) ||
      normalizeId(r?.target);
    if (!destination || !targetType) continue;

    const tt = String(targetType).toLowerCase();
    let target = targetType;
    if (tt.includes("internet_gateway") || tt.startsWith("igw") || tt === "gateway")
      target = "internet_gateway";
    if (tt.includes("nat_gateway") || tt.startsWith("nat")) target = "nat_gateway";

    schemaRoutes.push({ destination, target });
  }

  return {
    id: normalizeId(p.RouteTableId) || normalizeId(p.id) || bestIdFromFlatResource(rt) || "route-table",
    routes: schemaRoutes,
  };
}

function pickRouteTablesForVpcFromFlat(routeTables: any[]) {
  const publicCandidates: any[] = [];
  const privateCandidates: any[] = [];

  for (const rt of routeTables) {
    const p = rt?.resource_property ?? {};
    const routes = Array.isArray(p.Routes) ? p.Routes : [];

    const hasIgw = routes.some((r: any) => {
      const tt = String(r?.target_type ?? r?.GatewayId ?? "").toLowerCase();
      const tid = String(r?.target_id ?? "").toLowerCase();
      return tt.includes("internet_gateway") || tid.startsWith("igw");
    });

    const hasNat = routes.some((r: any) => {
      const tt = String(r?.target_type ?? "").toLowerCase();
      const tid = String(r?.target_id ?? "").toLowerCase();
      return tt.includes("nat_gateway") || tid.startsWith("nat");
    });

    if (hasIgw) publicCandidates.push(rt);
    if (hasNat) privateCandidates.push(rt);
  }

  return {
    publicRt: publicCandidates[0],
    privateRt: privateCandidates[0],
  };
}

function buildArchitectureFromFlatVpc(
  region: string,
  allResources: any[],
  vpcResource: any
): ArchitectureDataset | undefined {
  const vpcId =
    normalizeId(vpcResource?.resource_property?.VpcId) || bestIdFromFlatResource(vpcResource);
  if (!vpcId) return undefined;

  const vpcTags = vpcResource?.resource_property?.Tags;
  const vpcName = tagValue(vpcTags, "Name") || vpcResource?.resource_name || vpcId;
  const vpcCidr = normalizeId(vpcResource?.resource_property?.CidrBlock);

  const inVpc = (r: any) => normalizeId(r?.resource_property?.VpcId) === vpcId;

  const subnets = allResources.filter((r) => r?.resource_type === "SUBNET" && inVpc(r));
  const publicSubnetRes = subnets.find((s) => inferSubnetKindFromFlat(s) === "public");
  const privateSubnetRes = subnets.find((s) => inferSubnetKindFromFlat(s) === "private");

  const publicSubnetId =
    normalizeId(publicSubnetRes?.resource_property?.SubnetId) || bestIdFromFlatResource(publicSubnetRes);
  const privateSubnetId =
    normalizeId(privateSubnetRes?.resource_property?.SubnetId) || bestIdFromFlatResource(privateSubnetRes);

  const igwRes = allResources.find((r) => {
    if (r?.resource_type !== "INTERNET_GATEWAY") return false;
    const p = r?.resource_property ?? {};
    const attachments = Array.isArray(p.Attachments) ? p.Attachments : [];
    return attachments.some((a: any) => normalizeId(a?.VpcId) === vpcId) || normalizeId(p.VpcId) === vpcId;
  });

  const igwId =
    normalizeId(igwRes?.resource_property?.InternetGatewayId) ||
    normalizeId(igwRes?.resource_property?.id) ||
    bestIdFromFlatResource(igwRes) ||
    "internet_gateway";

  const igwLabel =
    tagValue(igwRes?.resource_property?.Tags, "Name") || igwRes?.resource_name || "Internet Gateway";

  const routeTables = allResources.filter((r) => r?.resource_type === "ROUTE_TABLE" && inVpc(r));
  const { publicRt, privateRt } = pickRouteTablesForVpcFromFlat(routeTables);

  const natRes = allResources.find((r) => r?.resource_type === "NAT_GATEWAY" && inVpc(r));
  const natId =
    normalizeId(natRes?.resource_property?.NatGatewayId) ||
    normalizeId(natRes?.resource_property?.id) ||
    bestIdFromFlatResource(natRes);

  const lbs = allResources.filter((r) => r?.resource_type === "LOAD_BALANCER" && inVpc(r));
  const albRes =
    lbs.find((r) => {
      const scheme = String(r?.resource_property?.Scheme ?? "").toLowerCase();
      return scheme.includes("internet");
    }) || lbs[0];
  const albId = bestIdFromFlatResource(albRes);

  const tgRes = allResources.find((r) => r?.resource_type === "TARGET_GROUP" && inVpc(r));
  const tgId = bestIdFromFlatResource(tgRes);

  const ec2Res = allResources.find((r) => r?.resource_type === "EC2" && inVpc(r));
  const ec2Id = bestIdFromFlatResource(ec2Res);

  const rdsResources = allResources.filter((r) => r?.resource_type === "RDS" && inVpc(r));

  const endpointResources = allResources.filter(
    (r) => isVpcEndpointFlatResource(r) && inVpc(r)
  );
  const vpcEndpoints = endpointResources
    .map((r) => {
      const p = r?.resource_property ?? {};
      const id = normalizeId(p.VpcEndpointId) || normalizeId(p.id) || bestIdFromFlatResource(r);
      if (!id) return undefined;
      const endpointType = String(p.VpcEndpointType ?? "").toLowerCase();
      const type =
        endpointType === "gateway"
          ? "GATEWAY_ENDPOINT"
          : endpointType
            ? "INTERFACE_ENDPOINT"
            : "VPC_ENDPOINT";
      const service = normalizeEndpointService(p.ServiceName);
      const note = normalizeId(p.name) || undefined;
      return { id, type, service, note };
    })
    .filter(Boolean) as Array<{
    id: string;
    type?: string;
    service?: string;
    note?: string;
  }>;

  const hasS3Endpoint = vpcEndpoints.some(
    (e) => String(e.service ?? "").toLowerCase() === "s3"
  );
  const s3Buckets = allResources.filter((r) => r?.resource_type === "S3");

  const storage = s3Buckets
    .map((b) => {
      const id =
        normalizeId(b?.resource_property?.BucketId) ||
        normalizeId(b?.resource_property?.id) ||
        bestIdFromFlatResource(b);
      if (!id) return undefined;
      return {
        id,
        type: "S3",
        name: b?.resource_name || b?.resource_property?.name || id,
        access: hasS3Endpoint ? "via-vpc-endpoint" : undefined,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    type?: string;
    name?: string;
    access?: string;
  }>;

  const publicSubnetResources: Array<Record<string, any>> = [];
  const privateSubnetResources: Array<Record<string, any>> = [];

  const pushResource = (arr: Array<Record<string, any>>, r: any, typeOverride?: string) => {
    const id = bestIdFromFlatResource(r);
    if (!id) return;
    const type = typeOverride || normalizeId(r?.resource_type) || "RESOURCE";
    const name = r?.resource_name || tagValue(r?.resource_property?.Tags, "Name") || id;

    if (type === "RDS") {
      const engine = normalizeId(r?.resource_property?.Engine);
      arr.push({ id, type, name, ...(engine ? { engine } : null) });
      return;
    }
    arr.push({ id, type, name });
  };

  if (natRes) pushResource(publicSubnetResources, natRes, "NAT_GATEWAY");
  if (albRes) pushResource(publicSubnetResources, albRes, "LOAD_BALANCER");
  if (tgRes) pushResource(publicSubnetResources, tgRes, "TARGET_GROUP");

  if (ec2Res) {
    const sn = normalizeId(ec2Res?.resource_property?.SubnetId);
    if (sn && sn === privateSubnetId) pushResource(privateSubnetResources, ec2Res, "EC2");
    else pushResource(publicSubnetResources, ec2Res, "EC2");
  }

  for (const rds of rdsResources) pushResource(privateSubnetResources, rds, "RDS");

  const publicSubnetSchema = publicSubnetId
    ? {
        subnet_id: publicSubnetId,
        cidr: normalizeId(publicSubnetRes?.resource_property?.CidrBlock),
        name:
          tagValue(publicSubnetRes?.resource_property?.Tags, "Name") ||
          publicSubnetRes?.resource_name ||
          "Public Subnet",
        ...(publicRt ? { route_table: routeTableToSchemaFromFlat(publicRt) } : null),
        resources: publicSubnetResources,
      }
    : undefined;

  const privateSubnetSchema = privateSubnetId
    ? {
        subnet_id: privateSubnetId,
        cidr: normalizeId(privateSubnetRes?.resource_property?.CidrBlock),
        name:
          tagValue(privateSubnetRes?.resource_property?.Tags, "Name") ||
          privateSubnetRes?.resource_name ||
          "Private Subnet",
        ...(privateRt ? { route_table: routeTableToSchemaFromFlat(privateRt) } : null),
        resources: privateSubnetResources,
      }
    : undefined;

  const traffic_flows: Array<{ from: string; to: string; protocol?: string }> = [];
  traffic_flows.push({ from: "Internet", to: "internet_gateway", protocol: "HTTP/HTTPS" });
  if (albId) traffic_flows.push({ from: "internet_gateway", to: albId });
  if (albId && tgId) traffic_flows.push({ from: albId, to: tgId });
  if (tgId && ec2Id) traffic_flows.push({ from: tgId, to: ec2Id });
  if (albId && ec2Id && !tgId) traffic_flows.push({ from: albId, to: ec2Id });
  if (ec2Id) {
    for (const rds of rdsResources) {
      const rid = bestIdFromFlatResource(rds);
      if (rid) traffic_flows.push({ from: ec2Id, to: rid });
    }
  }
  if (natId) {
    traffic_flows.push({ from: "private_subnet", to: natId });
    traffic_flows.push({ from: natId, to: "internet_gateway" });
  }
  const s3Ep = vpcEndpoints.find((e) => String(e.service ?? "").toLowerCase() === "s3");
  if (s3Ep?.id) traffic_flows.push({ from: "private_subnet", to: s3Ep.id });

  return {
    region,
    architecture_name: `Converted from flat-array (${vpcName})`,
    vpc: {
      vpc_id: vpcId,
      cidr: vpcCidr,
      name: vpcName,
      internet: { type: "INTERNET", label: "Internet" },
      internet_gateway: { id: igwId, type: "INTERNET_GATEWAY", label: igwLabel },
      subnets: {
        ...(publicSubnetSchema ? { public: publicSubnetSchema } : null),
        ...(privateSubnetSchema ? { private: privateSubnetSchema } : null),
      },
      ...(storage.length ? { storage } : null),
      ...(vpcEndpoints.length ? { vpc_endpoints: vpcEndpoints } : null),
      ...(traffic_flows.length ? { traffic_flows } : null),
    },
  };
}

export function convertFlatArrayToArchitectureDatasets(input: unknown): ArchitectureDataset[] {
  const flat = Array.isArray(input) ? (input as FlatRegionDataset[]) : [];
  const output: ArchitectureDataset[] = [];

  for (const regionItem of flat) {
    const region = normalizeId(regionItem?.region) ?? "unknown";
    const resources = Array.isArray(regionItem?.resources) ? regionItem.resources : [];
    const vpcs = resources.filter((r) => r?.resource_type === "VPC");
    for (const vpcResource of vpcs) {
      const converted = buildArchitectureFromFlatVpc(region, resources, vpcResource);
      if (converted) output.push(converted);
    }
  }

  return output;
}

// Map AWS resource type strings to cloudResources IDs
function mapResourceTypeToId(resourceTypeString: string): string {
  const normalized = resourceTypeString
    .toLowerCase()
    .trim()
    .replace(/-/g, '_')
    .replace(/\s+/g, '_');

  const typeMap: Record<string, string> = {
    'internet_gateway': 'internetgateway',
    'igw': 'internetgateway',
    'nat_gateway': 'natgateway',
    'natgw': 'natgateway',
    'transit_gateway': 'transitgateway',
    'tgw': 'transitgateway',
    'route_table': 'routetable',
    'route_tables': 'routetable',
    'routing_table': 'routetable',
    'vpc_endpoint': 'vpcendpoint',
    'vpce': 'vpcendpoint',
    'gateway_endpoint': 'gatewayendpoint',
    'interface_endpoint': 'interfaceendpoint',
    'load_balancer': 'elb',
    'alb': 'elb',
    'nlb': 'elb',
    'classic_load_balancer': 'elb',
    'target_group': 'targetgroup',
    'security_group': 'securitygroup',
    'sg': 'securitygroup',
    'network_acl': 'networkacl',
    'nacl': 'networkacl',
    'autoscaling_group': 'autoscaling',
    'asg': 'autoscaling',
    'auto_scaling_group': 'autoscaling',
    'launch_template': 'launchtemplate',
    'launch_config': 'launchtemplate',
    'launch_configuration': 'launchtemplate',
    'application_load_balancer': 'elb',
    'network_load_balancer': 'elb',
    'api_gateway': 'apigateway',
    'rest_api': 'apigateway',
    'http_api': 'apigateway',
    'aws_route': 'routetable',
    'subnet': 'subnet',
    'vpc': 'vpc',
    'instance': 'ec2',
    'ec2': 'ec2',
    'rds_instance': 'rds',
    'rds': 'rds',
    'dynamodb': 'dynamodb',
    'ddb': 'dynamodb',
    's3': 's3',
    's3_bucket': 's3',
    'bucket': 's3',
    'lambda': 'lambda',
    'function': 'lambda',
    'cloudwatch': 'cloudwatch',
    'logs': 'cloudwatch',
    'sns': 'sns',
    'sqs': 'sqs',
    'kinesis': 'kinesis',
    'elasticache': 'elasticache',
    'cache': 'elasticache',
    'iam_role': 'iam',
    'iam': 'iam',
    'role': 'iam',
    'user': 'iam',
    'policy': 'iam',
  };

  return typeMap[normalized] || normalized.replace(/_/g, '');
}

function resourceNode(
  id: string,
  label: string,
  resourceType: string,
  parentNode?: string,
  extra?: any,
  raw?: any
): Node {
  // Map string resource type to actual resource type ID
  const mappedTypeId = mapResourceTypeToId(resourceType);
  
  // Find resource from cloudResources using mapped ID
  const mappedResourceType = cloudResources.find(rt => rt.id === mappedTypeId) || {
    id: mappedTypeId,
    name: resourceType,
    category: 'unknown',
    icon: 'unknown',
    description: 'Unknown resource type',
    color: '#888'
  };

  return {
    id,
    type: "resource",
    data: { label, resourceType: mappedResourceType, ...(extra ?? {}), raw },
    position: { x: 0, y: 0 },
    ...(parentNode
      ? {
          parentNode,
          extent: "parent" as const,
        }
      : null),
  };
}

// Enhanced edge styling based on connection type
function getEdgeStyle(connectionType: string, isDashed = false): any {
  const baseStyles = {
    strokeWidth: 1.0,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const styles: Record<string, any> = {
    // Internet connectivity - professional blue
    internet: {
      ...baseStyles,
      stroke: '#2563EB',
      strokeWidth: 1.5,
    },

    // Load balancer connections - professional purple
    loadbalancer: {
      ...baseStyles,
      stroke: '#7C3AED',
      strokeWidth: 1.5,
    },

    // Target group connections - professional orange
    targetgroup: {
      ...baseStyles,
      stroke: '#EA580C',
      strokeWidth: 1.0,
      strokeDasharray: '8 4',
    },

    // Database connections - professional green
    database: {
      ...baseStyles,
      stroke: '#16A34A',
      strokeWidth: 1.5,
    },

    // Route table connections - professional gray
    routing: {
      ...baseStyles,
      stroke: '#6B7280',
      strokeWidth: 1.0,
      strokeDasharray: '6 3',
      opacity: 0.8,
    },

    // VPC endpoint connections - professional teal
    vpcendpoint: {
      ...baseStyles,
      stroke: '#0891B2',
      strokeWidth: 1.0,
      strokeDasharray: '4 2',
    },

    // Security/data flow - professional red
    security: {
      ...baseStyles,
      stroke: '#DC2626',
      strokeWidth: 1.0,
      strokeDasharray: '10 5',
    },

    // Default connection - professional navy
    default: {
      ...baseStyles,
      stroke: '#1E40AF',
      strokeWidth: 1.0,
    },
  };

  const style = styles[connectionType] || styles.default;
  return isDashed ? { ...style, strokeDasharray: '6 3' } : style;
}

function edge(
  id: string,
  source: string,
  target: string,
  label?: string,
  style?: any,
  raw?: any,
  connectionType?: string
): Edge {
  // Auto-detect connection type if not provided
  let detectedType = connectionType;
  if (!detectedType) {
    const sourceLower = source.toLowerCase();
    const targetLower = target.toLowerCase();

    if (sourceLower.includes('internet') || targetLower.includes('internet')) {
      detectedType = 'internet';
    } else if (sourceLower.includes('alb') || targetLower.includes('nlb') || sourceLower.includes('load') || targetLower.includes('load')) {
      detectedType = 'loadbalancer';
    } else if (sourceLower.includes('tg') || targetLower.includes('tg') || sourceLower.includes('target') || targetLower.includes('target')) {
      detectedType = 'targetgroup';
    } else if (sourceLower.includes('rds') || targetLower.includes('rds') || sourceLower.includes('db') || targetLower.includes('db')) {
      detectedType = 'database';
    } else if (sourceLower.includes('route') || targetLower.includes('route') || sourceLower.includes('rtb') || targetLower.includes('rtb')) {
      detectedType = 'routing';
    } else if (sourceLower.includes('endpoint') || targetLower.includes('endpoint') || sourceLower.includes('vpce') || targetLower.includes('vpce')) {
      detectedType = 'vpcendpoint';
    } else if (sourceLower.includes('security') || targetLower.includes('security') || sourceLower.includes('sg') || targetLower.includes('sg')) {
      detectedType = 'security';
    }
  }

  const edgeStyle = style || getEdgeStyle(detectedType || 'default');

  return {
    id,
    source,
    target,
    ...(label ? { label, labelStyle: { fontSize: '10px', fontWeight: '400', opacity: 0.7, background: 'transparent', color: '#666' } } : null),
    style: edgeStyle,
    data: { raw, connectionType: detectedType },
    type: 'smoothstep',
  };
}

// Helper function for consistent group styling
function createGroupStyle(
  backgroundColor: string,
  borderColor: string,
  width: number,
  height: number,
  additionalStyles?: any
) {
  return {
    width,
    height,
    backgroundColor,
    border: `2px solid ${borderColor}`,
    borderRadius: '8px',
    padding: '15px',
    boxShadow: `0 4px 12px ${borderColor}20`,
    // Additional styling options that can be enabled:
    // opacity: 0.9,
    // backdropFilter: 'blur(10px)',
    // backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
    ...additionalStyles,
  };
}

export function buildArchitectureGraph(
  dataset: ArchitectureDataset,
  options: { vpcId?: string } = {}
) {
  const vpc = dataset?.vpc;
  if (!vpc?.vpc_id) return { nodes: [] as Node[], edges: [] as Edge[] };

  const requestedVpc = normalizeId(options.vpcId);
  if (requestedVpc && requestedVpc !== vpc.vpc_id) {
    return { nodes: [] as Node[], edges: [] as Edge[] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const internetId = "internet";
  const igwId = normalizeId(vpc.internet_gateway?.id) ?? "internet_gateway";
  const vpcId = vpc.vpc_id;

  // Internet
  nodes.push({
    id: internetId,
    type: "internet",
    data: { label: vpc.internet?.label ?? "Internet", raw: vpc.internet },
    position: { x: 0, y: 0 },
    style: {
      backgroundColor: 'rgba(33, 150, 243, 0.1)', // Light blue background
      border: '2px solid #2196F3',
      borderRadius: '50%',
      width: 64,
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#2196F3',
      boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
    },
  });

  // VPC container
  nodes.push({
    id: vpcId,
    type: "group",
    data: { label: vpc.name ?? vpcId, kind: "vpc", cidr: vpc.cidr, raw: vpc },
    position: { x: 0, y: 0 },
    style: createGroupStyle(
      'rgba(140, 79, 255, 0.05)', // Light purple background
      '#8C4FFF', // Purple border
      980,
      640,
      { padding: '20px' } // Extra padding for VPC
    ),
  });

  // IGW (inside VPC)
  nodes.push(
    resourceNode(
      igwId,
      vpc.internet_gateway?.label ?? "Internet Gateway",
      "INTERNET_GATEWAY",
      vpcId,
      undefined,
      vpc.internet_gateway
    )
  );

  // Subnets
  const publicSubnet = vpc.subnets?.public;
  const privateSubnet = vpc.subnets?.private;

  const publicSubnetId = normalizeId(publicSubnet?.subnet_id);
  const privateSubnetId = normalizeId(privateSubnet?.subnet_id);

  const natId = (() => {
    for (const res of publicSubnet?.resources ?? []) {
      const id = normalizeId((res as any)?.id);
      const type = normalizeId((res as any)?.type);
      if (id && type === "NAT_GATEWAY") return id;
    }
    return undefined;
  })();

  if (publicSubnetId) {
    nodes.push({
      id: publicSubnetId,
      type: "group",
      data: {
        label: `${publicSubnet?.name ?? "Public Subnet"}`,
        kind: "subnet",
        subnetKind: "public",
        cidr: publicSubnet?.cidr,
        raw: publicSubnet,
      },
      parentNode: vpcId,
      extent: "parent",
      position: { x: 0, y: 0 },
      style: createGroupStyle(
        'rgba(76, 175, 80, 0.08)', // Light green background for public
        '#4CAF50', // Green border
        460,
        520
      ),
    });
  }

  if (privateSubnetId) {
    nodes.push({
      id: privateSubnetId,
      type: "group",
      data: {
        label: `${privateSubnet?.name ?? "Private Subnet"}`,
        kind: "subnet",
        subnetKind: "private",
        cidr: privateSubnet?.cidr,
        raw: privateSubnet,
      },
      parentNode: vpcId,
      extent: "parent",
      position: { x: 0, y: 0 },
      style: createGroupStyle(
        'rgba(244, 67, 54, 0.08)', // Light red background for private
        '#F44336', // Red border
        460,
        520
      ),
    });
  }

  // Encourage public-left, private-right
  if (publicSubnetId && privateSubnetId) {
    edges.push({
      id: "__layout_subnet_order__",
      source: publicSubnetId,
      target: privateSubnetId,
      style: { strokeOpacity: 0 },
      markerEnd: undefined,
    } as any);
  }

  // Route tables (inside subnets)
  if (publicSubnet?.route_table?.id && publicSubnetId) {
    const rtId = publicSubnet.route_table.id;
    nodes.push(resourceNode(rtId, "Public Route Table", "ROUTE_TABLE", publicSubnetId, undefined, publicSubnet.route_table));
    for (const r of publicSubnet.route_table.routes ?? []) {
      if (r.target === "internet_gateway") {
        edges.push(
          edge(
            `${rtId}-to-igw`,
            rtId,
            igwId,
            `${r.destination} → IGW`,
            getEdgeStyle('routing'),
            r,
            'routing'
          )
        );
      }
    }
  }

  if (privateSubnet?.route_table?.id && privateSubnetId) {
    const rtId = privateSubnet.route_table.id;
    nodes.push(
      resourceNode(rtId, "Private Route Table", "ROUTE_TABLE", privateSubnetId, undefined, privateSubnet.route_table)
    );
    for (const r of privateSubnet.route_table.routes ?? []) {
      if (r.target === "nat_gateway") {
        edges.push(
          edge(
            `${rtId}-to-nat`,
            rtId,
            natId ?? "nat-webapp-001",
            `${r.destination} → NAT`,
            getEdgeStyle('routing'),
            r,
            'routing'
          )
        );
      }
    }
  }

  // Resources inside subnets
  const allResources: Array<{
    id: string;
    type: string;
    name?: string;
    parent?: string;
    extra?: any;
    raw?: any;
  }> = [];

  for (const res of publicSubnet?.resources ?? []) {
    const id = normalizeId(res?.id);
    const type = normalizeId(res?.type);
    if (!id || !type || !publicSubnetId) continue;
    allResources.push({
      id,
      type,
      name: res?.name,
      parent: publicSubnetId,
      extra: {
        listener: res?.listener,
        securityGroup: res?.security_group,
      },
      raw: res,
    });
  }

  for (const res of privateSubnet?.resources ?? []) {
    const id = normalizeId(res?.id);
    const type = normalizeId(res?.type);
    if (!id || !type || !privateSubnetId) continue;
    const engine = normalizeId(res?.engine);
    allResources.push({
      id,
      type,
      name: res?.name,
      parent: privateSubnetId,
      extra: engine ? { engine } : undefined,
      raw: res,
    });
  }

  for (const r of allResources) {
    const label =
      r.type === "RDS" && r.extra?.engine
        ? `${r.name ?? r.id} (${r.extra.engine})`
        : r.name ?? r.id;
    nodes.push(resourceNode(r.id, label, r.type, r.parent, r.extra, r.raw));
  }

  // Storage (S3) – place inside VPC, outside subnets
  for (const s of vpc.storage ?? []) {
    const id = normalizeId(s?.id);
    if (!id) continue;
    nodes.push(resourceNode(id, s?.name ?? id, s?.type ?? "S3", vpcId, { access: s?.access }, s));
  }

  // VPC Endpoints – place inside VPC
  for (const ep of vpc.vpc_endpoints ?? []) {
    const id = normalizeId(ep?.id);
    if (!id) continue;
    const label = ep?.service ? `${ep.service} Endpoint` : id;
    nodes.push(resourceNode(id, label, ep?.type ?? "VPC_ENDPOINT", vpcId, { note: ep?.note }, ep));
  }

  // Traffic flows -> edges
  const resolveToken = (tokenRaw: string): string | undefined => {
    const token = tokenRaw.trim();
    if (!token) return undefined;

    if (token.toLowerCase() === "internet") return internetId;
    if (token === "internet_gateway") return igwId;
    if (token === "public_subnet") return publicSubnetId;
    if (token === "private_subnet") return privateSubnetId;

    // direct ids
    return token;
  };

  for (const [i, f] of (vpc.traffic_flows ?? []).entries()) {
    const source = resolveToken(f.from);
    const target = resolveToken(f.to);
    if (!source || !target) continue;

    // Determine connection type based on source/target
    let connectionType = 'default';
    if (source === internetId || target === internetId) connectionType = 'internet';
    else if (source.includes('alb') || target.includes('alb') || source.includes('load') || target.includes('load')) connectionType = 'loadbalancer';
    else if (source.includes('rds') || target.includes('rds')) connectionType = 'database';

    edges.push(edge(`flow-${i}-${source}-${target}`, source, target, f.protocol, getEdgeStyle(connectionType), f, connectionType));
  }

  // Extra diagram-like helpers
  // Internet -> IGW
  edges.push(
    edge("internet-to-igw", internetId, igwId, "HTTP(S)", getEdgeStyle('internet'), {
      from: "internet",
      to: "internet_gateway",
    }, 'internet')
  );

  // If we have an internet-facing ALB in public subnet, connect IGW -> ALB
  const alb = allResources.find((r) => r.id.includes("alb") || r.type === "LOAD_BALANCER");
  if (alb)
    edges.push(
      edge(
        `igw-to-${alb.id}`,
        igwId,
        alb.id,
        undefined,
        getEdgeStyle('loadbalancer'),
        { from: "internet_gateway", to: alb.id },
        'loadbalancer'
      )
    );

  // ALB -> TG -> EC2 (if present)
  const tg = allResources.find((r) => r.type === "TARGET_GROUP");
  const ec2 = allResources.find((r) => r.type === "EC2");
  if (alb && tg) edges.push(edge(`${alb.id}-to-${tg.id}`, alb.id, tg.id, undefined, getEdgeStyle('targetgroup'), undefined, 'targetgroup'));
  if (tg && ec2) edges.push(edge(`${tg.id}-to-${ec2.id}`, tg.id, ec2.id, undefined, getEdgeStyle('database'), undefined, 'database'));

  // Endpoint -> S3 buckets (dashed green)
  const s3Endpoint = (vpc.vpc_endpoints ?? []).find(
    (e) => e?.service?.toLowerCase() === "s3"
  );
  const s3EndpointId = normalizeId(s3Endpoint?.id);
  if (s3EndpointId) {
    for (const s of vpc.storage ?? []) {
      const sid = normalizeId(s?.id);
      if (!sid) continue;
      edges.push(
        edge(
          `${s3EndpointId}-to-${sid}`,
          s3EndpointId,
          sid,
          "Secure via VPC Endpoint",
          getEdgeStyle('vpcendpoint'),
          undefined,
          'vpcendpoint'
        )
      );
    }
  }

  return { nodes, edges };
}
