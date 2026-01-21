# Architect Playhouse - User Guide

Welcome to **Architect Playhouse**, an interactive AWS architecture diagram builder. This application allows you to design, visualize, and manage complex cloud infrastructure architectures with ease.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [User Interface Overview](#user-interface-overview)
3. [Creating Diagrams](#creating-diagrams)
4. [Working with Resources](#working-with-resources)
5. [Managing Connections](#managing-connections)
6. [Properties and Customization](#properties-and-customization)
7. [File Operations](#file-operations)
8. [Advanced Features](#advanced-features)
9. [Tips and Tricks](#tips-and-tricks)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Application

Simply visit the application URL in your web browser. The application is fully responsive and works on desktop browsers (Chrome, Firefox, Safari, Edge).

### First Time Users

When you first open the application, you'll see:
- **Left Sidebar**: Resource library with AWS components
- **Center Canvas**: Interactive drawing area
- **Top Toolbar**: Action buttons and controls
- **Right Panel**: Properties editor (appears when you select items)

No installation or setup required—start building immediately!

---

## User Interface Overview

### Left Sidebar - Resource Library

**Purpose**: Browse and select AWS resources to add to your diagram

**Features**:
- **Search Bar**: Quickly find resources by name or description
- **Resource Categories**: Organized by service type:
  - 🖥️ **Compute**: EC2, Lambda, ECS, Fargate, Auto Scaling
  - 💾 **Storage**: S3, EBS, Glacier
  - 🗄️ **Database**: RDS, DynamoDB, ElastiCache
  - 🌐 **Networking**: VPC, Subnet, Internet Gateway, Route Table, NAT Gateway
  - 🔒 **Security**: IAM Roles, Security Groups, ACL
  - 📊 **Analytics**: Kinesis
  - 💬 **Messaging**: SQS, SNS, EventBridge
  - 🎯 **CDN/API**: CloudFront, API Gateway, ALB
  - 👁️ **Monitoring**: CloudWatch

**How to Use**:
1. Search for a resource (e.g., "EC2")
2. Drag the resource onto the canvas
3. Release to place it in your diagram

### Top Toolbar

**Left Section - File Operations**:
- 📥 **Import**: Load saved diagrams or AWS JSON data
- 📤 **Export**: Save diagrams as JSON or ZIP files
- 🗑️ **Clear**: Remove all elements from the canvas

**Middle Section - Editing**:
- ↶ **Undo**: Revert last action
- ↷ **Redo**: Restore undone action
- 📦 **Templates**: Load predefined architecture templates
- ☁️ **AWS Data**: Import AWS infrastructure data

**Right Section - Visual Aids**:
- Zoom controls
- Pan controls
- Fit to view

### Canvas Area

**The main working area** where your architecture diagram is built:
- **Gray background**: Indicates the working canvas
- **Grid alignment**: Resources snap to grid for alignment
- **Zoom support**: Scroll to zoom, use mouse wheel
- **Pan support**: Click and drag to move around
- **Selection**: Click resources to select them

### Right Properties Panel

**Appears when you select a resource**:
- **Resource Details**: Name, type, and configuration
- **Styling Options**: Color, size customization
- **Connections**: View and manage relationships
- **Metadata**: ID, tags, and other properties

---

## Creating Diagrams

### Method 1: Building from Scratch

1. **Open the Application**: Start with a blank canvas
2. **Add Your First Resource**:
   - Click and drag a resource from the left sidebar
   - Place it on the canvas by releasing the mouse
3. **Add More Resources**: Repeat for each component
4. **Arrange**: Drag resources to organize your layout
5. **Connect**: Draw connections between related resources
6. **Save**: Export your diagram

### Method 2: Using Templates

1. Click the **📦 Templates** button in the toolbar
2. Select a predefined architecture pattern (e.g., "3-tier web app", "microservices")
3. The template loads with suggested resources
4. Customize as needed for your use case
5. Save your diagram

### Method 3: Importing AWS Data

1. Click **☁️ AWS Data** in the toolbar
2. Upload a JSON file containing your AWS infrastructure (exported from AWS console or CLI)
3. The application automatically:
   - Parses AWS resources
   - Creates appropriate diagram nodes
   - Arranges them in a hierarchical layout
   - Applies color coding by resource type
4. Review and customize the generated diagram

### Resource Hierarchy

The application maintains a strict hierarchy for valid architectures:

```
Region (Container)
├── VPC (Container)
│   ├── Subnet (Container)
│   │   ├── Security Group (Container)
│   │   │   └── EC2 Instance (Resource)
│   │   └── NAT Gateway (Resource)
│   ├── Internet Gateway (Resource)
│   └── Route Table (Resource)
└── Other Regional Resources
```

**Key Points**:
- Resources must be placed in appropriate containers
- The system validates containment automatically
- Invalid placements will show a warning

---

## Working with Resources

### Adding Resources

**Drag and Drop Method**:
1. Find resource in sidebar
2. Click and hold to drag
3. Hover over the canvas
4. Release to place
5. Adjust position by dragging

**Search Method** (for large resource list):
1. Type in search box (e.g., "EC2")
2. Matching resources appear below
3. Drag matching resource to canvas

### Selecting Resources

- **Single Click**: Select one resource
- **Click and Drag**: Select multiple resources (creates a selection box)
- **Ctrl+Click** (or **Cmd+Click**): Add/remove resources from selection

### Moving Resources

1. Click on a resource to select it
2. Drag to new position
3. Release to place
4. Resources auto-align to grid

### Resizing Resources

For **container resources** (VPC, Subnet, Security Group):
1. Select the resource
2. Look for resize handles at the edges
3. Drag handles to resize
4. Container automatically adjusts to fit children

### Deleting Resources

1. Select the resource(s)
2. Press **Delete** or **Backspace** key
3. Or right-click and select "Remove"

**⚠️ Warning**: Deleting a container removes all contained resources!

### Duplicating Resources

1. Select the resource
2. Press **Ctrl+D** (or **Cmd+D** on Mac)
3. Duplicated resource appears with offset
4. Drag to desired position

### Resource Icons

Each resource displays an icon representing its type:
- **Compute resources**: CPU/server icons
- **Database resources**: Cylinder/database icons
- **Network resources**: Cloud/network icons
- **Storage resources**: Drive/bucket icons
- **Security resources**: Lock/shield icons

---

## Managing Connections

### Connection Types

The application supports multiple connection types:

| Connection Type | Meaning | Example |
|---|---|---|
| **Containment** | Parent-child relationship | VPC contains Subnet |
| **Network Flow** | Data flows between services | EC2 → Load Balancer |
| **Dependency** | One resource requires another | App Server → Database |
| **Reference** | One resource references another | IAM Role ← EC2 |

### Creating Connections

**Method 1: Connection Handles**:
1. Hover over a resource
2. Small connection points appear at edges
3. Click and drag from one point to another
4. Release on the target resource

**Method 2: Context Menu**:
1. Right-click on a resource
2. Select "Connect to..."
3. Choose the target resource from list

**Method 3: Toolbar Button**:
1. Select source resource
2. Click "Create Connection" button
3. Click target resource

### Editing Connections

1. Click on the connection line
2. The line highlights
3. Right-click for options:
   - **Change Type**: Modify connection type
   - **Edit Label**: Add or change connection label
   - **Delete**: Remove the connection
   - **Style**: Customize color/thickness

### Deleting Connections

1. Click on the connection line to select
2. Press **Delete** or **Backspace**
3. Or right-click → Remove

### Connection Validation

The system validates connections:
- ✅ VPC ↔ Subnet connections are allowed
- ✅ Subnet ↔ EC2 connections are allowed
- ❌ EC2 ↔ Lambda connections shown with warning
- ⚠️ Invalid connections appear in orange color

---

## Properties and Customization

### Accessing Properties

1. **Select a resource** by clicking on it
2. The **Properties Panel** opens on the right
3. Edit properties as needed

### Common Properties

**For All Resources**:
- **Name**: Display label (double-click on canvas to edit)
- **Type**: Resource type (read-only)
- **Color**: Customize appearance
- **Width/Height**: Adjust size (containers only)
- **Tags**: Add metadata labels

**For Specific Resources**:
- **EC2 Instances**: Instance type, AMI, tags
- **Databases**: Engine type, version, storage
- **Load Balancers**: Protocol, port mappings
- **Security Groups**: Rule descriptions

### Styling Options

**Color Coding**:
- Each resource type has a default color
- Click color swatch to change
- Colors help identify resource types

**Borders and Strokes**:
- Solid, dashed, or dotted lines
- Custom thickness (1-5 pixels)
- Transparency adjustment

**Labels**:
- Add text labels for clarity
- Position labels around resources
- Customize font size and color

### Custom Annotations

**Text Labels**:
1. Use **Text** tool from toolbar
2. Click on canvas to place
3. Type your annotation
4. Style using properties panel

**Comments**:
1. Click resource
2. In properties panel, scroll to "Comments"
3. Add descriptive text
4. Comments are shown on hover

---

## File Operations

### Saving Your Work

**Save as JSON**:
1. Click **📤 Export** in toolbar
2. Select **Save as JSON**
3. File downloads as `architecture-diagram.json`
4. Contains all nodes, edges, and positions

**Save as ZIP** (with images):
1. Click **📤 Export**
2. Select **Export as ZIP**
3. Creates package containing:
   - `diagram.json` (structure)
   - `diagram.png` (visual export)
   - `diagram.svg` (scalable graphics)

### Loading Saved Diagrams

**Load JSON Diagram**:
1. Click **📥 Import** in toolbar
2. Select **Import Diagram**
3. Choose saved JSON file
4. Diagram loads with all elements and connections

**Load from File**:
1. Click **📥 Import**
2. Click "Choose File"
3. Navigate to JSON file
4. Open

### Working with AWS Data

**Import AWS Infrastructure**:
1. Click **☁️ AWS Data** in toolbar
2. Click "Choose File"
3. Select exported AWS JSON file
4. The application:
   - Parses all resources
   - Creates diagram nodes
   - Calculates optimal positions
   - Applies color coding
   - Shows resource count

**Supported AWS Export Formats**:
- AWS CLI JSON export
- AWS Console JSON download
- Custom JSON following AWS structure

### Clearing the Canvas

1. Click **🗑️ Clear** button
2. Confirm in dialog
3. All elements removed
4. Canvas ready for new diagram

### Undo/Redo

- **Undo**: Click **↶** button (or Ctrl+Z)
- **Redo**: Click **↷** button (or Ctrl+Y)
- Works for all operations: add, delete, move, style changes

---

## Advanced Features

### Multi-Selection and Batch Operations

1. **Select Multiple**:
   - Click and drag to create selection box
   - Hold Ctrl/Cmd and click to add/remove items
   - Click resource and Shift+click another to select range

2. **Batch Operations**:
   - Apply same color to all selected resources
   - Move all selected resources together
   - Delete multiple resources at once
   - Change properties for group

### Layout Adjustment

**Auto-Layout**:
- Click **Auto-Layout** button (if available)
- System calculates optimal positions
- Eliminates overlaps
- Maintains relationships

**Manual Alignment**:
1. Select multiple resources
2. Right-click → Alignment options:
   - **Align Left**: Line up left edges
   - **Align Right**: Line up right edges
   - **Align Top**: Line up top edges
   - **Align Bottom**: Line up bottom edges
   - **Distribute Horizontally**: Equal horizontal spacing
   - **Distribute Vertically**: Equal vertical spacing

### Hierarchical Collapse

For complex diagrams with many containers:
1. Right-click on container (VPC, Subnet, etc.)
2. Select **Collapse**
3. Container shrinks to hide children
4. Click **Expand** to show children again
5. Useful for focusing on specific areas

### Zoom and Pan

- **Zoom In**: Scroll wheel up (or +)
- **Zoom Out**: Scroll wheel down (or -)
- **Fit to View**: Press 'F' or use toolbar button
- **Pan**: Hold spacebar and drag
- **Reset View**: Click reset button in toolbar

### Validation Report

Generate a validation report to check your diagram:
1. Click **Validate** button (toolbar)
2. Report shows:
   - ✅ Valid connections
   - ⚠️ Warnings (unusual patterns)
   - ❌ Errors (invalid configurations)
   - 📊 Resource count by type

### Export Options

**Image Formats**:
- **PNG**: Raster image (best for web)
- **SVG**: Vector image (best for printing/scaling)
- **PDF**: Document format (best for sharing)

**Data Formats**:
- **JSON**: Full diagram data structure
- **YAML**: Alternative data format
- **CSV**: Resource inventory

---

## Tips and Tricks

### Productivity Tips

1. **Use Search**: Instead of scrolling sidebar, type resource name
2. **Keyboard Shortcuts**:
   - `Delete` or `Backspace`: Delete selected
   - `Ctrl+D` (Cmd+D): Duplicate
   - `Ctrl+Z` (Cmd+Z): Undo
   - `Ctrl+Y` (Cmd+Y): Redo
   - `Ctrl+A` (Cmd+A): Select all
   - `F`: Fit to view
   - `Escape`: Deselect all

3. **Drag Templates**: Some resources can be dragged directly from examples

4. **Color Consistency**: Use the color palette to maintain consistency across diagrams

5. **Naming Convention**: Use clear, consistent names for resources (e.g., "web-server-1", "db-prod")

### Common Architecture Patterns

**3-Tier Architecture**:
1. Load Balancer → Web Tier (EC2s in Auto Scaling Group)
2. Web Tier → App Tier (EC2s)
3. App Tier → Database Tier (RDS)
4. Cache Layer (ElastiCache) between tiers

**Microservices**:
1. API Gateway as entry point
2. Multiple Lambda functions or ECS services
3. RDS databases for persistence
4. Message queues (SQS/SNS) for async communication
5. CloudWatch for monitoring

**Serverless**:
1. API Gateway entry point
2. Lambda functions for logic
3. DynamoDB for data
4. S3 for storage
5. CloudWatch Logs for monitoring

### Organizing Large Diagrams

1. **Use Multiple Regions**: Spread resources across regions
2. **Collapse Containers**: Hide unnecessary details
3. **Layer by Function**: Group by service (frontend, backend, database)
4. **Color Coding**: Use colors to identify tiers or environments
5. **Documentation**: Add text labels and comments

### Accessibility Features

- **High Contrast**: Colors are chosen for visibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Compatible with assistive technologies
- **Text Labels**: All icons have descriptive labels on hover

---

## Troubleshooting

### Common Issues

**Issue: Resources not staying in container**
- **Cause**: Resource might be incompatible with container type
- **Solution**: Check resource hierarchy requirements
- **Alternative**: Use text label to group conceptually

**Issue: Connections not appearing**
- **Cause**: Resources not in valid connection range
- **Solution**: Check if both resources are on canvas
- **Alternative**: Use connection menu to force connection

**Issue: Diagram looks cluttered**
- **Cause**: Too many resources with many connections
- **Solution**: 
  - Use collapse feature on containers
  - Zoom in to focus on areas
  - Use multiple diagrams for different aspects

**Issue: Export file is very large**
- **Cause**: High-resolution image export
- **Solution**: 
  - Use JSON export instead for structure
  - Reduce zoom level before exporting PNG
  - Use SVG format for smaller file size

**Issue: Slow performance with many resources**
- **Cause**: Large diagram (100+ resources)
- **Solution**:
  - Close and reopen diagram
  - Split into multiple diagrams
  - Use collapse feature
  - Disable animations in settings

### Performance Optimization

1. **For 50+ resources**:
   - Collapse non-essential containers
   - Hide text labels not needed
   - Reduce connection count
   - Use zoom to work on sections

2. **Browser Tips**:
   - Use Chrome/Edge for best performance
   - Close other browser tabs
   - Clear browser cache
   - Update browser to latest version

### Getting Help

**If you encounter issues**:

1. **Check Validation Report**:
   - Click Validate in toolbar
   - Review reported errors
   - Follow suggested fixes

2. **Review Documentation**:
   - Read relevant sections above
   - Check resource-specific guides
   - Review architecture patterns

3. **Contact Support**:
   - Check application documentation
   - Review error messages carefully
   - Note your exact steps to reproduce
   - Provide exported diagram if possible

### Browser Compatibility

**Recommended Browsers**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Minimum Requirements**:
- Modern browser with ES6 support
- 2GB+ RAM
- JavaScript enabled
- Cookies enabled

---

## Keyboard Shortcuts Reference

| Action | Windows/Linux | Mac |
|--------|---|---|
| Select All | Ctrl+A | Cmd+A |
| Delete | Delete or Backspace | Delete or Backspace |
| Duplicate | Ctrl+D | Cmd+D |
| Undo | Ctrl+Z | Cmd+Z |
| Redo | Ctrl+Y | Cmd+Shift+Z |
| Copy | Ctrl+C | Cmd+C |
| Paste | Ctrl+V | Cmd+V |
| Fit to View | F | F |
| Zoom In | + or Scroll Up | + or Scroll Up |
| Zoom Out | - or Scroll Down | - or Scroll Down |
| Escape | Escape | Escape |

---

## Best Practices

### Diagram Design

1. **Clarity First**: Make diagrams easy to understand
2. **Logical Flow**: Arrange from left to right or top to bottom
3. **Color Meaning**: Use colors consistently
4. **Naming**: Use descriptive, consistent names
5. **Documentation**: Add comments for non-obvious connections

### Architecture Best Practices

1. **High Availability**: Show redundancy with multiple resources
2. **Security Layers**: Clearly show security boundaries (Security Groups, NACLs)
3. **Monitoring**: Include CloudWatch and logging
4. **Scaling**: Show Auto Scaling Groups when applicable
5. **Backup/DR**: Include backup and disaster recovery components

### File Management

1. **Version Control**: Include version numbers in filenames
2. **Regular Saves**: Save frequently during work
3. **Backup**: Keep copies of important diagrams
4. **Naming Convention**: Use descriptive filenames (e.g., `prod-arch-v2.1.json`)
5. **Documentation**: Add README with diagram purpose

---

## Advanced Topics

### Custom Resource Types

If you need resources not in the library:
1. Use generic "Custom" resource
2. Add icon and label in properties
3. Style to match your needs
4. Use text labels for details

### Programmatic Access

The application exports standard JSON format, which can be:
- Integrated with other tools
- Parsed for analysis
- Used in documentation generation
- Imported into other diagramming tools

### Team Collaboration

For team use:
1. Export diagram as JSON
2. Share via version control (Git)
3. Compare changes between versions
4. Merge diagrams manually if needed
5. Discuss changes and export updates

---

## Conclusion

Architect Playhouse provides a powerful, intuitive way to design and visualize AWS architectures. Start with simple diagrams and gradually add complexity as you become familiar with the tool.

**Key Takeaways**:
- ✅ Drag-and-drop interface for rapid design
- ✅ Automatic layout and validation
- ✅ Multiple export formats
- ✅ Support for complex hierarchies
- ✅ Perfect for documentation and planning

Happy designing! 🏗️

---

## Appendix: Resource Categories Quick Reference

### Compute Services
- **EC2**: Scalable virtual machines
- **Lambda**: Serverless functions
- **ECS**: Container orchestration (EC2)
- **Fargate**: Serverless containers
- **Elastic Beanstalk**: Managed platform

### Storage Services
- **S3**: Object storage
- **EBS**: Block storage for EC2
- **Glacier**: Long-term archival storage
- **EFS**: Elastic file system

### Database Services
- **RDS**: Managed relational database
- **DynamoDB**: NoSQL database
- **ElastiCache**: In-memory cache
- **Neptune**: Graph database

### Networking
- **VPC**: Virtual private cloud
- **Subnet**: Network subdivision
- **Internet Gateway**: Internet connectivity
- **NAT Gateway**: Outbound internet access
- **Route Table**: Network routing rules
- **VPN**: Secure connectivity

### Security
- **Security Group**: Virtual firewall
- **IAM Role**: Identity and access
- **ACL**: Network access control
- **KMS**: Key management

### Messaging & Events
- **SQS**: Message queue
- **SNS**: Pub/sub messaging
- **EventBridge**: Event routing
- **Kinesis**: Stream processing

### Monitoring & Analytics
- **CloudWatch**: Monitoring and logging
- **CloudTrail**: Audit logging
- **Kinesis**: Stream analytics

### Content & APIs
- **CloudFront**: CDN
- **API Gateway**: REST/WebSocket APIs
- **ALB/NLB**: Load balancing

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Application**: Architect Playhouse  
**Built with**: React, Vite, TypeScript, Tailwind CSS
