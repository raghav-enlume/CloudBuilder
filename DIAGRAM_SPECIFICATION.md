# Diagram Specification

## Technical Specification for CloudBuilder AWS Architecture Diagrams

This document provides the complete technical specification for converting AWS infrastructure data to CloudBuilder diagram format with collision-free, dynamically-positioned nodes and edges.

---

## 1. Overview

### 1.1 Purpose
CloudBuilder converts AWS infrastructure data (JSON) into interactive architecture diagrams with automatic layout, collision detection, and position validation.

### 1.2 Input Format
AWS infrastructure data in JSON format containing:
- Regions
- VPCs (Virtual Private Clouds)
- Subnets
- EC2 Instances
- Internet Gateways
- Route Tables
- Security Groups

### 1.3 Output Format
JSON diagram specification containing:
- Nodes (resource representations)
- Edges (connections/relationships)
- Positions (x, y coordinates)
- Sizes (width, height)
- Styling (colors, stroke styles)

### 1.4 Key Features
- ✅ Automatic collision-free positioning (with two-pass subnet repositioning)
- ✅ Dynamic container sizing
- ✅ Multi-level hierarchy (5 levels: Region → VPC → Subnet → SG → Instance)
- ✅ 5 edge types with distinct styling
- ✅ Comprehensive validation
- ✅ Region stacking support
- ✅ Recursive parent-child adjustment
- ✅ Zero subnet overlap prevention with 50px minimum spacing

---

## 2. Node Specification

### 2.1 Node Structure

```json
{
  "id": "unique-node-identifier",
  "type": "resourceNode",
  "position": { "x": 0, "y": 0 },
  "data": {
    "label": "Display Label",
    "resourceType": {
      "id": "resource-type-id",
      "name": "Resource Type Name",
      "category": "category",
      "icon": "icon-name",
      "color": "#RRGGBB",
      "description": "Description"
    },
    "parentId": "parent-node-id",
    "isContainer": true,
    "nestingDepth": 0,
    "size": { "width": 400, "height": 300 },
    // Resource-specific properties
    "resourceSpecificProperty": "value"
  },
  "width": 400,
  "height": 300
}
```

### 2.2 Mandatory Properties

All nodes must have:
- `id`: Unique identifier (string)
- `type`: Always `"resourceNode"`
- `position`: Object with `x` and `y` (numbers)
- `width`: Width in pixels (number)
- `height`: Height in pixels (number)
- `data.label`: Display label (string)
- `data.resourceType`: Resource type definition (object)
- `data.nestingDepth`: Nesting level (number 0-3)
- `data.isContainer`: Whether can contain children (boolean)

### 2.3 Optional Properties

- `data.parentId`: Parent node ID (for hierarchy)
- `data.size`: Size object (mirrors width/height)
- Resource-specific properties (vpcId, subnetId, etc.)

### 2.4 Resource-Specific Properties

#### Region
```json
{
  "label": "Region: us-east-2",
  "region": "us-east-2"
}
```

#### VPC
```json
{
  "label": "vpc-123456",
  "vpcId": "vpc-123456",
  "cidrBlock": "10.0.0.0/16",
  "dnsHostnamesEnabled": true,
  "state": "available",
  "isDefault": false
}
```

#### Subnet
```json
{
  "label": "subnet-123456",
  "subnetId": "subnet-123456",
  "vpcId": "vpc-123456",
  "cidrBlock": "10.0.1.0/24",
  "availabilityZone": "us-east-2a",
  "state": "available"
}
```

#### EC2 Instance
```json
{
  "label": "instance-name",
  "instanceId": "i-123456",
  "instanceType": "t3.small",
  "state": "running",
  "privateIpAddress": "10.0.1.119",
  "publicIpAddress": "3.142.252.53",
  "imageId": "ami-123456",
  "launchTime": "2024-01-08T10:30:00Z"
}
```

#### Route Table
```json
{
  "label": "rtb-123456",
  "routeTableId": "rtb-123456",
  "vpcId": "vpc-123456"
}
```

#### Internet Gateway
```json
{
  "label": "igw-123456",
  "gatewayId": "igw-123456"
}
```

#### Security Group
```json
{
  "label": "security-group-name",
  "groupId": "sg-123456",
  "groupName": "security-group-name",
  "vpcId": "vpc-123456",
  "description": "Description",
  "inboundRules": 3,
  "outboundRules": 1,
  "minHeight": 120,
  "minWidth": 120
}
```

---

## 3. Edge Specification

### 3.1 Edge Structure

```json
{
  "id": "edge-type-source-target",
  "source": "source-node-id",
  "target": "target-node-id",
  "animated": true,
  "type": "smoothstep",
  "style": {
    "stroke": "#RRGGBB",
    "strokeWidth": 2,
    "strokeDasharray": "4,4"
  }
}
```

### 3.2 Edge Types

#### Type 1: VPC → Subnet (Containment)
```json
{
  "id": "vpc-to-subnet-vpc-123-subnet-456",
  "source": "vpc-vpc-123",
  "target": "subnet-subnet-456",
  "type": "smoothstep",
  "style": {
    "stroke": "#8C4FFF",
    "strokeWidth": 2
  }
}
```

#### Type 2: Subnet → Security Group (Containment)
```json
{
  "id": "subnet-to-sg-subnet-456-sg-789",
  "source": "subnet-subnet-456",
  "target": "sg-sg-789",
  "type": "smoothstep",
  "style": {
    "stroke": "#FF6B35",
    "strokeWidth": 2
  }
}
```

#### Type 3: Security Group → EC2 Instance (Containment)
```json
{
  "id": "sg-to-instance-sg-789-instance-012",
  "source": "sg-sg-789",
  "target": "instance-i-012",
  "type": "smoothstep",
  "style": {
    "stroke": "#DD344C",
    "strokeWidth": 2
  }
}
```

#### Type 4: Route Table → Subnet (Association)
```json
{
  "id": "rt-to-subnet-rt-123-subnet-456",
  "source": "rt-rtb-123",
  "target": "subnet-subnet-456",
  "type": "smoothstep",
  "style": {
    "stroke": "#FFA000",
    "strokeWidth": 2,
    "strokeDasharray": "4,4"
  }
}
```

#### Type 5: Internet Gateway → VPC (Attachment)
```json
{
  "id": "igw-to-vpc-igw-123-vpc-456",
  "source": "igw-igw-123",
  "target": "vpc-vpc-456",
  "type": "smoothstep",
  "style": {
    "stroke": "#FFC107",
    "strokeWidth": 2,
    "strokeDasharray": "4,4"
  }
}
```

---

## 4. Positioning Specification

### 4.1 Coordinate System

- **Origin:** Top-left corner (0, 0)
- **X-axis:** Horizontal, increases rightward
- **Y-axis:** Vertical, increases downward
- **Unit:** Pixels

### 4.2 Position Rules by Resource Type

#### Region
```
position.x = 0 (always)
position.y = cumulative_height_of_previous_regions + padding(40px)
width = max(all VPC widths) + padding(40px)
height = sum(all VPC heights) + padding(40px)
```

#### VPC
```
position.x = 100 + (index * 450px)
position.y = 140 (relative to region)
width = max(children x + children width) - vpc.x + padding(40px)
height = max(children y + children height) - vpc.y + padding(40px)
```

#### Subnet
```
Initial:
  position.x = vpc.x + padding(40px)
  position.y = vpc.y + 120px

After collision detection (Two-Pass Repositioning):
  position.x = vpc.x + padding(40px)
  position.y = previous_subnet.y + previous_subnet.height + min_spacing(50px)

width = 200px (default) OR max(children) + padding(30px)
height = 80px (default) OR max(children) + padding(30px)

Notes:
  - First pass: Vertical stacking with 50px minimum spacing
  - Second pass: Reposition after subnet size expansion from SGs
  - Prevents collisions even when children are added later
```

#### Security Group (Container inside Subnet)
```
position.x = subnet.x + padding(30px)
position.y = subnet.y + padding(30px)
width = 120px (minimum, can expand for children)
height = 120px (minimum, can expand for children)

Container Role:
  - Acts as protective boundary for EC2 instances
  - Can contain multiple instances
  - Only SGs protecting instances are created (orphaned SGs filtered)
```

#### EC2 Instance
```
position.x = sg.x + padding(20px)  OR  subnet.x + padding(30px) (if no SG)
position.y = sg.y + padding(20px)  OR  subnet.y + padding(30px) (if no SG)
width = 120px (fixed)
height = 88px (fixed)

Placement:
  - Primary: Inside Security Group (nested within SG container)
  - Fallback: Directly in Subnet (if no SG)
```

### 4.3 Coordinate Transformations

#### Parent Relative Positioning
When moving a parent container, all children positions must be updated:

```python
def adjust_children_positions(parent_id, y_offset):
    for child in get_children(parent_id):
        child.position.y += y_offset
        if child.is_container:
            adjust_children_positions(child.id, y_offset)
```

#### Recursive Position Adjustment
Position changes propagate through hierarchy:
1. Region Y changes → All VPCs adjust
2. VPC moves → All Subnets/IGWs/RTs/SGs adjust
3. Subnet moves → All EC2 instances adjust

---

## 5. Sizing Specification

### 5.1 Size Rules

#### Fixed-Size Resources
- EC2 Instance: 120×88px
- Route Table: 120×88px
- Internet Gateway: 120×88px
- Security Group: 120×88px

#### Dynamic-Size Resources (Containers)

**Subnet:**
```
if has_children:
    width = max(child.x + child.width) - subnet.x + padding(30px)
    height = max(child.y + child.height) - subnet.y + padding(30px)
else:
    width = 200px (default)
    height = 80px (default)
```

**VPC:**
```
width = max(child.x + child.width) - vpc.x + padding(40px)
height = max(child.y + child.height) - vpc.y + padding(40px)
minimum_width = 400px
minimum_height = 300px
```

**Region:**
```
width = max(vpc.x + vpc.width) + padding(40px)
height = max(vpc.y + vpc.height) + padding(40px)
```

### 5.2 Padding/Margin Values

| Container | Padding | Notes |
|-----------|---------|-------|
| Region | 40px | All sides |
| VPC | 40px | All sides |
| Subnet | 30px | Instance/SG placement |
| Subnet spacing | 50px | Minimum margin between subnets (increased from 20px) |
| Security Group | 20px | Instance placement within SG |
| RT/IGW spacing | 100px | Vertical spacing |

### 5.3 Minimum Size Constraints

| Resource Type | Min Width | Min Height | Notes |
|---------------|-----------|------------|-------|
| Security Group | 120px | 120px | Acts as container for instances |
| EC2 Instance | 120px | 88px | Fixed size |
| Route Table | 120px | 88px | Fixed size |
| Internet Gateway | 120px | 88px | Fixed size |
| Subnet | 200px | 80px | Expands with children |
| VPC | 400px | 300px | Expands with children |
| Region | Dynamic | Dynamic | Expands with VPCs |

---

## 6. Conversion Algorithm

### 6.1 7-Pass Algorithm

#### Pass 1: Create Nodes at Minimal Sizes
- Create Region node with minimal size
- Create VPC nodes: 400×300px each
- Create Subnet nodes: 200×80px each
- Create resource nodes: 120×88px each
- **Purpose:** Establish base structure

#### Pass 2: _update_region_size()
- Calculate subnet sizes based on children
- Calculate VPC sizes to fit all children
- Calculate region size to fit all VPCs
- **Purpose:** Initial sizing pass

#### Pass 3: _reposition_subnets_to_prevent_collision()
- Restack subnets vertically with 20px margins
- Adjust child positions with parent move offset
- **Purpose:** Prevent subnet overlaps

#### Pass 4: _recalculate_vpc_sizes()
- Recalculate VPC sizes after subnet repositioning
- Update based on actual final subnet positions
- **Purpose:** Ensure VPCs fit repositioned subnets

#### Pass 5: _reposition_route_tables_and_security_groups()
- Position RTs below final subnets
- Position SGs below final RTs
- Calculate dynamic start positions
- **Purpose:** Prevent RT/SG overlaps

#### Pass 6: Final Sizing + Validation
- _recalculate_vpc_sizes() after RT/SG repositioning
- _update_region_size() for final region sizing
- **Purpose:** Final container sizing

#### Pass 7: _validate_all_positions()
- Check node overlaps (AABB collision)
- Check edge overlaps (line-rect intersection)
- Check container bounds validation
- **Purpose:** Verify all positions valid

### 6.2 Implementation Details

```python
def convert(aws_data):
    # Pass 1: Create nodes
    for region in aws_data:
        create_region_node(region)
        for vpc in region.vpcs:
            create_vpc_node(vpc)
            for subnet in vpc.subnets:
                create_subnet_node(subnet)
                for instance in subnet.instances:
                    create_instance_node(instance)
            for igw in vpc.igws:
                create_igw_node(igw)
            for rt in vpc.route_tables:
                create_rt_node(rt)
            for sg in vpc.security_groups:
                create_sg_node(sg)
    
    # Pass 2: Initial sizing
    update_region_size()
    
    # Pass 3: Subnet repositioning
    reposition_subnets_to_prevent_collision()
    
    # Pass 4: VPC sizing update
    recalculate_vpc_sizes()
    
    # Pass 5: RT/SG repositioning
    reposition_route_tables_and_security_groups()
    
    # Pass 6: Final sizing
    recalculate_vpc_sizes()
    update_region_size()
    
    # Pass 7: Validation
    validate_all_positions()
    
    return {nodes, edges}
```

---

## 7. Validation Specification

### 7.1 Node Overlap Detection

**Algorithm:** AABB (Axis-Aligned Bounding Box)

```
Two rectangles overlap if NOT:
  x1 + w1 < x2  (rect1 is left of rect2)
  OR x2 + w2 < x1  (rect2 is left of rect1)
  OR y1 + h1 < y2  (rect1 is above rect2)
  OR y2 + h2 < y1  (rect2 is above rect1)

If none of above conditions are true, rectangles overlap.
```

**Scope:** Only nodes with same parentId

**Output:** List of overlapping node pairs

### 7.2 Edge Overlap Detection

**Algorithm:** Line-Rectangle Intersection

**Smart Filtering:**
1. Skip edges with no source/target node
2. Skip parent-child edges (expected crossings)
3. Skip sibling edges within same parent (acceptable)
4. Check line-rectangle intersection for remaining

**Distance Threshold:** 100px squared (line-to-point distance)

**Output:** List of problematic edge-node intersections

### 7.3 Container Bounds Verification

**Algorithm:** Boundary Checking

```
For each container:
  For each child:
    Assert: child.x >= container.x
    Assert: child.y >= container.y
    Assert: child.x + child.width <= container.x + container.width
    Assert: child.y + child.height <= container.y + container.height
```

**Output:** List of out-of-bounds children

### 7.4 Validation Report

**Format:**
```
================================================
POSITION VALIDATION REPORT
================================================

✅ No node overlaps detected

✅ No problematic edge overlaps detected
   (Note: X edges cross region boundaries - this is expected)

✅ Container bounds validated

================================================
```

---

## 8. Color Specification

### 8.1 Color Values

| Category | Color | Hex | Resources |
|----------|-------|-----|-----------|
| Boundary | Deep Blue | `#3949AB` | Region |
| Networking | Purple | `#8C4FFF` | VPC, Subnet, Route Table |
| Compute | Orange | `#FF9900` | EC2, Internet Gateway |
| Security | Red | `#DD344C` | Security Group |
| Edge - Containment | Purple | `#8C4FFF` | VPC→Subnet |
| Edge - Containment | Orange | `#FF9900` | Subnet→Instance |
| Edge - Functional | Gold | `#FFA000` | Route Table→Subnet |
| Edge - Functional | Red | `#DD344C` | Security Group→Instance |

---

## 9. Performance Specifications

### 9.1 Supported Scales

- **Single Region:** Up to 33 nodes (tested)
- **Multi-Region:** Up to 162 nodes (tested)
- **Maximum Depth:** 4 levels
- **Maximum Siblings:** 16 regions, 4 VPCs per region

### 9.2 Algorithm Complexity

- Node overlap detection: O(n²) where n = nodes in container
- Edge overlap detection: O(e × n) where e = edges, n = nodes
- Container bounds checking: O(c × k) where c = containers, k = children per container
- Overall conversion: O(n) for node creation + O(n²) for validation

### 9.3 Conversion Time

- Single-region (33 nodes): ~100ms
- Multi-region (162 nodes): ~200ms

---

## 10. Error Handling

### 10.1 Node Creation Errors

**Missing Required Properties:**
- Error: "Node missing mandatory property: {property}"
- Action: Skip node, log warning

**Invalid Position:**
- Error: "Invalid position for {node_id}: x={x}, y={y}"
- Action: Use default position (0, 0)

### 10.2 Sizing Errors

**Infinite Loop Prevention:**
- Maximum iterations: 6 passes
- If sizing doesn't converge: log warning, use current size

**Child Exceeds Parent:**
- Warning: "Child {child_id} exceeds parent {parent_id}"
- Action: Log coordinate details, continue

### 10.3 Validation Errors

**No Critical Failures:**
- All validation is informational
- Overlaps reported but don't prevent conversion
- Conversion always succeeds with validation report

---

## 11. Examples

### 11.1 Single Region Output

```json
{
  "nodes": 33,
  "edges": 17,
  "size": { "width": 1890, "height": 1054 },
  "regions": 1,
  "vpcs": 4,
  "subnets": 9,
  "instances": 1,
  "validation": {
    "nodeOverlaps": 0,
    "edgeOverlaps": 0,
    "boundErrors": 0
  }
}
```

### 11.2 Multi-Region Output

```json
{
  "nodes": 162,
  "edges": 71,
  "regions": 16,
  "vpcs": 40,
  "subnets": 80,
  "instances": 2,
  "validation": {
    "nodeOverlaps": 0,
    "edgeOverlaps": 0,
    "boundErrors": 0
  }
}
```

---

## 12. Compliance

### 12.1 CloudBuilder Format

All output conforms to CloudBuilder diagram JSON format:
- ✅ Node structure matches specification
- ✅ Edge structure matches specification
- ✅ Position values are valid numbers
- ✅ Color values are valid hex codes
- ✅ All required properties present

### 12.2 AWS Data Accuracy

- ✅ All AWS IDs preserved exactly
- ✅ All properties mapped to correct fields
- ✅ CIDR blocks preserved
- ✅ Availability zones preserved
- ✅ Resource states captured

### 12.3 Hierarchy Accuracy

- ✅ Parent-child relationships match AWS data
- ✅ Nesting depth correctly calculated
- ✅ Container flags accurate
- ✅ All associations represented

---

## 13. Conclusion

This specification defines the complete conversion process from AWS infrastructure data to CloudBuilder diagrams with:
- Automatic collision-free positioning
- Dynamic multi-level sizing
- Comprehensive validation
- Visual clarity through color coding
- Support for regions, VPCs, subnets, instances, and network resources
