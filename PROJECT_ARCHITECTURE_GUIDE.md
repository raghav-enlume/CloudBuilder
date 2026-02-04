# CloudBuilder - AWS Architecture Diagram Tool

**CloudBuilder** is a streamlined AWS infrastructure visualization tool that converts flat array JSON data into clean, professional React Flow diagrams with automatic ELK-based layout.

---

## 🏗️ Current Architecture

```
CloudBuilder/
├── src/
│   ├── components/
│   │   ├── diagram/
│   │   │   ├── DiagramBuilder.tsx      # Main diagram component
│   │   │   ├── DiagramCanvas.tsx       # React Flow canvas with ELK layout
│   │   │   ├── Toolbar.tsx             # File upload interface
│   │   │   ├── ResourceSidebar.tsx     # Resource properties panel
│   │   │   ├── PropertiesPanel.tsx     # Node properties (read-only)
│   │   │   └── ResourceNode.tsx        # Static resource nodes (no editing)
│   │   └── ui/                         # shadcn-ui components
│   ├── lib/
│   │   ├── flatArrayConverter.ts       # Import orchestration + ELK layout
│   │   ├── graphLayout.ts              # ELK layout engine integration
│   │   ├── awsDataParser.ts            # AWS resource parsing (4227 lines)
│   │   ├── dbJsonParser.ts             # Flat array → AWS format conversion
│   │   ├── iconMapper.tsx              # AWS icon mappings
│   │   └── costCalculator.ts           # Resource cost estimation
│   ├── store/
│   │   └── diagramStore.ts             # Zustand state management
│   └── data/
│       ├── resources.ts                # Resource type definitions
│       └── templates.ts                # Pre-built templates
```

---

## 📊 Data Input Format

### Flat Array JSON Structure
```json
[
  {
    "region": "us-east-1",
    "total_resources": 14,
    "resources": [
      {
        "region": "us-east-1",
        "cloud_resource_id": "vpc-12345",
        "resource_name": "Production VPC",
        "resource_type": "VPC",
        "resource_property": {
          "VpcId": "vpc-12345",
          "CidrBlock": "10.0.0.0/16"
        }
      },
      {
        "region": "us-east-1",
        "cloud_resource_id": "i-12345",
        "resource_name": "web-server",
        "resource_type": "EC2",
        "resource_property": {
          "InstanceId": "i-12345",
          "VpcId": "vpc-12345",
          "SubnetId": "subnet-public-1"
        }
      }
    ]
  }
]
```

**Key Characteristics:**
- ✅ Flat array structure (not hierarchical)
- ✅ Each resource is a complete object
- ✅ `resource_type` determines AWS service
- ✅ `resource_property` contains AWS attributes
- ✅ Auto-converted to diagram with ELK layout

---

## 🔄 Import & Layout Process

### Single-Step Conversion
```
Flat Array JSON
    ↓
flatArrayConverter.ts
├─ Detect format (flat-array)
├─ Convert to ArchitectureDataset
├─ Build graph nodes & edges
└─ Apply ELK layout automatically
    ↓
Professional Diagram Ready
```

### ELK Layout Features
- **Automatic Positioning**: No manual layout needed
- **Hierarchical Structure**: VPCs → Subnets → Resources
- **Connection-Aware**: Edges influence positioning
- **Professional Spacing**: Clean, readable diagrams
- **Container Sizing**: Auto-sized based on content
- **Configurable Options**: Direction, spacing, algorithms, and positioning rules

### ELK Configuration Options

```typescript
interface ElkLayoutConfig {
  // Root level options
  rootDirection?: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';        // Default: 'DOWN'
  rootSpacing?: number;                                    // Default: 30 (increased for better spacing)
  rootLayerSpacing?: number;                              // Default: 40 (increased for better spacing)

  // Container options
  vpcDirection?: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';        // Default: 'RIGHT'
  subnetDirection?: 'DOWN' | 'RIGHT' | 'LEFT' | 'UP';     // Default: 'DOWN'
  containerPadding?: string;                              // Default: '[top=25,left=15,bottom=15,right=15]'
  nodeSpacing?: number;                                   // Default: 25 (increased for better node spacing)

  // Algorithm options
  algorithm?: 'layered' | 'mrtree' | 'radial' | 'force' | 'disco' | 'box' | 'fixed';
                                                         // Default: 'layered'

  // Advanced positioning options
  nodeNodeBetweenLayers?: number;                         // Default: 35
  edgeNodeBetweenLayers?: number;                         // Default: 15
  considerModelOrder?: 'NONE' | 'NODES_AND_EDGES' | 'EDGES';
  cycleBreaking?: 'GREEDY' | 'INTERACTIVE' | 'MODEL_ORDER';
  layering?: 'NETWORK_SIMPLEX' | 'LONGEST_PATH' | 'COFFMAN_Graham';
  crossingMinimization?: 'LAYER_SWEEP' | 'SIMPLE';
  nodePlacement?: 'BRANDES_KOEPF' | 'LINEAR_SEGMENTS' | 'INTERACTIVE' | 'SIMPLE';
}
```

### Available Layout Presets

- **Default**: Balanced spacing (25px between nodes)
- **Compact**: Tight spacing (8px between nodes) - most dense
- **Wide**: Horizontal layout with moderate spacing
- **Presentation**: Professional spacing (40px between nodes)
- **Spacious**: Maximum breathing room (50px between nodes) - NEW!

**Compact Layout:**
```typescript
const compactConfig = {
  rootSpacing: 20,
  rootLayerSpacing: 30,
  nodeSpacing: 15,
  containerPadding: '[top=20,left=10,bottom=10,right=10]',
  vpcDirection: 'DOWN',  // Vertical VPC layout
  subnetDirection: 'RIGHT'  // Horizontal subnet layout
};
```

**Wide Layout:**
```typescript
const wideConfig = {
  rootDirection: 'RIGHT',  // Horizontal root layout
  rootSpacing: 60,
  rootLayerSpacing: 80,
  nodeSpacing: 40,
  vpcDirection: 'DOWN',   // Vertical VPC layout
  subnetDirection: 'RIGHT'  // Horizontal subnet layout
};
```

**Alternative Algorithms:**
```typescript
const forceConfig = {
  algorithm: 'force',  // Force-directed layout
  rootDirection: 'DOWN'
};

const radialConfig = {
  algorithm: 'radial',  // Radial layout
  rootDirection: 'DOWN'
};
```

---

## 🎨 Visual Design

### Professional Styling
- **Colors**: Muted corporate palette (no rainbow effects)
- **Edges**: Smoothstep curves with proper arrows
- **Labels**: Transparent, small, non-editable
- **Containers**: Clean borders with subtle backgrounds
- **Icons**: AWS official icons with consistent sizing

### Connection Types
| Connection | Color | Purpose |
|-----------|-------|---------|
| Internet Access | Blue (#2563EB) | Public connectivity |
| Load Balancer | Purple (#7C3AED) | Traffic distribution |
| Database | Green (#16A34A) | Data connections |
| Routing | Gray (#6B7280) | Network routing |
| Security | Red (#DC2626) | Access control |

---

## 🛠️ Core Components

### 1. **flatArrayConverter.ts** (117 lines)
```typescript
// Main import function with ELK configuration
export async function convertFlatArrayImport(
  data: any,
  applyLayout: boolean = true,
  elkConfig?: ElkLayoutConfig
): Promise<{ nodes: Node[]; edges: Edge[] } | null>
```
- Format detection (flat-array, diagram, unknown)
- Architecture dataset conversion
- ELK layout orchestration with custom configuration
- Error handling

### Using Custom ELK Configuration

```typescript
import { convertFlatArrayImport } from './lib/flatArrayConverter';
import { compactLayout, wideLayout, internetFriendlyLayout } from './lib/elkConfigs';

// Use compact layout for dense arrangements
const result = await convertFlatArrayImport(data, true, compactLayout);

// Use wide layout for horizontal expansion
const result = await convertFlatArrayImport(data, true, wideLayout);

// Use internet-friendly layout to prevent overlap between groups and internet nodes
const result = await convertFlatArrayImport(data, true, internetFriendlyLayout);

// Use custom configuration
const customConfig = {
  rootDirection: 'RIGHT',
  vpcDirection: 'DOWN',
  rootSpacing: 60,
  nodeSpacing: 40
};
const result = await convertFlatArrayImport(data, true, customConfig);
```

### 2. **graphLayout.ts** (134 lines)
```typescript
// ELK integration
export async function layoutGraphWithELK(
  nodes: Node[],
  edges: Edge[]
): Promise<Node[]>
```
- Eclipse Layout Kernel integration
- Hierarchical layout algorithm
- Direction control (RIGHT for VPCs, DOWN for subnets)
- Professional positioning

### 3. **awsDataParser.ts** (4227 lines)
- 50+ AWS resource type handlers
- Node and edge creation
- Connection logic (EC2→RDS, EC2→NAT, etc.)
- Resource property mapping

### 4. **ResourceNode.tsx** (178 lines)
- Static resource display (no editing)
- AWS icon rendering
- Hover effects and selection
- Clone and delete actions only

### 5. **elkConfigs.ts** (New)
- Pre-built layout configurations (compact, wide, vertical, etc.)
- Force-directed and radial layout options
- Presentation and minimal spacing configurations
- **Internet-friendly layout**: Maximum clearance for internet gateways
- Easy-to-use presets for common layout needs

### 6. **examples/elkLayoutExamples.ts** (New)
- Code examples showing how to use custom ELK configurations
- Different layout algorithms and directions
- Real-world usage patterns

---

## 🚀 Usage

### Import Process
1. **Upload**: Click "Upload AWS Data" in toolbar
2. **Select**: Choose flat array JSON file
3. **Auto-Generate**: Diagram renders instantly with:
   - Professional ELK layout
   - Color-coded connections
   - Proper containment hierarchy
   - Clean visual styling

### Supported Resources (50+)
- **Compute**: EC2, Lambda, ECS, EKS
- **Storage**: S3, EBS, EFS
- **Database**: RDS, DynamoDB, ElastiCache
- **Networking**: VPC, Subnets, IGW, NAT, Route Tables
- **Load Balancing**: ALB, NLB, Target Groups
- **Security**: Security Groups (floating elements)

---

## 🎯 Key Features

### ✅ Current Features
- **Automatic ELK Layout**: Professional positioning
- **Flat Array Import**: Simple JSON format
- **50+ AWS Resources**: Comprehensive coverage
- **Color-Coded Edges**: Visual connection types
- **Container Hierarchy**: VPC → Subnet → Resources
- **Clean UI**: Minimal, focused interface
- **Internet-Friendly Layout**: Prevents overlap between internet nodes and groups
- **Static Labels**: No editing, pure visualization

### ❌ Removed Features
- Manual layout controls (intentionally removed)
- Resource name editing (simplified to read-only)
- Custom layout engines (replaced with ELK)
- Complex UI controls (streamlined experience)

---

## 📈 Architecture Benefits

### ELK Layout Advantages
- **Professional Quality**: Industry-standard layout algorithm
- **Zero Configuration**: Automatic optimal positioning
- **Connection-Aware**: Edges influence node placement
- **Scalable**: Handles large architectures efficiently
- **Consistent**: Same layout every time

### Simplified User Experience
- **One-Click Import**: Upload → Instant diagram
- **No Manual Steps**: Everything automated
- **Clean Interface**: Focus on visualization, not configuration
- **Reliable Results**: Consistent, professional output

---

## 🔧 Technical Implementation

### Import Flow
```typescript
// User uploads file
handleImport(file) →
  parseImportFormat(data) → "flat-array" →
  convertFlatArrayToArchitectureDatasets(data) →
  buildArchitectureGraph(dataset) →
  layoutGraphWithELK(nodes, edges) →
  loadDiagram(nodes, edges)
```

### Layout Directions
- **VPC Level**: RIGHT direction (horizontal flow)
- **Subnet Level**: DOWN direction (vertical flow)
- **Resource Level**: ELK-optimized positioning

### Connection Logic
```typescript
// Automatic edge creation
EC2 instances → RDS databases (same VPC)
EC2 instances → NAT gateways (public subnets)
EC2 instances → Internet Gateway (public access)
Route tables → IGW/NAT (routing rules)
```

---

## 📝 Current Limitations

- **Input Format**: Flat array JSON only (most common)
- **Layout Control**: No manual positioning (by design)
- **Editing**: No resource modification (read-only visualization)
- **Export**: Diagram viewing only (no save functionality)

---

## 🎯 Summary

**CloudBuilder** is a focused, professional AWS architecture visualization tool that:

1. **Takes** flat array JSON exports
2. **Applies** automatic ELK layout
3. **Creates** clean, color-coded diagrams
4. **Delivers** instant professional results

The tool prioritizes reliability and simplicity over complex features, providing a streamlined experience for AWS architecture visualization.

