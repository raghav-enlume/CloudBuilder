# CloudBuilder Resource Types Reference

## Overview

CloudBuilder supports **8 AWS resource types** organized in a 4-level hierarchical structure. This document provides a complete reference for all supported resource types, their properties, and relationships.

---

## Supported Resource Types

### 1. Region
- **Type ID:** `region`
- **Category:** Networking (Boundary)
- **Color:** `#3949AB` (Deep Blue)
- **Icon:** vpc
- **Description:** AWS Region - Ultimate boundary container for entire AWS infrastructure
- **Is Container:** Yes
- **Parent:** None (Root level)
- **Children:** VPCs
- **Nesting Depth:** 0

**Editable Attributes:**
- `label` (string): Region Name (e.g., "us-east-2")
- `region` (string): Region Code

**Example:**
```json
{
  "id": "region-us-east-2",
  "label": "Region: us-east-2",
  "resourceType": { "id": "region", "name": "Region" },
  "position": { "x": 0, "y": 0 },
  "width": 3540,
  "height": 1054
}
```

---

### 2. VPC (Virtual Private Cloud)
- **Type ID:** `vpc`
- **Category:** Networking
- **Color:** `#8C4FFF` (Purple)
- **Icon:** vpc
- **Description:** Virtual private cloud - Network isolation boundary containing subnets and services
- **Is Container:** Yes (special - contains multiple types)
- **Parent:** Region
- **Children:** Subnets, Internet Gateways, Route Tables, Security Groups
- **Nesting Depth:** 1

**Editable Attributes:**
- `vpcName` (string): VPC Name (e.g., "my-vpc")
- `cidrBlock` (string): CIDR Block (e.g., "10.0.0.0/16")
- `dnsHostnamesEnabled` (boolean): DNS Hostnames enabled

**Properties:**
- `vpcId`: AWS VPC ID
- `state`: State of VPC (available)
- `isDefault`: Whether this is the default VPC

**Example:**
```json
{
  "id": "vpc-vpc-06cc31a57a405feb8",
  "label": "vpc-06cc31a57a405feb8",
  "resourceType": { "id": "vpc", "name": "VPC" },
  "parentId": "region-us-east-2",
  "position": { "x": 100, "y": 140 },
  "width": 915,
  "height": 625,
  "data": {
    "vpcId": "vpc-06cc31a57a405feb8",
    "cidrBlock": "10.0.0.0/16",
    "state": "available",
    "isDefault": false
  }
}
```

---

### 3. Subnet
- **Type ID:** `subnet`
- **Category:** Networking
- **Color:** `#8C4FFF` (Purple)
- **Icon:** vpc
- **Description:** Virtual Subnet - Network segment containing EC2 instances
- **Is Container:** Yes
- **Parent:** VPC
- **Children:** EC2 Instances
- **Nesting Depth:** 2

**Editable Attributes:**
- `label` (string): Subnet ID
- `cidrBlock` (string): CIDR Block (e.g., "10.0.1.0/24")

**Properties:**
- `subnetId`: AWS Subnet ID
- `vpcId`: Parent VPC ID
- `availabilityZone`: Availability Zone (e.g., "us-east-2a")
- `state`: State of subnet

**Sizing:**
- **Default:** 200×80px (when no children)
- **Expanded:** Grows to fit all EC2 instances with 30px padding

**Example:**
```json
{
  "id": "subnet-subnet-0da1a05dfc8b55dc3",
  "label": "subnet-0da1a05dfc8b55dc3",
  "resourceType": { "id": "subnet", "name": "Subnet" },
  "parentId": "vpc-vpc-06cc31a57a405feb8",
  "position": { "x": 140, "y": 310 },
  "width": 200,
  "height": 80,
  "data": {
    "subnetId": "subnet-0da1a05dfc8b55dc3",
    "vpcId": "vpc-06cc31a57a405feb8",
    "cidrBlock": "10.0.1.0/24",
    "availabilityZone": "us-east-2a"
  }
}
```

---

### 4. EC2 Instance
- **Type ID:** `ec2`
- **Category:** Compute
- **Color:** `#FF9900` (Orange)
- **Icon:** ec2
- **Description:** Virtual server in the cloud
- **Is Container:** No (leaf node)
- **Parent:** Subnet
- **Children:** None
- **Nesting Depth:** 3

**Editable Attributes:**
- `label` (string): Instance ID or Name
- `instanceType` (string): Instance Type (e.g., "t3.small")

**Properties:**
- `instanceId`: AWS Instance ID
- `instanceType`: EC2 Instance type
- `state`: Instance state (running, stopped, etc.)
- `privateIpAddress`: Private IP address
- `publicIpAddress`: Public IP address (if assigned)
- `imageId`: AMI ID
- `launchTime`: Launch time
- `subnetId`: Parent subnet ID
- `vpcId`: VPC ID

**Sizing:**
- **Fixed:** 120×88px
- **Padding:** 30px from subnet edges (top-left alignment)

**Example:**
```json
{
  "id": "instance-i-0525e04aaef702279",
  "label": "blazeops-agent-staging-backend-api",
  "resourceType": { "id": "ec2", "name": "EC2 Instance" },
  "parentId": "subnet-subnet-0da1a05dfc8b55dc3",
  "position": { "x": 150, "y": 340 },
  "width": 120,
  "height": 88,
  "data": {
    "instanceId": "i-0525e04aaef702279",
    "instanceType": "t3.small",
    "state": "running",
    "privateIpAddress": "10.0.1.119",
    "publicIpAddress": "3.142.252.53"
  }
}
```

---

### 5. Route Table
- **Type ID:** `routetable`
- **Category:** Networking
- **Color:** `#8C4FFF` (Purple)
- **Icon:** vpc
- **Description:** Route Table - Defines routing rules for subnets
- **Is Container:** No (leaf node)
- **Parent:** VPC
- **Children:** None (but connects to Subnets via edges)
- **Nesting Depth:** 2

**Editable Attributes:**
- `label` (string): Route Table ID

**Properties:**
- `routeTableId`: AWS Route Table ID
- `vpcId`: Parent VPC ID

**Positioning:**
- **Position:** LEFT side of VPC
- **X:** `vpc_x + 40`
- **Y:** `vpc_y + 260` (below subnets)
- **Spacing:** 100px between route tables (vertical)
- **Fixed Size:** 120×88px

**Example:**
```json
{
  "id": "rt-rtb-01acacde45952b958",
  "label": "rtb-01acacde45952b958",
  "resourceType": { "id": "routetable", "name": "Route Table" },
  "parentId": "vpc-vpc-06cc31a57a405feb8",
  "position": { "x": 140, "y": 535 },
  "width": 120,
  "height": 88,
  "data": {
    "routeTableId": "rtb-01acacde45952b958",
    "vpcId": "vpc-06cc31a57a405feb8"
  }
}
```

---

### 6. Internet Gateway
- **Type ID:** `internetgateway`
- **Category:** Compute/Connectivity
- **Color:** `#FF9900` (Orange)
- **Icon:** elb
- **Description:** Internet Gateway - Enables internet access for VPC
- **Is Container:** No (leaf node)
- **Parent:** VPC
- **Children:** None
- **Nesting Depth:** 2

**Editable Attributes:**
- `label` (string): Gateway ID

**Properties:**
- `gatewayId`: AWS Internet Gateway ID
- `ownerId`: AWS Account ID

**Positioning:**
- **Position:** Top row of VPC
- **Y:** `vpc_y + 20`
- **X:** Horizontal distribution across VPC width
- **Fixed Size:** 120×88px

**Example:**
```json
{
  "id": "igw-igw-01d5c14d9e2b4b9c8",
  "label": "igw-01d5c14d9e2b4b9c8",
  "resourceType": { "id": "internetgateway", "name": "Internet Gateway" },
  "parentId": "vpc-vpc-06cc31a57a405feb8",
  "position": { "x": 140, "y": 180 },
  "width": 120,
  "height": 88,
  "data": {
    "gatewayId": "igw-01d5c14d9e2b4b9c8"
  }
}
```

---

### 7. Security Group
- **Type ID:** `securityGroup`
- **Category:** Security
- **Color:** `#DD344C` (Red)
- **Icon:** waf
- **Description:** Security Group - Firewall rules applied to instances
- **Is Container:** No (leaf node)
- **Parent:** VPC
- **Children:** None (but connects to Instances via edges)
- **Nesting Depth:** 2

**Editable Attributes:**
- `label` (string): Security Group Name

**Properties:**
- `groupId`: AWS Security Group ID
- `groupName`: Security Group Name
- `vpcId`: Parent VPC ID
- `description`: Description
- `inboundRules`: Count of inbound rules
- `outboundRules`: Count of outbound rules

**Positioning:**
- **Position:** RIGHT side of VPC
- **X:** `vpc_x + vpc_width - 160`
- **Y:** `max(last_RT_bottom) + 20` (below route tables)
- **Spacing:** 100px between security groups (vertical)
- **Fixed Size:** 120×88px

**Example:**
```json
{
  "id": "sg-sg-0c7910417aebd89b9",
  "label": "blazeops-agent-staging-agent",
  "resourceType": { "id": "securityGroup", "name": "Security Group" },
  "parentId": "vpc-vpc-06cc31a57a405feb8",
  "position": { "x": 750, "y": 615 },
  "width": 120,
  "height": 88,
  "data": {
    "groupId": "sg-0c7910417aebd89b9",
    "groupName": "blazeops-agent-staging-agent",
    "vpcId": "vpc-06cc31a57a405feb8",
    "inboundRules": 3,
    "outboundRules": 1
  }
}
```

---

## Resource Type Summary

| Type | ID | Category | Color | Container | Parent | Children | Depth |
|------|-------|----------|-------|-----------|--------|----------|-------|
| Region | `region` | Networking | #3949AB | ✅ | None | VPCs | 0 |
| VPC | `vpc` | Networking | #8C4FFF | ✅ | Region | Subnets, IGWs, RTs, SGs | 1 |
| Subnet | `subnet` | Networking | #8C4FFF | ✅ | VPC | EC2 Instances | 2 |
| EC2 | `ec2` | Compute | #FF9900 | ❌ | Subnet | None | 3 |
| Route Table | `routetable` | Networking | #8C4FFF | ❌ | VPC | None | 2 |
| IGW | `internetgateway` | Compute | #FF9900 | ❌ | VPC | None | 2 |
| Security Group | `securityGroup` | Security | #DD344C | ❌ | VPC | None | 2 |

---

## Color Legend

| Color | Hex | Resources | Purpose |
|-------|-----|-----------|---------|
| Deep Blue | `#3949AB` | Region | Top-level boundary |
| Purple | `#8C4FFF` | VPC, Subnet, Route Table | Network management |
| Orange | `#FF9900` | EC2, IGW | Compute & Connectivity |
| Red | `#DD344C` | Security Group | Security & Access Control |

---

## Size Reference

| Resource | Width | Height | Notes |
|----------|-------|--------|-------|
| Region | Dynamic | Dynamic | Expands to fit all VPCs |
| VPC | Dynamic (min 400) | Dynamic (min 300) | Expands to fit children |
| Subnet | Dynamic (200 default) | Dynamic (80 default) | Expands if has instances |
| EC2 Instance | 120 | 88 | Fixed size |
| Route Table | 120 | 88 | Fixed size |
| IGW | 120 | 88 | Fixed size |
| Security Group | 120 | 88 | Fixed size |

---

## Positioning Rules

### Region
- **Stacking:** Vertical (one below another)
- **Spacing:** 40px between regions
- **X Position:** 0 (full width)
- **Y Position:** Cumulative height

### VPC
- **Distribution:** Horizontal within region
- **X Position:** `100 + (index × 450px)`
- **Y Position:** 140 (relative to region)
- **Spacing:** 450px between VPCs

### Subnet
- **Initial Y:** `vpc_y + 120`
- **Stacking:** Vertical with 100px spacing
- **Collision Detection:** 20px minimum margin
- **Repositioning:** Dynamic after placement

### Route Table
- **Position:** LEFT side of VPC
- **X:** `vpc_x + 40`
- **Y Start:** `vpc_y + 260`
- **Spacing:** 100px vertical

### Security Group
- **Position:** RIGHT side of VPC
- **X:** `vpc_x + vpc_width - 160`
- **Y Start:** `max(last_RT_y + last_RT_height) + 20`
- **Spacing:** 100px vertical

### EC2 Instance
- **Position:** Inside subnet (top-left)
- **X:** `subnet_x + 30`
- **Y:** `subnet_y + 30`
- **Padding:** 30px from all edges

### Internet Gateway
- **Position:** Top row of VPC
- **Y:** `vpc_y + 20`
- **X:** Horizontal distribution based on count

---

## Validation

All resource placements are validated for:
- ✅ **Node Overlaps:** AABB collision detection within same parent
- ✅ **Edge Overlaps:** Line-rectangle intersection detection
- ✅ **Container Bounds:** All children fit within parent boundaries

Current Status:
- Single-region diagram: 33 nodes, 17 edges - **Clean**
- Multi-region diagram: 162 nodes, 71 edges - **Clean**
