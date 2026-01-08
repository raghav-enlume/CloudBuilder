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
        "color": "#3949AB"
    },
    "vpc": {
        "id": "vpc",
        "name": "VPC",
        "category": "networking",
        "icon": "vpc",
        "description": "Virtual private cloud",
        "color": "#8C4FFF"
    },
    "subnet": {
        "id": "subnet",
        "name": "Subnet",
        "category": "networking",
        "icon": "vpc",
        "description": "Virtual Subnet",
        "color": "#8C4FFF"
    },
    "instance": {
        "id": "ec2",
        "name": "EC2 Instance",
        "category": "compute",
        "icon": "ec2",
        "description": "Virtual server in the cloud",
        "color": "#FF9900"
    },
    "route_table": {
        "id": "routetable",
        "name": "Route Table",
        "category": "networking",
        "icon": "vpc",
        "description": "Route Table",
        "color": "#8C4FFF"
    },
    "internet_gateway": {
        "id": "internetgateway",
        "name": "Internet Gateway",
        "category": "networking",
        "icon": "elb",
        "description": "Internet Gateway",
        "color": "#FF9900"
    },
    "security_group": {
        "id": "securityGroup",
        "name": "Security Group",
        "category": "security",
        "icon": "waf",
        "description": "Security Group",
        "color": "#DD344C"
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
        for region_name, region_data in self.aws_data.items():
            self._process_region(region_name, region_data)
        
        # Third pass: update region size based on child nodes
        self._update_region_size()
        
        return {
            "nodes": self.nodes,
            "edges": self.edges
        }
    
    def _process_region(self, region_name: str, region_data: Dict):
        """Process all resources in a region"""
        region_id = f"region-{region_name}"
        
        # Create region container node with minimal initial size
        # The actual size will be calculated in _update_region_size based on all children
        self._create_node(
            node_id=region_id,
            label=f"Region: {region_name}",
            resource_type="region",
            position={"x": 0, "y": 0},
            size={"width": 100, "height": 100},  # Minimal initial size, will be recalculated
            is_container=True,
            parent_id=None,
            config={"originalType": "AWS::EC2::Region", "region": region_name},
            nesting_depth=0
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
            vpc_name = self._get_tag_value(vpc.get("Tags", []), "Name", vpc_id)
            
            node_id = f"vpc-{vpc_id}"
            self.vpc_node_map[vpc_id] = node_id
            
            # Distribute VPCs horizontally with proper spacing
            # Increased spacing to accommodate all children
            x_pos = 100 + (idx * 1300)
            vpc_width = 1200  # Increased width to fit all children
            vpc_height = 700  # Increased height to fit all children
            self.max_x_position = max(self.max_x_position, x_pos + vpc_width)
            
            self._create_node(
                node_id=node_id,
                label=vpc_name,
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
                vpc_id=vpc_id,
                cidr_block=vpc.get("CidrBlock"),
                state=vpc.get("State"),
                is_default=vpc.get("IsDefault", False)
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
            vpc_width = vpc_node["width"]
            
            # Calculate available space inside VPC (with 40px padding on each side)
            padding = 40
            available_width = vpc_width - (padding * 2)
            subnet_height = 160  # Fixed height for subnets
            
            # Position subnets in a grid within VPC bounds
            for subnet_idx, subnet in enumerate(vpc_subnets):
                subnet_id = subnet.get("SubnetId")
                subnet_name = self._get_tag_value(subnet.get("Tags", []), "Name", subnet_id)
                node_id = f"subnet-{subnet_id}"
                
                # Stack subnets vertically with proper margins
                x_pos = vpc_x + padding
                y_pos = 170 + (subnet_idx * 170)  # 170 = 160 (height) + 10 (margin between)
                
                self._create_node(
                    node_id=node_id,
                    label=subnet_name,
                    resource_type="subnet",
                    position={"x": x_pos, "y": y_pos},
                    size={"width": available_width, "height": subnet_height},
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
                    subnet_id=subnet_id,
                    vpc_id=vpc_id,
                    cidr_block=subnet.get("CidrBlock"),
                    availability_zone=subnet.get("AvailabilityZone"),
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
        """Process EC2 Instances"""
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
            subnet_width = subnet_node["width"]
            
            # Position instance inside subnet with margins
            padding = 20
            instance_width = 120
            x_pos = subnet_x + padding
            # Ensure instance doesn't exceed subnet width
            if x_pos + instance_width > subnet_x + subnet_width - padding:
                x_pos = subnet_x + subnet_width - instance_width - padding
            
            self._create_node(
                node_id=node_id,
                label=instance_name,
                resource_type="instance",
                position={"x": x_pos, "y": 165},
                size={"width": 120, "height": 88},
                is_container=False,
                parent_id=subnet_node_id,
                config={
                    "originalType": "AWS::EC2::Instance",
                    "region": subnet_id.split('-')[1] if len(subnet_id.split('-')) > 1 else "unknown",
                    "vpc": instance.get("VpcId"),
                    "subnet": subnet_id,
                    "securityGroup": instance.get("SecurityGroups", [{}])[0].get("GroupId"),
                    "instanceType": instance.get("InstanceType"),
                    "architecture": instance.get("Architecture"),
                    "hypervisor": instance.get("Hypervisor"),
                    "virtualizationType": instance.get("VirtualizationType"),
                    "rootDeviceName": instance.get("RootDeviceName"),
                    "rootDeviceType": instance.get("RootDeviceType"),
                    "keyName": instance.get("KeyName")
                },
                nesting_depth=3,
                instance_id=instance_id,
                instance_type=instance.get("InstanceType"),
                state=instance.get("State", {}).get("Name"),
                private_ip=instance.get("PrivateIpAddress"),
                public_ip=instance.get("PublicIpAddress"),
                image_id=instance.get("ImageId"),
                launch_time=instance.get("LaunchTime"),
                subnet_id=subnet_id,
                vpc_id=instance.get("VpcId")
            )
            
            # Create Subnet -> Instance edge
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
            vpc_width = vpc_node["width"]
            
            # Position IGWs horizontally at the top with proper spacing
            padding = 40
            igw_spacing = (vpc_width - (padding * 2)) / (len(vpc_igws) + 1)
            
            for igw_idx, igw in enumerate(vpc_igws):
                igw_id = igw.get("InternetGatewayId")
                igw_name = self._get_tag_value(igw.get("Tags", []), "Name", igw_id)
                node_id = f"igw-{igw_id}"
                
                x_pos = vpc_x + padding + ((igw_idx + 1) * igw_spacing) - 60
                
                self._create_node(
                    node_id=node_id,
                    label=igw_name,
                    resource_type="internet_gateway",
                    position={"x": x_pos, "y": 150},
                    size={"width": 120, "height": 88},
                    is_container=False,
                    parent_id=vpc_node_id,
                    config={
                        "originalType": "AWS::EC2::InternetGateway",
                        "region": vpc_id.split('-')[1] if len(vpc_id.split('-')) > 1 else "unknown",
                        "ownerId": igw.get("OwnerId")
                    },
                    nesting_depth=2,
                    gateway_id=igw_id
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
            vpc_width = vpc_node["width"]
            
            # Position RTs in a row at the bottom with proper spacing and margin
            padding = 40
            rt_spacing = (vpc_width - (padding * 2)) / (len(vpc_rts) + 1)
            
            for idx, rt in enumerate(vpc_rts):
                rt_id = rt.get("RouteTableId")
                rt_name = self._get_tag_value(rt.get("Tags", []), "Name", rt_id)
                node_id = f"rt-{rt_id}"
                self.rt_node_map[rt_id] = node_id
                
                x_pos = vpc_x + padding + ((idx + 1) * rt_spacing) - 60
                
                self._create_node(
                    node_id=node_id,
                    label=rt_name,
                    resource_type="route_table",
                    position={"x": x_pos, "y": 600},
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
                    route_table_id=rt_id,
                    vpc_id=vpc_id,
                    routes=rt.get("Routes", [])
                )
    
    def _process_security_groups(self, sgs: List[Dict]):
        """Process Security Groups"""
        # Group security groups by VPC
        sg_by_vpc: Dict[str, List[Dict]] = {}
        for sg in sgs:
            vpc_id = sg.get("VpcId")
            if vpc_id not in sg_by_vpc:
                sg_by_vpc[vpc_id] = []
            sg_by_vpc[vpc_id].append(sg)
        
        # Position security groups per VPC
        for vpc_id, vpc_sgs in sg_by_vpc.items():
            vpc_node_id = self.vpc_node_map.get(vpc_id)
            
            if not vpc_node_id:
                continue
            
            vpc_node = self.node_map.get(vpc_node_id)
            vpc_x = vpc_node["position"]["x"]
            vpc_width = vpc_node["width"]
            
            # Position SGs in a row below RTs with proper spacing and margin
            padding = 40
            sg_spacing = (vpc_width - (padding * 2)) / (len(vpc_sgs) + 1)
            
            for idx, sg in enumerate(vpc_sgs):
                sg_id = sg.get("GroupId")
                sg_name = sg.get("GroupName", sg_id)
                node_id = f"sg-{sg_id}"
                self.sg_node_map[sg_id] = node_id
                
                x_pos = vpc_x + padding + ((idx + 1) * sg_spacing) - 60
                
                self._create_node(
                    node_id=node_id,
                    label=sg_name,
                    resource_type="security_group",
                    position={"x": x_pos, "y": 600},
                    size={"width": 120, "height": 88},
                    is_container=False,
                    parent_id=vpc_node_id,
                    config={
                        "originalType": "AWS::EC2::SecurityGroup",
                        "region": vpc_id.split('-')[1] if len(vpc_id.split('-')) > 1 else "unknown",
                        "ownerId": sg.get("OwnerId"),
                        "vpc": vpc_id,
                        "groupName": sg_name
                    },
                    nesting_depth=2,
                    group_id=sg_id,
                    group_name=sg_name,
                    vpc_id=vpc_id,
                    description=sg.get("Description"),
                    inbound_rules=len(sg.get("IpPermissions", [])),
                    outbound_rules=len(sg.get("IpPermissionsEgress", []))
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
            instance_node_id = f"instance-{instance_id}"
            
            if instance_node_id not in self.node_map:
                continue
            
            for sg in instance.get("SecurityGroups", []):
                sg_id = sg.get("GroupId")
                sg_node_id = self.sg_node_map.get(sg_id)
                
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
        
        node = {
            "id": node_id,
            "type": "resourceNode",
            "position": position,
            "data": {
                "label": label,
                "resourceType": rt_def,
                "isContainer": is_container,
                "config": config,
                "nestingDepth": nesting_depth,
                **kwargs
            },
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
        """
        padding = 40
        
        # First pass: Update subnet sizes based on their instances
        subnet_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "subnet"]
        for subnet_node in subnet_nodes:
            subnet_id = subnet_node["id"]
            children = [n for n in self.nodes if n["data"].get("parentId") == subnet_id]
            
            if children:
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
                
                region_node["width"] = new_width
                region_node["height"] = new_height
                region_node["size"] = {"width": new_width, "height": new_height}
                
                print(f"Region '{region_id}' sized to: {new_width}x{new_height} (VPCs max: {max_right}x{max_bottom})")


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
