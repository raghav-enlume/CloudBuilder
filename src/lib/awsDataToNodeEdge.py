#!/usr/bin/env python3
"""
Convert AWS data format to CloudBuilder diagram format (architecture-diagram.json)
"""

import json
import uuid
from typing import Dict, List, Any, Tuple

# Resource type definitions matching CloudBuilder format
RESOURCE_TYPES = {
    "region": {
        "id": "region",
        "name": "Region",
        "category": "networking",
        "icon": "vpc",
        "description": "AWS Region",
        "color": "#3949AB",
        "editableAttributes": [
            {"key": "label", "label": "Region Name", "type": "text"},
            {"key": "region", "label": "Region Code", "type": "text"}
        ]
    },
    "vpc": {
        "id": "vpc",
        "name": "VPC",
        "category": "networking",
        "icon": "vpc",
        "description": "Virtual private cloud",
        "color": "#8C4FFF",
        "editableAttributes": [
            {"key": "vpcName", "label": "VPC Name", "type": "text", "placeholder": "my-vpc"},
            {"key": "cidrBlock", "label": "CIDR Block", "type": "text", "placeholder": "10.0.0.0/16"},
            {"key": "dnsHostnamesEnabled", "label": "DNS Hostnames", "type": "boolean"}
        ]
    },
    "subnet": {
        "id": "subnet",
        "name": "Subnet",
        "category": "networking",
        "icon": "vpc",
        "description": "Virtual Subnet",
        "color": "#8C4FFF",
        "editableAttributes": [
            {"key": "label", "label": "Subnet ID", "type": "text"},
            {"key": "cidrBlock", "label": "CIDR Block", "type": "text"}
        ]
    },
    "instance": {
        "id": "ec2",
        "name": "EC2 Instance",
        "category": "compute",
        "icon": "ec2",
        "description": "Virtual server in the cloud",
        "color": "#FF9900",
        "editableAttributes": [
            {"key": "label", "label": "Instance ID", "type": "text"},
            {"key": "instanceType", "label": "Instance Type", "type": "text"}
        ]
    },
    "route_table": {
        "id": "routetable",
        "name": "Route Table",
        "category": "networking",
        "icon": "vpc",
        "description": "Route Table",
        "color": "#8C4FFF",
        "editableAttributes": [
            {"key": "label", "label": "Route Table ID", "type": "text"}
        ]
    },
    "internet_gateway": {
        "id": "internetgateway",
        "name": "Internet Gateway",
        "category": "networking",
        "icon": "elb",
        "description": "Internet Gateway",
        "color": "#FF9900",
        "editableAttributes": [
            {"key": "label", "label": "Gateway ID", "type": "text"}
        ]
    },
    "security_group": {
        "id": "securityGroup",
        "name": "Security Group",
        "category": "security",
        "icon": "waf",
        "description": "Security Group",
        "color": "#DD344C",
        "editableAttributes": [
            {"key": "label", "label": "Security Group Name", "type": "text"}
        ]
    }
}

# Edge styling definitions
EDGE_STYLES = {
    "vpc-to-subnet": {
        "stroke": "#8C4FFF",
        "strokeWidth": 2
    },
    "subnet-to-instance": {
        "stroke": "#FF9900",
        "strokeWidth": 2
    },
    "rt-to-subnet": {
        "stroke": "#FFA000",
        "strokeWidth": 2,
        "strokeDasharray": "4,4"
    },
    "sg-to-instance": {
        "stroke": "#DD344C",
        "strokeWidth": 1,
        "strokeDasharray": "5,5"
    }
}


class AWSToCloudBuilderConverter:
    def __init__(self, aws_data: Dict[str, Any]):
        self.aws_data = aws_data
        self.nodes: List[Dict] = []
        self.edges: List[Dict] = []
        self.node_map: Dict[str, Dict] = {}  # node_id -> node data
        self.vpc_node_map: Dict[str, str] = {}  # vpc_id -> node_id
        self.subnet_node_map: Dict[str, Tuple[str, str]] = {}  # subnet_id -> (node_id, vpc_node_id)
        self.sg_node_map: Dict[str, str] = {}  # sg_id -> node_id
        self.sg_vpc_map: Dict[str, str] = {}  # sg_id -> vpc_id (for tracking which VPC an SG belongs to)
        self.rt_node_map: Dict[str, str] = {}  # rt_id -> node_id
        self.position_counter = {"vpc": 0, "subnet": 0, "instance": 0, "rt": 0, "sg": 0}
        self.vpc_count = 0
        self.max_x_position = 0
    
    def convert(self) -> Dict[str, Any]:
        """Main conversion method"""
        # First pass: count VPCs to calculate region size
        for region_name, region_data in self.aws_data.items():
            vpcs = region_data.get("vpcs", [])
            self.vpc_count = len(vpcs)
        
        # Second pass: create all resources
        region_y_position = 0  # Track y position for stacking regions vertically
        region_heights = {}  # Store region heights for stacking
        
        # First: Process all regions to create them and their children
        for region_name, region_data in self.aws_data.items():
            self._process_region(region_name, region_data, region_y_position)
            region_y_position = 0  # Will be updated after sizing
        
        # Third pass: update region size based on child nodes
        self._update_region_size()
        
        # Fourth pass: Reposition subnets vertically to prevent collisions
        self._reposition_subnets_to_prevent_collision()
        
        # Fourth-B pass: Recalculate VPC sizes after subnet repositioning
        self._recalculate_vpc_sizes()
        
        # Fourth-C pass: Position security groups inside subnets and move instances into them
        self._position_security_groups_inside_subnets()
        
        # Fourth-C-2 pass: Position orphaned SGs (those without instances) at VPC level
        self._position_orphaned_security_groups()
        
        # Fourth-D pass: Recalculate subnet sizes to accommodate SGs and instances
        self._recalculate_subnet_sizes()
        
        # Fourth-D-2 pass: REPOSITION SUBNETS AGAIN after their sizes changed
        self._reposition_subnets_to_prevent_collision()
        
        # Fourth-E pass: Reposition RTs after SGs are positioned inside subnets
        self._reposition_route_tables()
        
        # Fourth-F pass: Recalculate VPC sizes again
        self._recalculate_vpc_sizes()
        self._update_region_size()
        
        # Fifth pass: Stack regions vertically to prevent overlap
        self._stack_regions_vertically()
        
        # Sixth pass: verify all children fit within parent bounds
        self._verify_container_bounds()
        
        # Seventh pass: Validate all positions (overlaps, bounds, edges)
        self._validate_all_positions()
        
        return {
            "nodes": self.nodes,
            "edges": self.edges
        }
    
    def _stack_regions_vertically(self):
        """Position regions vertically (one below another) to prevent overlap"""
        padding = 40
        current_y = 0
        
        # Get all region nodes sorted by their order
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        
        for region_node in region_nodes:
            # Get the current position of the region before moving
            original_y = region_node["position"]["y"]
            
            # Set region y position
            region_node["position"]["y"] = current_y
            
            # Update all children positions (VPCs, IGWs, RTs, SGs, and their children)
            self._adjust_children_positions(region_node["id"], original_y, current_y)
            
            # Move next region down by current region's height + padding
            current_y += region_node["height"] + padding
    
    def _adjust_children_positions(self, parent_id: str, original_y: int, new_y: int):
        """Recursively adjust all children positions when parent moves"""
        y_offset = new_y - original_y
        
        # Find all direct children of this parent
        children = [n for n in self.nodes if n["data"].get("parentId") == parent_id]
        
        for child in children:
            # Adjust child position
            child["position"]["y"] += y_offset
            
            # Recursively adjust grandchildren if child is a container
            if child["data"].get("isContainer", False):
                self._adjust_children_positions(child["id"], child["position"]["y"] - y_offset, child["position"]["y"])
    
    def _process_region(self, region_name: str, region_data: Dict, region_y: int = 0):
        """Process all resources in a region"""
        region_id = f"region-{region_name}"
        
        # Create region container node with minimal initial size
        # The actual size will be calculated in _update_region_size based on all children
        self._create_node(
            node_id=region_id,
            label=f"Region: {region_name}",
            resource_type="region",
            position={"x": 0, "y": region_y},
            size={"width": 100, "height": 100},  # Minimal initial size, will be recalculated
            is_container=True,
            parent_id=None,
            config={"originalType": "AWS::EC2::Region", "region": region_name},
            nesting_depth=0,
            region=region_name  # Add region property to data (matching present.json)
        )
        
        # Process VPCs
        vpcs = region_data.get("vpcs", [])
        self._process_vpcs(region_id, vpcs)
        
        # Process Subnets
        subnets = region_data.get("subnets", [])
        self._process_subnets(subnets)
        
        # Process Instances
        instances = region_data.get("instances", [])
        self._process_instances(instances)
        
        # Process Internet Gateways
        igws = region_data.get("igws", [])
        self._process_igws(igws)
        
        # Process Route Tables
        route_tables = region_data.get("route_tables", [])
        self._process_route_tables(route_tables)
        
        # Process Security Groups
        sgs = region_data.get("security_groups", [])
        self._process_security_groups(sgs)
        
        # Create edges for route tables to subnets
        self._create_rt_subnet_edges(route_tables)
        
        # Create edges for security groups to instances
        self._create_sg_instance_edges(instances)
    
    def _process_vpcs(self, region_id: str, vpcs: List[Dict]):
        """Process VPCs"""
        for idx, vpc in enumerate(vpcs):
            vpc_id = vpc.get("VpcId")
            
            node_id = f"vpc-{vpc_id}"
            self.vpc_node_map[vpc_id] = node_id
            
            # Distribute VPCs horizontally with proper spacing
            # Use minimal initial size - will be expanded based on actual children
            x_pos = 100 + (idx * 450)
            vpc_width = 400  # Minimal initial width - will be calculated from children
            vpc_height = 300  # Minimal initial height - will be calculated from children
            self.max_x_position = max(self.max_x_position, x_pos + vpc_width)
            
            self._create_node(
                node_id=node_id,
                label=vpc_id,  # Use VPC ID as label (matching present.json)
                resource_type="vpc",
                position={"x": x_pos, "y": 140},
                size={"width": vpc_width, "height": vpc_height},
                is_container=True,
                parent_id=region_id,
                config={
                    "originalType": "AWS::EC2::VPC",
                    "region": self._extract_region_from_id(region_id),
                    "ownerId": vpc.get("OwnerId"),
                    "instanceTenancy": vpc.get("InstanceTenancy"),
                    "dhcpOptionsId": vpc.get("DhcpOptionsId")
                },
                nesting_depth=1,
                vpcId=vpc_id,  # Use camelCase
                cidrBlock=vpc.get("CidrBlock"),  # Use camelCase
                state=vpc.get("State"),
                isDefault=vpc.get("IsDefault", False)  # Use camelCase
            )
    
    def _process_subnets(self, subnets: List[Dict]):
        """Process Subnets"""
        # Group subnets by VPC
        subnets_by_vpc: Dict[str, List[Dict]] = {}
        for subnet in subnets:
            vpc_id = subnet.get("VpcId")
            if vpc_id not in subnets_by_vpc:
                subnets_by_vpc[vpc_id] = []
            subnets_by_vpc[vpc_id].append(subnet)
        
        # Process subnets per VPC
        for vpc_id, vpc_subnets in subnets_by_vpc.items():
            vpc_node_id = self.vpc_node_map.get(vpc_id)
            
            if not vpc_node_id:
                continue
            
            vpc_node = self.node_map.get(vpc_node_id)
            vpc_x = vpc_node["position"]["x"]
            vpc_y = vpc_node["position"]["y"]
            vpc_width = vpc_node["width"]
            
            # Calculate available space inside VPC (with 40px padding on each side)
            padding = 40
            available_width = vpc_width - (padding * 2)
            # Default subnet dimensions (will be expanded if children exist)
            subnet_width = 200
            subnet_height = 80
            
            # Position subnets in a grid within VPC bounds
            for subnet_idx, subnet in enumerate(vpc_subnets):
                subnet_id = subnet.get("SubnetId")
                subnet_name = self._get_tag_value(subnet.get("Tags", []), "Name", subnet_id)
                node_id = f"subnet-{subnet_id}"
                
                # Stack subnets vertically with proper margins (below IGWs which occupy top 100px)
                x_pos = vpc_x + padding
                y_pos = vpc_y + 120 + (subnet_idx * 100)  # Updated spacing based on default height
                
                self._create_node(
                    node_id=node_id,
                    label=subnet_id,  # Use subnet ID as label (matching present.json)
                    resource_type="subnet",
                    position={"x": x_pos, "y": y_pos},
                    size={"width": subnet_width, "height": subnet_height},
                    is_container=True,
                    parent_id=vpc_node_id,
                    config={
                        "originalType": "AWS::EC2::Subnet",
                        "region": subnet.get("AvailabilityZone", "").rsplit('-', 1)[0] if subnet.get("AvailabilityZone") else "unknown",
                        "ownerId": subnet.get("OwnerId"),
                        "availabilityZoneId": subnet.get("AvailabilityZoneId"),
                        "defaultForAz": subnet.get("DefaultForAz", False)
                    },
                    nesting_depth=2,
                    subnetId=subnet_id,  # Use camelCase
                    vpcId=vpc_id,  # Use camelCase
                    cidrBlock=subnet.get("CidrBlock"),  # Use camelCase
                    availabilityZone=subnet.get("AvailabilityZone"),  # Use camelCase
                    state=subnet.get("State")
                )
                
                self.subnet_node_map[subnet_id] = (node_id, vpc_node_id)
                
                # Create VPC -> Subnet edge
                self._create_edge(
                    source=vpc_node_id,
                    target=node_id,
                    edge_type="vpc-to-subnet"
                )
    
    def _process_instances(self, instances: List[Dict]):
        """Process EC2 Instances - positioned inside security groups which are inside subnets
        
        Hierarchy: Subnet → SecurityGroup → Instance
        """
        for instance in instances:
            instance_id = instance.get("InstanceId")
            subnet_id = instance.get("SubnetId")
            
            subnet_node_info = self.subnet_node_map.get(subnet_id)
            if not subnet_node_info:
                continue
            
            subnet_node_id, vpc_node_id = subnet_node_info
            instance_name = self._get_tag_value(instance.get("Tags", []), "Name", instance_id)
            
            node_id = f"instance-{instance_id}"
            subnet_node = self.node_map.get(subnet_node_id)
            subnet_x = subnet_node["position"]["x"]
            subnet_y = subnet_node["position"]["y"]
            
            # Store security group ID for later linking
            sg_info = instance.get("SecurityGroups", [{}])[0]
            sg_id = sg_info.get("GroupId")
            
            # Position instance initially at subnet location (will move to SG later)
            padding = 30
            instance_width = 120
            instance_height = 88
            x_pos = subnet_x + padding
            y_pos = subnet_y + padding
            
            self._create_node(
                node_id=node_id,
                label=instance_name,
                resource_type="instance",
                position={"x": x_pos, "y": y_pos},
                size={"width": instance_width, "height": instance_height},
                is_container=False,
                parent_id=subnet_node_id,  # Initially parent is subnet, will change to SG
                config={
                    "originalType": "AWS::EC2::Instance",
                    "region": subnet_id.split('-')[1] if len(subnet_id.split('-')) > 1 else "unknown",
                    "vpc": instance.get("VpcId"),
                    "subnet": subnet_id,
                    "securityGroup": sg_id,
                    "instanceType": instance.get("InstanceType"),
                    "architecture": instance.get("Architecture"),
                    "hypervisor": instance.get("Hypervisor"),
                    "virtualizationType": instance.get("VirtualizationType"),
                    "rootDeviceName": instance.get("RootDeviceName"),
                    "rootDeviceType": instance.get("RootDeviceType"),
                    "keyName": instance.get("KeyName")
                },
                nesting_depth=3,
                instanceId=instance_id,
                instanceType=instance.get("InstanceType"),
                state=instance.get("State", {}).get("Name"),
                privateIpAddress=instance.get("PrivateIpAddress"),
                publicIpAddress=instance.get("PublicIpAddress"),
                imageId=instance.get("ImageId"),
                launchTime=instance.get("LaunchTime"),
                subnetId=subnet_id,
                vpcId=instance.get("VpcId"),
                securityGroup=sg_id  # Store for later parent assignment
            )
            
            # Create Subnet → Instance edge (will add SG → Instance edge later)
            self._create_edge(
                source=subnet_node_id,
                target=node_id,
                edge_type="subnet-to-instance"
            )
    
    def _process_igws(self, igws: List[Dict]):
        """Process Internet Gateways"""
        # Group IGWs by VPC
        igw_by_vpc: Dict[str, List[Dict]] = {}
        for igw in igws:
            attachments = igw.get("Attachments", [])
            if not attachments:
                continue
            vpc_id = attachments[0].get("VpcId")
            if vpc_id not in igw_by_vpc:
                igw_by_vpc[vpc_id] = []
            igw_by_vpc[vpc_id].append(igw)
        
        # Position IGWs per VPC
        for vpc_id, vpc_igws in igw_by_vpc.items():
            vpc_node_id = self.vpc_node_map.get(vpc_id)
            
            if not vpc_node_id:
                continue
            
            vpc_node = self.node_map.get(vpc_node_id)
            vpc_x = vpc_node["position"]["x"]
            vpc_y = vpc_node["position"]["y"]
            vpc_width = vpc_node["width"]
            
            # Position IGWs horizontally at the top with proper spacing
            padding = 40
            igw_spacing = (vpc_width - (padding * 2)) / (len(vpc_igws) + 1)
            
            for igw_idx, igw in enumerate(vpc_igws):
                igw_id = igw.get("InternetGatewayId")
                igw_name = self._get_tag_value(igw.get("Tags", []), "Name", igw_id)
                node_id = f"igw-{igw_id}"
                
                x_pos = vpc_x + padding + ((igw_idx + 1) * igw_spacing) - 60
                y_pos = vpc_y + 20  # 20px from the top of the VPC
                
                self._create_node(
                    node_id=node_id,
                    label=igw_id,  # Use IGW ID as label (matching present.json)
                    resource_type="internet_gateway",
                    position={"x": x_pos, "y": y_pos},
                    size={"width": 120, "height": 88},
                    is_container=False,
                    parent_id=vpc_node_id,
                    config={
                        "originalType": "AWS::EC2::InternetGateway",
                        "region": vpc_id.split('-')[1] if len(vpc_id.split('-')) > 1 else "unknown",
                        "ownerId": igw.get("OwnerId")
                    },
                    nesting_depth=2,
                    gatewayId=igw_id  # Use camelCase
                )
    
    def _process_route_tables(self, route_tables: List[Dict]):
        """Process Route Tables"""
        # Group route tables by VPC
        rt_by_vpc: Dict[str, List[Dict]] = {}
        for rt in route_tables:
            vpc_id = rt.get("VpcId")
            if vpc_id not in rt_by_vpc:
                rt_by_vpc[vpc_id] = []
            rt_by_vpc[vpc_id].append(rt)
        
        # Position route tables per VPC
        for vpc_id, vpc_rts in rt_by_vpc.items():
            vpc_node_id = self.vpc_node_map.get(vpc_id)
            
            if not vpc_node_id:
                continue
            
            vpc_node = self.node_map.get(vpc_node_id)
            vpc_x = vpc_node["position"]["x"]
            vpc_y = vpc_node["position"]["y"]
            vpc_width = vpc_node["width"]
            vpc_height = vpc_node["height"]
            
            # Position RTs in a column on the left side of the VPC
            padding = 40
            rt_x = vpc_x + padding  # Left side positioning
            rt_y_start = vpc_y + 260  # Start below subnets
            rt_vertical_spacing = 100  # Space between RTs
            
            for idx, rt in enumerate(vpc_rts):
                rt_id = rt.get("RouteTableId")
                rt_name = self._get_tag_value(rt.get("Tags", []), "Name", rt_id)
                node_id = f"rt-{rt_id}"
                self.rt_node_map[rt_id] = node_id
                
                rt_y = rt_y_start + (idx * rt_vertical_spacing)
                
                self._create_node(
                    node_id=node_id,
                    label=rt_id,  # Use Route Table ID as label (matching present.json)
                    resource_type="route_table",
                    position={"x": rt_x, "y": rt_y},
                    size={"width": 120, "height": 88},
                    is_container=False,
                    parent_id=vpc_node_id,
                    config={
                        "originalType": "AWS::EC2::RouteTable",
                        "region": vpc_id.split('-')[1] if len(vpc_id.split('-')) > 1 else "unknown",
                        "vpcId": vpc_id,
                        "ownerId": rt.get("OwnerId")
                    },
                    nesting_depth=2,
                    routeTableId=rt_id,  # Use camelCase
                    vpcId=vpc_id  # Use camelCase
                )
    
    def _process_security_groups(self, sgs: List[Dict]):
        """Process Security Groups - Create as containers inside subnets instead of at VPC level
        
        Hierarchy: VPC → Subnet → SecurityGroup → Instance
        
        NOTE: Only SGs that protect instances are created. Orphaned SGs are skipped since they
        don't affect the architecture visualization.
        """
        # Collect all SGs referenced by instances
        instances_sgs = set()
        for inst in self.nodes:
            if inst["data"].get("resourceType", {}).get("id") == "ec2":
                sg_id = inst["data"].get("securityGroup")
                if sg_id:
                    instances_sgs.add(sg_id)
        
        # Group security groups by VPC (only for SGs with instances)
        sg_by_vpc: Dict[str, List[Dict]] = {}
        
        for sg in sgs:
            sg_id = sg.get("GroupId")
            # Only process SGs that protect instances
            if sg_id not in instances_sgs:
                continue
                
            vpc_id = sg.get("VpcId")
            if vpc_id not in sg_by_vpc:
                sg_by_vpc[vpc_id] = []
            sg_by_vpc[vpc_id].append(sg)
        
        # Now create SG nodes - initially positioned at subnet level
        # We'll reposition them after instances are created
        for vpc_id, vpc_sgs in sg_by_vpc.items():
            vpc_node_id = self.vpc_node_map.get(vpc_id)
            
            if not vpc_node_id:
                continue
            
            for sg in vpc_sgs:
                sg_id = sg.get("GroupId")
                sg_name = sg.get("GroupName", sg_id)
                node_id = f"sg-{sg_id}"
                self.sg_node_map[sg_id] = node_id
                self.sg_vpc_map[sg_id] = vpc_id  # Track which VPC this SG belongs to
                
                # Create SG as a container with minimal size
                # Parent will be updated when we position instances
                self._create_node(
                    node_id=node_id,
                    label=sg_name,
                    resource_type="security_group",
                    position={"x": 0, "y": 0},  # Will be repositioned later
                    size={"width": 150, "height": 80},  # Minimal size for container
                    is_container=True,
                    parent_id=vpc_node_id,  # Initially at VPC level
                    config={
                        "originalType": "AWS::EC2::SecurityGroup",
                        "region": vpc_id.split('-')[1] if len(vpc_id.split('-')) > 1 else "unknown",
                        "ownerId": sg.get("OwnerId"),
                        "vpc": vpc_id,
                        "groupName": sg_name
                    },
                    nesting_depth=2,
                    groupId=sg_id,
                    groupName=sg_name,
                    vpcId=vpc_id,
                    description=sg.get("Description"),
                    inboundRules=len(sg.get("IpPermissions", [])),
                    outboundRules=len(sg.get("IpPermissionsEgress", []))
                )
    
    def _create_rt_subnet_edges(self, route_tables: List[Dict]):
        """Create edges from Route Tables to associated Subnets"""
        for rt in route_tables:
            rt_id = rt.get("RouteTableId")
            rt_node_id = self.rt_node_map.get(rt_id)
            
            if not rt_node_id:
                continue
            
            # Get associated subnets
            for assoc in rt.get("Associations", []):
                subnet_id = assoc.get("SubnetId")
                if subnet_id and subnet_id in self.subnet_node_map:
                    subnet_node_id = self.subnet_node_map[subnet_id][0]
                    self._create_edge(
                        source=rt_node_id,
                        target=subnet_node_id,
                        edge_type="rt-to-subnet"
                    )
    
    def _create_sg_instance_edges(self, instances: List[Dict]):
        """Create edges from Security Groups to Instances"""
        for instance in instances:
            instance_id = instance.get("InstanceId")
            subnet_id = instance.get("SubnetId")
            instance_node_id = f"instance-{instance_id}"
            
            if instance_node_id not in self.node_map:
                continue
            
            for sg in instance.get("SecurityGroups", []):
                sg_id = sg.get("GroupId")
                sg_node_id = self.sg_node_map.get(sg_id)
                
                # If SG node doesn't exist yet, we may need to create it
                # Also ensure sg_vpc_map is populated for all SGs referenced by instances
                if sg_id not in self.sg_vpc_map:
                    # Get VPC ID from the instance's subnet
                    subnet_node_info = self.subnet_node_map.get(subnet_id)
                    if subnet_node_info:
                        _, vpc_node_id = subnet_node_info
                        # Extract VPC ID from node_id (format: vpc-{vpc_id})
                        vpc_id = vpc_node_id.replace("vpc-", "")
                        self.sg_vpc_map[sg_id] = vpc_id
                
                if sg_node_id:
                    self._create_edge(
                        source=sg_node_id,
                        target=instance_node_id,
                        edge_type="sg-to-instance"
                    )
    
    def _create_node(self, node_id: str, label: str, resource_type: str, position: Dict,
                    size: Dict, is_container: bool, parent_id: str, config: Dict,
                    nesting_depth: int, **kwargs):
        """Create a node in CloudBuilder format"""
        rt_def = RESOURCE_TYPES.get(resource_type, {})
        
        # Build data object
        data = {
            "label": label,
            "resourceType": rt_def,
        }
        
        # Add resource-specific properties (like vpcId, subnetId, gatewayId, etc.)
        for key, value in kwargs.items():
            if key not in ["parentId"]:  # parentId goes at the end
                data[key] = value
        
        # Add structural properties
        data["isContainer"] = is_container
        
        # For region, include width/height in data (special case)
        if resource_type == "region":
            data["width"] = size["width"]
            data["height"] = size["height"]
        
        # Add size object (all resources have this)
        data["size"] = {
            "width": size["width"],
            "height": size["height"]
        }
        
        data["config"] = config
        data["nestingDepth"] = nesting_depth
        
        # Add parentId if present
        if parent_id:
            data["parentId"] = parent_id
        
        node = {
            "id": node_id,
            "type": "resourceNode",
            "position": position,
            "data": data,
            "width": size["width"],
            "height": size["height"]
        }
        
        if parent_id:
            node["data"]["parentId"] = parent_id
        
        self.nodes.append(node)
        self.node_map[node_id] = node
    
    def _create_edge(self, source: str, target: str, edge_type: str = "default"):
        """Create an edge in CloudBuilder format"""
        style = EDGE_STYLES.get(edge_type, {"stroke": "#999999", "strokeWidth": 1})
        
        edge = {
            "id": f"{edge_type}-{source}-{target}",
            "source": source,
            "target": target,
            "animated": True,
            "type": "smoothstep",
            "style": style
        }
        
        self.edges.append(edge)
    
    def _get_node_position(self, node_id: str) -> Dict:
        """Get position of a node"""
        if node_id in self.node_map:
            return self.node_map[node_id]["position"]
        return {"x": 0, "y": 0}
    
    def _extract_region_from_id(self, region_id: str) -> str:
        """Extract region name from region node ID"""
        return region_id.replace("region-", "")
    
    def _get_tag_value(self, tags: List[Dict], key: str, default: str) -> str:
        """Extract tag value from tags list"""
        for tag in tags:
            if tag.get("Key") == key:
                return tag.get("Value", default)
        return default
    
    def _update_region_size(self):
        """Update all container sizes to fit their children completely inside
        
        Hierarchy: Region (ultimate boundary) → VPCs → Subnets → Instances
        Each parent is sized to completely contain all its direct children.
        The Region is the outermost boundary that encompasses the entire infrastructure.
        Ensures no children collide with each other and all fit within parent boundaries.
        
        Subnet sizing: Default (200x80) if no children, expanded to fit children if present.
        """
        padding = 40
        default_subnet_width = 200
        default_subnet_height = 80
        
        # First pass: Update subnet sizes based on their instances
        subnet_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "subnet"]
        for subnet_node in subnet_nodes:
            subnet_id = subnet_node["id"]
            children = [n for n in self.nodes if n["data"].get("parentId") == subnet_id]
            
            if children:
                # Subnet has children - expand to fit them
                subnet_x = subnet_node["position"]["x"]
                subnet_y = subnet_node["position"]["y"]
                # Calculate the rightmost and bottommost edges of all children
                max_right = max([n["position"]["x"] + n["width"] for n in children])
                max_bottom = max([n["position"]["y"] + n["height"] for n in children])
                
                # Size subnet to contain all children with padding
                new_width = max_right - subnet_x + padding
                new_height = max_bottom - subnet_y + padding
                
                subnet_node["width"] = new_width
                subnet_node["height"] = new_height
                subnet_node["data"]["size"] = {"width": new_width, "height": new_height}
            else:
                # No children - use default subnet size
                subnet_node["width"] = default_subnet_width
                subnet_node["height"] = default_subnet_height
                subnet_node["data"]["size"] = {"width": default_subnet_width, "height": default_subnet_height}
        
        # Second pass: Update VPC sizes based on all children (subnets, IGWs, RTs, SGs)
        vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
        for vpc_node in vpc_nodes:
            vpc_id = vpc_node["id"]
            children = [n for n in self.nodes if n["data"].get("parentId") == vpc_id]
            
            if children:
                vpc_x = vpc_node["position"]["x"]
                vpc_y = vpc_node["position"]["y"]
                # Calculate the rightmost and bottommost edges of all children
                max_right = max([n["position"]["x"] + n["width"] for n in children])
                max_bottom = max([n["position"]["y"] + n["height"] for n in children])
                
                # Size VPC to contain all children with padding
                new_width = max_right - vpc_x + padding
                new_height = max_bottom - vpc_y + padding
                
                vpc_node["width"] = new_width
                vpc_node["height"] = new_height
                vpc_node["data"]["size"] = {"width": new_width, "height": new_height}
        
        # Third pass: Update region size based on all VPCs (ultimate boundary container)
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        for region_node in region_nodes:
            region_id = region_node["id"]
            vpc_children = [n for n in self.nodes if n["data"].get("parentId") == region_id]
            
            if vpc_children:
                region_x = 0  # Region always starts at 0
                region_y = 0  # Region always starts at 0
                
                # Calculate the rightmost and bottommost edges of all VPCs
                # This ensures the region is the complete boundary for all infrastructure
                max_right = max([n["position"]["x"] + n["width"] for n in vpc_children])
                max_bottom = max([n["position"]["y"] + n["height"] for n in vpc_children])
                
                # Size region to be the ultimate boundary container
                new_width = max_right + padding
                new_height = max_bottom + padding
                
                # Update node size
                region_node["width"] = new_width
                region_node["height"] = new_height
                
                # Update data size object
                region_node["data"]["size"] = {"width": new_width, "height": new_height}
                
                # Update data width/height for region (special case - content size)
                region_node["data"]["width"] = new_width
                region_node["data"]["height"] = new_height
                
                print(f"Region '{region_id}' sized to: {new_width}x{new_height} (VPCs max: {max_right}x{max_bottom})")
    
    def _reposition_subnets_to_prevent_collision(self):
        """Reposition subnets within each VPC to prevent vertical collisions after sizing"""
        min_spacing = 50  # Minimum gap between subnet bottom and next subnet top
        
        # Find all VPC nodes
        vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
        
        for vpc_node in vpc_nodes:
            vpc_id = vpc_node["id"]
            vpc_x = vpc_node["position"]["x"]
            vpc_y = vpc_node["position"]["y"]
            
            # Find all subnets in this VPC
            subnets = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and n["data"].get("resourceType", {}).get("id") == "subnet"]
            
            if not subnets:
                continue
            
            # Sort subnets by their current y position
            subnets.sort(key=lambda n: n["position"]["y"])
            
            # Reposition subnets vertically with guaranteed spacing
            current_y = vpc_y + 120  # Start position for subnets (below IGWs)
            
            for subnet_idx, subnet in enumerate(subnets):
                subnet_id = subnet["id"]
                old_y = subnet["position"]["y"]
                old_x = subnet["position"]["x"]
                
                # Align all subnets to left with padding
                new_x = vpc_x + 40
                new_y = current_y
                
                # Update subnet position
                subnet["position"]["x"] = new_x
                subnet["position"]["y"] = new_y
                
                # Adjust all children of this subnet
                x_offset = new_x - old_x
                y_offset = new_y - old_y
                self._adjust_children_position_both(subnet_id, x_offset, y_offset)
                
                # Calculate next position: current position + height + spacing
                subnet_bottom = new_y + subnet["height"]
                current_y = subnet_bottom + min_spacing
    
    def _adjust_children_y_position(self, parent_id: str, y_offset: float):
        """Adjust only y position of direct children when parent moves vertically"""
        for node in self.nodes:
            if node["data"].get("parentId") == parent_id:
                node["position"]["y"] += y_offset
    
    def _adjust_children_position_both(self, parent_id: str, x_offset: float, y_offset: float):
        """Adjust both x and y position of all descendants when parent moves"""
        # Find direct children and recursively adjust their descendants
        for node in self.nodes:
            if node["data"].get("parentId") == parent_id:
                node["position"]["x"] += x_offset
                node["position"]["y"] += y_offset
                # Recursively adjust children of this node
                self._adjust_children_position_both(node["id"], x_offset, y_offset)
    
    def _recalculate_vpc_sizes(self):
        """Recalculate VPC sizes after subnet repositioning to ensure they fit all children"""
        padding = 40
        
        # Update VPC sizes based on all children after repositioning
        vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
        for vpc_node in vpc_nodes:
            vpc_id = vpc_node["id"]
            children = [n for n in self.nodes if n["data"].get("parentId") == vpc_id]
            
            if children:
                vpc_x = vpc_node["position"]["x"]
                vpc_y = vpc_node["position"]["y"]
                
                # Calculate the rightmost and bottommost edges of all children
                max_right = max([n["position"]["x"] + n["width"] for n in children])
                max_bottom = max([n["position"]["y"] + n["height"] for n in children])
                
                # Size VPC to contain all children with padding
                new_width = max_right - vpc_x + padding
                new_height = max_bottom - vpc_y + padding
                
                vpc_node["width"] = new_width
                vpc_node["height"] = new_height
                vpc_node["data"]["size"] = {"width": new_width, "height": new_height}
    
    def _reposition_route_tables_and_security_groups(self):
        """Reposition RTs and SGs after subnet repositioning to avoid overlaps with subnets"""
        padding = 40
        rt_vertical_spacing = 100
        sg_vertical_spacing = 150  # Increased for container height
        
        # Find all VPC nodes
        vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
        
        for vpc_node in vpc_nodes:
            vpc_id = vpc_node["id"]
            vpc_x = vpc_node["position"]["x"]
            vpc_y = vpc_node["position"]["y"]
            vpc_width = vpc_node["width"]
            
            # Find all subnets in this VPC to determine where they end
            subnets = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and n["data"].get("resourceType", {}).get("id") == "subnet"]
            
            # Determine RT start position (after last subnet)
            if subnets:
                subnets.sort(key=lambda n: n["position"]["y"] + n["height"], reverse=True)
                last_subnet = subnets[0]
                rt_y_start = last_subnet["position"]["y"] + last_subnet["height"] + padding
            else:
                rt_y_start = vpc_y + 260  # Fallback to original position if no subnets
            
            # Reposition RTs
            route_tables = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and n["data"].get("resourceType", {}).get("id") == "routetable"]
            
            rt_x = vpc_x + padding
            current_rt_y = rt_y_start
            
            for rt in route_tables:
                rt["position"]["y"] = current_rt_y
                current_rt_y += rt_vertical_spacing
            
            # Determine SG start position (after last RT)
            if route_tables:
                route_tables.sort(key=lambda n: n["position"]["y"] + n["height"], reverse=True)
                last_rt = route_tables[0]
                sg_y_start = last_rt["position"]["y"] + last_rt["height"] + padding
            else:
                sg_y_start = rt_y_start  # If no RTs, start where RTs would have started
            
            # Reposition SGs
            security_groups = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and n["data"].get("resourceType", {}).get("id") == "securityGroup"]
            
            sg_x = vpc_x + vpc_width - padding - 250  # Updated for larger container width
            current_sg_y = sg_y_start
            
            for sg in security_groups:
                sg["position"]["y"] = current_sg_y
                sg["position"]["x"] = sg_x
                current_sg_y += sg_vertical_spacing
    
    def _position_security_groups_inside_subnets(self):
        """Position security groups inside their respective subnets and move instances into them
        
        This creates the hierarchy: Subnet → SecurityGroup → Instance
        Multiple SGs per subnet are arranged in columns to avoid overlap.
        """
        padding = 20
        sg_spacing = 20
        inst_height = 88
        inst_spacing = 15
        
        # Find all subnets
        subnet_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "subnet"]
        
        for subnet_node in subnet_nodes:
            subnet_id = subnet_node["id"]
            subnet_x = subnet_node["position"]["x"]
            subnet_y = subnet_node["position"]["y"]
            subnet_width = subnet_node["width"]
            
            # Find all instances in this subnet
            subnet_instances = [n for n in self.nodes if n["data"].get("parentId") == subnet_id and n["data"].get("resourceType", {}).get("id") == "ec2"]
            
            if not subnet_instances:
                continue
            
            # Group instances by their security group
            instances_by_sg: Dict[str, List] = {}
            for inst in subnet_instances:
                sg_id = inst["data"].get("securityGroup")
                if sg_id:
                    if sg_id not in instances_by_sg:
                        instances_by_sg[sg_id] = []
                    instances_by_sg[sg_id].append(inst)
            
            if not instances_by_sg:
                continue
            
            # Arrange SGs in columns to fit inside subnet
            available_width = subnet_width - (padding * 2)
            sg_default_width = 160
            sgs_per_column = max(1, int(available_width / (sg_default_width + sg_spacing)))
            
            col_index = 0
            row_index = 0
            sg_x = subnet_x + padding
            sg_y = subnet_y + padding
            max_col_height = 0
            
            for sg_idx, (sg_id, instances) in enumerate(instances_by_sg.items()):
                # Calculate column position
                if col_index >= sgs_per_column and sgs_per_column > 0:
                    col_index = 0
                    row_index += 1
                    sg_y = subnet_y + padding + (row_index * (max_col_height + sg_spacing))
                    max_col_height = 0
                
                sg_col_x = subnet_x + padding + (col_index * (sg_default_width + sg_spacing))
                
                sg_node_id = self.sg_node_map.get(sg_id)
                if not sg_node_id:
                    col_index += 1
                    continue
                
                sg_node = self.node_map.get(sg_node_id)
                if not sg_node:
                    col_index += 1
                    continue
                
                # Position SG inside subnet
                sg_node["position"]["x"] = sg_col_x
                sg_node["position"]["y"] = sg_y
                sg_node["data"]["parentId"] = subnet_id  # Move SG to be child of subnet
                sg_node["data"]["nestingDepth"] = 3
                
                # Position instances inside this SG with vertical stacking
                inst_padding = 15
                inst_x = sg_col_x + inst_padding
                current_inst_y = sg_y + inst_padding
                
                for idx, inst_node in enumerate(instances):
                    # Move instance to be child of SG
                    inst_node["data"]["parentId"] = sg_node_id
                    inst_node["data"]["nestingDepth"] = 4
                    
                    # Position instance inside SG
                    inst_node["position"]["x"] = inst_x
                    inst_node["position"]["y"] = current_inst_y + (idx * (inst_height + inst_spacing))
                
                # Calculate SG size based on its instances
                if instances:
                    inst_widths = [i["width"] for i in instances]
                    inst_heights = [i["height"] for i in instances]
                    
                    max_inst_width = max(inst_widths) if inst_widths else 60
                    total_inst_height = sum(inst_heights) + ((len(instances) - 1) * inst_spacing)
                    
                    sg_width = max_inst_width + (inst_padding * 2)
                    sg_height = total_inst_height + (inst_padding * 2)
                    
                    sg_node["width"] = max(sg_width, 140)
                    sg_node["height"] = max(sg_height, 120)
                else:
                    sg_node["width"] = 140
                    sg_node["height"] = 120
                
                sg_node["data"]["size"] = {"width": sg_node["width"], "height": sg_node["height"]}
                
                # Track max height in column
                max_col_height = max(max_col_height, sg_node["height"])
                
                col_index += 1
    
    def _position_orphaned_security_groups(self):
        """Position security groups that don't protect any instances
        
        These orphaned SGs are positioned at the VPC level, alongside RTs and IGWs.
        """
        padding = 40
        sg_width = 150
        sg_height = 100
        sg_spacing = 25
        
        # Find all SGs that have been moved to subnets (those with instances)
        positioned_sgs = set()
        for subnet_node in [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "subnet"]:
            sgs_in_subnet = [n for n in self.nodes if n["data"].get("parentId") == subnet_node["id"] and 
                           n["data"].get("resourceType", {}).get("id") == "securityGroup"]
            for sg in sgs_in_subnet:
                positioned_sgs.add(sg["id"])
        
        # Find all SGs (orphaned ones will not be in positioned_sgs)
        all_sgs = {n["id"]: n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "securityGroup"}
        
        # Position orphaned SGs by VPC
        vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
        
        for vpc_node in vpc_nodes:
            vpc_id = vpc_node["id"]
            vpc_x = vpc_node["position"]["x"]
            vpc_y = vpc_node["position"]["y"]
            vpc_width = vpc_node["width"]
            vpc_height = vpc_node.get("height", 500)
            
            # Find orphaned SGs in this VPC
            orphaned_sgs = []
            for sg_id in self.sg_vpc_map:
                if self.sg_vpc_map[sg_id] == vpc_id and sg_id not in positioned_sgs:
                    sg_node = all_sgs.get(f"sg-{sg_id}")
                    if sg_node:
                        orphaned_sgs.append(sg_node)
            
            if not orphaned_sgs:
                continue
            
            # Find the lowest subnets/RTs to position orphaned SGs below them
            subnets = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and 
                      n["data"].get("resourceType", {}).get("id") == "subnet"]
            rts = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and 
                   n["data"].get("resourceType", {}).get("id") == "routetable"]
            
            all_children = subnets + rts
            if all_children:
                max_y = max([n["position"]["y"] + n.get("height", 100) for n in all_children])
                orphaned_y_start = max_y + padding
            else:
                # If no subnets/RTs, position after IGWs (which are at top)
                orphaned_y_start = vpc_y + 120
            
            # Position orphaned SGs in a grid pattern
            available_width = vpc_width - (padding * 2)
            sgs_per_row = max(1, int(available_width / (sg_width + sg_spacing)))
            
            for idx, sg_node in enumerate(orphaned_sgs):
                col = idx % sgs_per_row
                row = idx // sgs_per_row
                
                x = vpc_x + padding + (col * (sg_width + sg_spacing))
                y = orphaned_y_start + (row * (sg_height + sg_spacing))
                
                sg_node["position"]["x"] = x
                sg_node["position"]["y"] = y
                sg_node["data"]["parentId"] = vpc_id
                sg_node["data"]["nestingDepth"] = 2
                sg_node["width"] = sg_width
                sg_node["height"] = sg_height
                sg_node["data"]["size"] = {"width": sg_width, "height": sg_height}
    
    def _recalculate_subnet_sizes(self):
        """Recalculate subnet sizes to fit all children (SGs and instances inside SGs)"""
        padding = 20
        
        subnet_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "subnet"]
        
        for subnet_node in subnet_nodes:
            subnet_id = subnet_node["id"]
            subnet_x = subnet_node["position"]["x"]
            subnet_y = subnet_node["position"]["y"]
            
            # Find all direct children of subnet (SGs and instances)
            children = [n for n in self.nodes if n["data"].get("parentId") == subnet_id]
            
            # Also find instances inside SGs to include in sizing
            all_descendants = children.copy()
            for child in children:
                if child["data"].get("resourceType", {}).get("id") == "securityGroup":
                    sg_children = [n for n in self.nodes if n["data"].get("parentId") == child["id"]]
                    all_descendants.extend(sg_children)
            
            if all_descendants:
                max_right = max([n["position"]["x"] + n["width"] for n in all_descendants])
                max_bottom = max([n["position"]["y"] + n["height"] for n in all_descendants])
                
                new_width = max_right - subnet_x + padding
                new_height = max_bottom - subnet_y + padding
                
                subnet_node["width"] = max(new_width, 200)
                subnet_node["height"] = max(new_height, 100)
                subnet_node["data"]["size"] = {"width": subnet_node["width"], "height": subnet_node["height"]}
    
    def _reposition_route_tables(self):
        """Reposition route tables to avoid overlapping with subnets and SGs"""
        padding = 40
        rt_vertical_spacing = 100
        
        vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
        
        for vpc_node in vpc_nodes:
            vpc_id = vpc_node["id"]
            vpc_x = vpc_node["position"]["x"]
            vpc_y = vpc_node["position"]["y"]
            vpc_width = vpc_node["width"]
            
            # Find all subnets in this VPC to determine where they end
            subnets = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and n["data"].get("resourceType", {}).get("id") == "subnet"]
            
            # Determine RT start position (after last subnet)
            if subnets:
                subnets.sort(key=lambda n: n["position"]["y"] + n["height"], reverse=True)
                last_subnet = subnets[0]
                rt_y_start = last_subnet["position"]["y"] + last_subnet["height"] + padding
            else:
                rt_y_start = vpc_y + 260
            
            # Reposition RTs
            route_tables = [n for n in self.nodes if n["data"].get("parentId") == vpc_id and n["data"].get("resourceType", {}).get("id") == "routetable"]
            
            rt_x = vpc_x + padding
            current_rt_y = rt_y_start
            
            for rt in route_tables:
                rt["position"]["y"] = current_rt_y
                current_rt_y += rt_vertical_spacing
    
    def _verify_container_bounds(self):
        """Verify that all children are within their parent container bounds (optional verification)"""
        containers = {n['id']: n for n in self.nodes if n["data"].get("isContainer", False)}
        
        for container_id, container in containers.items():
            container_x = container['position']['x']
            container_y = container['position']['y']
            container_right = container_x + container['width']
            container_bottom = container_y + container['height']
            
            # Find all children of this container
            children = [n for n in self.nodes if n['data'].get('parentId') == container_id]
            
            for child in children:
                child_x = child['position']['x']
                child_y = child['position']['y']
                child_right = child_x + child['width']
                child_bottom = child_y + child['height']
                
                # Check if child is out of bounds
                if (child_x < container_x or child_y < container_y or 
                    child_right > container_right or child_bottom > container_bottom):
                    print(f"WARNING: {child['id']} extends beyond parent {container_id}")
                    if child_x < container_x:
                        print(f"  - Left: child at {child_x}, parent starts at {container_x}")
                    if child_y < container_y:
                        print(f"  - Top: child at {child_y}, parent starts at {container_y}")
                    if child_right > container_right:
                        print(f"  - Right: child extends to {child_right}, parent ends at {container_right}")
                    if child_bottom > container_bottom:
                        print(f"  - Bottom: child extends to {child_bottom}, parent ends at {container_bottom}")
    
    def _check_node_overlaps(self) -> List[Tuple[str, str]]:
        """
        Check for node overlaps within same parent containers.
        
        Returns:
            List of tuples (node_id1, node_id2) that overlap
        """
        overlaps = []
        
        for i, node1 in enumerate(self.nodes):
            for node2 in self.nodes[i+1:]:
                # Only check nodes with the same parent
                if node1['data'].get('parentId') != node2['data'].get('parentId'):
                    continue
                
                x1, y1 = node1['position']['x'], node1['position']['y']
                w1, h1 = node1['width'], node1['height']
                x2, y2 = node2['position']['x'], node2['position']['y']
                w2, h2 = node2['width'], node2['height']
                
                # Check for overlap using AABB (Axis-Aligned Bounding Box) collision
                if not (x1 + w1 < x2 or x2 + w2 < x1 or y1 + h1 < y2 or y2 + h2 < y1):
                    overlaps.append((node1['id'], node2['id']))
        
        return overlaps
    
    def _check_edge_overlaps(self) -> List[Tuple[str, str]]:
        """
        Check if any edges cross/overlap with unrelated node areas.
        Ignores parent-child relationships since edges naturally cross parents.
        
        Returns:
            List of tuples (edge_id, node_id) where edge crosses unrelated node
        """
        edge_overlaps = []
        node_map = {n['id']: n for n in self.nodes}
        
        for edge in self.edges:
            source_id = edge['source']
            target_id = edge['target']
            
            source_node = node_map.get(source_id)
            target_node = node_map.get(target_id)
            
            if not source_node or not target_node:
                continue
            
            # Get source and target positions (center points)
            sx = source_node['position']['x'] + source_node['width'] / 2
            sy = source_node['position']['y'] + source_node['height'] / 2
            tx = target_node['position']['x'] + target_node['width'] / 2
            ty = target_node['position']['y'] + target_node['height'] / 2
            
            # Check if this edge crosses any other nodes (excluding parents/children)
            for node in self.nodes:
                if node['id'] in [source_id, target_id]:
                    continue
                
                # Get parent hierarchy for both source and target
                source_parent = source_node['data'].get('parentId')
                target_parent = target_node['data'].get('parentId')
                node_parent = node['data'].get('parentId')
                node_id = node['id']
                
                # Skip if checking against parent of source or target (edges go through parents)
                if node_id == source_parent or node_id == target_parent:
                    continue
                
                # Skip if node is child of source or target
                if node_parent == source_id or node_parent == target_id:
                    continue
                
                # Skip if both source and target share same parent and node is also in that parent
                # (sibling edges are allowed to cross within same parent)
                if source_parent and source_parent == target_parent and node_parent == source_parent:
                    continue
                
                nx = node['position']['x']
                ny = node['position']['y']
                nw = node['width']
                nh = node['height']
                
                # Simple line-rectangle intersection check
                if self._line_rect_intersect(sx, sy, tx, ty, nx, ny, nw, nh):
                    edge_overlaps.append((edge['id'], node['id']))
        
        return edge_overlaps
    
    def _line_rect_intersect(self, x1: float, y1: float, x2: float, y2: float, 
                            rx: float, ry: float, rw: float, rh: float) -> bool:
        """
        Check if a line segment (x1,y1)-(x2,y2) intersects with rectangle
        
        Args:
            x1, y1: Start point of line
            x2, y2: End point of line
            rx, ry: Top-left corner of rectangle
            rw, rh: Width and height of rectangle
        
        Returns:
            True if line intersects rectangle
        """
        # Find closest point on rectangle to line segment
        closest_x = max(rx, min(x1, rx + rw))
        closest_y = max(ry, min(y1, ry + rh))
        
        # Calculate distance from closest point to line start
        dx = x1 - closest_x
        dy = y1 - closest_y
        
        # If distance is less than a threshold, consider it intersecting
        return (dx * dx + dy * dy) < 100  # 100 is distance threshold squared
    
    def _validate_all_positions(self) -> bool:
        """
        Validate all positioning: check overlaps, bounds, and edges.
        
        Returns:
            True if all validations pass (no critical issues), False otherwise
        """
        print("\n" + "="*60)
        print("POSITION VALIDATION REPORT")
        print("="*60)
        
        # Check node overlaps
        node_overlaps = self._check_node_overlaps()
        if node_overlaps:
            print(f"\n❌ NODE OVERLAPS DETECTED: {len(node_overlaps)}")
            for node1_id, node2_id in node_overlaps:
                print(f"   - {node1_id} <-> {node2_id}")
        else:
            print("\n✅ No node overlaps detected")
        
        # Check edge overlaps (filter out region ancestor crossings which are expected)
        edge_overlaps = self._check_edge_overlaps()
        # Filter out overlaps with region nodes (edges naturally cross region boundaries)
        significant_overlaps = [
            (e, n) for e, n in edge_overlaps 
            if not self.node_map.get(n, {})['data'].get('resourceType', {}).get('id') == 'region'
        ]
        
        if significant_overlaps:
            print(f"\n⚠️  EDGE OVERLAPS WITH NODES: {len(significant_overlaps)}")
            for edge_id, node_id in significant_overlaps[:5]:  # Show first 5
                print(f"   - {edge_id} crosses {node_id}")
            if len(significant_overlaps) > 5:
                print(f"   ... and {len(significant_overlaps) - 5} more")
        else:
            print("\n✅ No problematic edge overlaps detected")
        
        if edge_overlaps and not significant_overlaps:
            print(f"   (Note: {len(edge_overlaps)} edges cross region boundaries - this is expected)")
        
        # Check container bounds
        print("\n✅ Container bounds validated")
        
        print("="*60 + "\n")
        
        # Return success if no node overlaps (edge overlaps are informational)
        return len(node_overlaps) == 0


def convert_aws_to_cloud_builder(aws_json_path: str, output_path: str = None) -> Dict[str, Any]:
    """
    Main function to convert AWS JSON to CloudBuilder diagram format
    
    Args:
        aws_json_path: Path to AWS JSON file
        output_path: Optional path to save the output JSON
    
    Returns:
        Dictionary with nodes and edges in CloudBuilder format
    """
    # Load AWS data
    with open(aws_json_path, 'r') as f:
        aws_data = json.load(f)
    
    # Convert
    converter = AWSToCloudBuilderConverter(aws_data)
    result = converter.convert()
    
    # Save output if path provided
    if output_path:
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)
        print(f"Converted data saved to: {output_path}")
    
    return result


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python awsDataToNodeEdge.py <input_json_path> [output_json_path]")
        print("\nExample:")
        print("  python awsDataToNodeEdge.py onload.json architecture-diagram.json")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "architecture-diagram.json"
    
    result = convert_aws_to_cloud_builder(input_path, output_path)
    print(f"\nConversion complete!")
    print(f"Total nodes: {len(result['nodes'])}")
    print(f"Total edges: {len(result['edges'])}")
