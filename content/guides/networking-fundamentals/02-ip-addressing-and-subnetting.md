---
title: 'IP Addressing and Subnetting'
description: 'Planning and managing IP address spaces for applications, containers, and cloud infrastructure.'
order: 2
---

IP addresses might look simple, but proper address planning prevents headaches as your infrastructure grows. Whether you're setting up development environments, designing cloud architecture, or troubleshooting connectivity issues, understanding how IP addressing works saves time and prevents conflicts.

## Prerequisites

- Understanding of basic networking from Part 1
- Terminal access for testing commands
- No special tools required

## IP Address Structure

An IPv4 address like `192.168.1.100` represents a 32-bit number split into four parts. But there's more structure than meets the eye.

Let's check your current IP configuration:

```bash
# Show your network interfaces and IP addresses
ip addr show
```

You'll see output like:

```
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic eth0
```

The `/24` part is crucial - it tells you how much of the address identifies the network versus individual hosts.

### Understanding Subnet Masks

The `/24` notation means the first 24 bits identify the network, leaving 8 bits for host addresses:

- Network portion: `10.0.2` (first 24 bits)
- Host portion: `.15` (last 8 bits)
- Available host addresses: `10.0.2.1` through `10.0.2.254`

You lose two addresses in every subnet:

- Network address: `10.0.2.0` (identifies the network itself)
- Broadcast address: `10.0.2.255` (sends to all hosts on the network)

### Common Subnet Sizes

Different subnet sizes give you different numbers of host addresses:

```bash
/24 = 254 usable host addresses (common for small networks)
/16 = 65,534 usable host addresses (medium networks)
/8  = 16,777,214 usable host addresses (very large networks)
```

Use a subnet calculator to verify your math:

```bash
# Install ipcalc if available
sudo apt install ipcalc

# Calculate subnet information
ipcalc 192.168.1.0/24
```

## Private vs Public IP Addresses

Not all IP addresses can be reached from the internet. Three ranges are reserved for private use:

### Class A Private: 10.0.0.0/8

This gives you over 16 million addresses, perfect for large organizations:

```bash
# Example: Enterprise network design
10.1.0.0/16    # New York office (65k addresses)
10.2.0.0/16    # London office (65k addresses)
10.3.0.0/16    # Cloud infrastructure (65k addresses)
```

### Class B Private: 172.16.0.0/12

Docker uses this range by default:

```bash
# Check Docker's network configuration
docker network ls
docker network inspect bridge
```

You'll see Docker assigns addresses like `172.17.0.0/16` for container communication.

### Class C Private: 192.168.0.0/16

Most home routers use this range:

```bash
# Common home network setups
192.168.1.0/24   # Main network
192.168.2.0/24   # Guest network
192.168.100.0/24 # IoT devices
```

## Network Address Translation (NAT)

Private addresses can't communicate directly with the internet. NAT solves this by translating between private and public addresses.

```
Private Network (192.168.1.0/24)      │      Internet
                                      │
┌─────────────┐                       │    ┌─────────────┐
│ Laptop      │                       │    │ Google      │
│192.168.1.100│────┐                  │    │8.8.8.8      │
└─────────────┘    │                  │    └─────────────┘
                   │   ┌──────────┐   │           ▲
┌─────────────┐    └───│ Router/  │───┼───────────┘
│ Phone       │        │ NAT      │   │
│192.168.1.101│────────│Gateway   │   │
└─────────────┘        │          │   │
                       │Public IP:│   │
                       │203.0.113.│   │
                       │50        │   │
                       └──────────┘   │

NAT Translation Table:
Internal IP:Port    ←→    External IP:Port
192.168.1.100:5000  ←→    203.0.113.50:12345
192.168.1.101:3000  ←→    203.0.113.50:12346
```

When your laptop with IP `192.168.1.100` makes a web request:

1. Your request: `192.168.1.100:5000 → google.com:443`
2. Router translates: `203.0.113.50:12345 → google.com:443`
3. Response: `google.com:443 → 203.0.113.50:12345`
4. Router translates back: `google.com:443 → 192.168.1.100:5000`

Check your public IP address:

```bash
# See your public IP as the internet sees it
curl ifconfig.me
```

This is probably different from your local IP address shown by `ip addr show`.

## Practical Subnetting

Let's say you're setting up infrastructure and need to organize different types of servers. Starting with `10.0.0.0/16`, you could divide it like this:

```
Main Network: 10.0.0.0/16 (65,536 addresses)
│
├── Web Servers: 10.0.1.0/24 (254 addresses)
│   ├── 10.0.1.1 - nginx-1
│   ├── 10.0.1.2 - nginx-2
│   └── 10.0.1.3 - nginx-3
│
├── App Servers: 10.0.2.0/24 (254 addresses)
│   ├── 10.0.2.1 - api-1
│   ├── 10.0.2.2 - api-2
│   └── 10.0.2.3 - api-3
│
├── Databases: 10.0.3.0/27 (30 addresses)
│   ├── 10.0.3.1 - postgres-primary
│   ├── 10.0.3.2 - postgres-replica
│   └── 10.0.3.3 - redis-cache
│
└── Management: 10.0.4.0/26 (62 addresses)
    ├── 10.0.4.1 - monitoring
    ├── 10.0.4.2 - logging
    └── 10.0.4.3 - backup
```

This approach gives each service type its own network segment, which helps with security policies and troubleshooting.

### Variable Length Subnetting

You don't need to make all subnets the same size. Adjust based on your actual needs:

```bash
# Large subnet for development machines
10.0.10.0/24   # 254 addresses

# Small subnet for production databases
10.0.20.0/28   # 14 addresses

# Medium subnet for staging environment
10.0.30.0/26   # 62 addresses
```

## Cloud Network Planning

Cloud environments require careful IP planning to avoid conflicts and enable connectivity between services.

### AWS VPC Example

Here's how you might design an AWS VPC:

```bash
# Main VPC: 10.0.0.0/16 (65,536 total addresses)

# Public subnets (for load balancers, NAT gateways)
10.0.1.0/24    # us-east-1a public (254 addresses)
10.0.2.0/24    # us-east-1b public (254 addresses)

# Private subnets (for application servers)
10.0.10.0/24   # us-east-1a private (254 addresses)
10.0.20.0/24   # us-east-1b private (254 addresses)

# Database subnets (highly restricted access)
10.0.100.0/28  # us-east-1a database (14 addresses)
10.0.100.16/28 # us-east-1b database (14 addresses)
```

This design provides multiple availability zones while keeping different tiers isolated.

### Multi-Cloud Considerations

If you're using multiple cloud providers or connecting to on-premises networks, avoid overlapping IP ranges:

```bash
# AWS environment
10.1.0.0/16

# Azure environment
10.2.0.0/16

# Google Cloud environment
10.3.0.0/16

# On-premises office
10.10.0.0/16
```

This prevents routing conflicts when you set up VPN connections between environments.

## Container Network Planning

Container platforms create networks automatically, but understanding the addressing helps with troubleshooting.

### Docker Networks

Docker creates several networks by default:

```bash
# List Docker networks
docker network ls

# Examine the default bridge network
docker network inspect bridge
```

You'll see Docker typically uses `172.17.0.0/16` for the default bridge network. When you run containers, they get addresses from this range.

Create custom networks for better organization:

```bash
# Create a network for a specific application
docker network create --subnet=10.5.0.0/16 ecommerce-network

# Run containers on the custom network
docker run --network ecommerce-network --name web nginx
docker run --network ecommerce-network --name db postgres
```

Containers on the same network can communicate using container names as hostnames.

### Kubernetes Networking

Kubernetes uses more complex networking, but the same principles apply:

```bash
# See pod network assignments
kubectl get pods -o wide

# Check node network configuration
kubectl describe node <node-name>
```

Kubernetes typically uses large address spaces like `10.244.0.0/16` for pod networks.

## Troubleshooting IP Address Issues

### Address Conflicts

When two devices have the same IP address, you'll see intermittent connectivity:

```bash
# Test for IP conflicts
ping 192.168.1.100
arping 192.168.1.100

# Check ARP table for inconsistencies
arp -a
```

If you see different MAC addresses for the same IP, you have a conflict.

### DHCP Problems

DHCP automatically assigns IP addresses, but it can fail:

```bash
# Force a new DHCP lease
sudo dhclient -r  # Release current lease
sudo dhclient     # Request new lease

# Check current lease information
cat /var/lib/dhcp/dhclient.leases
```

### Routing Issues

Sometimes you can reach some networks but not others:

```bash
# Check your routing table
ip route show

# Add a temporary route if needed
sudo ip route add 10.5.0.0/16 via 192.168.1.1
```

The routing table shows where packets go for different destination networks.

## Network Overlap Detection

Before connecting new networks, check for overlaps:

```bash
# Show all your current network routes
ip route show

# Look for conflicts before adding VPN or new segments
# For example, if you see 192.168.1.0/24 locally,
# don't use the same range for a VPN connection
```

Overlapping networks cause routing confusion and connectivity problems.

## IPv6 Basics

IPv6 adoption is growing, especially in cloud environments. The addressing works differently:

```bash
# Check IPv6 configuration
ip -6 addr show

# Test IPv6 connectivity
ping6 google.com
```

IPv6 addresses are much longer (`2001:db8:85a3::8a2e:370:7334`) but the subnetting concepts are similar. The key difference is that IPv6 provides so many addresses that you don't need to be as careful about conservation.

## Network Documentation

As your infrastructure grows, document your IP allocations:

```bash
# Keep a simple text file or spreadsheet:
# Network Plan for Production Environment
#
# 10.0.0.0/16 - Main VPC
# ├── 10.0.1.0/24 - Public subnet AZ-a (load balancers)
# ├── 10.0.2.0/24 - Public subnet AZ-b (load balancers)
# ├── 10.0.10.0/24 - Private subnet AZ-a (app servers)
# ├── 10.0.20.0/24 - Private subnet AZ-b (app servers)
# └── 10.0.100.0/28 - Database subnet (restricted access)
```

This prevents conflicts and helps new team members understand your network design.

## Performance Considerations

Network design affects performance in subtle ways:

### Broadcast Domains

Larger subnets create larger broadcast domains:

```bash
# Small subnet: 10.0.1.0/28 (14 hosts)
# - Less broadcast traffic
# - Better performance
# - Easier to troubleshoot

# Large subnet: 10.0.1.0/22 (1022 hosts)
# - More broadcast traffic
# - Potential performance issues
# - Harder to isolate problems
```

### Inter-Subnet Communication

Communication within the same subnet is typically faster:

```bash
# Same subnet: Direct communication
# 192.168.1.10 → 192.168.1.20 (fast)

# Different subnets: Requires routing
# 192.168.1.10 → 192.168.2.20 (slightly slower)
```

This matters for high-performance applications where every millisecond counts.

In the next section, we'll explore DNS and domain management - how the names your applications use get translated into the IP addresses you've just learned to plan and manage.

Good planning prevents most IP address problems before they occur. Take time to design your address space logically, avoid overlaps, and document your decisions.

Happy subnetting!
