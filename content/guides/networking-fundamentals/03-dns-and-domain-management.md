---
title: 'DNS and Domain Management'
description: 'How domain names resolve to IP addresses and managing DNS records for your applications.'
order: 3
---

DNS translates human-readable domain names into IP addresses that computers use for communication. When DNS breaks, everything breaks - users can't reach your site, APIs can't communicate, and services fail in confusing ways. Understanding DNS helps you troubleshoot these issues and configure reliable service discovery.

## Prerequisites

- Understanding of IP addressing from Part 2
- Terminal access for testing DNS commands
- Optional: A domain name you control (for hands-on configuration)

## How DNS Resolution Works

When you type `api.github.com` into your browser, your computer needs to find the IP address. Here's what actually happens:

1. Check local cache (your computer remembers recent lookups)
2. Ask your configured DNS server (usually your ISP's or 8.8.8.8)
3. That server might ask root DNS servers for `.com` information
4. Eventually someone returns an IP address like `140.82.112.3`
5. Your browser connects to that IP address

Let's trace this process:

```bash
# See basic DNS resolution
nslookup api.github.com

# Get more detailed information
dig api.github.com

# Trace the full resolution path
dig +trace api.github.com
```

The `+trace` option shows each step in the resolution process, which is invaluable for debugging DNS issues.

## DNS Record Types

DNS stores different types of information using various record types. Here are the ones you'll encounter most often:

### A Records: IPv4 Addresses

A records map domain names to IPv4 addresses:

```bash
# Look up A records
dig api.stripe.com A
```

You'll see output like:

```
api.stripe.com.    300    IN    A    54.187.174.169
api.stripe.com.    300    IN    A    54.187.205.235
```

Multiple A records provide load balancing and redundancy. Your computer will try different IP addresses if one fails.

### AAAA Records: IPv6 Addresses

AAAA records work like A records but for IPv6:

```bash
# Check for IPv6 addresses
dig google.com AAAA
```

### CNAME Records: Aliases

CNAME records create aliases that point to other domain names:

```bash
# Many CDNs use CNAME records
dig www.github.com CNAME
```

You might see:

```
www.github.com.    3600    IN    CNAME    github.com.
```

This means `www.github.com` is an alias for `github.com`.

### MX Records: Mail Servers

MX records specify where email should be delivered:

```bash
# Check mail servers
dig github.com MX
```

The output shows priority numbers (lower = higher priority) and mail server hostnames.

### TXT Records: Arbitrary Text

TXT records store text information, often used for verification and configuration:

```bash
# TXT records often contain verification tokens
dig github.com TXT
```

You'll see records used for domain verification, email security policies, and other metadata.

## DNS Caching and TTL

DNS responses include a TTL (Time To Live) value that tells clients how long to cache the information:

```bash
# Notice the TTL values in DNS responses
dig api.example.com
```

Look for numbers like `300` or `3600` in the output - these are TTL values in seconds.

### Why Caching Matters

DNS caching improves performance but can cause confusion:

- **Short TTL (60-300 seconds)**: Changes take effect quickly, but more DNS queries
- **Long TTL (3600+ seconds)**: Better performance, but changes propagate slowly

When you update DNS records, old cached values might persist until their TTL expires.

### Clearing DNS Cache

Sometimes you need to clear cached DNS entries:

```bash
# Linux: flush systemd-resolved cache
sudo systemd-resolve --flush-caches

# macOS: flush DNS cache
sudo dscacheutil -flushcache

# Windows: flush DNS resolver cache
ipconfig /flushdns
```

## Setting Up DNS Records

If you manage a domain, you'll configure DNS records through your registrar or DNS provider.

### Common DNS Configuration

Here's a typical DNS setup for a web application:

```bash
# Main website
example.com         A      203.0.113.10
www.example.com     CNAME  example.com

# API endpoint
api.example.com     A      203.0.113.20

# Mail servers
example.com         MX     10 mail.example.com
mail.example.com    A      203.0.113.30

# Verification and security
example.com         TXT    "v=spf1 include:_spf.google.com ~all"
```

### DNS Propagation

After changing DNS records, the changes need to propagate across the internet. This can take anywhere from minutes to 48 hours, depending on TTL values and caching.

Test propagation from different locations:

```bash
# Check from different DNS servers
dig @8.8.8.8 example.com
dig @1.1.1.1 example.com
dig @208.67.222.222 example.com
```

Different DNS servers might return different results during propagation.

## Troubleshooting DNS Issues

DNS problems often manifest as intermittent connectivity issues that are hard to diagnose.

### Common DNS Problems

**Domain doesn't resolve at all:**

```bash
# Test basic resolution
nslookup problematic-domain.com
```

If this fails, either the domain doesn't exist or your DNS server can't reach the authoritative servers.

**Slow DNS resolution:**

```bash
# Time DNS lookups
time nslookup slow-domain.com
```

If DNS queries take more than a few seconds, you might have DNS server problems.

**Inconsistent results:**

```bash
# Query multiple DNS servers
dig @8.8.8.8 inconsistent-domain.com
dig @1.1.1.1 inconsistent-domain.com
```

Different results indicate propagation issues or DNS server problems.

### DNS Server Configuration

Check which DNS servers your system uses:

```bash
# Linux/macOS: check resolver configuration
cat /etc/resolv.conf

# Show current DNS settings
systemd-resolve --status
```

You'll see entries like:

```
nameserver 8.8.8.8
nameserver 8.8.4.4
```

If you're having DNS issues, try switching to different DNS servers:

- Google: `8.8.8.8`, `8.8.4.4`
- Cloudflare: `1.1.1.1`, `1.0.0.1`
- OpenDNS: `208.67.222.222`, `208.67.220.220`

## DNS in Application Development

Modern applications often use DNS for service discovery and configuration.

### Environment-Specific DNS

Use different DNS names for different environments:

```bash
# Development
api-dev.example.com     A    10.0.1.100

# Staging
api-staging.example.com A    10.0.2.100

# Production
api.example.com         A    203.0.113.100
```

This lets you use the same application code across environments by changing only the DNS configuration.

### Database Connection Strings

Instead of hardcoding IP addresses, use DNS names:

```python
# Instead of hardcoding IP addresses
DATABASE_URL = "postgresql://user:pass@10.0.3.100:5432/app"

# Use DNS names for flexibility
DATABASE_URL = "postgresql://user:pass@db.internal.example.com:5432/app"
```

This makes it easier to move services or implement load balancing.

### Health Checks and DNS

Some applications use DNS for health checking:

```bash
# Remove unhealthy servers from DNS
# Healthy servers: api.example.com points to multiple IPs
dig api.example.com A

# If one server fails, remove its A record
# Users automatically use remaining healthy servers
```

## DNS Security Considerations

DNS traffic is often unencrypted, which creates security risks.

### DNS over HTTPS (DoH)

Modern browsers support DNS over HTTPS, which encrypts DNS queries:

```bash
# Test DNS over HTTPS
curl -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=example.com&type=A'
```

### DNS Filtering and Blocking

Some networks block or redirect DNS queries:

```bash
# Test if DNS is being filtered
dig @8.8.8.8 blocked-site.example.com
dig @1.1.1.1 blocked-site.example.com
```

If results differ significantly, DNS filtering might be occurring.

## Dynamic DNS and Service Discovery

In cloud environments, IP addresses change frequently. DNS can provide dynamic service discovery.

### Container DNS

Container platforms often provide built-in DNS:

```bash
# In Docker, containers can reach each other by name
docker run --name database postgres
docker run --name webapp --link database myapp

# webapp can connect to "database" hostname
```

### Kubernetes DNS

Kubernetes automatically creates DNS entries for services:

```bash
# Services get DNS names automatically
kubectl create service clusterip my-service --tcp=80:8080

# Other pods can reach: my-service.default.svc.cluster.local
```

### Cloud DNS Services

Cloud providers offer managed DNS with API integration:

```bash
# AWS Route 53 health checks
# Automatically remove unhealthy targets from DNS

# Azure Traffic Manager
# Route traffic based on performance or geography

# Google Cloud DNS
# Integrate with load balancers and auto-scaling
```

## DNS Performance Optimization

DNS performance affects application responsiveness.

### Connection Pooling and DNS

Applications that make many outbound requests should consider DNS caching:

```python
# Python example: cache DNS lookups
import socket
socket.getaddrinfo('api.example.com', 443)  # Cached after first lookup
```

### Prefetching DNS

For web applications, prefetch DNS for external resources:

```html
<!-- Preload DNS for external assets -->
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
<link rel="dns-prefetch" href="//cdn.example.com" />
```

### Monitoring DNS Performance

Monitor DNS resolution time as part of application performance:

```bash
# Simple DNS timing
time nslookup api.example.com

# More detailed timing with dig
dig api.example.com | grep "Query time"
```

## Local DNS Testing

For development, you can override DNS locally:

### /etc/hosts File

Add entries to bypass DNS for testing:

```bash
# Edit /etc/hosts (requires sudo)
sudo vim /etc/hosts

# Add test entries
127.0.0.1 local-api.example.com
10.0.1.100 staging-api.example.com
```

Applications will use these mappings instead of DNS queries.

### Local DNS Servers

Run a local DNS server for development:

```bash
# dnsmasq provides simple local DNS
# Add to /etc/dnsmasq.conf:
address=/dev.example.com/127.0.0.1
address=/test.example.com/10.0.1.100
```

This gives you more flexible local DNS control.

## DNS Monitoring and Alerting

DNS failures can be subtle but devastating. Monitor DNS health proactively:

```bash
# Simple DNS monitoring script
#!/bin/bash
DOMAIN="api.example.com"
IP=$(dig +short $DOMAIN | head -n1)
if [ -z "$IP" ]; then
    echo "DNS resolution failed for $DOMAIN"
    # Send alert
fi
```

Production monitoring should check:

- DNS resolution time
- Record consistency across multiple DNS servers
- TTL compliance
- Certificate renewal for domains

In the next section, we'll explore network security and firewalls - protecting the communication channels that DNS helps establish.

DNS is often invisible when it works correctly, but when it breaks, everything stops working. Invest time in understanding your DNS configuration and monitoring it proactively.

Happy resolving!
