# Position Calculation in AWS Diagram Parser

## Overview
The diagram uses a hierarchical positioning system where each container calculates its children's positions based on grid layout and cumulative spacing.

---

## 1. REGION POSITIONING

**Starting Point:**
```typescript
const regionX = currentX;  // Always 0 (top-left)
const regionY = currentY;  // Incremented after each region
```

**Region Container Size:**
- **Width**: Based on number of VPCs
  ```
  regionContainerWidth = (vpcCount × maxVpcWidth) + ((vpcCount + 1) × vpcMarginBetween)
  ```
- **Height**: Based on tallest VPC + padding
  ```
  regionContainerHeight = (regionPadding × 2) + maxVpcHeight
  // regionPadding = 140px (top and bottom)
  ```

**Update for next region:**
```typescript
currentY += regionContainerHeight + regionMargin + s3Height;
```

---

## 2. VPC POSITIONING

**Horizontal Layout (within Region):**
```typescript
const vpcX = regionX + vpcMarginBetween + vpcIndex * (maxVpcWidth + vpcMarginBetween);
```

**Example with 2 VPCs:**
```
Region boundary (x=0)
├─ VPC 0: x = 0 + 100 + 0×(maxW + 100) = 100
└─ VPC 1: x = 0 + 100 + 1×(maxW + 100) = 100 + maxW + 100
```

**Vertical Position (always same):**
```typescript
const vpcY = regionY + regionPadding;  // regionPadding = 140
```

---

## 3. SUBNET POSITIONING (GRID LAYOUT)

Subnets are arranged in a **2-column grid** within each VPC.

**Horizontal Position (X):**
```typescript
const col = subnetIndex % 2;  // 0 or 1 (column index)
const subnetX = vpcX + vpcPadding + col * (subnetWidth + subnetMargin);
// subnetWidth = 380px
// subnetMargin = 25px
```

**Example layout:**
```
VPC (vpcX = 100)
├─ Subnet 0 (col=0): x = 100 + 40 + 0×(380+25) = 140
├─ Subnet 1 (col=1): x = 100 + 40 + 1×(380+25) = 545
├─ Subnet 2 (col=0): x = 100 + 40 + 0×(380+25) = 140 (new row)
└─ Subnet 3 (col=1): x = 100 + 40 + 1×(380+25) = 545 (new row)
```

**Vertical Position (Y) - Dynamic based on content:**
```typescript
const row = Math.floor(subnetIndex / 2);  // Row number
let subnetY = vpcY + vpcPadding + igwHeight + 30;

// Add heights of all previous rows
for (let i = 0; i < row; i++) {
  subnetY += rowHeights[i] + subnetMargin;
}
```

**Example:**
```
VPC (vpcY = regionY + 140)
├─ IGWs at top: 100px
├─ Subnet Row 0: y = vpcY + 40 + 100 + 30 = vpcY + 170
│  └─ Height: rowHeights[0] = 280px (calculated from subnet content)
├─ Subnet Row 1: y = vpcY + 170 + 280 + 25 = vpcY + 475
│  └─ Height: rowHeights[1] = 200px
└─ Route Tables at bottom
```

---

## 4. RESOURCES INSIDE SUBNETS

### EC2 Instances
**Horizontal (X) - Left aligned in rows:**
```typescript
const instanceMargin = 15;
const instanceWidth = 160;
const instanceX = subnetX + instancePadding + (instanceIndex * (instanceWidth + instanceMargin));
// instancePadding = 10px
```

**Vertical (Y) - Top of subnet:**
```typescript
const instanceY = subnetY + 30;  // 30px from top of subnet
```

### Load Balancers (inside public subnet)
**Position - Bottom right of subnet:**
```typescript
const natSubnetNode = nodes.find(n => n.id === `subnet-${ngw.SubnetId}`);
const subnetData = natSubnetNode.data;

const lbNodeX = natSubnetNode.position.x + (subnetData.size?.width || 380) - natWidth - 15;
const lbNodeY = natSubnetNode.position.y + 30;
```

### NAT Gateways (inside public subnet)
**Position - Right side of subnet:**
```typescript
const natWidth = 160;
const natX = natSubnetNode.position.x + (subnetData.size?.width || 380) - natWidth - 15;
const natY = natSubnetNode.position.y + 30;
```

### RDS Databases (inside private subnet)
**Position - Bottom area of subnet:**
```typescript
const rdsSubnetNode = nodes.find(n => n.id === `subnet-${rds.subnet_id}`);
const rdsX = rdsSubnetNode.position.x + 10;
const rdsY = rdsSubnetNode.position.y + (subnetData.size?.height || 120) - 50;
```

---

## 5. REGION-LEVEL RESOURCES

### Load Balancers (if at region level)
```typescript
const lbX = regionX + regionPadding;
const lbY = regionY + regionContainerHeight + vpcMarginBetween;
```

### S3 Buckets
```typescript
const s3X = regionX + regionPadding;
const s3Y = regionY + regionContainerHeight + vpcMarginBetween + (loadBalancers ? 120 : 0);
// Positioned below LBs
```

---

## 6. SECURITY GROUPS & ROUTE TABLES

### Security Groups (at bottom of VPC)
```typescript
const sgMarginBetween = 25;
const sgNodeWidth = 280;
const sgX = vpcX + vpcPadding + sgIndex * (sgNodeWidth + sgMarginBetween);
const sgY = vpcY + vpcContainerHeight - sgHeight - 50;
```

### Route Tables (at bottom of VPC)
```typescript
const rtMargin = 25;
const rtWidth = 280;
const rtX = vpcX + vpcPadding + rtIndex * (rtWidth + rtMargin);
const rtY = vpcY + vpcContainerHeight - rtTableHeight - sgHeight - vpcPadding + 30;
```

---

## 7. KEY SPACING CONSTANTS

| Constant | Value | Usage |
|----------|-------|-------|
| `regionPadding` | 140px | Top/bottom space inside region |
| `vpcMarginBetween` | 100px | Space between VPCs horizontally |
| `vpcPadding` | 40px | Inner padding inside VPC |
| `subnetWidth` | 380px | Fixed width of subnet container |
| `subnetMargin` | 25px | Space between subnets |
| `instanceWidth` | 160px | Fixed width of EC2 instance |
| `instanceMargin` | 15px | Space between instances |
| `natWidth` | 160px | NAT gateway width |
| `igwHeight` | 100px | Internet gateway area height |
| `rtTableHeight` | 120px | Route table area height |

---

## 8. CALCULATION FLOW SUMMARY

```
1. START: currentX = 0, currentY = 0

2. FOR EACH REGION:
   a. Calculate max heights of subnets (first pass)
   b. Calculate region dimensions
   c. Position region at (0, currentY)
   d. FOR EACH VPC:
      i. Position VPC at (regionX + offset, regionY + padding)
      ii. FOR EACH SUBNET (2-column grid):
          - Calculate grid position (x, y)
          - FOR EACH RESOURCE IN SUBNET:
            * Calculate position relative to subnet
      iii. Position IGWs, Route Tables, Security Groups
   e. Position S3 buckets below VPCs
   f. Update currentY += regionHeight

3. RESULT: Complete diagram with all positions calculated
```

---

## 9. COORDINATE SYSTEM

- **Origin (0, 0)**: Top-left corner of canvas
- **X increases**: Left to right →
- **Y increases**: Top to bottom ↓
- **Parent-relative positioning**: Each container positions children relative to its own position

