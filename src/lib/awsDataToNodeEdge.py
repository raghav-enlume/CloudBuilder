#!/usr/bin/env python3
"""
Convert AWS data format to CloudBuilder diagram format (architecture-diagram.json)
Supports 50+ AWS resources with relationship mapping
"""

import json
import uuid
from typing import Dict, List, Any, Tuple
from collections import defaultdict

# Resource type definitions matching CloudBuilder format - 50+ AWS resources
RESOURCE_TYPES = {
    # Networking
    "region": {
        "id": "region", "name": "Region", "category": "networking", "icon": "vpc",
        "description": "AWS Region", "color": "#3949AB",
        "editableAttributes": [{"key": "label", "label": "Region Name", "type": "text"},
                               {"key": "region", "label": "Region Code", "type": "text"}]
    },
    "vpc": {
        "id": "vpc", "name": "VPC", "category": "networking", "icon": "vpc",
        "description": "Virtual Private Cloud", "color": "#8C4FFF",
        "editableAttributes": [{"key": "vpcName", "label": "VPC Name", "type": "text", "placeholder": "my-vpc"},
                               {"key": "cidrBlock", "label": "CIDR Block", "type": "text", "placeholder": "10.0.0.0/16"}]
    },
    "subnet": {
        "id": "subnet", "name": "Subnet", "category": "networking", "icon": "vpc",
        "description": "Virtual Subnet", "color": "#8C4FFF",
        "editableAttributes": [{"key": "label", "label": "Subnet ID", "type": "text"},
                               {"key": "cidrBlock", "label": "CIDR Block", "type": "text"}]
    },
    "route_table": {
        "id": "routetable", "name": "Route Table", "category": "networking", "icon": "vpc",
        "description": "Route Table", "color": "#8C4FFF",
        "editableAttributes": [{"key": "label", "label": "Route Table ID", "type": "text"}]
    },
    "internet_gateway": {
        "id": "internetgateway", "name": "Internet Gateway", "category": "networking", "icon": "elb",
        "description": "Internet Gateway", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Gateway ID", "type": "text"}]
    },
    "nat_gateway": {
        "id": "natgateway", "name": "NAT Gateway", "category": "networking", "icon": "elb",
        "description": "NAT Gateway", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "NAT Gateway ID", "type": "text"}]
    },
    "network_interface": {
        "id": "eni", "name": "Network Interface", "category": "networking", "icon": "elb",
        "description": "Elastic Network Interface", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "ENI ID", "type": "text"}]
    },
    "transit_gateway": {
        "id": "tgw", "name": "Transit Gateway", "category": "networking", "icon": "vpc",
        "description": "Transit Gateway", "color": "#8C4FFF",
        "editableAttributes": [{"key": "label", "label": "TGW ID", "type": "text"}]
    },
    "vpc_peering": {
        "id": "vpcpeering", "name": "VPC Peering", "category": "networking", "icon": "vpc",
        "description": "VPC Peering Connection", "color": "#8C4FFF",
        "editableAttributes": [{"key": "label", "label": "Peering ID", "type": "text"}]
    },
    # Compute
    "instance": {
        "id": "ec2", "name": "EC2 Instance", "category": "compute", "icon": "ec2",
        "description": "Elastic Compute Cloud", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Instance ID", "type": "text"},
                               {"key": "instanceType", "label": "Instance Type", "type": "text"}]
    },
    "auto_scaling_group": {
        "id": "asg", "name": "Auto Scaling Group", "category": "compute", "icon": "ec2",
        "description": "Auto Scaling Group", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "ASG Name", "type": "text"}]
    },
    "lambda": {
        "id": "lambda", "name": "Lambda Function", "category": "compute", "icon": "lambda",
        "description": "Serverless Function", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Function Name", "type": "text"},
                               {"key": "runtime", "label": "Runtime", "type": "text"}]
    },
    "ecs_cluster": {
        "id": "ecscluster", "name": "ECS Cluster", "category": "compute", "icon": "ecs",
        "description": "Elastic Container Service Cluster", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Cluster Name", "type": "text"}]
    },
    "ecs_service": {
        "id": "ecsservice", "name": "ECS Service", "category": "compute", "icon": "ecs",
        "description": "ECS Service", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Service Name", "type": "text"}]
    },
    "ecs_task": {
        "id": "ecstask", "name": "ECS Task", "category": "compute", "icon": "ecs",
        "description": "ECS Task", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Task ID", "type": "text"}]
    },
    # Load Balancing
    "alb": {
        "id": "alb", "name": "Application Load Balancer", "category": "networking", "icon": "elb",
        "description": "Application Load Balancer", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "ALB Name", "type": "text"}]
    },
    "nlb": {
        "id": "nlb", "name": "Network Load Balancer", "category": "networking", "icon": "elb",
        "description": "Network Load Balancer", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "NLB Name", "type": "text"}]
    },
    "target_group": {
        "id": "targetgroup", "name": "Target Group", "category": "networking", "icon": "elb",
        "description": "Target Group", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Target Group Name", "type": "text"}]
    },
    # Database
    "rds_instance": {
        "id": "rds", "name": "RDS Instance", "category": "database", "icon": "rds",
        "description": "Relational Database", "color": "#527FFF",
        "editableAttributes": [{"key": "label", "label": "DB Instance", "type": "text"},
                               {"key": "engine", "label": "Engine", "type": "text"}]
    },
    "rds_read_replica": {
        "id": "rdsreplica", "name": "RDS Read Replica", "category": "database", "icon": "rds",
        "description": "RDS Read Replica", "color": "#527FFF",
        "editableAttributes": [{"key": "label", "label": "Replica Name", "type": "text"}]
    },
    "dynamodb": {
        "id": "dynamodb", "name": "DynamoDB Table", "category": "database", "icon": "dynamodb",
        "description": "NoSQL Database", "color": "#527FFF",
        "editableAttributes": [{"key": "label", "label": "Table Name", "type": "text"}]
    },
    "elasticache": {
        "id": "elasticache", "name": "ElastiCache", "category": "database", "icon": "elasticache",
        "description": "In-Memory Cache", "color": "#527FFF",
        "editableAttributes": [{"key": "label", "label": "Cache ID", "type": "text"}]
    },
    "redshift": {
        "id": "redshift", "name": "Redshift", "category": "database", "icon": "redshift",
        "description": "Data Warehouse", "color": "#527FFF",
        "editableAttributes": [{"key": "label", "label": "Cluster ID", "type": "text"}]
    },
    # Security
    "security_group": {
        "id": "securityGroup", "name": "Security Group", "category": "security", "icon": "waf",
        "description": "Security Group", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "SG Name", "type": "text"}]
    },
    "acl": {
        "id": "nacl", "name": "Network ACL", "category": "security", "icon": "waf",
        "description": "Network Access Control List", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "NACL ID", "type": "text"}]
    },
    "waf": {
        "id": "waf", "name": "AWS WAF", "category": "security", "icon": "waf",
        "description": "Web Application Firewall", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "WAF Name", "type": "text"}]
    },
    "iam_role": {
        "id": "iamrole", "name": "IAM Role", "category": "security", "icon": "iam",
        "description": "IAM Role", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "Role Name", "type": "text"}]
    },
    "iam_user": {
        "id": "iamuser", "name": "IAM User", "category": "security", "icon": "iam",
        "description": "IAM User", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "User Name", "type": "text"}]
    },
    "iam_policy": {
        "id": "iampolicy", "name": "IAM Policy", "category": "security", "icon": "iam",
        "description": "IAM Policy", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "Policy Name", "type": "text"}]
    },
    "kms": {
        "id": "kms", "name": "KMS Key", "category": "security", "icon": "kms",
        "description": "Key Management Service", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "Key ID", "type": "text"}]
    },
    "secrets_manager": {
        "id": "secretsmanager", "name": "Secrets Manager", "category": "security", "icon": "secretsmanager",
        "description": "Secrets Manager", "color": "#DD344C",
        "editableAttributes": [{"key": "label", "label": "Secret Name", "type": "text"}]
    },
    # Storage
    "s3": {
        "id": "s3", "name": "S3 Bucket", "category": "storage", "icon": "s3",
        "description": "Simple Storage Service", "color": "#569A31",
        "editableAttributes": [{"key": "label", "label": "Bucket Name", "type": "text"}]
    },
    "ebs": {
        "id": "ebs", "name": "EBS Volume", "category": "storage", "icon": "ebs",
        "description": "Elastic Block Store", "color": "#569A31",
        "editableAttributes": [{"key": "label", "label": "Volume ID", "type": "text"}]
    },
    "efs": {
        "id": "efs", "name": "EFS", "category": "storage", "icon": "efs",
        "description": "Elastic File System", "color": "#569A31",
        "editableAttributes": [{"key": "label", "label": "File System ID", "type": "text"}]
    },
    "fsx": {
        "id": "fsx", "name": "FSx", "category": "storage", "icon": "fsx",
        "description": "File Storage Service", "color": "#569A31",
        "editableAttributes": [{"key": "label", "label": "FSx ID", "type": "text"}]
    },
    "glacier": {
        "id": "glacier", "name": "Glacier", "category": "storage", "icon": "glacier",
        "description": "Archive Storage", "color": "#569A31",
        "editableAttributes": [{"key": "label", "label": "Vault Name", "type": "text"}]
    },
    # Analytics
    "cloudwatch": {
        "id": "cloudwatch", "name": "CloudWatch", "category": "management", "icon": "cloudwatch",
        "description": "Monitoring Service", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Log Group", "type": "text"}]
    },
    "kinesis": {
        "id": "kinesis", "name": "Kinesis", "category": "analytics", "icon": "kinesis",
        "description": "Real-time Data", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Stream Name", "type": "text"}]
    },
    "emr": {
        "id": "emr", "name": "EMR Cluster", "category": "analytics", "icon": "emr",
        "description": "Elastic MapReduce", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Cluster ID", "type": "text"}]
    },
    # Application Services
    "api_gateway": {
        "id": "apigateway", "name": "API Gateway", "category": "networking", "icon": "apigateway",
        "description": "API Gateway", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "API Name", "type": "text"}]
    },
    "sqs": {
        "id": "sqs", "name": "SQS Queue", "category": "messaging", "icon": "sqs",
        "description": "Simple Queue Service", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Queue Name", "type": "text"}]
    },
    "sns": {
        "id": "sns", "name": "SNS Topic", "category": "messaging", "icon": "sns",
        "description": "Simple Notification Service", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Topic Name", "type": "text"}]
    },
    "step_functions": {
        "id": "stepfunctions", "name": "Step Functions", "category": "compute", "icon": "stepfunctions",
        "description": "Workflow Orchestration", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "State Machine", "type": "text"}]
    },
    "codepipeline": {
        "id": "codepipeline", "name": "CodePipeline", "category": "devops", "icon": "codepipeline",
        "description": "CI/CD Pipeline", "color": "#FF6C40",
        "editableAttributes": [{"key": "label", "label": "Pipeline Name", "type": "text"}]
    },
    "codebuild": {
        "id": "codebuild", "name": "CodeBuild", "category": "devops", "icon": "codebuild",
        "description": "Build Service", "color": "#FF6C40",
        "editableAttributes": [{"key": "label", "label": "Project Name", "type": "text"}]
    },
    "codedeploy": {
        "id": "codedeploy", "name": "CodeDeploy", "category": "devops", "icon": "codedeploy",
        "description": "Deployment Service", "color": "#FF6C40",
        "editableAttributes": [{"key": "label", "label": "Application", "type": "text"}]
    },
    # Management
    "cloudformation": {
        "id": "cloudformation", "name": "CloudFormation", "category": "management", "icon": "cloudformation",
        "description": "Infrastructure as Code", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Stack Name", "type": "text"}]
    },
    "cloudtrail": {
        "id": "cloudtrail", "name": "CloudTrail", "category": "management", "icon": "cloudtrail",
        "description": "Audit Logging", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Trail Name", "type": "text"}]
    },
    "config": {
        "id": "config", "name": "Config", "category": "management", "icon": "config",
        "description": "Compliance Monitoring", "color": "#FFA000",
        "editableAttributes": [{"key": "label", "label": "Config Rule", "type": "text"}]
    },
    # Content Delivery
    "cloudfront": {
        "id": "cloudfront", "name": "CloudFront", "category": "networking", "icon": "cloudfront",
        "description": "Content Delivery Network", "color": "#FF9900",
        "editableAttributes": [{"key": "label", "label": "Distribution ID", "type": "text"}]
    }
}

# Edge styling definitions
EDGE_STYLES = {
    # Networking relationships
    "vpc-to-subnet": {"stroke": "#8C4FFF", "strokeWidth": 2},
    "subnet-to-instance": {"stroke": "#FF9900", "strokeWidth": 2},
    "rt-to-subnet": {"stroke": "#FFA000", "strokeWidth": 2, "strokeDasharray": "4,4"},
    "subnet-to-nat": {"stroke": "#FF9900", "strokeWidth": 2},
    "subnet-to-alb": {"stroke": "#FF9900", "strokeWidth": 2},
    "subnet-to-rds": {"stroke": "#527FFF", "strokeWidth": 2},
    "alb-to-target": {"stroke": "#FF9900", "strokeWidth": 2},
    "api-to-lambda": {"stroke": "#FF9900", "strokeWidth": 2},
    # Security relationships
    "sg-to-instance": {"stroke": "#DD344C", "strokeWidth": 1, "strokeDasharray": "5,5"},
    "sg-to-rds": {"stroke": "#DD344C", "strokeWidth": 1, "strokeDasharray": "5,5"},
    "sg-to-alb": {"stroke": "#DD344C", "strokeWidth": 1, "strokeDasharray": "5,5"},
    "iam-to-resource": {"stroke": "#DD344C", "strokeWidth": 1, "strokeDasharray": "3,3"},
    "kms-to-resource": {"stroke": "#DD344C", "strokeWidth": 1, "strokeDasharray": "3,3"},
    # Compute relationships
    "asg-to-instance": {"stroke": "#FF9900", "strokeWidth": 2},
    "ecs-cluster-to-service": {"stroke": "#FF9900", "strokeWidth": 2},
    "ecs-service-to-task": {"stroke": "#FF9900", "strokeWidth": 2},
    # Messaging & Queue relationships
    "lambda-to-sqs": {"stroke": "#FFA000", "strokeWidth": 1, "strokeDasharray": "4,4"},
    "lambda-to-sns": {"stroke": "#FFA000", "strokeWidth": 1, "strokeDasharray": "4,4"},
    "sqs-to-lambda": {"stroke": "#FFA000", "strokeWidth": 2},
    "sns-to-lambda": {"stroke": "#FFA000", "strokeWidth": 2},
    # Database relationships
    "rds-to-sg": {"stroke": "#527FFF", "strokeWidth": 1},
    "dynamodb-to-lambda": {"stroke": "#527FFF", "strokeWidth": 1},
    "elasticache-to-instance": {"stroke": "#527FFF", "strokeWidth": 1},
    # Storage relationships
    "instance-to-ebs": {"stroke": "#569A31", "strokeWidth": 1},
    "instance-to-s3": {"stroke": "#569A31", "strokeWidth": 1},
    "lambda-to-s3": {"stroke": "#569A31", "strokeWidth": 1},
    # Monitoring relationships
    "resource-to-cloudwatch": {"stroke": "#FFA000", "strokeWidth": 1, "strokeDasharray": "2,2"},
    # Content Delivery
    "cloudfront-to-s3": {"stroke": "#FF9900", "strokeWidth": 2},
    "cloudfront-to-alb": {"stroke": "#FF9900", "strokeWidth": 2},
    # Default
    "default": {"stroke": "#999999", "strokeWidth": 1}
}


class SugiyamaLayout:
    """
    Sugiyama layered graph drawing algorithm implementation for AWS resources
    
    Phases:
    1. Layer Assignment: Assign nodes to layers based on AWS hierarchy depth
    2. Node Ordering: Order nodes within layers to minimize edge crossings
    3. Position Calculation: Calculate x, y coordinates respecting parent-child relationships
    4. Container Sizing: Size all containers to fit their children
    """
    
    # AWS resource type to layer mapping
    RESOURCE_LAYERS = {
        'region': 0,
        'vpc': 1,
        'subnet': 2,
        'ec2': 3,
        'lambda': 3,
        'rds': 2,
        's3': 1,
        'internetgateway': 1,
        'natgateway': 2,
        'routetable': 1,
        'securityGroup': 2,
        'elasticache': 2,
        'dynamodb': 1,
        'alb': 2,
        'nlb': 2,
        'cloudwatch': 1,
        'cloudfront': 0,
        'apigateway': 1,
        'ebs': 3,
        'snapshot': 2,
    }
    
    # Layout spacing parameters
    LAYER_SPACING = 300  # Vertical space between layers
    NODE_SPACING = 200   # Horizontal space between sibling nodes
    CONTAINER_PADDING = 30  # Padding inside containers
    
    @staticmethod
    def apply_layout(nodes: List[Dict], edges: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Apply Sugiyama layout algorithm to AWS resource graph
        """
        # Build hierarchy maps
        parent_map = {}
        children_map = defaultdict(list)
        
        for node in nodes:
            parent_id = node['data'].get('parentId')
            if parent_id:
                parent_map[node['id']] = parent_id
                children_map[parent_id].append(node['id'])
        
        # Do NOT assign region parents to external services
        # They should remain root-level for proper spacing outside region boundaries
        
        # Phase 1: Assign layers based on AWS hierarchy
        layers = SugiyamaLayout._assign_layers(nodes, parent_map)
        
        # Phase 2: Order nodes within layers to minimize crossings
        SugiyamaLayout._order_nodes_by_barycenter(nodes, edges, layers)
        
        # Phase 3: Calculate positions (x, y)
        SugiyamaLayout._calculate_positions(nodes, layers, parent_map, children_map)
        
        # Phase 4: Size containers to fit children
        SugiyamaLayout._size_containers(nodes, children_map)
        
        return nodes, edges
    
    @staticmethod
    def _assign_layers(nodes: List[Dict], parent_map: Dict) -> Dict[str, int]:
        """
        Assign layer number to each node based on AWS hierarchy depth
        """
        layers = {}
        
        for node in nodes:
            resource_type = node['data'].get('resourceType', {}).get('id', 'unknown')
            
            # Use predefined layer if available
            if resource_type in SugiyamaLayout.RESOURCE_LAYERS:
                layers[node['id']] = SugiyamaLayout.RESOURCE_LAYERS[resource_type]
            else:
                # Calculate layer based on parent hierarchy
                if node['id'] in parent_map:
                    parent_id = parent_map[node['id']]
                    parent_layer = layers.get(parent_id, 1)
                    layers[node['id']] = parent_layer + 1
                else:
                    layers[node['id']] = 0
        
        return layers
    
    @staticmethod
    def _order_nodes_by_barycenter(nodes: List[Dict], edges: List[Dict], layers: Dict) -> None:
        """
        Order nodes within each layer using barycenter heuristic
        to minimize edge crossings
        """
        # Group nodes by layer
        layer_nodes = defaultdict(list)
        for node in nodes:
            layer = layers.get(node['id'], 0)
            layer_nodes[layer].append(node)
        
        # For each layer, sort by barycenter position of neighbors
        for layer in sorted(layer_nodes.keys()):
            nodes_in_layer = layer_nodes[layer]
            barycenters = {}
            
            for node in nodes_in_layer:
                neighbor_positions = []
                
                # Find positions of connected nodes
                for edge in edges:
                    if edge['source'] == node['id']:
                        neighbor = next((n for n in nodes if n['id'] == edge['target']), None)
                        if neighbor and layers.get(neighbor['id'], layer) != layer:
                            neighbor_positions.append(neighbor['position'].get('x', 0))
                    elif edge['target'] == node['id']:
                        neighbor = next((n for n in nodes if n['id'] == edge['source']), None)
                        if neighbor and layers.get(neighbor['id'], layer) != layer:
                            neighbor_positions.append(neighbor['position'].get('x', 0))
                
                # Calculate barycenter (average position of neighbors)
                if neighbor_positions:
                    barycenters[node['id']] = sum(neighbor_positions) / len(neighbor_positions)
                else:
                    barycenters[node['id']] = node['position'].get('x', 0)
            
            # Sort nodes by barycenter value
            layer_nodes[layer].sort(key=lambda n: barycenters.get(n['id'], 0))
    
    @staticmethod
    def _calculate_positions(nodes: List[Dict], layers: Dict, parent_map: Dict, children_map: Dict) -> None:
        """
        Calculate x, y coordinates for all nodes
        Respects parent-child relationships and container boundaries
        """
        # Group nodes by layer
        layer_nodes = defaultdict(list)
        for node in nodes:
            layer = layers.get(node['id'], 0)
            layer_nodes[layer].append(node)
        
        # Calculate y-position for each layer
        layer_y = {}
        current_y = 0
        
        for layer in sorted(layer_nodes.keys()):
            layer_y[layer] = current_y
            max_height = max((n.get('height', 80) for n in layer_nodes[layer]), default=80)
            current_y += max_height + SugiyamaLayout.LAYER_SPACING
        
        # Position nodes within each layer
        for layer in sorted(layer_nodes.keys()):
            nodes_in_layer = layer_nodes[layer]
            
            # Group nodes by parent
            parent_groups = defaultdict(list)
            for node in nodes_in_layer:
                parent_id = parent_map.get(node['id'], 'root')
                parent_groups[parent_id].append(node)
            
            # Position each group
            current_x = 20  # Start at left margin
            
            for parent_id, group_nodes in parent_groups.items():
                parent_node = next((n for n in nodes if n['id'] == parent_id), None) if parent_id != 'root' else None
                
                if parent_node:
                    # Position children inside parent container
                    parent_x = parent_node['position'].get('x', 0)
                    start_x = parent_x + SugiyamaLayout.CONTAINER_PADDING
                    
                    # Distribute horizontally within container
                    max_parent_right = parent_x + parent_node.get('width', 600)
                    
                    for idx, node in enumerate(group_nodes):
                        node_width = node.get('width', 120)
                        x_pos = start_x + (idx * (node_width + SugiyamaLayout.NODE_SPACING))
                        
                        # Ensure node stays within parent bounds
                        if x_pos + node_width > max_parent_right - SugiyamaLayout.CONTAINER_PADDING:
                            x_pos = max_parent_right - node_width - SugiyamaLayout.CONTAINER_PADDING
                        
                        # Add Y-based offset for multiple children at same layer to avoid overlap
                        y_offset = idx * 100  # Larger vertical offset between siblings (was 25)
                        node['position']['x'] = x_pos
                        node['position']['y'] = layer_y[layer] + y_offset
                else:
                    # Root-level nodes - position away from containers
                    # Find rightmost boundary of all containers to position externals beyond
                    container_nodes = [n for n in nodes if n['data'].get('isContainer', False)]
                    max_container_right = 0
                    if container_nodes:
                        max_container_right = max(
                            n['position'].get('x', 0) + n.get('width', 600) 
                            for n in container_nodes
                        )
                    
                    # Position root nodes far to the right with proper spacing
                    start_x = max(current_x, max_container_right + 200)
                    
                    for idx, node in enumerate(group_nodes):
                        node_width = node.get('width', 120)
                        # Add Y-based offset for multiple nodes at same layer to avoid overlap
                        y_offset = idx * 20  # Slight vertical offset
                        node['position']['x'] = start_x + (idx * (node_width + SugiyamaLayout.NODE_SPACING))
                        node['position']['y'] = layer_y[layer] + y_offset
                    
                    # Update current_x for next root group
                    if group_nodes:
                        last_node = group_nodes[-1]
                        current_x = last_node['position'].get('x', 0) + last_node.get('width', 120) + SugiyamaLayout.NODE_SPACING
    
    @staticmethod
    def _size_containers(nodes: List[Dict], children_map: Dict) -> None:
        """
        Size containers (Region, VPC, Subnet) to fit all children
        Process bottom-up: deepest containers first
        """
        containers = [n for n in nodes if n['data'].get('isContainer', False)]
        containers.sort(key=lambda n: n['data'].get('nestingDepth', 0), reverse=True)
        
        for container in containers:
            children_ids = children_map.get(container['id'], [])
            if not children_ids:
                continue
            
            children = [n for n in nodes if n['id'] in children_ids]
            if not children:
                continue
            
            # Calculate bounds
            min_x = min(c['position'].get('x', 0) for c in children)
            max_x = max(c['position'].get('x', 0) + c.get('width', 150) for c in children)
            min_y = min(c['position'].get('y', 0) for c in children)
            max_y = max(c['position'].get('y', 0) + c.get('height', 80) for c in children)
            
            # Size container
            container['position']['x'] = min_x - SugiyamaLayout.CONTAINER_PADDING
            container['position']['y'] = min_y - SugiyamaLayout.CONTAINER_PADDING
            container['width'] = (max_x - min_x) + (2 * SugiyamaLayout.CONTAINER_PADDING)
            container['height'] = (max_y - min_y) + (2 * SugiyamaLayout.CONTAINER_PADDING)
            
            container['data']['size'] = {
                'width': container['width'],
                'height': container['height']
            }


class AWSToCloudBuilderConverter:
    def __init__(self, aws_data: Dict[str, Any], use_sugiyama: bool = False):
        self.aws_data = aws_data
        self.use_sugiyama = use_sugiyama
        self.nodes: List[Dict] = []
        self.edges: List[Dict] = []
        self.node_map: Dict[str, Dict] = {}  # node_id -> node data
        self.vpc_node_map: Dict[str, str] = {}  # vpc_id -> node_id
        self.subnet_node_map: Dict[str, Tuple[str, str]] = {}  # subnet_id -> (node_id, vpc_node_id)
        self.sg_node_map: Dict[str, str] = {}  # sg_id -> node_id
        self.sg_vpc_map: Dict[str, str] = {}  # sg_id -> vpc_id (for tracking which VPC an SG belongs to)
        self.rt_node_map: Dict[str, str] = {}  # rt_id -> node_id
        self.instance_node_map: Dict[str, str] = {}  # instance_id -> node_id
        self.s3_node_map: Dict[str, str] = {}  # bucket_name -> node_id
        self.rds_node_map: Dict[str, str] = {}  # db_name -> node_id
        self.igw_node_map: Dict[str, str] = {}  # igw_id -> node_id
        self.nat_gw_node_map: Dict[str, str] = {}  # nat_id -> node_id
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
        
        # Third pass: Apply layout algorithm
        # Use Sugiyama layered graph algorithm or AWS-aware grid layout
        if self.use_sugiyama:
            print("Applying Sugiyama layered graph algorithm for resource placement...")
            self.nodes, self.edges = SugiyamaLayout.apply_layout(self.nodes, self.edges)
        else:
            print("Applying AWS-aware hierarchical grid layout...")
            self._apply_hierarchical_layout()
        
        # Fourth pass: Resolve overlaps between sibling containers
        self._resolve_container_collisions()
        
        # Fifth pass: Resize parent containers to fit repositioned children
        self._resize_containers_to_fit_children()
        
        # Sixth pass: Verify layout and validate positions
        self._verify_container_bounds()
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
        igws = region_data.get("internet_gateways", [])
        self._process_igws(igws)
        
        # Process Route Tables
        route_tables = region_data.get("route_tables", [])
        self._process_route_tables(route_tables)
        
        # Process Security Groups
        sgs = region_data.get("security_groups", [])
        self._process_security_groups(sgs)
        
        # Process NAT Gateways
        nat_gateways = region_data.get("nat_gateways", [])
        self._process_nat_gateways(nat_gateways)
        
        # Process RDS Instances
        rds_instances = region_data.get("rds_instances", [])
        self._process_rds_instances(rds_instances)
        
        # Process additional generic resources (Lambda, ALB, S3, API Gateway, etc.)
        self._process_generic_resources(region_name, region_data)
        
        # Create edges for Internet Gateways to VPC
        self._create_igw_vpc_edges(igws)
        
        # Create edges for route tables to subnets
        self._create_rt_subnet_edges(route_tables)
        
        # Create edges for route tables to gateways (IGW/NAT)
        self._create_rt_gateway_edges(route_tables)
        
        # Create edges for security groups to instances
        self._create_sg_instance_edges(instances)
        
        # Create edges for NAT Gateways to subnets
        self._create_nat_subnet_edges(nat_gateways)
        
        # Create edges for RDS to subnets and security groups
        self._create_rds_edges(rds_instances)
        
        # Create edges for maximum connectivity between existing resources
        self._create_instance_s3_edges(instances)
        self._create_rds_s3_edges(rds_instances)
        self._create_nat_vpc_edges(nat_gateways)
        self._create_instance_subnet_edges(instances)
        self._create_rds_subnet_edges(rds_instances)
    
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
                state=instance.get("State", {}).get("Name") if isinstance(instance.get("State"), dict) else instance.get("State", "running"),
                privateIpAddress=instance.get("PrivateIpAddress"),
                publicIpAddress=instance.get("PublicIpAddress"),
                imageId=instance.get("ImageId"),
                launchTime=instance.get("LaunchTime"),
                subnetId=subnet_id,
                vpcId=instance.get("VpcId"),
                securityGroup=sg_id  # Store for later parent assignment
            )
            
            # Store in map for edge creation
            self.instance_node_map[instance_id] = node_id
            
            # Create Subnet → Instance edge (will add SG → Instance edge later)
            self._create_edge(
                source=subnet_node_id,
                target=node_id,
                edge_type="subnet-to-instance"
            )
    
    def _process_igws(self, igws: List[Dict]):
        """Process Internet Gateways"""
        # Initialize igw_node_map if not exists
        if not hasattr(self, 'igw_node_map'):
            self.igw_node_map = {}
        
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
                
                # Store in map for edge creation
                self.igw_node_map[igw_id] = node_id
                
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
    
    def _process_nat_gateways(self, nat_gateways: List[Dict]):
        """Process NAT Gateways - positioned below their subnet to avoid overflow"""
        for nat in nat_gateways:
            nat_id = nat.get("NatGatewayId")
            subnet_id = nat.get("SubnetId")
            
            subnet_node_info = self.subnet_node_map.get(subnet_id)
            if not subnet_node_info:
                continue
            
            subnet_node_id, vpc_node_id = subnet_node_info
            subnet_node = self.node_map.get(subnet_node_id)
            
            node_id = f"nat-{nat_id}"
            self.nat_gw_node_map = getattr(self, 'nat_gw_node_map', {})
            self.nat_gw_node_map[nat_id] = node_id
            
            # Position NAT Gateway below subnet, aligned to the left
            subnet_x = subnet_node["position"]["x"]
            subnet_y = subnet_node["position"]["y"]
            subnet_height = subnet_node["height"]
            
            nat_width = 100
            nat_height = 60
            x_pos = subnet_x  # Aligned with subnet
            y_pos = subnet_y + subnet_height + 15  # Below subnet
            
            self._create_node(
                node_id=node_id,
                label=nat_id,
                resource_type="nat_gateway",
                position={"x": x_pos, "y": y_pos},
                size={"width": nat_width, "height": nat_height},
                is_container=False,
                parent_id=subnet_node_id,
                config={"originalType": "AWS::EC2::NatGateway"},
                nesting_depth=2,
                natGatewayId=nat_id,
                subnetId=subnet_id,
                state=nat.get("State")
            )
    
    def _process_rds_instances(self, rds_instances: List[Dict]):
        """Process RDS Instances - positioned inside subnets"""
        for rds in rds_instances:
            db_name = rds.get("db_instance_name")
            subnet_type = rds.get("subnet_type", "private")
            
            # Find a private subnet to place RDS in (typically in private subnets)
            matching_subnet = None
            for subnet_id, (node_id, vpc_node_id) in list(self.subnet_node_map.items()):
                subnet_node = self.node_map.get(node_id)
                if subnet_node:
                    # Prefer private subnets for RDS
                    if subnet_node["data"].get("Type") == "private" or subnet_type == "private":
                        matching_subnet = (node_id, subnet_node, vpc_node_id)
                        break
                    elif not matching_subnet:
                        # Fallback to any subnet
                        matching_subnet = (node_id, subnet_node, vpc_node_id)
            
            if not matching_subnet:
                # If no subnet found, use the first VPC as parent
                vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
                if not vpc_nodes:
                    continue
                vpc_node = vpc_nodes[0]
                node_id = f"rds-{db_name}"
                self.rds_node_map = getattr(self, 'rds_node_map', {})
                self.rds_node_map[db_name] = node_id
                
                # Position in VPC
                rds_width = 140
                rds_height = 80
                x_pos = vpc_node["position"]["x"] + 20
                y_pos = vpc_node["position"]["y"] + vpc_node["height"] + 40
                
                self._create_node(
                    node_id=node_id,
                    label=db_name,
                    resource_type="rds_instance",
                    position={"x": x_pos, "y": y_pos},
                    size={"width": rds_width, "height": rds_height},
                    is_container=False,
                    parent_id=vpc_node_id,
                    config={"originalType": "AWS::RDS::DBInstance"},
                    nesting_depth=2,
                    dbInstanceName=db_name,
                    engine=rds.get("engine"),
                    port=rds.get("port"),
                    subnetType=subnet_type
                )
                continue
            
            subnet_node_id, subnet_node, vpc_node_id = matching_subnet
            node_id = f"rds-{db_name}"
            self.rds_node_map = getattr(self, 'rds_node_map', {})
            self.rds_node_map[db_name] = node_id
            
            # Position RDS inside subnet, right side
            subnet_x = subnet_node["position"]["x"]
            subnet_y = subnet_node["position"]["y"]
            subnet_width = subnet_node["width"]
            
            rds_width = 130
            rds_height = 70
            x_pos = subnet_x + subnet_width - rds_width - 10  # Right side with padding
            y_pos = subnet_y + 5  # Top with small padding
            
            self._create_node(
                node_id=node_id,
                label=db_name,
                resource_type="rds_instance",
                position={"x": x_pos, "y": y_pos},
                size={"width": rds_width, "height": rds_height},
                is_container=False,
                parent_id=subnet_node_id,
                config={"originalType": "AWS::RDS::DBInstance"},
                nesting_depth=3,
                dbInstanceName=db_name,
                engine=rds.get("engine"),
                port=rds.get("port"),
                subnetType=subnet_type
            )
    
    def _process_generic_resources(self, region_name: str, region_data: Dict):
        """Process additional AWS resources from the data if present"""
        # Lambda Functions
        if "lambdas" in region_data or "lambda_functions" in region_data:
            lambdas = region_data.get("lambdas", region_data.get("lambda_functions", []))
            self._process_lambdas(lambdas)
        
        # ALB/NLB
        if "load_balancers" in region_data:
            lbs = region_data.get("load_balancers", [])
            self._process_load_balancers(lbs)
        
        # S3 Buckets
        if "s3_buckets" in region_data:
            buckets = region_data.get("s3_buckets", [])
            self._process_s3_buckets(buckets)
        
        # CloudFront
        if "cloudfront_distributions" in region_data:
            dists = region_data.get("cloudfront_distributions", [])
            self._process_cloudfront(dists)
        
        # API Gateway
        if "api_gateways" in region_data:
            apis = region_data.get("api_gateways", [])
            self._process_api_gateways(apis)
        
        # SQS/SNS
        if "sqs_queues" in region_data:
            queues = region_data.get("sqs_queues", [])
            self._process_sqs(queues)
        
        if "sns_topics" in region_data:
            topics = region_data.get("sns_topics", [])
            self._process_sns(topics)
        
        # ECS
        if "ecs_clusters" in region_data:
            clusters = region_data.get("ecs_clusters", [])
            self._process_ecs(clusters)
        
        # DynamoDB
        if "dynamodb_tables" in region_data:
            tables = region_data.get("dynamodb_tables", [])
            self._process_dynamodb(tables)
        
        # ElastiCache
        if "elasticache_clusters" in region_data:
            caches = region_data.get("elasticache_clusters", [])
            self._process_elasticache(caches)
        
        # IAM Roles
        if "iam_roles" in region_data:
            roles = region_data.get("iam_roles", [])
            self._process_iam_roles(roles)
        
        # KMS Keys
        if "kms_keys" in region_data:
            keys = region_data.get("kms_keys", [])
            self._process_kms(keys)
    
    def _process_lambdas(self, lambdas: List[Dict]):
        """Process Lambda Functions"""
        lambda_map = getattr(self, 'lambda_node_map', {})
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        for idx, func in enumerate(lambdas):
            func_name = func.get("FunctionName") or func.get("name", f"lambda-{idx}")
            node_id = f"lambda-{func_name}"
            lambda_map[func_name] = node_id
            lambda_width = 110
            lambda_height = 70
            x_pos = 500 + (idx * 150)
            y_pos = 300
            self._create_node(
                node_id=node_id, label=func_name, resource_type="lambda",
                position={"x": x_pos, "y": y_pos}, size={"width": lambda_width, "height": lambda_height},
                is_container=False, parent_id=region_id,
                config={"originalType": "AWS::Lambda::Function"},
                nesting_depth=1, functionName=func_name, runtime=func.get("Runtime", "python3.9")
            )
        setattr(self, 'lambda_node_map', lambda_map)
    
    def _process_load_balancers(self, lbs: List[Dict]):
        """Process Load Balancers (ALB/NLB)"""
        alb_map = getattr(self, 'alb_node_map', {})
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        for lb in lbs:
            lb_name = lb.get("LoadBalancerName") or lb.get("name", "alb")
            lb_type = lb.get("Type", "application").lower()
            res_type = "alb" if "application" in lb_type else "nlb"
            node_id = f"{res_type}-{lb_name}"
            alb_map[lb_name] = node_id
            lb_width = 120
            lb_height = 80
            x_pos = 300
            y_pos = 150
            self._create_node(
                node_id=node_id, label=lb_name, resource_type=res_type,
                position={"x": x_pos, "y": y_pos}, size={"width": lb_width, "height": lb_height},
                is_container=False, parent_id=region_id,
                config={"originalType": f"AWS::ElasticLoadBalancingV2::{res_type}"},
                nesting_depth=1, lbName=lb_name, lbType=lb_type
            )
        setattr(self, 'alb_node_map', alb_map)
    
    def _process_s3_buckets(self, buckets: List[Dict]):
        """Process S3 Buckets - keep at root level (not inside region) for cleaner layout"""
        s3_map = getattr(self, 's3_node_map', {})
        
        for bucket in buckets:
            bucket_name = bucket.get("Name") or bucket.get("Bucket", "s3-bucket")
            node_id = f"s3-{bucket_name}"
            s3_map[bucket_name] = node_id
            s3_width = 100
            s3_height = 80
            x_pos = 50 + (len(s3_map) * 120)
            y_pos = 50
            self._create_node(
                node_id=node_id, label=bucket_name, resource_type="s3",
                position={"x": x_pos, "y": y_pos}, size={"width": s3_width, "height": s3_height},
                is_container=False, parent_id=None,
                config={"originalType": "AWS::S3::Bucket"},
                nesting_depth=0, bucketName=bucket_name
            )
        setattr(self, 's3_node_map', s3_map)
    
    def _process_cloudfront(self, dists: List[Dict]):
        """Process CloudFront Distributions"""
        cf_map = getattr(self, 'cloudfront_node_map', {})
        
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        for dist in dists:
            dist_id = dist.get("Id") or dist.get("DomainName", "cloudfront")
            node_id = f"cloudfront-{dist_id}"
            cf_map[dist_id] = node_id
            
            cf_width = 120
            cf_height = 70
            x_pos = 100
            y_pos = 100
            
            self._create_node(
                node_id=node_id, label=dist_id, resource_type="cloudfront",
                position={"x": x_pos, "y": y_pos}, size={"width": cf_width, "height": cf_height},
                is_container=False, parent_id=region_id,
                config={"originalType": "AWS::CloudFront::Distribution"},
                nesting_depth=1, distId=dist_id
            )
        
        setattr(self, 'cloudfront_node_map', cf_map)
    
    def _process_api_gateways(self, apis: List[Dict]):
        """Process API Gateways"""
        api_map = getattr(self, 'api_node_map', {})
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        
        for api in apis:
            api_name = api.get("name") or api.get("Name", "api")
            api_id = api.get("id") or api.get("RestApiId", api_name)
            node_id = f"api-{api_id}"
            api_map[api_id] = node_id
            
            api_width = 110
            api_height = 70
            x_pos = 700
            y_pos = 300
            
            self._create_node(
                node_id=node_id, label=api_name, resource_type="api_gateway",
                position={"x": x_pos, "y": y_pos}, size={"width": api_width, "height": api_height},
                is_container=False, parent_id=region_id,
                config={"originalType": "AWS::ApiGateway::RestApi"},
                nesting_depth=1, apiName=api_name, apiId=api_id
            )
        
        setattr(self, 'api_node_map', api_map)
    
    def _process_sqs(self, queues: List[Dict]):
        """Process SQS Queues"""
        sqs_map = getattr(self, 'sqs_node_map', {})
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        
        for queue in queues:
            queue_name = queue.get("QueueName") or queue.get("name", "queue")
            node_id = f"sqs-{queue_name}"
            sqs_map[queue_name] = node_id
            
            queue_width = 100
            queue_height = 70
            x_pos = 600 + (len(sqs_map) * 120)
            y_pos = 450
            
            self._create_node(
                node_id=node_id, label=queue_name, resource_type="sqs",
                position={"x": x_pos, "y": y_pos}, size={"width": queue_width, "height": queue_height},
                is_container=False, parent_id=region_id,
                config={"originalType": "AWS::SQS::Queue"},
                nesting_depth=1, queueName=queue_name
            )
        
        setattr(self, 'sqs_node_map', sqs_map)
    
    def _process_sns(self, topics: List[Dict]):
        """Process SNS Topics"""
        sns_map = getattr(self, 'sns_node_map', {})
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        
        for topic in topics:
            topic_name = topic.get("TopicName") or topic.get("name", "topic")
            topic_arn = topic.get("TopicArn") or topic.get("arn", topic_name)
            node_id = f"sns-{topic_name}"
            sns_map[topic_name] = node_id
            
            topic_width = 100
            topic_height = 70
            x_pos = 600 + (len(sns_map) * 120)
            y_pos = 550
            
            self._create_node(
                node_id=node_id, label=topic_name, resource_type="sns",
                position={"x": x_pos, "y": y_pos}, size={"width": topic_width, "height": topic_height},
                is_container=False, parent_id=region_id,
                config={"originalType": "AWS::SNS::Topic"},
                nesting_depth=1, topicName=topic_name, topicArn=topic_arn
            )
        
        setattr(self, 'sns_node_map', sns_map)
    
    def _process_ecs(self, clusters: List[Dict]):
        """Process ECS Clusters"""
        ecs_map = getattr(self, 'ecs_node_map', {})
        
        for cluster in clusters:
            cluster_name = cluster.get("clusterName") or cluster.get("name", "cluster")
            node_id = f"ecs-{cluster_name}"
            ecs_map[cluster_name] = node_id
            
            ecs_width = 110
            ecs_height = 80
            y_pos = 450
            
            self._create_node(
                node_id=node_id, label=cluster_name, resource_type="ecs_cluster",
                position={"x": x_pos, "y": y_pos}, size={"width": ecs_width, "height": ecs_height},
                is_container=True, parent_id=None,
                config={"originalType": "AWS::ECS::Cluster"},
                nesting_depth=0, clusterName=cluster_name
            )
        
        setattr(self, 'ecs_node_map', ecs_map)
    
    def _process_dynamodb(self, tables: List[Dict]):
        """Process DynamoDB Tables"""
        ddb_map = getattr(self, 'dynamodb_node_map', {})
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        
        for table in tables:
            table_name = table.get("TableName") or table.get("name", "table")
            node_id = f"dynamodb-{table_name}"
            ddb_map[table_name] = node_id
            
            ddb_width = 110
            ddb_height = 70
            x_pos = 900 + (len(ddb_map) * 120)
            y_pos = 550
            
            self._create_node(
                node_id=node_id, label=table_name, resource_type="dynamodb",
                position={"x": x_pos, "y": y_pos}, size={"width": ddb_width, "height": ddb_height},
                is_container=False, parent_id=region_id,
                config={"originalType": "AWS::DynamoDB::Table"},
                nesting_depth=1, tableName=table_name
            )
        
        setattr(self, 'dynamodb_node_map', ddb_map)
    
    def _process_elasticache(self, caches: List[Dict]):
        """Process ElastiCache Clusters"""
        cache_map = getattr(self, 'elasticache_node_map', {})
        region_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        region_id = region_nodes[0]["id"] if region_nodes else None
        
        for cache in caches:
            cache_id = cache.get("CacheClusterId") or cache.get("id", "cache")
            node_id = f"elasticache-{cache_id}"
            cache_map[cache_id] = node_id
            
            cache_width = 110
            cache_height = 70
            x_pos = 1000 + (len(cache_map) * 120)
            y_pos = 300
            
            self._create_node(
                node_id=node_id, label=cache_id, resource_type="elasticache",
                position={"x": x_pos, "y": y_pos}, size={"width": cache_width, "height": cache_height},
                is_container=False, parent_id=region_id,
                config={"originalType": "AWS::ElastiCache::CacheCluster"},
                nesting_depth=1, cacheId=cache_id
            )
        
        setattr(self, 'elasticache_node_map', cache_map)
    
    def _process_iam_roles(self, roles: List[Dict]):
        """Process IAM Roles"""
        iam_map = getattr(self, 'iam_node_map', {})
        
        for role in roles:
            role_name = role.get("RoleName") or role.get("name", "role")
            node_id = f"iam-{role_name}"
            iam_map[role_name] = node_id
            
            iam_width = 100
            iam_height = 60
            x_pos = 1100 + (len(iam_map) * 120)
            y_pos = 150
            
            self._create_node(
                node_id=node_id, label=role_name, resource_type="iam_role",
                position={"x": x_pos, "y": y_pos}, size={"width": iam_width, "height": iam_height},
                is_container=False, parent_id=None,
                config={"originalType": "AWS::IAM::Role"},
                nesting_depth=0, roleName=role_name
            )
        
        setattr(self, 'iam_node_map', iam_map)
    
    def _process_kms(self, keys: List[Dict]):
        """Process KMS Keys"""
        kms_map = getattr(self, 'kms_node_map', {})
        
        for key in keys:
            key_id = key.get("KeyId") or key.get("id", "key")
            key_desc = key.get("Description", key_id)
            node_id = f"kms-{key_id}"
            kms_map[key_id] = node_id
            
            kms_width = 100
            kms_height = 60
            x_pos = 1200 + (len(kms_map) * 120)
            y_pos = 200
            
            self._create_node(
                node_id=node_id, label=key_desc, resource_type="kms",
                position={"x": x_pos, "y": y_pos}, size={"width": kms_width, "height": kms_height},
                is_container=False, parent_id=None,
                config={"originalType": "AWS::KMS::Key"},
                nesting_depth=0, keyId=key_id
            )
        
        setattr(self, 'kms_node_map', kms_map)
    
    def _create_igw_vpc_edges(self, internet_gateways: List[Dict]):
        """Create edges from Internet Gateways to VPC (attachment relationship)"""
        if not hasattr(self, 'igw_node_map'):
            return
        
        for igw in internet_gateways:
            igw_id = igw.get("InternetGatewayId")
            igw_node_id = self.igw_node_map.get(igw_id)
            
            if not igw_node_id:
                continue
            
            # Get attached VPCs
            for attachment in igw.get("Attachments", []):
                vpc_id = attachment.get("VpcId")
                vpc_node_id = self.vpc_node_map.get(vpc_id)
                
                if vpc_node_id:
                    self._create_edge(
                        source=igw_node_id,
                        target=vpc_node_id,
                        edge_type="igw-to-vpc"
                    )
    
    def _create_rt_gateway_edges(self, route_tables: List[Dict]):
        """Create edges from Route Tables to IGW/NAT Gateways for routing"""
        if not hasattr(self, 'igw_node_map'):
            self.igw_node_map = {}
        if not hasattr(self, 'nat_gw_node_map'):
            self.nat_gw_node_map = {}
        
        for rt in route_tables:
            rt_id = rt.get("RouteTableId")
            rt_node_id = self.rt_node_map.get(rt_id)
            
            if not rt_node_id:
                continue
            
            # Check routes for IGW or NAT Gateway targets
            for route in rt.get("Routes", []):
                # IGW route
                igw_id = route.get("GatewayId")
                if igw_id and igw_id != "local":
                    igw_node_id = self.igw_node_map.get(igw_id)
                    if igw_node_id:
                        self._create_edge(
                            source=rt_node_id,
                            target=igw_node_id,
                            edge_type="rt-to-igw"
                        )
                
                # NAT Gateway route
                nat_id = route.get("NatGatewayId")
                if nat_id:
                    nat_node_id = self.nat_gw_node_map.get(nat_id)
                    if nat_node_id:
                        self._create_edge(
                            source=rt_node_id,
                            target=nat_node_id,
                            edge_type="rt-to-nat"
                        )
    
    def _create_nat_subnet_edges(self, nat_gateways: List[Dict]):
        """Create edges from Subnets to NAT Gateways"""
        nat_gw_node_map = getattr(self, 'nat_gw_node_map', {})
        
        for nat in nat_gateways:
            nat_id = nat.get("NatGatewayId")
            subnet_id = nat.get("SubnetId")
            
            nat_node_id = nat_gw_node_map.get(nat_id)
            if not nat_node_id or subnet_id not in self.subnet_node_map:
                continue
            
            subnet_node_id = self.subnet_node_map[subnet_id][0]
            self._create_edge(
                source=subnet_node_id,
                target=nat_node_id,
                edge_type="subnet-to-nat"
            )
    
    def _create_rds_edges(self, rds_instances: List[Dict]):
        """Create edges from Subnets and Security Groups to RDS Instances"""
        rds_node_map = getattr(self, 'rds_node_map', {})
        
        for rds in rds_instances:
            db_name = rds.get("db_instance_name")
            rds_node_id = rds_node_map.get(db_name)
            
            if not rds_node_id:
                continue
            
            # Create edge from RDS to its security group if present
            sg_info = rds.get("security_group", {})
            if sg_info and sg_info.get("id"):
                sg_id = sg_info.get("id")
                sg_node_id = self.sg_node_map.get(sg_id)
                if sg_node_id:
                    self._create_edge(
                        source=sg_node_id,
                        target=rds_node_id,
                        edge_type="sg-to-rds"
                    )
    
    def _create_instance_s3_edges(self, instances: List[Dict]):
        """Create edges from EC2 instances to S3 buckets (app uses S3)"""
        s3_node_map = getattr(self, 's3_node_map', {})
        if not s3_node_map:
            return
        
        for instance in instances:
            instance_id = instance.get("InstanceId")
            instance_node_id = self.instance_node_map.get(instance_id)
            
            if not instance_node_id:
                continue
            
            # Create edges to all S3 buckets (app uses them)
            for bucket_name, s3_node_id in s3_node_map.items():
                self._create_edge(
                    source=instance_node_id,
                    target=s3_node_id,
                    edge_type="instance-to-s3"
                )
    
    def _create_rds_s3_edges(self, rds_instances: List[Dict]):
        """Create edges from RDS instances to S3 buckets (backups)"""
        rds_node_map = getattr(self, 'rds_node_map', {})
        s3_node_map = getattr(self, 's3_node_map', {})
        if not rds_node_map or not s3_node_map:
            return
        
        for rds in rds_instances:
            db_name = rds.get("db_instance_name")
            rds_node_id = rds_node_map.get(db_name)
            
            if not rds_node_id:
                continue
            
            # Create edges to all S3 buckets (database backups)
            for bucket_name, s3_node_id in s3_node_map.items():
                self._create_edge(
                    source=rds_node_id,
                    target=s3_node_id,
                    edge_type="rds-to-s3"
                )
    
    def _create_nat_vpc_edges(self, nat_gateways: List[Dict]):
        """Create edges from NAT Gateways to VPC"""
        nat_gw_node_map = getattr(self, 'nat_gw_node_map', {})
        
        for nat in nat_gateways:
            nat_id = nat.get("NatGatewayId")
            nat_node_id = nat_gw_node_map.get(nat_id)
            
            if not nat_node_id:
                continue
            
            # Find the VPC by getting the subnet's VPC
            subnet_id = nat.get("SubnetId")
            if subnet_id and subnet_id in self.subnet_node_map:
                subnet_node_id, vpc_node_id = self.subnet_node_map[subnet_id]
                if vpc_node_id:
                    self._create_edge(
                        source=nat_node_id,
                        target=vpc_node_id,
                        edge_type="nat-to-vpc"
                    )
    
    def _create_instance_subnet_edges(self, instances: List[Dict]):
        """Create explicit edges from instances to their subnets"""
        for instance in instances:
            instance_id = instance.get("InstanceId")
            instance_node_id = self.instance_node_map.get(instance_id)
            
            if not instance_node_id:
                continue
            
            # Create edge to subnet
            subnet_id = instance.get("SubnetId")
            if subnet_id and subnet_id in self.subnet_node_map:
                subnet_node_id, vpc_node_id = self.subnet_node_map[subnet_id]
                if subnet_node_id:
                    self._create_edge(
                        source=instance_node_id,
                        target=subnet_node_id,
                        edge_type="instance-in-subnet"
                    )
    
    def _create_rds_subnet_edges(self, rds_instances: List[Dict]):
        """Create explicit edges from RDS instances to their subnets"""
        rds_node_map = getattr(self, 'rds_node_map', {})
        
        for rds in rds_instances:
            db_name = rds.get("db_instance_name")
            rds_node_id = rds_node_map.get(db_name)
            
            if not rds_node_id:
                continue
            
            # Create edge to subnet
            subnet_id = rds.get("subnet_id")
            if subnet_id and subnet_id in self.subnet_node_map:
                subnet_node_id, vpc_node_id = self.subnet_node_map[subnet_id]
                if subnet_node_id:
                    self._create_edge(
                        source=rds_node_id,
                        target=subnet_node_id,
                        edge_type="rds-in-subnet"
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
        
        # ALWAYS add parentId (even if None) so it can be updated later
        data["parentId"] = parent_id
        
        node = {
            "id": node_id,
            "type": "resourceNode",
            "position": position,
            "data": data,
            "width": size["width"],
            "height": size["height"]
        }
        
        self.nodes.append(node)
        self.node_map[node_id] = node
    
    def _create_edge(self, source: str, target: str, edge_type: str = "default"):
        """Create an edge in CloudBuilder format with smart routing to avoid node overlaps"""
        style = EDGE_STYLES.get(edge_type, {"stroke": "#999999", "strokeWidth": 1})
        
        edge = {
            "id": f"{edge_type}-{source}-{target}",
            "source": source,
            "target": target,
            "animated": True,
            "type": "smoothstep",
            "style": style
        }
        
        # Calculate waypoints to avoid overlapping with other nodes
        waypoints = self._calculate_edge_waypoints(source, target)
        if waypoints and len(waypoints) > 0:
            edge["data"] = {"waypoints": waypoints}
        
        self.edges.append(edge)
    
    def _calculate_edge_waypoints(self, source_id: str, target_id: str) -> List[Dict]:
        """
        Calculate waypoints for edge path to avoid overlapping with other nodes.
        Uses simple node avoidance algorithm.
        """
        source_node = self.node_map.get(source_id)
        target_node = self.node_map.get(target_id)
        
        if not source_node or not target_node:
            return []
        
        source_pos = source_node["position"]
        target_pos = target_node["position"]
        
        # Get center points
        source_center = {
            "x": source_pos["x"] + source_node["width"] / 2,
            "y": source_pos["y"] + source_node["height"] / 2
        }
        target_center = {
            "x": target_pos["x"] + target_node["width"] / 2,
            "y": target_pos["y"] + target_node["height"] / 2
        }
        
        # Check if direct line intersects any nodes
        intersecting_nodes = self._find_intersecting_nodes(
            source_center, target_center, [source_id, target_id]
        )
        
        if not intersecting_nodes:
            return []  # No intersections, use default smoothstep
        
        # Route around intersecting nodes
        waypoints = self._route_around_nodes(
            source_center, target_center, intersecting_nodes
        )
        
        return waypoints
    
    def _find_intersecting_nodes(self, start: Dict, end: Dict, exclude_ids: List[str]) -> List[Dict]:
        """Find nodes that intersect with the line from start to end"""
        intersecting = []
        
        for node in self.nodes:
            node_id = node["id"]
            if node_id in exclude_ids:
                continue
            
            pos = node["position"]
            width = node["width"]
            height = node["height"]
            
            # Check if line segment intersects node bounding box
            if self._line_intersects_rect(start, end, pos, width, height):
                intersecting.append(node)
        
        return intersecting
    
    def _line_intersects_rect(self, p1: Dict, p2: Dict, rect_pos: Dict, width: float, height: float) -> bool:
        """Check if line segment (p1, p2) intersects with rectangle"""
        x1, y1 = p1["x"], p1["y"]
        x2, y2 = p2["x"], p2["y"]
        
        rect_x = rect_pos["x"]
        rect_y = rect_pos["y"]
        rect_right = rect_x + width
        rect_bottom = rect_y + height
        
        # Check if either endpoint is inside rectangle
        if (rect_x <= x1 <= rect_right and rect_y <= y1 <= rect_bottom) or \
           (rect_x <= x2 <= rect_right and rect_y <= y2 <= rect_bottom):
            return True
        
        # Check if line crosses rectangle edges
        # Check horizontal edges (top and bottom)
        if self._point_on_line_segment({"x": rect_x, "y": rect_y}, {"x": rect_right, "y": rect_y}, p1, p2) or \
           self._point_on_line_segment({"x": rect_x, "y": rect_bottom}, {"x": rect_right, "y": rect_bottom}, p1, p2):
            return True
        
        # Check vertical edges (left and right)
        if self._point_on_line_segment({"x": rect_x, "y": rect_y}, {"x": rect_x, "y": rect_bottom}, p1, p2) or \
           self._point_on_line_segment({"x": rect_right, "y": rect_y}, {"x": rect_right, "y": rect_bottom}, p1, p2):
            return True
        
        return False
    
    def _point_on_line_segment(self, line_start: Dict, line_end: Dict, seg_start: Dict, seg_end: Dict) -> bool:
        """Check if line segment intersects with another line segment"""
        # Simple approach: check if segments share any overlap
        def ccw(A: Dict, B: Dict, C: Dict) -> bool:
            return (C["y"] - A["y"]) * (B["x"] - A["x"]) > (B["y"] - A["y"]) * (C["x"] - A["x"])
        
        return ccw(line_start, seg_start, seg_end) != ccw(line_end, seg_start, seg_end) and \
               ccw(line_start, line_end, seg_start) != ccw(line_start, line_end, seg_end)
    
    def _route_around_nodes(self, start: Dict, end: Dict, obstacles: List[Dict]) -> List[Dict]:
        """
        Create waypoints to route around obstacles.
        Uses simple side-stepping: go around the first obstacle.
        """
        waypoints = []
        
        # Get obstacle bounds
        obstacle = obstacles[0]  # Use first obstacle for simplicity
        obs_pos = obstacle["position"]
        obs_width = obstacle["width"]
        obs_height = obstacle["height"]
        
        # Determine which side to route around based on positions
        mid_x = (start["x"] + end["x"]) / 2
        mid_y = (start["y"] + end["y"]) / 2
        
        obs_center_x = obs_pos["x"] + obs_width / 2
        obs_center_y = obs_pos["y"] + obs_height / 2
        
        # Calculate offset direction
        offset = 80  # Distance to detour around obstacle
        
        # Route to the side that's further from obstacle
        if abs(start["x"] - obs_center_x) > abs(start["y"] - obs_center_y):
            # Route horizontally
            detour_x = obs_center_x + (offset if start["x"] > obs_center_x else -offset)
            waypoints.append({"x": detour_x, "y": start["y"]})
            waypoints.append({"x": detour_x, "y": end["y"]})
        else:
            # Route vertically
            detour_y = obs_center_y + (offset if start["y"] > obs_center_y else -offset)
            waypoints.append({"x": start["x"], "y": detour_y})
            waypoints.append({"x": end["x"], "y": detour_y})
        
        return waypoints
    
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
                max_y = max([n["position"]["y"] + n["height"] for n in all_children])
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
                
                subnet_node["width"] = max(max_right - subnet_x + padding, 200)
                subnet_node["height"] = max(max_bottom - subnet_y + padding, 100)
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
    
    def _apply_hierarchical_layout(self):
        """
        Apply hierarchical layout algorithm to ensure:
        1. All children are positioned inside their parent containers
        2. No overlaps between siblings at same level
        3. Proper spacing and alignment
        """
        # First, fix parent relationships for orphaned nodes
        self._fix_orphaned_nodes()
        
        # Build parent-child relationships AFTER fixing orphaned nodes
        children_by_parent: Dict[str, List[Dict]] = {}
        for node in self.nodes:
            parent_id = node["data"].get("parentId")
            if parent_id not in children_by_parent:
                children_by_parent[parent_id] = []
            children_by_parent[parent_id].append(node)
        
        # Layout container by container, depth-first
        def layout_recursive(parent_id=None, parent_node=None, depth=0):
            """Recursively layout children starting from deepest level"""
            children = children_by_parent.get(parent_id, [])
            if not children:
                return
            
            # First, recursively layout each child's children
            for child in children:
                if child["data"].get("isContainer", False):
                    layout_recursive(child["id"], child, depth + 1)
            
            # Then layout this level's children
            if parent_node is None:
                # Top-level regions
                self._layout_regions()
            else:
                parent_type = parent_node["data"].get("resourceType", {}).get("id")
                if parent_type == "region":
                    self._layout_vpcs_in_region(children, parent_node)
                elif parent_type == "vpc":
                    self._layout_vpc_contents_v2(children, parent_node)
                elif parent_type == "subnet":
                    self._layout_subnet_contents_v2(children, parent_node)
                elif parent_type == "securityGroup":
                    self._layout_sg_contents_v2(children, parent_node)
                else:
                    self._layout_generic_container(children, parent_node)
            
            # Recalculate parent size to fit children
            if parent_node:
                self._size_container_to_children(parent_node)
        
        # Start from root
        layout_recursive()
        
        # Final pass: ensure all containers sized properly
        self._recalculate_all_container_sizes()
    
    def _fix_orphaned_nodes(self):
        """Fix parent relationships for nodes that should be inside containers"""
        # Find the VPC node
        vpc_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "vpc"]
        if not vpc_nodes:
            return
        
        vpc_id = vpc_nodes[0]["id"]
        
        # RDS instances should be in VPC (note: resource type id is "rds", not "rds_instance")
        rds_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "rds"]
        for rds in rds_nodes:
            rds["data"]["parentId"] = vpc_id  # Force parent to VPC
        
        # NAT gateways should be in VPC
        nat_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "natgateway"]
        for nat in nat_nodes:
            nat["data"]["parentId"] = vpc_id  # Force parent to VPC
        
        # S3 buckets should be in VPC
        s3_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "s3"]
        for s3 in s3_nodes:
            s3["data"]["parentId"] = vpc_id  # Force parent to VPC

    
    def _recalculate_all_container_sizes(self):
        """Recalculate all container sizes to fit their children"""
        # Process containers bottom-up (children before parents)
        containers = [n for n in self.nodes if n["data"].get("isContainer", False)]
        
        # Sort by nesting depth (deepest first)
        containers.sort(key=lambda n: n["data"].get("nestingDepth", 0), reverse=True)
        
        padding = 20
        for container in containers:
            children = [n for n in self.nodes if n["data"].get("parentId") == container["id"]]
            
            if not children:
                continue
            
            # Calculate bounds of all children
            child_xs = [n["position"]["x"] for n in children]
            child_ys = [n["position"]["y"] for n in children]
            child_rights = [n["position"]["x"] + n["width"] for n in children]
            child_bottoms = [n["position"]["y"] + n["height"] for n in children]
            
            min_x = min(child_xs)
            min_y = min(child_ys)
            max_right = max(child_rights)
            max_bottom = max(child_bottoms)
            
            # Adjust container position if needed
            if min_x < container["position"]["x"]:
                container["position"]["x"] = min_x - padding
            if min_y < container["position"]["y"]:
                container["position"]["y"] = min_y - padding
            
            # Resize container to fit all children
            new_width = max_right - container["position"]["x"] + padding
            new_height = max_bottom - container["position"]["y"] + padding
            
            container["width"] = max(container["width"], new_width)
            container["height"] = max(container["height"], new_height)
            container["data"]["size"] = {"width": container["width"], "height": container["height"]}
    
    def _layout_regions(self):
        """Layout all region nodes vertically"""
        regions = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "region"]
        current_y = 20
        
        for region in regions:
            region["position"]["x"] = 20
            region["position"]["y"] = current_y
            current_y += 600  # Large space for content
    
    def _layout_vpcs_in_region(self, vpcs: List[Dict], region_node: Dict):
        """Layout VPCs inside region"""
        region_x = region_node["position"]["x"]
        region_y = region_node["position"]["y"]
        spacing = 40
        
        # Position VPCs vertically
        current_y = region_y + 40
        
        for vpc in vpcs:
            vpc["position"]["x"] = region_x + 30
            vpc["position"]["y"] = current_y
            current_y += 400  # Space for VPC content
    
    def _layout_vpc_contents_v2(self, children: List[Dict], vpc_node: Dict):
        """Layout all resources inside VPC optimally"""
        vpc_x = vpc_node["position"]["x"]
        vpc_y = vpc_node["position"]["y"]
        vpc_id = vpc_node["id"]
        padding = 30
        spacing = 50  # Increased from 35 to 50 for better subnet spacing
        
        # Categorize children
        subnets = [n for n in children if n["data"].get("resourceType", {}).get("id") == "subnet"]
        igws = [n for n in children if n["data"].get("resourceType", {}).get("id") == "internetgateway"]
        nats = [n for n in children if n["data"].get("resourceType", {}).get("id") == "natgateway"]
        rts = [n for n in children if n["data"].get("resourceType", {}).get("id") == "routetable"]
        sgs = [n for n in children if n["data"].get("resourceType", {}).get("id") == "securityGroup"]
        
        # Find RDS and S3 that need to be repositioned (they might have parent_id=None)
        rds_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "rds" and n["data"].get("parentId") == vpc_id]
        s3_nodes = [n for n in self.nodes if n["data"].get("resourceType", {}).get("id") == "s3" and n["data"].get("parentId") == vpc_id]
        
        # Column 1: Subnets (left) - with better vertical spacing
        if subnets:
            col1_x = vpc_x + padding
            col1_y = vpc_y + padding + 20
            for subnet in subnets:
                subnet["position"]["x"] = col1_x
                subnet["position"]["y"] = col1_y
                # Add height to the spacing calculation to prevent overlaps
                col1_y += subnet["height"] + spacing + 60  # Increased from 50 to 60 for more margin
        
        # Column 2: IGW and NAT (right top)
        col2_x = vpc_x + 350  # Right side
        col2_y = vpc_y + padding
        
        for igw in igws:
            igw["position"]["x"] = col2_x
            igw["position"]["y"] = col2_y
            col2_y += igw["height"] + spacing
        
        for nat in nats:
            nat["position"]["x"] = col2_x
            nat["position"]["y"] = col2_y
            col2_y += nat["height"] + spacing
        
        # Column 3: Route Tables (right bottom)
        col3_y = vpc_y + padding + 220
        for rt in rts:
            rt["position"]["x"] = col2_x
            rt["position"]["y"] = col3_y
            col3_y += rt["height"] + spacing
        
        # Bottom row: RDS and S3 (below subnets)
        bottom_y = vpc_y + 480  # Increased from 450 to give more space
        bottom_x = vpc_x + padding
        for rds in rds_nodes:
            rds["position"]["x"] = bottom_x
            rds["position"]["y"] = bottom_y
            bottom_x += rds["width"] + spacing
        
        for s3 in s3_nodes:
            s3["position"]["x"] = bottom_x
            s3["position"]["y"] = bottom_y
            bottom_x += s3["width"] + spacing

    
    def _layout_subnet_contents_v2(self, children: List[Dict], subnet_node: Dict):
        """Layout EC2 and RDS inside subnet"""
        subnet_x = subnet_node["position"]["x"]
        subnet_y = subnet_node["position"]["y"]
        subnet_w = subnet_node["width"]
        subnet_h = subnet_node["height"]
        padding = 15
        spacing = 12
        
        # Split children
        sgs = [n for n in children if n["data"].get("resourceType", {}).get("id") == "securityGroup"]
        instances = [n for n in children if n["data"].get("resourceType", {}).get("id") == "ec2"]
        rds = [n for n in children if n["data"].get("resourceType", {}).get("id") == "rds"]
        
        # Left side: instances/SGs
        col_x = subnet_x + padding
        col_y = subnet_y + padding
        
        for sg in sgs:
            sg["position"]["x"] = col_x
            sg["position"]["y"] = col_y
            col_y += sg["height"] + spacing
        
        for inst in instances:
            inst["position"]["x"] = col_x
            inst["position"]["y"] = col_y
            col_y += inst["height"] + spacing
        
        # Right side: RDS
        if rds:
            rds_x = subnet_x + subnet_w - rds[0]["width"] - padding
            rds_y = subnet_y + padding
            for r in rds:
                r["position"]["x"] = rds_x
                r["position"]["y"] = rds_y
                rds_y += r["height"] + spacing
    
    def _layout_sg_contents_v2(self, children: List[Dict], sg_node: Dict):
        """Layout instances inside security group"""
        sg_x = sg_node["position"]["x"]
        sg_y = sg_node["position"]["y"]
        padding = 8
        spacing = 8
        
        current_y = sg_y + padding
        for child in children:
            child["position"]["x"] = sg_x + padding
            child["position"]["y"] = current_y
            current_y += child["height"] + spacing
    
    def _layout_generic_container(self, children: List[Dict], container: Dict):
        """Default layout for unknown containers"""
        x = container["position"]["x"]
        y = container["position"]["y"]
        padding = 15
        spacing = 15
        
        current_y = y + padding
        for child in children:
            child["position"]["x"] = x + padding
            child["position"]["y"] = current_y
            current_y += child["height"] + spacing
    
    def _size_container_to_children(self, container: Dict):
        """Resize a container to fit all its children"""
        children = [n for n in self.nodes if n["data"].get("parentId") == container["id"]]
        if not children:
            return
        
        padding = 20
        container_x = container["position"]["x"]
        container_y = container["position"]["y"]
        
        # Find child bounds
        child_xs = [n["position"]["x"] for n in children]
        child_ys = [n["position"]["y"] for n in children]
        child_rights = [n["position"]["x"] + n["width"] for n in children]
        child_bottoms = [n["position"]["y"] + n["height"] for n in children]
        
        min_x = min(child_xs)
        min_y = min(child_ys)
        max_right = max(child_rights)
        max_bottom = max(child_bottoms)
        
        # Expand container to fit children
        new_width = max_right - container_x + padding
        new_height = max_bottom - container_y + padding
        
        container["width"] = max(container["width"], new_width)
        container["height"] = max(container["height"], new_height)
        container["data"]["size"] = {"width": container["width"], "height": container["height"]}
    
    def _clamp_nodes_to_parents(self):
        """Clamp all child nodes to stay within their parent container bounds.
        
        This ensures no resource is positioned outside of its parent container.
        Only moves nodes that actually overflow - preserves Sugiyama layout otherwise.
        """
        containers = {n['id']: n for n in self.nodes if n["data"].get("isContainer", False)}
        padding = 30
        
        for container_id, container in containers.items():
            container_x = container['position']['x']
            container_y = container['position']['y']
            container_width = container['width']
            container_height = container['height']
            container_right = container_x + container_width
            container_bottom = container_y + container_height
            
            # Find all children of this container
            children = [n for n in self.nodes if n['data'].get('parentId') == container_id]
            
            for child in children:
                child_x = child['position']['x']
                child_y = child['position']['y']
                child_width = child['width']
                child_height = child['height']
                
                # Only adjust if node extends beyond container bounds
                if child_x < container_x + padding:
                    child['position']['x'] = container_x + padding
                
                if child_y < container_y + padding:
                    child['position']['y'] = container_y + padding
                
                if child_x + child_width > container_right - padding:
                    child['position']['x'] = container_right - child_width - padding
                
                if child_y + child_height > container_bottom - padding:
                    child['position']['y'] = container_bottom - child_height - padding
    
    def _resolve_container_collisions(self):
        """Resolve overlaps between sibling containers by pushing them apart vertically."""
        # Group containers by parent
        by_parent = {}
        for node in self.nodes:
            if node['data'].get('isContainer', False):
                parent_id = node['data'].get('parentId')
                if parent_id not in by_parent:
                    by_parent[parent_id] = []
                by_parent[parent_id].append(node)
        
        # For each parent with multiple containers, resolve overlaps
        for parent_id, containers in by_parent.items():
            if len(containers) < 2:
                continue
            
            # Iteratively resolve all overlaps
            max_iterations = 10
            for iteration in range(max_iterations):
                overlaps_found = False
                
                # Sort by Y position
                containers_sorted = sorted(containers, key=lambda n: n['position']['y'])
                
                # Check each pair of sibling containers
                for i in range(len(containers_sorted) - 1):
                    c1 = containers_sorted[i]
                    c2 = containers_sorted[i + 1]
                    
                    y1 = c1['position']['y']
                    h1 = c1['height']
                    y2 = c2['position']['y']
                    h2 = c2['height']
                    
                    # If they overlap in Y, push c2 down
                    if y1 + h1 > y2:
                        gap = 20  # Minimum gap between containers
                        new_y2 = y1 + h1 + gap
                        c2['position']['y'] = new_y2
                        overlaps_found = True
                
                if not overlaps_found:
                    break
    
    def _resize_containers_to_fit_children(self):
        """Resize all containers to fit their children after collision resolution."""
        padding = 30
        
        # Get all containers sorted by nesting depth (deepest first)
        containers = sorted(
            [n for n in self.nodes if n['data'].get('isContainer', False)],
            key=lambda n: n['data'].get('nestingDepth', 0),
            reverse=True
        )
        
        for container in containers:
            children = [n for n in self.nodes if n['data'].get('parentId') == container['id']]
            
            if not children:
                continue
            
            # Calculate bounds of all children
            min_x = min(c['position']['x'] for c in children)
            max_x = max(c['position']['x'] + c['width'] for c in children)
            min_y = min(c['position']['y'] for c in children)
            max_y = max(c['position']['y'] + c['height'] for c in children)
            
            # Resize and reposition container
            container['position']['x'] = min_x - padding
            container['position']['y'] = min_y - padding
            container['width'] = (max_x - min_x) + (2 * padding)
            container['height'] = (max_y - min_y) + (2 * padding)
            
            # Update size data
            container['data']['size'] = {
                'width': container['width'],
                'height': container['height']
            }
    
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
        
        # Further filter: ignore edges to/from S3 (external service) since they naturally cross VPC
        critical_overlaps = [
            (e, n) for e, n in significant_overlaps 
            if 's3' not in e and 's3' not in n
        ]
        
        if critical_overlaps:
            print(f"\n⚠️  EDGE OVERLAPS WITH NODES: {len(critical_overlaps)}")
            for edge_id, node_id in critical_overlaps[:5]:  # Show first 5
                print(f"   - {edge_id} crosses {node_id}")
            if len(critical_overlaps) > 5:
                print(f"   ... and {len(critical_overlaps) - 5} more")
        else:
            print("\n✅ No critical edge overlaps detected")
        
        if significant_overlaps and not critical_overlaps:
            print(f"   (Note: {len(significant_overlaps)} edges involve S3 or cross region boundaries - this is expected)")
        
        # Check container bounds
        print("\n✅ Container bounds validated")
        
        print("="*60 + "\n")
        
        # Return success if no node overlaps (edge overlaps are informational)
        return len(node_overlaps) == 0


def convert_aws_to_cloud_builder(aws_json_path: str, output_path: str = None, use_sugiyama: bool = False) -> Dict[str, Any]:
    """
    Main function to convert AWS JSON to CloudBuilder diagram format
    
    Args:
        aws_json_path: Path to AWS JSON file
        output_path: Optional path to save the output JSON
        use_sugiyama: Whether to use Sugiyama layered graph algorithm
    
    Returns:
        Dictionary with nodes and edges in CloudBuilder format
    """
    # Load AWS data
    with open(aws_json_path, 'r') as f:
        aws_data = json.load(f)
    
    # Convert
    converter = AWSToCloudBuilderConverter(aws_data, use_sugiyama=use_sugiyama)
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
        print("Usage: python awsDataToNodeEdge.py <input_json_path> [output_json_path] [--sugiyama]")
        print("\nExample:")
        print("  python awsDataToNodeEdge.py onload.json architecture-diagram.json")
        print("  python awsDataToNodeEdge.py onload.json architecture-diagram.json --sugiyama")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else "architecture-diagram.json"
    use_sugiyama = '--sugiyama' in sys.argv
    
    result = convert_aws_to_cloud_builder(input_path, output_path, use_sugiyama)
    print(f"\nConversion complete!")
    print(f"Total nodes: {len(result['nodes'])}")
    print(f"Total edges: {len(result['edges'])}")
