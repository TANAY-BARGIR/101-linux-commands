---
title: 'VPC - Building Your Private Network'
description: 'Create isolated, secure networks in the cloud and understand why custom networking matters.'
order: 5
---

When you first started with AWS, your servers used a "default network" that Amazon set up for you. This works fine for learning, but real applications need custom networks designed for security, performance, and organization.

Virtual Private Cloud (VPC) lets you create your own private section of AWS where you control the networking rules, just like setting up a corporate network in an office building.

## Why Custom Networks Matter

Think of the default AWS network like a shared apartment building:

- Everyone uses the same hallways
- You can't control who has access to what
- Security relies on individual door locks
- Limited ability to customize the layout

A custom VPC is like owning your own building:

- You design the floor plan
- You control who can enter which areas
- You can create private sections and public lobbies
- You decide how different areas connect

## Understanding Network Basics

Before diving into VPC, let's review some networking fundamentals:

**Public vs. Private**:

- Public networks connect to the internet
- Private networks are isolated from direct internet access

**Subnets**:

- Smaller sections within a larger network
- Like different floors or wings in a building

**IP Addresses**:

- Unique addresses for each device on the network
- Private addresses (like 10.0.1.5) for internal use
- Public addresses for internet communication

## VPC Core Components

A VPC consists of several pieces working together:

### The VPC Itself

This is your private network space with a range of IP addresses you control. You might choose something like 10.0.0.0/16, which gives you about 65,000 possible addresses.

### Subnets

Subnets divide your VPC into smaller sections. You typically create:

- **Public subnets** for things that need internet access
- **Private subnets** for databases and internal services

### Internet Gateway

This is like the front door to your building - it allows traffic between your VPC and the internet.

### Route Tables

These are like traffic signs that tell network traffic where to go. Different subnets can have different routing rules.

### Security Groups

Virtual firewalls that control traffic at the server level. Think of them as security guards for individual rooms.

## Planning Your Network

Before creating anything, sketch out your network design. A typical web application might look like:

```
Internet
    |
Internet Gateway
    |
Load Balancer (Public Subnet)
    |
Web Servers (Private Subnet)
    |
Database (Private Subnet)
```

This design keeps your web servers and database hidden from direct internet access while still allowing your load balancer to serve traffic.

## Creating Your First VPC

Let's build a simple but secure network for a web application.

### Step 1: Create the VPC

In the VPC console, create a new VPC with:

- **Name**: MyApp-VPC
- **IPv4 CIDR**: 10.0.0.0/16
- **IPv6**: Not needed for basic applications

This gives you a private network with 65,000 possible IP addresses.

### Step 2: Create Subnets

Create two subnets in different availability zones for redundancy:

**Public Subnet**:

- **Name**: Public-Subnet-A
- **Availability Zone**: us-east-1a
- **IPv4 CIDR**: 10.0.1.0/24 (256 addresses)

**Private Subnet**:

- **Name**: Private-Subnet-A
- **Availability Zone**: us-east-1a
- **IPv4 CIDR**: 10.0.10.0/24 (256 addresses)

### Step 3: Set Up Internet Access

Create an Internet Gateway and attach it to your VPC. This enables internet connectivity for your public subnet.

### Step 4: Configure Routing

Create route tables that define how traffic flows:

- **Public Route Table**: Sends internet traffic to the Internet Gateway
- **Private Route Table**: Keeps traffic internal (for now)

## Security Groups vs. NACLs

AWS provides two types of network security:

### Security Groups (Recommended)

- Apply to individual instances
- Stateful (automatically allow return traffic)
- Easier to manage and understand
- Default deny, explicitly allow what you need

### Network ACLs

- Apply to entire subnets
- Stateless (must explicitly allow both directions)
- More complex but offer additional control
- Good for compliance requirements

For most applications, Security Groups provide sufficient security with less complexity.

## Practical Security Group Setup

Here's how you might configure security groups for a web application:

### Web Server Security Group

**Inbound Rules**:

- HTTP (port 80) from anywhere
- HTTPS (port 443) from anywhere
- SSH (port 22) from your IP only

**Outbound Rules**:

- All traffic allowed (default)

### Database Security Group

**Inbound Rules**:

- MySQL (port 3306) from Web Server Security Group only
- No direct internet access

This setup ensures your database only accepts connections from your web servers.

## NAT Gateways for Private Subnets

Sometimes servers in private subnets need internet access for updates or external API calls, but you don't want them directly accessible from the internet.

A NAT Gateway acts like a one-way door:

- Private servers can make outbound connections
- Internet traffic can't initiate connections to private servers

This is perfect for:

- Installing software updates
- Calling external APIs
- Downloading application dependencies

## Multi-AZ Design for Reliability

For production applications, spread resources across multiple Availability Zones:

**Zone A**:

- Public Subnet A
- Private Subnet A
- Web Server A
- Database Primary

**Zone B**:

- Public Subnet B
- Private Subnet B
- Web Server B
- Database Standby

This design survives the failure of an entire data center.

## Common VPC Patterns

### Single-Tier Architecture

All resources in public subnets. Simple but less secure.
**Good for**: Static websites, simple applications
**Not ideal for**: Applications handling sensitive data

### Two-Tier Architecture

Web servers in public subnets, databases in private subnets.
**Good for**: Most web applications
**Security**: Moderate

### Three-Tier Architecture

Load balancers in public subnets, web servers in private subnets, databases in isolated subnets.
**Good for**: Production applications
**Security**: High

## VPC Endpoints for AWS Services

By default, when your EC2 instances access AWS services like S3, traffic goes over the internet. VPC Endpoints let you access AWS services privately within your VPC.

**Benefits**:

- Improved security (traffic stays within AWS)
- Better performance (no internet detour)
- Reduced data transfer costs

**Common endpoints**:

- S3 for file storage
- DynamoDB for databases
- EC2 for instance management

## Connecting Multiple VPCs

As your applications grow, you might need multiple VPCs for:

- Different environments (dev, staging, production)
- Different teams or projects
- Different regions

VPC Peering connects VPCs so they can communicate privately. It's like building a private bridge between two buildings.

## Monitoring Your Network

CloudWatch provides network monitoring:

- **VPC Flow Logs**: See all network traffic
- **Network ACL metrics**: Monitor allowed/denied traffic
- **NAT Gateway metrics**: Track usage and performance

Flow logs are especially useful for security analysis and troubleshooting connectivity issues.

## Common Networking Issues

### Can't Connect to Instance

Check:

1. Security group allows the required port
2. Route table has correct routes
3. Instance is in the right subnet
4. NACL allows traffic (if customized)

### Instance Can't Reach Internet

Check:

1. Instance is in a public subnet, or
2. Route table points to Internet Gateway (public) or NAT Gateway (private)
3. Security group allows outbound traffic

### Services Can't Talk to Each Other

Check:

1. Security groups allow traffic between services
2. Both services are in the same VPC or connected VPCs
3. DNS resolution is working

## Cost Considerations

VPC components have different cost implications:

- **VPC, subnets, route tables**: Free
- **Internet Gateway**: Free
- **NAT Gateway**: ~$45/month plus data processing
- **VPC Endpoints**: $7-22/month depending on type
- **Data transfer**: Varies by amount and destination

## Best Practices for Beginners

### Start Simple

Begin with a basic two-tier architecture and add complexity as needed.

### Plan IP Address Space

Choose CIDR blocks that won't conflict with your office network or other VPCs.

### Use Consistent Naming

Name resources clearly: "Production-Web-Subnet" is better than "Subnet-1".

### Document Your Design

Keep notes about why you made certain choices. Future you will thank you.

### Test Security Rules

Verify that your security groups work as expected before deploying applications.

## When to Use Custom VPCs

**Always use custom VPCs for**:

- Production applications
- Applications handling sensitive data
- Multi-tier applications
- Applications requiring specific network layouts

**Default VPCs are fine for**:

- Learning and experimentation
- Simple, single-server applications
- Quick prototypes

## Migrating from Default VPC

If you started with the default VPC and need to move to a custom VPC:

1. Create your new VPC
2. Launch new instances in the new VPC
3. Migrate data and configuration
4. Update DNS to point to new instances
5. Terminate old instances

This process avoids downtime and lets you test thoroughly.

## Next Steps

With your VPC providing a secure network foundation, you're ready to add managed database services with RDS. Databases benefit greatly from VPC security, and you'll see how to place them in private subnets while still allowing your applications to connect.

Understanding networking makes you a more effective cloud architect. The concepts you've learned here apply not just to AWS, but to any cloud platform or traditional data center networking.
