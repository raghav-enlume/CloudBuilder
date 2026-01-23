# CloudBuilder - Project Architecture & Diagram Understanding Guide

## 📋 Project Overview

**CloudBuilder** is an AWS infrastructure visualization tool that converts AWS JSON data into interactive React Flow diagrams. It supports multiple data formats and automatically creates hierarchical, container-based diagrams of complex cloud architectures.

---

## 🏗️ Project Structure

```
CloudBuilder/
├── src/
│   ├── components/
│   │   ├── diagram/
│   │   │   ├── DiagramBuilder.tsx      # Main diagram rendering component
│   │   │   ├── DiagramCanvas.tsx       # React Flow canvas wrapper
│   │   │   ├── Toolbar.tsx             # Upload & file handling
│   │   │   ├── ResourceSidebar.tsx     # Resource properties panel
│   │   │   ├── PropertiesPanel.tsx     # Node editing panel
│   │   │   └── ResourceNode.tsx        # Individual node renderer
│   │   └── ui/                         # shadcn-ui components
│   ├── lib/
│   │   ├── awsDataParser.ts            # Main parser (4227 lines) - converts AWS data → nodes/edges
│   │   ├── dbJsonParser.ts             # DB flat array format → AWS format converter
│   │   ├── layoutEngine.ts             # Hierarchical layout calculator
│   │   ├── architectureParser.ts       # Simple-architecture format support
│   │   ├── iconMapper.tsx              # AWS icon mappings
│   │   ├── costCalculator.ts           # Resource cost estimation
│   │   └── aws/                        # Test data files
│   │       ├── sample-web-app.json     # Reference architecture
│   │       ├── clean-db-14.json        # DB flat array format (14 resources)
│   │       ├── db-new.json             # DB flat array format (458 resources)
│   │       └── big.json                # Large test dataset
│   ├── hooks/
│   │   ├── useAutoLayout.ts            # Auto-layout hook
│   │   ├── use-toast.ts                # Toast notifications
│   │   └── use-mobile.tsx              # Mobile detection
│   ├── store/
│   │   └── diagramStore.ts             # Zustand state management
│   ├── types/
│   │   └── diagram.ts                  # TypeScript interfaces
│   ├── data/
│   │   ├── resources.ts                # Resource type definitions
│   │   └── templates.ts                # Pre-built templates
│   ├── pages/
│   │   └── Index.tsx                   # Main app entry point
│   ├── App.tsx                         # Root component
│   └── main.tsx                        # Vite entry point
├── package.json                        # Dependencies
├── vite.config.ts                      # Vite build config
├── tsconfig.json                       # TypeScript config
└── tailwind.config.ts                  # Tailwind CSS config
```

---

## 📊 Data Format Support

### 1. **AWS Region Format** (Primary Format)
**File**: `sample-web-app.json`

```typescript
{
  "us-east-1": {
    vpcs: [...],
    subnets: [...],
    instances: [...],
    security_groups: [...],
    internet_gateways: [...],
    nat_gateways: [...],
    route_tables: [...],
    rds_instances: [...],
    s3_buckets: [...],
    lambda_functions: [...],
    api_gateways: [...],
    dynamodb_tables: [...],
    ecs_clusters: [...],
    load_balancers: [...],
    // ... 50+ AWS resource types supported
  }
}
```

**Usage**: Direct AWS export format, most efficient parsing

---

### 2. **DB Flat Array Format** (Converting Format)
**File**: `clean-db-14.json` or `db-new.json`

```typescript
[
  {
    "region": "sample-web-app",
    "total_resources": 17,
    "resources": [
      {
        "region": "sample-web-app",
        "cloud_resource_id": "vpc-webapp-001",
        "resource_name": "Sample Web App VPC",
        "resource_type": "VPC",
        "resource_category": "NETWORKING",
        "resource_property": {
          "VpcId": "vpc-webapp-001",
          "CidrBlock": "10.0.0.0/16",
          "State": "available",
          "Tags": [...]
        }
      },
      // ... more resources in flat array
    ]
  }
]
```

**Key Characteristics**:
- ✓ Flat array structure (not hierarchical)
- ✓ Each resource is a complete object with metadata
- ✓ `resource_type` indicates AWS resource type
- ✓ `resource_property` contains AWS fields
- ✓ Converted to AWS format via `dbJsonParser.ts`

**Conversion Flow**:
```
DB Flat Array
    ↓
dbJsonParser.convertDBJsonToAWSFormat()
    ↓
AWS Region Format
    ↓
awsDataParser.parseAWSDataJSON()
    ↓
Nodes & Edges
    ↓
React Flow Diagram
```

---

## 🔄 Data Processing Pipeline

### Phase 1: File Upload → Validation
**File**: `Toolbar.tsx` (lines 234-260)

```typescript
// Validate AWS data format
const isValidAWSData = Object.values(data).some((region) => {
  return (
    Array.isArray(region.vpcs) ||
    Array.isArray(region.subnets) ||
    Array.isArray(region.instances) ||
    // ... check for any AWS resource type
  );
});
```

### Phase 2: Format Detection & Conversion
**File**: `dbJsonParser.ts` (lines 1-60)

```typescript
// If flat array format detected, convert to AWS format
if (Array.isArray(data)) {
  const converted = convertDBJsonToAWSFormat(data[0]);
  data = converted;
}
```

### Phase 3: Resource Parsing
**File**: `awsDataParser.ts` (lines 730-800)

```typescript
// For each region in AWS format
Object.entries(data).forEach(([regionKey, regionData]) => {
  // Extract resource types
  const vpcs = regionData.vpcs || [];
  const instances = regionData.instances || [];
  const rds_instances = regionData.rds_instances || [];
  // ... for all 50+ resource types
});
```

### Phase 4: Node Creation
**File**: `awsDataParser.ts` (lines 1000-2000+)

```typescript
// Example: Create VPC nodes
vpcs.forEach((vpc) => {
  nodes.push({
    id: `vpc-${vpc.VpcId}`,
    type: 'resourceNode',
    position: { x: vpcX, y: vpcY },
    data: {
      label: vpc.VpcId,
      resourceType: vpcResourceType,
      size: { width: 1100, height: containerHeight }
    }
  });
});
```

### Phase 5: Edge Creation
**File**: `awsDataParser.ts` (lines 4020-4150)

```typescript
// Connection types created:
1. EC2 → RDS        (red line, same VPC)
2. EC2 → NAT        (purple line, public subnet)
3. EC2 → IGW        (green line, public subnet)
4. EC2 → S3         (orange line, same region)
5. Route Table → IGW/NAT (gray line, routing)
```

### Phase 6: Layout Calculation
**File**: `layoutEngine.ts` (lines 1-437)

```typescript
// Hierarchical positioning
Region Container
├── VPC Container
│   ├── Subnet Container (public)
│   │   ├── EC2 Instance
│   │   ├── NAT Gateway
│   │   └── Load Balancer
│   ├── Subnet Container (private)
│   │   ├── RDS Instance
│   │   └── Lambda
│   ├── Security Groups (floating)
│   └── Route Tables (floating)
├── S3 Buckets (region-level)
├── Lambda Functions (region-level)
├── DynamoDB Tables (region-level)
└── API Gateways (region-level)
```

---

## 📦 Supported Resource Types (50+)

### Compute
- EC2 Instances
- Lambda Functions
- ECS Clusters & Services
- EKS Clusters
- Fargate Tasks
- Elastic Beanstalk Apps
- Autoscaling Groups

### Storage
- S3 Buckets
- EBS Volumes
- EFS Filesystems

### Database
- RDS (PostgreSQL, MySQL, Oracle, SQL Server)
- DynamoDB Tables
- ElastiCache Clusters
- Redshift

### Networking
- VPCs
- Subnets (public/private)
- Internet Gateways
- NAT Gateways
- Route Tables
- Security Groups
- Network ACLs
- VPC Endpoints
- VPC Peering
- Transit Gateways

### Load Balancing
- Application Load Balancers (ALB)
- Network Load Balancers (NLB)
- Classic Load Balancers
- Target Groups
- ALB Listeners

### Application Services
- API Gateway
- CloudFront Distributions
- SQS Queues
- SNS Topics
- Kinesis Streams
- AppSync APIs

### Developer Tools
- CodePipeline
- CodeBuild
- CodeDeploy
- ECR Repositories
- Service Discovery

### Security & Monitoring
- IAM Roles/Policies
- Cognito User Pools
- WAF Web ACLs
- CloudWatch Alarms
- Secrets Manager

### DNS
- Route 53 Zones
- Route 53 Health Checks

---

## 🎨 Connection Types & Colors

### EC2 Connections
| Connection | Color | Label |
|-----------|-------|-------|
| EC2 → RDS | 🔴 Red (#FF6B6B) | "Connects to" |
| EC2 → NAT | 🟣 Purple (#8C4FFF) | "Routes via NAT" |
| EC2 → IGW | 🟢 Green (#1DB954) | "Internet Access" |
| EC2 → S3 | 🟠 Orange (#FFA500) | "Access" |

### Infrastructure Connections
| Connection | Type | Color |
|-----------|------|-------|
| Route Table → IGW | Routing | Gray (#4ECDC4) |
| Route Table → NAT | Routing | Gray (#4ECDC4) |
| LB → ECS | Traffic | Blue (#146EB4) |
| API → Lambda | Integration | Orange (#FF9900) |
| Lambda → DynamoDB | Access | Purple (#8C4FFF) |

---

## 📈 Hierarchical Layout Algorithm

### Positioning Rules

1. **Region Container**
   - Full width diagram
   - Contains all VPCs and region-level resources
   - Dynamic height based on content

2. **VPC Container**
   - Max width: 1100px
   - Padding: 140px
   - Multiple VPCs positioned horizontally with 100px margin

3. **Subnet Containers** (inside VPC)
   - Public subnets at top
   - Private subnets below
   - Width: 380px each
   - Dynamic height based on contained resources

4. **Resource Positioning** (inside Subnet)
   - EC2 Instances: Vertically stacked
   - NAT Gateways: Bottom-right corner
   - Load Balancers: Bottom-right corner
   - RDS Instances: Bottom-right corner

5. **Security Groups** (floating in VPC)
   - Outside subnets
   - Right side of VPC

6. **Region-Level Resources**
   - Positioned outside VPCs
   - Include: S3, Lambda, DynamoDB, API Gateway, etc.
   - Grid layout: 8 resources per row

### Container Sizing Logic
```typescript
subnetHeight = 120 + 
               (instances.length * 80) +
               (lbs.length ? 100 : 0) +
               (nats.length ? 100 : 0) +
               (rds.length ? 100 : 0);
```

---

## 🔌 Edge Creation Logic

### Phase 1: EC2 → RDS Connections
```typescript
// For each EC2 instance
// For each RDS instance in same VPC
if (instance.VpcId === rds.VpcId) {
  createEdge({
    source: `instance-${instance.InstanceId}`,
    target: `rds-${rds.db_instance_name}`,
    stroke: '#FF6B6B'  // Red
  });
}
```

### Phase 2: EC2 → NAT/IGW Connections
```typescript
// For each EC2 instance in PUBLIC subnet
if (subnet.Type === 'public') {
  // Connect to NAT Gateway
  createEdge({
    source: `instance-${instance.InstanceId}`,
    target: `nat-${nat.NatGatewayId}`,
    stroke: '#8C4FFF'  // Purple
  });
  
  // Connect to Internet Gateway
  createEdge({
    source: `instance-${instance.InstanceId}`,
    target: `igw-${igw.InternetGatewayId}`,
    stroke: '#1DB954'  // Green
  });
}
```

### Phase 3: EC2 → S3 Connections
```typescript
// For each EC2 instance
// For each S3 bucket in region
createEdge({
  source: `instance-${instance.InstanceId}`,
  target: `s3-${bucket.Name}`,
  stroke: '#FFA500'  // Orange
});
```

### Phase 4: Route Table Connections
```typescript
// Route Table → Internet Gateway
// Route Table → NAT Gateway
// Route Table → VPC Peering
// Route Table → Transit Gateway
```

---

## 🔍 DB Flat Array Format - Detailed Example

### Input: `clean-db-14.json` (14 Resources)
```json
[
  {
    "region": "sample-web-app",
    "total_resources": 17,
    "resources": [
      {
        "region": "sample-web-app",
        "cloud_resource_id": "vpc-webapp-001",
        "resource_name": "Sample Web App VPC",
        "resource_type": "VPC",
        "resource_category": "NETWORKING",
        "resource_property": {
          "VpcId": "vpc-webapp-001",
          "State": "available",
          "CidrBlock": "10.0.0.0/16",
          "Tags": [{"Key": "Name", "Value": "Sample Web App VPC"}]
        }
      },
      {
        "region": "sample-web-app",
        "cloud_resource_id": "i-webapp-001",
        "resource_name": "bo-drone-instance-553",
        "resource_type": "EC2",
        "resource_category": "COMPUTE",
        "resource_property": {
          "InstanceId": "i-webapp-001",
          "InstanceType": "t3.medium",
          "State": {"Name": "running"},
          "VpcId": "vpc-webapp-001",
          "SubnetId": "subnet-public-001",
          "SecurityGroups": [{"GroupId": "sg-web-001"}]
        }
      },
      {
        "region": "sample-web-app",
        "cloud_resource_id": "rds-webapp-postgres",
        "resource_name": "bo-drone-db-554",
        "resource_type": "RDS",
        "resource_category": "DATABASE",
        "resource_property": {
          "DBInstanceIdentifier": "rds-webapp-postgres",
          "db_instance_name": "rds-webapp-postgres",
          "Engine": "postgresql",
          "engine": "postgresql",
          "engine_version": "13.7",
          "DBInstanceClass": "db.t3.micro",
          "VpcId": "vpc-webapp-001",
          "subnet_id": "subnet-public-001"
        }
      },
      // ... 11 more resources
    ]
  }
]
```

### Conversion Process

**Input Structure** → **Conversion** → **Output Structure**

```
[
  {
    region: "sample-web-app",
    resources: [ ... flat array ... ]
  }
]
    ↓
convertDBJsonToAWSFormat()
    ↓
{
  "sample-web-app": {
    vpcs: [ vpc-webapp-001 ],
    subnets: [ subnet-public-001, subnet-private-001 ],
    instances: [ i-webapp-001 ],
    rds_instances: [ rds-webapp-postgres, rds-webapp-mysql ],
    s3_buckets: [ webapp-assets-bucket, webapp-backups-bucket ],
    internet_gateways: [ igw-webapp-001 ],
    nat_gateways: [ nat-webapp-001 ],
    route_tables: [ rtb-public-001, rtb-private-001 ],
    security_groups: [ sg-web-001, sg-rds-001 ]
  }
}
```

### Resource Type Mapping
```typescript
// DB Format → AWS Format
"VPC"                → vpcs[]
"SUBNET"             → subnets[]
"EC2"                → instances[]
"SECURITY_GROUP"     → security_groups[]
"INTERNET_GATEWAY"   → internet_gateways[]
"NAT_GATEWAY"        → nat_gateways[]
"ROUTE_TABLE"        → route_tables[]
"RDS"                → rds_instances[]
"S3"                 → s3_buckets[]
"LOAD_BALANCER"      → load_balancers[]
"TARGET_GROUP"       → target_groups[]
"ALB_LISTENER"       → alb_listeners[]
"DB_SUBNET_GROUP"    → db_subnet_groups[]
"RDS_BACKUP_JOB"     → rds_backup_jobs[]
```

---

## 🎯 Diagram Generation Flow

```
User uploads clean-db-14.json
    ↓
File content parsed as JSON
    ↓
Detected as flat array format
    ↓
convertDBJsonToAWSFormat(dbJson)
    ↓
Converted to AWS region structure
    ↓
parseAWSDataJSON(regionData)
    ↓
├─ Create nodes for all resources
├─ Calculate hierarchical positions
├─ Create routing/connectivity edges
│  ├─ EC2 → RDS (red)
│  ├─ EC2 → NAT (purple)
│  ├─ EC2 → IGW (green)
│  ├─ EC2 → S3 (orange)
│  └─ Route Table connections
├─ Size containers based on content
└─ Return { nodes[], edges[] }
    ↓
loadDiagram(nodes, edges)
    ↓
React Flow renders diagram
    ↓
✓ Interactive visualization ready
```

---

## 🛠️ Key Parser Files

### 1. **awsDataParser.ts** (4227 lines)
- Main parser for AWS region format
- 50+ resource type handlers
- Edge creation logic
- Position calculation
- Connection rules

### 2. **dbJsonParser.ts** (364 lines)
- Converts DB flat array → AWS format
- Resource type mapping
- Relationship tracking
- 14+ resource types handled

### 3. **layoutEngine.ts** (437 lines)
- Hierarchical layout calculation
- Container sizing
- Position constraints
- Border collision handling

### 4. **architectureParser.ts**
- Supports simple-architecture.json format
- Legacy format support
- Format conversion utilities

---

## 📊 Resource Count Examples

### clean-db-14.json (14 Resources)
- 1 VPC
- 2 Subnets (public, private)
- 1 EC2 Instance
- 2 RDS Instances (PostgreSQL, MySQL)
- 2 S3 Buckets
- 1 Internet Gateway
- 1 NAT Gateway
- 2 Route Tables
- 2 Security Groups
- (Total: 14 resources)

### db-new.json (458 Resources)
- 12 Regions
- 100+ VPCs
- 150+ Subnets
- 50+ EC2 Instances
- 30+ RDS Instances
- 20+ S3 Buckets
- 40+ Lambda Functions
- 20+ DynamoDB Tables
- And more...

---

## 🚀 Quick Start

### Loading a Diagram

1. **From UI**:
   - Click "Upload AWS Data" button
   - Select JSON file (any supported format)
   - Diagram auto-generates

2. **From Code**:
```typescript
import { parseAWSDataJSON } from './lib/awsDataParser';

const { nodes, edges } = await parseAWSDataJSON(awsData);
loadDiagram(nodes, edges);
```

### Supported File Formats

```
✓ AWS Region Format (sample-web-app.json)
✓ DB Flat Array (clean-db-14.json, db-new.json)
✓ Simple Architecture (architecture.json)
✓ Any JSON with regional AWS resources
```

---

## 🔗 Connection Examples

### Example 1: Web App Architecture
```
Internet (public internet)
    ↓
IGW ↔ EC2 (green line)
    ↓
EC2 ↔ RDS (red line)
    ↓
EC2 ↔ S3 (orange line)
```

### Example 2: Private Database Architecture
```
EC2 (public subnet)
    ↓
EC2 ↔ NAT (purple line)
    ↓
NAT → IGW (gray line)
    ↓
EC2 ↔ RDS (red line, private subnet)
```

---

## 📝 Notes

- **DB Flat Array**: Best for database exports, easy to generate from scripts
- **AWS Region Format**: Most efficient, direct AWS API structure
- **Node IDs**: Follows pattern `{resourceType}-{resourceId}`
- **Container Nesting**: Visual hierarchy shows AWS architecture nesting
- **Automatic Positioning**: No manual layout needed, algorithm handles sizing

---

## 📚 Documentation Files

- `ARCHITECTURE_REFERENCE.md` - Detailed architecture rules
- `LAYOUT_ENGINE_README.md` - Layout algorithm details
- `ALL_RESOURCE_TYPES.md` - Complete resource type list
- `DIAGRAM_SPECIFICATION.md` - Diagram generation spec

