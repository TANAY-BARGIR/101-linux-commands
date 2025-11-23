---
title: 'Cloud Networking'
description: 'Understanding Virtual Private Clouds, security groups, and cloud-native networking patterns across AWS, Azure, and Google Cloud.'
order: 7
---

Cloud networking provides powerful abstractions over physical network infrastructure, but with great power comes complexity. Understanding how cloud providers handle networking helps you design secure, scalable applications and troubleshoot connectivity issues in cloud environments.

## Prerequisites

- Basic understanding of IP addressing and subnetting
- Familiarity with at least one major cloud provider (AWS, Azure, or GCP)
- Knowledge of firewalls and network security concepts

## Virtual Private Clouds (VPCs)

A VPC is your private network in the cloud - isolated from other customers but connected to the internet when you need it.

```
AWS VPC (10.0.0.0/16)
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  Availability Zone A              │         Availability Zone B       │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │     Public Subnet           │  │  │     Public Subnet           │  │
│  │     10.0.1.0/24             │  │  │     10.0.2.0/24             │  │
│  │  ┌─────────┐ ┌─────────┐    │  │  │  ┌─────────┐ ┌─────────┐    │  │
│  │  │   ALB   │ │   NAT   │    │  │  │  │   ALB   │ │   NAT   │    │  │
│  │  │10.0.1.10│ │10.0.1.20│    │  │  │  │10.0.2.10│ │10.0.2.20│    │  │
│  │  └─────────┘ └─────────┘    │  │  │  └─────────┘ └─────────┘    │  │
│  └─────────────────────────────┘  │  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │     Private Subnet          │  │  │     Private Subnet          │  │
│  │     10.0.10.0/24            │  │  │     10.0.20.0/24            │  │
│  │  ┌─────────┐ ┌─────────┐    │  │  │  ┌─────────┐ ┌─────────┐    │  │
│  │  │  Web-1  │ │  API-1  │    │  │  │  │  Web-2  │ │  API-2  │    │  │
│  │  │10.0.10.1│ │10.0.10.2│    │  │  │  │10.0.20.1│ │10.0.20.2│    │  │
│  │  └─────────┘ └─────────┘    │  │  │  └─────────┘ └─────────┘    │  │
│  └─────────────────────────────┘  │  └─────────────────────────────┘  │
│  ┌─────────────────────────────┐  │  ┌─────────────────────────────┐  │
│  │     Database Subnet         │  │  │     Database Subnet         │  │
│  │     10.0.100.0/28           │  │  │     10.0.100.16/28          │  │
│  │  ┌─────────┐                │  │  │  ┌─────────┐                │  │
│  │  │  RDS    │                │  │  │  │  RDS    │                │  │
│  │  │Primary  │                │  │  │  │Replica  │                │  │
│  │  └─────────┘                │  │  │  └─────────┘                │  │
│  └─────────────────────────────┘  │  └─────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                            Internet Gateway
                                    │
                                    ▼
                                Internet

Traffic Flow:
Internet > Internet Gateway > Public Subnet (ALB) > Private Subnet (Apps) > Database Subnet (RDS)
Private Subnet > NAT Gateway > Internet Gateway > Internet (for outbound)
```

Let's create a basic VPC to understand the concepts:

```bash
# Create a VPC with CLI
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications \
  'ResourceType=vpc,Tags=[{Key=Name,Value=demo-vpc}]'

# Create subnets within the VPC
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a --tag-specifications \
  'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1a}]'

aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b --tag-specifications \
  'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1b}]'
```

This creates a VPC with two subnets in different availability zones for high availability.

### Subnet Types

**Public Subnets**: Have direct internet access via Internet Gateway

```bash
# Create internet gateway
aws ec2 create-internet-gateway --tag-specifications \
  'ResourceType=internet-gateway,Tags=[{Key=Name,Value=demo-igw}]'

# Attach to VPC
aws ec2 attach-internet-gateway --vpc-id vpc-12345678 --internet-gateway-id igw-87654321

# Create route table for public subnet
aws ec2 create-route-table --vpc-id vpc-12345678 --tag-specifications \
  'ResourceType=route-table,Tags=[{Key=Name,Value=public-rt}]'

# Add route to internet gateway
aws ec2 create-route --route-table-id rtb-11111111 \
  --destination-cidr-block 0.0.0.0/0 --gateway-id igw-87654321
```

**Private Subnets**: No direct internet access, use NAT for outbound traffic

```bash
# Create NAT gateway in public subnet
aws ec2 create-nat-gateway --subnet-id subnet-public --allocation-id eipalloc-12345

# Create route table for private subnet
aws ec2 create-route-table --vpc-id vpc-12345678 --tag-specifications \
  'ResourceType=route-table,Tags=[{Key=Name,Value=private-rt}]'

# Route private traffic through NAT gateway
aws ec2 create-route --route-table-id rtb-22222222 \
  --destination-cidr-block 0.0.0.0/0 --nat-gateway-id nat-12345678
```

## Security Groups vs Network ACLs

Cloud providers offer multiple layers of network security.

### Security Groups (Stateful)

Security groups act like firewalls attached to individual instances:

```bash
# Create security group for web servers
aws ec2 create-security-group --group-name web-servers \
  --description "Security group for web servers" --vpc-id vpc-12345678

# Allow HTTP and HTTPS traffic
aws ec2 authorize-security-group-ingress --group-id sg-web12345 \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress --group-id sg-web12345 \
  --protocol tcp --port 443 --cidr 0.0.0.0/0

# Allow SSH from management subnet only
aws ec2 authorize-security-group-ingress --group-id sg-web12345 \
  --protocol tcp --port 22 --cidr 10.0.100.0/24
```

Security groups are stateful - if you allow inbound traffic, the return traffic is automatically allowed.

### Network ACLs (Stateless)

Network ACLs provide subnet-level filtering:

```bash
# Create custom network ACL
aws ec2 create-network-acl --vpc-id vpc-12345678

# Add rules (must specify both inbound and outbound)
aws ec2 create-network-acl-entry --network-acl-id acl-12345678 \
  --rule-number 100 --protocol tcp --port-range From=80,To=80 \
  --cidr-block 0.0.0.0/0 --rule-action allow

# Add corresponding outbound rule for stateless operation
aws ec2 create-network-acl-entry --network-acl-id acl-12345678 \
  --rule-number 100 --protocol tcp --port-range From=32768,To=65535 \
  --cidr-block 0.0.0.0/0 --rule-action allow --egress
```

Network ACLs are stateless - you must explicitly allow both directions of traffic.

## Cloud Load Balancing

Cloud providers offer managed load balancing services.

### Application Load Balancer (AWS)

Application Load Balancers operate at Layer 7 and can route based on content:

```bash
# Create application load balancer
aws elbv2 create-load-balancer --name demo-alb \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups sg-alb12345

# Create target group
aws elbv2 create-target-group --name web-targets \
  --protocol HTTP --port 80 --vpc-id vpc-12345678 \
  --health-check-path /health

# Register targets
aws elbv2 register-targets --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-instance1,Port=80 Id=i-instance2,Port=80

# Create listener
aws elbv2 create-listener --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Advanced Load Balancer Features

Route traffic based on request attributes:

```json
{
  "Type": "forward",
  "ForwardConfig": {
    "TargetGroups": [
      {
        "TargetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/api-v1/...",
        "Weight": 90
      },
      {
        "TargetGroupArn": "arn:aws:elasticloadbalancing:...:targetgroup/api-v2/...",
        "Weight": 10
      }
    ]
  },
  "Conditions": [
    {
      "Field": "path-pattern",
      "Values": ["/api/*"]
    }
  ]
}
```

This configuration sends 90% of API traffic to v1 and 10% to v2 for gradual rollouts.

## Multi-Cloud Networking

Organizations often use multiple cloud providers for redundancy or specific services.

```
Multi-Cloud Architecture

┌───────────────────────────────────────────────────────────────┐
│                       Internet                                │
└────────────────────┬──────────────────┬───────────────────────┘
                     │                  │
┌────────────────────▼────────────────┐ │ ┌─────────────────────▼───────────┐
│        AWS (us-east-1)              │ │ │         Azure (eastus)          │
│ ┌─────────────────────────────────┐ │ │ │  ┌───────────────────────────┐  │
│ │     VPC (10.1.0.0/16)           │ │ │ │  │     VNet (10.2.0.0/16)    │  │
│ │  ┌─────────┐ ┌─────────┐        │ │ │ │  │  ┌─────────┐ ┌─────────┐  │  │
│ │  │   ALB   │ │   EC2   │        │ │ │ │  │  │   ALB   │ │   VM    │  │  │
│ │  │         │ │ Web App │        │ │ │ │  │  │         │ │ Web App │  │  │
│ │  └─────────┘ └─────────┘        │ │ │ │  │  └─────────┘ └─────────┘  │  │
│ └─────────────────────────────────┘ │ │ │  └───────────────────────────┘  │
└──────────────┬──────────────────────┘ │ └──────────────┬──────────────────┘
               │                        │                │
               │      VPN Tunnel        │                │
               │  (IPSec/Site-to-Site)  │                │
               └────────────────────────┼────────────────┘
                                        │
              ┌─────────────────────────▼──────────────────┐
              │                  GCP (us-central1)         │
              │ ┌───────────────────────────────────────┐  │
              │ │                VPC (10.3.0.0/16)      │  │
              │ │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
              │ │  │   LB    │ │   GKE   │ │Database │  │  │
              │ │  │         │ │Cluster  │ │(Global) │  │  │
              │ │  └─────────┘ └─────────┘ └─────────┘  │  │
              │ └───────────────────────────────────────┘  │
              └────────────────────────────────────────────┘

Connectivity Matrix:
AWS ←→ Azure: VPN Gateway (IPSec)
AWS ←→ GCP:   Cloud Interconnect
Azure ←→ GCP: ExpressRoute + Cloud Interconnect
All ←→ Users: Global DNS (Route 53/Traffic Manager/Cloud DNS)
```

### VPN Connections

Connect your VPCs across cloud providers:

```bash
# AWS: Create VPN gateway
aws ec2 create-vpn-gateway --type ipsec.1

# Create customer gateway (representing your on-premises or other cloud)
aws ec2 create-customer-gateway --type ipsec.1 \
  --public-ip 203.0.113.12 --bgp-asn 65000

# Create VPN connection
aws ec2 create-vpn-connection --type ipsec.1 \
  --customer-gateway-id cgw-12345678 --vpn-gateway-id vgw-87654321
```

### VPC Peering

Connect VPCs within the same cloud provider:

```bash
# Create peering connection between VPCs
aws ec2 create-vpc-peering-connection \
  --vpc-id vpc-12345678 --peer-vpc-id vpc-87654321

# Accept the peering connection
aws ec2 accept-vpc-peering-connection --vpc-peering-connection-id pcx-12345678

# Update route tables to enable communication
aws ec2 create-route --route-table-id rtb-11111111 \
  --destination-cidr-block 10.1.0.0/16 --vpc-peering-connection-id pcx-12345678
```

## Cloud DNS Services

Cloud providers offer managed DNS services with advanced features.

### Route 53 (AWS) Advanced Routing

Health-based routing automatically removes unhealthy endpoints:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "SetIdentifier": "primary",
        "TTL": 60,
        "ResourceRecords": [{ "Value": "203.0.113.10" }],
        "HealthCheckId": "12345678-1234-1234-1234-123456789012"
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "SetIdentifier": "secondary",
        "TTL": 60,
        "ResourceRecords": [{ "Value": "203.0.113.20" }],
        "HealthCheckId": "87654321-4321-4321-4321-210987654321",
        "Failover": "SECONDARY"
      }
    }
  ]
}
```

### Geolocation Routing

Route users to the nearest datacenter:

```bash
# Create records for different geographic locations
aws route53 change-resource-record-sets --hosted-zone-id Z12345678 --change-batch '{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "SetIdentifier": "US-East",
        "GeoLocation": {"ContinentCode": "NA"},
        "TTL": 300,
        "ResourceRecords": [{"Value": "203.0.113.10"}]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.example.com",
        "Type": "A",
        "SetIdentifier": "Europe",
        "GeoLocation": {"ContinentCode": "EU"},
        "TTL": 300,
        "ResourceRecords": [{"Value": "203.0.113.20"}]
      }
    }
  ]
}'
```

## Container Networking in the Cloud

Cloud platforms provide specialized networking for containers.

### AWS EKS Networking

EKS uses the Amazon VPC CNI plugin for pod networking:

```yaml
# aws-node-daemonset.yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: aws-node
  namespace: kube-system
spec:
  template:
    spec:
      containers:
        - name: aws-node
          image: amazon/amazon-k8s-cni:v1.11.4
          env:
            - name: AWS_VPC_K8S_CNI_VETHPREFIX
              value: eni
            - name: AWS_VPC_ENI_MTU
              value: '9001'
            - name: AWS_VPC_K8S_CNI_LOG_LEVEL
              value: DEBUG
```

Each pod gets an IP address from your VPC subnet range:

```bash
# Check pod IP addresses
kubectl get pods -o wide

# Pods can be reached directly from other VPC resources
aws ec2 describe-instances --filters "Name=private-ip-address,Values=10.0.1.100"
```

### Service Mesh in the Cloud

Cloud providers offer managed service mesh services:

```yaml
# AWS App Mesh virtual service
apiVersion: appmesh.k8s.aws/v1beta2
kind: VirtualService
metadata:
  name: productpage
  namespace: bookinfo
spec:
  awsName: productpage
  provider:
    virtualRouter:
      virtualRouterRef:
        name: productpage-router
```

## Cloud Network Monitoring

Cloud providers offer extensive networking monitoring and logging.

### VPC Flow Logs

Capture network traffic for analysis:

```bash
# Enable VPC Flow Logs
aws ec2 create-flow-logs --resource-type VPC --resource-ids vpc-12345678 \
  --traffic-type ALL --log-destination-type cloud-watch-logs \
  --log-group-name VPCFlowLogs

# Query flow logs
aws logs filter-log-events --log-group-name VPCFlowLogs \
  --filter-pattern '[version, account, eni, source, destination, srcport, destport="22", protocol="6", packets, bytes, windowstart, windowend, action="REJECT", flowlogstatus]'
```

This query finds rejected SSH connection attempts.

### CloudWatch Network Insights

Monitor application performance across network boundaries:

```bash
# Create network insights path
aws ec2 create-network-insights-path \
  --source i-instance1 --destination i-instance2 \
  --protocol tcp --destination-port 443

# Analyze the path
aws ec2 start-network-insights-analysis --network-insights-path-id nip-12345678
```

## Cloud Cost Optimization

Cloud networking can generate significant costs.

### Data Transfer Costs

Understand how data transfer pricing works:

```bash
# Same AZ: Usually free
# Same region, different AZ: ~$0.01/GB
# Different regions: ~$0.02/GB
# Internet egress: ~$0.09/GB (first 1TB free per month)
```

Optimize by:

- Keeping related services in the same AZ when possible
- Using CloudFront or other CDNs for static content
- Compressing data before transfer

### NAT Gateway Alternatives

NAT Gateways charge for data processing:

```bash
# Instead of NAT Gateway for all traffic
# Use VPC endpoints for AWS services
aws ec2 create-vpc-endpoint --vpc-id vpc-12345678 \
  --service-name com.amazonaws.us-east-1.s3 \
  --route-table-ids rtb-11111111

# This allows direct access to S3 without NAT Gateway costs
```

## Troubleshooting Cloud Networking

Cloud networking issues require systematic debugging.

### Connectivity Testing

Test connectivity step by step:

```bash
# 1. Can the instance reach the internet?
curl -I http://google.com

# 2. Can it reach other instances in the VPC?
ping 10.0.1.100

# 3. Are security groups allowing the traffic?
aws ec2 describe-security-groups --group-ids sg-12345678

# 4. Are network ACLs blocking traffic?
aws ec2 describe-network-acls --network-acl-ids acl-12345678

# 5. Is the route table configured correctly?
aws ec2 describe-route-tables --route-table-ids rtb-11111111
```

### Flow Log Analysis

Use flow logs to understand traffic patterns:

```bash
# Analyze rejected connections
aws logs filter-log-events --log-group-name VPCFlowLogs \
  --filter-pattern '[version, account, eni, source, destination, srcport, destport, protocol, packets, bytes, windowstart, windowend, action="REJECT", flowlogstatus]' \
  --start-time $(date -d '1 hour ago' +%s)000
```

### Load Balancer Health Checks

Debug load balancer health check failures:

```bash
# Check target health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:...

# Review load balancer logs
aws s3 ls s3://my-alb-logs/AWSLogs/123456789012/elasticloadbalancing/us-east-1/
```

## Multi-Region Architecture

Design applications that span multiple geographic regions.

### Database Replication

Set up cross-region database replication:

```bash
# RDS read replica in different region
aws rds create-db-instance-read-replica \
  --db-instance-identifier replica-west \
  --source-db-instance-identifier arn:aws:rds:us-east-1:123456789012:db:primary-db \
  --db-instance-class db.r5.large
```

### Global Load Balancing

Use Route 53 for global traffic distribution:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "SetIdentifier": "us-east-1",
        "Latency": "us-east-1",
        "TTL": 60,
        "ResourceRecords": [{ "Value": "203.0.113.10" }]
      }
    },
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "app.example.com",
        "Type": "A",
        "SetIdentifier": "us-west-2",
        "Latency": "us-west-2",
        "TTL": 60,
        "ResourceRecords": [{ "Value": "203.0.113.20" }]
      }
    }
  ]
}
```

## Security Best Practices

Cloud networking security requires multiple layers of protection.

### Network Segmentation

Use multiple VPCs for isolation:

```bash
# Production VPC: 10.0.0.0/16
# Staging VPC: 10.1.0.0/16
# Development VPC: 10.2.0.0/16
# Management VPC: 10.3.0.0/16

# Connect with peering or transit gateway as needed
```

### Principle of Least Privilege

Only allow necessary network access:

```bash
# Instead of allowing all traffic from a subnet
aws ec2 authorize-security-group-ingress --group-id sg-12345678 \
  --protocol tcp --port 5432 --cidr 10.0.0.0/24

# Allow only from specific security group
aws ec2 authorize-security-group-ingress --group-id sg-db12345 \
  --protocol tcp --port 5432 --source-group sg-app12345
```

In the next section, we'll explore network monitoring and troubleshooting tools that help you maintain visibility into your cloud and on-premises network infrastructure.

Cloud networking provides powerful capabilities, but complexity increases with scale. Start simple, document your architecture, and gradually add advanced features as your needs grow.

Happy cloud networking!
