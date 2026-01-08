# Architecture Reference Guide

## Complete Architecture Overview

This document provides a comprehensive reference for CloudBuilder's architecture, including resource relationships, hierarchy, connections, and positioning algorithms.

---

## Table of Contents

1. [Hierarchy Tree](#hierarchy-tree)
2. [Relationships & Connections](#relationships--connections)
3. [Positioning Strategy](#positioning-strategy)
4. [Sizing Algorithm](#sizing-algorithm)
5. [Validation Methods](#validation-methods)
6. [Examples](#examples)

---

## Hierarchy Tree

### 4-Level Architecture

```
Level 0: REGION (Container)
│        └─ Ultimate boundary for all infrastructure
│        └─ Stacked vertically with other regions
│
├── Level 1: VPC (Network Boundary)
│   │        └─ Parent: Region
│   │        └─ Siblings: 1-4 per region (450px spacing)
│   │        └─ Properties: CIDR block, DNS settings, default status
│   │
│   ├── Level 2a: SUBNET (Container)
│   │   │          └─ Parent: VPC
│   │   │          └─ Default Size: 200×80px
│   │   │          └─ Expanded: If contains EC2 instances
│   │   │
│   │   └── Level 3: EC2 INSTANCE (Leaf)
│   │                └─ Parent: Subnet
│   │                └─ Fixed Size: 120×88px
│   │                └─ Padding: 30px from subnet edges
│   │
│   ├── Level 2b: INTERNET GATEWAY (Leaf)
│   │              └─ Parent: VPC
│   │              └─ Position: Top of VPC (y=vpc_y+20)
│   │              └─ Fixed Size: 120×88px
│   │
│   ├── Level 2c: ROUTE TABLE (Leaf)
│   │              └─ Parent: VPC
│   │              └─ Position: LEFT side (x=vpc_x+40)
│   │              └─ Vertical Stack: 100px spacing
│   │              └─ Fixed Size: 120×88px
│   │
│   └── Level 2d: SECURITY GROUP (Leaf)
│                  └─ Parent: VPC
│                  └─ Position: RIGHT side (x=vpc_x+width-160)
│                  └─ Vertical Stack: 100px spacing (below RTs)
│                  └─ Fixed Size: 120×88px
```

### Nesting Depth

```
Depth 0: Region (1 per diagram)
         └─ Root level container

Depth 1: VPC (1-4 per region)
         └─ Network isolation boundary

Depth 2: Subnet, IGW, Route Table, Security Group (multiple per VPC)
         └─ Network configuration layer

Depth 3: EC2 Instance (0 or more per subnet)
         └─ Compute resources
```

---

## Relationships & Connections

### Edge Types (4 Total)

#### 1. VPC → Subnet (Containment Edge)
- **Style ID:** `vpc-to-subnet`
- **Source:** VPC
- **Target:** Subnet
- **Line Style:** Solid 2px
- **Color:** `#8C4FFF` (Purple)
- **Semantic:** Subnet is contained within VPC
- **Count:** 1 per subnet (automatically created)
- **Visual Purpose:** Shows network hierarchy

**Creation Rules:**
- One edge created for each subnet
- Automatic - no manual configuration needed
- Represents strict containment relationship

#### 2. Subnet → EC2 Instance (Containment Edge)
- **Style ID:** `subnet-to-instance`
- **Source:** Subnet
- **Target:** EC2 Instance
- **Line Style:** Solid 2px
- **Color:** `#FF9900` (Orange)
- **Semantic:** Instance is deployed in subnet
- **Count:** 1 per instance (automatically created)
- **Visual Purpose:** Shows instance placement

**Creation Rules:**
- One edge created for each EC2 instance
- Automatic - no manual configuration needed
- Represents strict containment relationship

#### 3. Route Table → Subnet (Association Edge)
- **Style ID:** `rt-to-subnet`
- **Source:** Route Table
- **Target:** Subnet
- **Line Style:** Dashed 2px (4,4 pattern)
- **Color:** `#FFA000` (Gold/Orange)
- **Semantic:** Route table controls traffic routing for subnet
- **Count:** Variable (from AWS associations data)
- **Visual Purpose:** Shows functional relationship (not containment)

**Creation Rules:**
- Created from Route Table associations in AWS data
- Multiple RTs can connect to same subnet
- Dashed line indicates functional (not structural) relationship
- Non-destructive - doesn't affect layout

#### 4. Security Group → EC2 Instance (Association Edge)
- **Style ID:** `sg-to-instance`
- **Source:** Security Group
- **Target:** EC2 Instance
- **Line Style:** Dashed 1px (5,5 pattern)
- **Color:** `#DD344C` (Red)
- **Semantic:** Security group rules applied to instance
- **Count:** Variable (instances can have multiple SGs)
- **Visual Purpose:** Shows access control relationship

**Creation Rules:**
- Created from Security Group assignments in AWS data
- Multiple SGs can apply to same instance
- Thin dashed line indicates lightweight functional relationship
- Non-destructive - doesn't affect layout

---

## Positioning Strategy

### Philosophy

The positioning strategy is **dynamic, collision-free, and hierarchical**:
- Each level respects its parent's boundaries
- Siblings are positioned without overlaps
- Children automatically adjust when parents move
- All positions calculated during conversion (no runtime calculation)

### Region Positioning

**Algorithm:** Vertical Stack

```
Region 1: y = 0
Region 2: y = region1_height + 40px padding
Region 3: y = region1_height + region2_height + 80px padding
Region N: y = sum(previous_heights) + (N * 40px padding)
```

**Properties:**
- X Position: Always 0 (full width)
- Spacing: 40px between regions
- Width: Expands to fit widest VPC set
- Height: Sum of all children with padding

**Behavior:**
- Regions never overlap horizontally
- Sequential vertical stacking
- Children recursively adjust when region moves

### VPC Positioning

**Algorithm:** Horizontal Distribution within Region

```
VPC[i]:
  x = 100 + (i × 450px)
  y = 140 (relative to parent region)
  width = Dynamic (min 400px, expands to fit children)
  height = Dynamic (min 300px, expands to fit children)
```

**Properties:**
- Horizontal Spacing: 450px between VPC positions
- Vertical Position: 140px below region top
- Dynamic Width: Expands based on children
- Dynamic Height: Expands based on children with 40px padding

**Sizing Rules:**
1. Initial: 400×300px
2. After subnet placement: Expand to fit all subnets
3. After IGW placement: Check if IGWs extend beyond width
4. After RT placement: Check if RTs extend beyond width
5. After SG placement: Check if SGs extend beyond width
6. Final: Width/height calculated to fit all children with 40px padding

### Subnet Positioning

**Algorithm:** Vertical Stack with Collision Detection

```
Initial Position:
  x = vpc_x + 40px padding
  y = vpc_y + 120px (below IGWs)

Repositioning (collision prevention):
  current_y = vpc_y + 120
  for each subnet (sorted by y position):
    subnet.y = current_y
    adjust_children(subnet, y_offset)
    current_y = subnet.y + subnet.height + 20px margin
```

**Properties:**
- Horizontal Offset: 40px from VPC left edge
- Starting Y: 120px (below IGWs)
- Vertical Spacing: 100px nominal, adjusted for collision
- Minimum Margin: 20px between subnets

**Default Sizing:**
- Width: 200px (no children)
- Height: 80px (no children)
- Expanded: If contains EC2 instances
  - Width: Fit instances + 30px padding each side
  - Height: Fit instances + 30px padding top/bottom

**Special Behavior:**
- Repositioning is triggered automatically during conversion
- When subnet moves, all children (EC2 instances) move with it
- Margin is enforced to prevent collisions

### Internet Gateway Positioning

**Algorithm:** Horizontal Distribution

```
IGW_spacing = (vpc_width - 80px) / (igw_count + 1)

IGW[i]:
  x = vpc_x + 40px + ((i + 1) × IGW_spacing) - 60px
  y = vpc_y + 20px (near VPC top)
  width = 120px (fixed)
  height = 88px (fixed)
```

**Properties:**
- Vertical Position: 20px from VPC top
- Horizontal Distribution: Evenly spaced across VPC width
- Fixed Size: 120×88px
- Constraint: Must fit within VPC boundaries

### Route Table Positioning

**Algorithm:** Left-Side Vertical Stack

```
RT_x = vpc_x + 40px

Initial Y calculation (before subnets finalized):
  rt_y_start = vpc_y + 260px
  RT[i].y = rt_y_start + (i × 100px)

After subnet repositioning:
  rt_y_start = max(subnet.y + subnet.height) + 40px
  RT[i].y = rt_y_start + (i × 100px)
```

**Properties:**
- Horizontal Position: 40px from VPC left edge
- Vertical Start: 260px from VPC top (or below last subnet)
- Vertical Spacing: 100px between route tables
- Fixed Size: 120×88px

**Repositioning Trigger:**
- Automatic after subnet repositioning
- Ensures RTs don't overlap with subnets
- Dynamic start position calculation

### Security Group Positioning

**Algorithm:** Right-Side Vertical Stack

```
SG_x = vpc_x + vpc_width - 40px - 120px

Dynamic Y calculation:
  Get all RTs in this VPC
  max_rt_bottom = max(RT.y + RT.height for all RTs)
  sg_y_start = max_rt_bottom + 20px
  SG[i].y = sg_y_start + (i × 100px)
```

**Properties:**
- Horizontal Position: Right side (vpc_width - 160px from left)
- Vertical Start: 20px below last Route Table
- Vertical Spacing: 100px between security groups
- Fixed Size: 120×88px

**Smart Positioning:**
- Automatically calculates based on actual RT positions
- Prevents overlap with RTs and subnets
- Dynamic start position updates after RT repositioning

### EC2 Instance Positioning

**Algorithm:** Top-Left Alignment with Padding

```
Instance:
  x = subnet_x + 30px padding
  y = subnet_y + 30px padding
  width = 120px (fixed)
  height = 88px (fixed)
```

**Properties:**
- Alignment: Top-left corner of subnet
- Padding: 30px from left and top edges
- Fixed Size: 120×88px
- Constraint: Must fit within subnet with padding

**Behavior:**
- Automatically moves when parent subnet moves
- Y offset preserved during repositioning
- Validated to ensure within subnet bounds

---

## Sizing Algorithm

### 6-Pass Multi-Level Sizing

The sizing algorithm operates in 6 passes to ensure all containers perfectly fit their children:

#### Pass 1: Create Nodes at Minimal Sizes
- Region: Minimal (will expand)
- VPC: 400×300px
- Subnet: 200×80px
- Others: 120×88px
- **Purpose:** Establish base structure

#### Pass 2: _update_region_size() - Calculate from Children
```python
# Subnet sizing: Expand if has instances
for subnet in subnets:
    if subnet.has_children:
        subnet.width = max_child_x - subnet.x + 30px padding
        subnet.height = max_child_y - subnet.y + 30px padding
    else:
        subnet.width = 200px
        subnet.height = 80px

# VPC sizing: Expand to fit subnets + IGWs + RTs + SGs
for vpc in vpcs:
    max_right = max(child.x + child.width for all children)
    max_bottom = max(child.y + child.height for all children)
    vpc.width = max_right - vpc.x + 40px padding
    vpc.height = max_bottom - vpc.y + 40px padding

# Region sizing: Expand to fit all VPCs
for region in regions:
    max_right = max(vpc.x + vpc.width for all vpcs)
    max_bottom = max(vpc.y + vpc.height for all vpcs)
    region.width = max_right + 40px padding
    region.height = max_bottom + 40px padding
```
- **Result:** Tight initial fit

#### Pass 3: _reposition_subnets_to_prevent_collision()
- Method: Restack subnets vertically with margins
- Spacing: 20px minimum between subnets
- Adjustment: Move children (instances) with parent
- **Result:** No subnet overlaps

#### Pass 4: _recalculate_vpc_sizes()
- Recalculate VPC sizes after subnet repositioning
- Expansion: Based on actual final subnet positions
- Padding: 40px on all sides
- **Result:** VPCs fit repositioned subnets

#### Pass 5: _reposition_route_tables_and_security_groups()
- RT positioning: Vertical stack below final subnets
- SG positioning: Vertical stack below final RTs
- Dynamic calculation: Based on actual subnet/RT heights
- **Result:** No RT/SG/Subnet overlaps

#### Pass 6: Final Sizing + Validation
- _recalculate_vpc_sizes() after RT/SG repositioning
- _update_region_size() for final region sizing
- **Result:** All containers perfectly fit children

---

## Validation Methods

### 1. Node Overlap Detection

**Method:** `_check_node_overlaps()`

**Algorithm:** AABB (Axis-Aligned Bounding Box) Collision Detection

```python
def check_overlaps(nodes):
    overlaps = []
    for node1, node2 in pairs(nodes):
        # Only check same parent
        if node1.parentId != node2.parentId:
            continue
        
        x1, y1, w1, h1 = node1.x, node1.y, node1.width, node1.height
        x2, y2, w2, h2 = node2.x, node2.y, node2.width, node2.height
        
        # AABB collision: overlap if not separated
        if not (x1 + w1 < x2 or x2 + w2 < x1 or 
                y1 + h1 < y2 or y2 + h2 < y1):
            overlaps.append((node1.id, node2.id))
    
    return overlaps
```

**Scope:** Nodes within same parent container
**Result:** List of overlapping node pairs

**Status:**
- Single-region: ✅ Zero overlaps (33 nodes)
- Multi-region: ✅ Zero overlaps (162 nodes)

### 2. Edge Overlap Detection

**Method:** `_check_edge_overlaps()`

**Algorithm:** Line-Rectangle Intersection Detection

**Smart Filtering:**
- ✅ Allows parent-child edge crossings (expected)
- ✅ Allows sibling edges within same parent (acceptable)
- ⚠️ Flags problematic crossings with unrelated nodes

```python
def check_edge_overlaps(edges, nodes):
    overlaps = []
    for edge in edges:
        source = nodes[edge.source]
        target = nodes[edge.target]
        
        # Get line endpoints (node centers)
        sx, sy = source.center
        tx, ty = target.center
        
        # Check intersection with other nodes
        for node in nodes:
            if node.id in [source.id, target.id]:
                continue
            
            # Skip parent/child relationships
            if is_parent_child(edge, node):
                continue
            
            # Check line-rect intersection
            if line_rect_intersect(sx, sy, tx, ty, node):
                overlaps.append((edge.id, node.id))
    
    return overlaps
```

**Status:**
- Single-region: ✅ No problematic overlaps (17 edges)
- Multi-region: ✅ No problematic overlaps (71 edges)

### 3. Container Bounds Verification

**Method:** `_verify_container_bounds()`

**Check:** All children fit within parent boundaries

```python
def verify_bounds(containers):
    issues = []
    for container in containers:
        cx, cy = container.x, container.y
        cw, ch = container.width, container.height
        
        for child in container.children:
            x, y = child.x, child.y
            w, h = child.width, child.height
            
            # Check all boundaries
            if x < cx or y < cy or x+w > cx+cw or y+h > cy+ch:
                issues.append((container.id, child.id))
    
    return issues
```

**Status:**
- Single-region: ✅ All bounds valid
- Multi-region: ✅ All bounds valid

---

## Examples

### Example 1: Single VPC with Resources

```json
{
  "nodes": [
    {
      "id": "region-us-east-2",
      "type": "resourceNode",
      "position": { "x": 0, "y": 0 },
      "width": 1540,
      "height": 1054,
      "data": {
        "label": "Region: us-east-2",
        "resourceType": { "id": "region", "name": "Region" },
        "isContainer": true,
        "nestingDepth": 0
      }
    },
    {
      "id": "vpc-vpc-06cc31a57a405feb8",
      "type": "resourceNode",
      "position": { "x": 100, "y": 140 },
      "width": 915,
      "height": 625,
      "data": {
        "label": "vpc-06cc31a57a405feb8",
        "resourceType": { "id": "vpc", "name": "VPC" },
        "parentId": "region-us-east-2",
        "isContainer": true,
        "nestingDepth": 1,
        "vpcId": "vpc-06cc31a57a405feb8",
        "cidrBlock": "10.0.0.0/16"
      }
    },
    {
      "id": "subnet-subnet-0da1a05dfc8b55dc3",
      "type": "resourceNode",
      "position": { "x": 140, "y": 310 },
      "width": 380,
      "height": 200,
      "data": {
        "label": "subnet-0da1a05dfc8b55dc3",
        "resourceType": { "id": "subnet", "name": "Subnet" },
        "parentId": "vpc-vpc-06cc31a57a405feb8",
        "isContainer": true,
        "nestingDepth": 2,
        "subnetId": "subnet-0da1a05dfc8b55dc3",
        "cidrBlock": "10.0.1.0/24",
        "availabilityZone": "us-east-2a"
      }
    },
    {
      "id": "instance-i-0525e04aaef702279",
      "type": "resourceNode",
      "position": { "x": 150, "y": 340 },
      "width": 120,
      "height": 88,
      "data": {
        "label": "blazeops-agent-staging-backend-api",
        "resourceType": { "id": "ec2", "name": "EC2 Instance" },
        "parentId": "subnet-subnet-0da1a05dfc8b55dc3",
        "isContainer": false,
        "nestingDepth": 3,
        "instanceId": "i-0525e04aaef702279",
        "instanceType": "t3.small",
        "state": "running"
      }
    }
  ],
  "edges": [
    {
      "id": "vpc-to-subnet-vpc-vpc-06cc31a57a405feb8-subnet-subnet-0da1a05dfc8b55dc3",
      "source": "vpc-vpc-06cc31a57a405feb8",
      "target": "subnet-subnet-0da1a05dfc8b55dc3",
      "type": "smoothstep",
      "style": {
        "stroke": "#8C4FFF",
        "strokeWidth": 2
      }
    },
    {
      "id": "subnet-to-instance-subnet-subnet-0da1a05dfc8b55dc3-instance-i-0525e04aaef702279",
      "source": "subnet-subnet-0da1a05dfc8b55dc3",
      "target": "instance-i-0525e04aaef702279",
      "type": "smoothstep",
      "style": {
        "stroke": "#FF9900",
        "strokeWidth": 2
      }
    }
  ]
}
```

### Example 2: VPC with Route Table Association

```json
{
  "nodes": [
    {
      "id": "rt-rtb-01acacde45952b958",
      "position": { "x": 140, "y": 535 },
      "data": {
        "label": "rtb-01acacde45952b958",
        "resourceType": { "id": "routetable" },
        "parentId": "vpc-vpc-06cc31a57a405feb8",
        "nestingDepth": 2
      }
    }
  ],
  "edges": [
    {
      "id": "rt-to-subnet-rt-rtb-01acacde45952b958-subnet-subnet-0da1a05dfc8b55dc3",
      "source": "rt-rtb-01acacde45952b958",
      "target": "subnet-subnet-0da1a05dfc8b55dc3",
      "type": "smoothstep",
      "style": {
        "stroke": "#FFA000",
        "strokeWidth": 2,
        "strokeDasharray": "4,4"
      }
    }
  ]
}
```

---

## Current Diagram Statistics

### Single-Region Diagram (onload.json)
- **Nodes:** 33
  - Containers: 14 (1 Region + 4 VPCs + 9 Subnets)
  - Leaf Nodes: 19 (1 Instance + 4 IGWs + 7 Route Tables + 7 Security Groups)
- **Edges:** 17
  - VPC → Subnet: 9
  - Subnet → Instance: 1
  - Route Table → Subnet: 6
  - Security Group → Instance: 1
- **Nesting Levels:** 4 (Region, VPC, Subnets/Resources, Instances)
- **Status:** ✅ Clean (zero overlaps)

### Multi-Region Diagram (full.json)
- **Nodes:** 162 across 16 regions
- **Edges:** 71
- **Status:** ✅ Clean (zero overlaps)

---

## Conclusion

CloudBuilder's architecture provides:
- **Hierarchical Organization:** 4-level nesting structure
- **Dynamic Positioning:** Automatic, collision-free layout
- **Smart Sizing:** Multi-pass algorithm for perfect fit
- **Comprehensive Validation:** Node, edge, and bounds checking
- **Visual Clarity:** 4-color scheme for resource categories
- **Scalability:** Handles 162+ nodes without performance issues
