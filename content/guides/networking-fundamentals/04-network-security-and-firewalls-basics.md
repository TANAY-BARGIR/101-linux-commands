---
title: 'Network Security and Firewalls'
description: 'Protecting network traffic, controlling access, and implementing security policies without breaking functionality.'
order: 4
---

Network security is about controlling who can communicate with what, when, and how. Good security policies protect your applications while still allowing legitimate traffic to flow. Poor security policies either leave you vulnerable or break functionality in confusing ways.

## Prerequisites

- Understanding of IP addressing and ports from previous sections
- Terminal access with sudo privileges for firewall configuration
- Basic understanding of your application's communication patterns

## Network Security Fundamentals

Every network connection has three key attributes you can control:

1. **Source**: Where is the traffic coming from?
2. **Destination**: Where is it trying to go?
3. **Protocol/Port**: What type of communication is it?

Let's see what connections currently exist on your system:

```bash
# Show all network connections
netstat -tuln

# Show connections with process information
sudo netstat -tulnp
```

This reveals what services are listening and what connections are active. Each line represents a potential security consideration.

### Default Security Posture

Most systems start with relatively open networking. Let's check your current firewall status:

```bash
# Ubuntu/Debian firewall status
sudo ufw status

# CentOS/RHEL firewall status
sudo firewall-cmd --list-all

# Raw iptables rules (Linux)
sudo iptables -L
```

If you see "inactive" or minimal rules, your system is probably accepting all connections by default.

## Firewall Types and Tools

### Host-Based Firewalls

Host-based firewalls run on individual servers and control traffic to/from that specific machine.

**UFW (Ubuntu/Debian):**

```bash
# Enable the firewall
sudo ufw enable

# Allow SSH access (important - don't lock yourself out!)
sudo ufw allow ssh

# Allow specific ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow from specific IP addresses
sudo ufw allow from 192.168.1.100 to any port 22
```

**firewalld (CentOS/RHEL):**

```bash
# Check current zones and rules
sudo firewall-cmd --list-all

# Allow specific services
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow specific ports
sudo firewall-cmd --permanent --add-port=8080/tcp

# Reload configuration
sudo firewall-cmd --reload
```

### Network-Based Firewalls

Network firewalls control traffic between network segments. Cloud providers offer these as security groups or network ACLs.

**AWS Security Groups example:**

```bash
# Allow HTTP traffic from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow database access only from application servers
aws ec2 authorize-security-group-ingress \
  --group-id sg-database \
  --protocol tcp \
  --port 5432 \
  --source-group sg-application
```

## Practical Firewall Configuration

Let's configure a typical web server firewall policy:

### Web Server Setup

Start with a deny-all policy, then explicitly allow needed traffic:

```bash
# Reset firewall to defaults
sudo ufw --force reset

# Default policies: deny incoming, allow outgoing
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if you use non-standard)
sudo ufw allow 22/tcp

# Allow web traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable the firewall
sudo ufw enable
```

Test that your web server still works after enabling the firewall.

### Database Server Security

Database servers need more restrictive policies:

```bash
# Allow database connections only from application servers
sudo ufw allow from 10.0.1.0/24 to any port 5432

# Allow SSH from management network only
sudo ufw allow from 10.0.100.0/24 to any port 22

# Deny everything else (default policy)
sudo ufw default deny incoming
```

### Application Server Configuration

Application servers often need to make outbound connections:

```bash
# Allow inbound connections from load balancer
sudo ufw allow from 10.0.2.0/24 to any port 8080

# Outbound connections are allowed by default
# But you can restrict them if needed:
sudo ufw default deny outgoing
sudo ufw allow out 53      # DNS
sudo ufw allow out 80      # HTTP
sudo ufw allow out 443     # HTTPS
sudo ufw allow out 5432    # Database
```

## Network Segmentation

Segmentation divides your network into zones with different security policies.

```
                           Internet
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                    DMZ (10.0.1.0/24)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │Load Balancer│  │ Web Server  │  │ Web Server  │         │
│  │10.0.1.10    │  │10.0.1.20    │  │10.0.1.21    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────┬──────────────────────────────────────┘
                      │ Firewall Rules:
                      │ ✓ HTTP/HTTPS from Internet
                      │ ✓ Limited access to Internal
                      ▼
┌────────────────────────────────────────────────────────────┐
│                Internal Zone (10.0.2.0/24)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │API Server   │  │App Server   │  │App Server   │         │
│  │10.0.2.10    │  │10.0.2.20    │  │10.0.2.21    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────┬──────────────────────────────────────┘
                      │ Firewall Rules:
                      │ ✓ Access from DMZ only
                      │ ✓ Specific ports to Secure Zone
                      ▼
┌───────────────────────────────────────────────────────────┐
│                 Secure Zone (10.0.3.0/24)                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │Database     │  │File Server  │  │Backup       │        │
│  │10.0.3.10    │  │10.0.3.20    │  │10.0.3.30    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                           │
│  Firewall Rules:                                          │
│  ✓ Access from Internal Zone only                         │
│  ✓ Management access from Admin network                   │
│  ✗ No direct Internet access                              │
└───────────────────────────────────────────────────────────┘
```

### Basic Network Zones

**DMZ (Demilitarized Zone)**: Public-facing servers

```bash
# DMZ subnet: 10.0.1.0/24
# - Web servers
# - Load balancers
# - Reverse proxies
# Allow: Internet → DMZ (ports 80, 443)
# Allow: DMZ → Internal (specific ports only)
```

**Internal Zone**: Application servers

```bash
# Internal subnet: 10.0.2.0/24
# - Application servers
# - API services
# - Microservices
# Allow: DMZ → Internal (application ports)
# Deny: Internet → Internal
```

**Secure Zone**: Data and management

```bash
# Secure subnet: 10.0.3.0/24
# - Database servers
# - File servers
# - Management tools
# Allow: Internal → Secure (specific ports)
# Allow: Management → Secure (SSH, monitoring)
# Deny: DMZ → Secure, Internet → Secure
```

### Implementing Segmentation

Use subnets and firewall rules to enforce segmentation:

```bash
# Allow web servers to reach app servers
sudo ufw allow from 10.0.1.0/24 to 10.0.2.0/24 port 8080

# Allow app servers to reach databases
sudo ufw allow from 10.0.2.0/24 to 10.0.3.0/24 port 5432

# Deny direct web-to-database connections
sudo ufw deny from 10.0.1.0/24 to 10.0.3.0/24
```

## Container Security

Container environments need special security considerations.

### Docker Network Security

By default, Docker containers can reach each other freely:

```bash
# Create isolated networks for different applications
docker network create --driver bridge app1-network
docker network create --driver bridge app2-network

# Run containers on isolated networks
docker run --network app1-network --name app1-web nginx
docker run --network app1-network --name app1-db postgres

docker run --network app2-network --name app2-web nginx
docker run --network app2-network --name app2-db postgres
```

Containers on different networks cannot communicate unless explicitly connected.

### Kubernetes Network Policies

Kubernetes allows fine-grained network policies:

```yaml
# NetworkPolicy: Allow only specific pod-to-pod communication
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: web
      ports:
        - protocol: TCP
          port: 8080
```

Apply these policies:

```bash
# Apply network policies
kubectl apply -f network-policies.yaml

# Verify policies are active
kubectl get networkpolicies -n production
```

## Service-to-Service Authentication

Network security alone isn't enough. Services should authenticate each other.

### API Keys and Tokens

Services can authenticate using API keys:

```bash
# Service A calls Service B with authentication
curl -H "Authorization: Bearer $API_TOKEN" \
  http://service-b.internal.com/api/data
```

### Mutual TLS (mTLS)

For highly secure environments, use mutual TLS where both client and server authenticate:

```bash
# Client provides certificate to server
curl --cert client.pem --key client-key.pem \
  --cacert ca.pem \
  https://secure-service.internal.com/api
```

### Service Meshes

Service mesh tools like Istio provide automatic mTLS:

```yaml
# Istio: Require mTLS for all service communication
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: require-mtls
  namespace: production
spec:
  mtls:
    mode: STRICT
```

## Monitoring and Logging

Security policies are only effective if you monitor them.

### Connection Monitoring

Monitor active connections for unusual patterns:

```bash
# Watch active connections in real-time
watch 'netstat -tuln | grep ESTABLISHED'

# Log connection attempts
sudo ufw logging on
tail -f /var/log/ufw.log
```

### Failed Connection Attempts

Failed connections often indicate attacks or misconfigurations:

```bash
# Check for blocked connections in UFW logs
sudo grep "BLOCK" /var/log/ufw.log

# Look for patterns in failed attempts
sudo grep "DPT=22" /var/log/ufw.log | grep "BLOCK"
```

### Application-Level Monitoring

Monitor your applications for authentication failures:

```bash
# Web server access logs
tail -f /var/log/nginx/access.log | grep "401\|403"

# Application logs
tail -f /var/log/app/auth.log | grep "FAILED"
```

## Common Security Mistakes

### Overly Permissive Rules

Avoid rules that allow too much access:

```bash
# Bad: Allow everything from internal network
sudo ufw allow from 10.0.0.0/8

# Better: Allow specific services from specific subnets
sudo ufw allow from 10.0.1.0/24 to any port 8080
sudo ufw allow from 10.0.2.0/24 to any port 5432
```

### Forgetting Outbound Rules

Don't forget that compromised services can make outbound connections:

```bash
# Consider restricting outbound connections
sudo ufw default deny outgoing

# Then explicitly allow needed outbound traffic
sudo ufw allow out 53   # DNS
sudo ufw allow out 80   # HTTP
sudo ufw allow out 443  # HTTPS
```

### Not Testing Changes

Always test firewall changes before applying them to production:

```bash
# Test firewall rules in a non-production environment first
# Use automation to apply consistent rules across environments

# Keep a rollback plan ready
sudo ufw disable  # Emergency rollback command
```

## Advanced Security Patterns

### Zero Trust Networking

Zero trust assumes no network location is inherently trustworthy:

```bash
# Every connection requires authentication
# Even "internal" services verify each request
# Network location grants no implicit access
```

### Defense in Depth

Layer multiple security controls:

1. **Network firewalls**: Control traffic between segments
2. **Host firewalls**: Control traffic to individual servers
3. **Application authentication**: Verify every request
4. **Encryption**: Protect data in transit
5. **Monitoring**: Detect unusual patterns

### Rate Limiting

Protect against abuse with rate limiting:

```bash
# nginx rate limiting example
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
        }
    }
}
```

## Cloud Security Groups

Cloud providers offer network security as a service:

### AWS Security Groups

Security groups act as virtual firewalls:

```bash
# Create security group
aws ec2 create-security-group \
  --group-name web-servers \
  --description "Security group for web servers"

# Add rules
aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-12345678 \
  --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### Network ACLs

Network ACLs provide subnet-level filtering:

```bash
# Network ACLs are stateless (must allow both inbound and outbound)
# Security groups are stateful (return traffic is automatically allowed)
```

## Troubleshooting Security Issues

### Connection Refused vs Connection Timeout

Different error messages indicate different problems:

```bash
# Connection refused: Service is reachable but not listening on port
telnet server.com 80
# Immediate "Connection refused" = firewall allows, service unavailable

# Connection timeout: Firewall blocking or network unreachable
telnet server.com 80
# Hangs then times out = firewall blocking or routing problem
```

### Testing Firewall Rules

Verify rules work as expected:

```bash
# Test from allowed source
ssh user@allowed-ip "curl -I http://your-server"

# Test from blocked source
ssh user@blocked-ip "curl -I http://your-server"

# Check firewall logs for blocked attempts
sudo tail -f /var/log/ufw.log
```

In the next section, we'll explore load balancing and high availability - distributing traffic across multiple servers while maintaining security boundaries.

Network security is about finding the right balance between protection and functionality. Start with restrictive policies and explicitly allow only the traffic your applications need.

Happy securing!
