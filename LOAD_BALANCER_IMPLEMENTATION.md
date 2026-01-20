# Load Balancer Implementation - Complete

## What Was Added

### 1. **Load Balancer Nodes**
Load balancers are now rendered as diagram nodes with the following properties:
- **Position**: Regional level (outside VPC)
- **Label**: Load balancer name (e.g., "app-alb")
- **Type**: Application (ALB), Network (NLB), or Gateway (GLB)
- **Scheme**: Internet-facing or Internal
- **Icon & Color**: Uses the standard load balancer resource styling (#FF9900)

### 2. **Automatic Connections**
The parser automatically creates edges from load balancers to:

#### Parent Connection
- **Region → Load Balancer**: Shows LB belongs to region
  - Label: "Load Balancer"
  - Color: #FF9900 (orange)

#### Subnet Connections
- **Load Balancer → Subnets**: Shows which subnets the LB is deployed in
  - Label: "Deployed in"
  - Color: #FF9900 (orange)
  - Multiple edges if load balancer spans multiple subnets

#### Security Group Connections
- **Load Balancer → Security Groups**: Shows which security groups protect the LB
  - Label: "Protected by"
  - Color: #DD344C (red)
  - Multiple edges for multiple security groups

### 3. **Data Structure**
Load balancers in the JSON should have:
```json
{
  "LoadBalancerName": "app-alb",      // Required: Name of the LB
  "Type": "application",               // Optional: "application", "network", "gateway"
  "Scheme": "internet-facing",         // Optional: "internet-facing" or "internal"
  "Subnets": ["subnet-id-1", ...],    // Optional: Array of subnet IDs where LB is deployed
  "SecurityGroups": ["sg-id-1", ...]  // Optional: Array of security group IDs
}
```

### 4. **Positioning**
- Load balancers are positioned at the region level below the VPC container
- If both load balancers and S3 buckets exist, S3 buckets are positioned below load balancers
- Horizontal spacing maintained with 25px margins between multiple load balancers

### 5. **AWS Compliance**
The implementation follows AWS architecture rules:
- Load balancers are regional resources (not VPC-specific)
- Multiple subnets can be assigned to one load balancer
- Security groups control ingress/egress traffic
- All edges have proper directional arrows

## Example Diagram Flow

```
Region (us-east-1)
├── VPC (vpc-prod-001)
│   ├── Subnets
│   ├── EC2 Instances
│   ├── RDS Database
│   └── Security Groups
├── Load Balancer (app-alb) ←─────────┐
│   ├── Connected to Subnet            │
│   └── Connected to Security Group    │
└── S3 Buckets
```

## Testing

To verify load balancers show on the diagram:

1. Upload or use sample data with `load_balancers` array
2. Load balancer nodes should appear below the VPC
3. Connections to subnets and security groups should be visible
4. Hover edges to see relationship labels
5. Click nodes to view/edit properties

## Technical Details

### Parser Changes (awsDataParser.ts)
- Added `loadBalancerResourceType` instantiation
- Added load balancer parsing logic in `parseAWSDataJSON`
- Load balancers processed after RDS, before S3
- Automatic positioning considering existing elements
- Y-coordinate offset accounts for load balancers when positioning S3

### Supported Load Balancer Types
- **ALB (Application Load Balancer)**: `Type: "application"`
- **NLB (Network Load Balancer)**: `Type: "network"`
- **GLB (Gateway Load Balancer)**: `Type: "gateway"`
- **Classic ELB**: Handled by `Type: "classic"`

## Next Steps

To enhance load balancer visualization:

1. Add target group connections (EC2 instances → Load Balancer)
2. Add listener configuration display
3. Color-code by load balancer type
4. Show health status indicators
5. Add load balancer rules visualization
