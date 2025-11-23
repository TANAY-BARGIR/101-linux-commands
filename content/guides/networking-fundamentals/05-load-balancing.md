---
title: 'Load Balancing and High Availability'
description: 'Distributing traffic across multiple servers and handling failures gracefully to maintain service reliability.'
order: 5
---

Single points of failure kill applications. When your only web server crashes, everyone gets error pages. When your database goes down, your entire application stops working. Load balancing and high availability techniques distribute traffic and eliminate these single points of failure.

## Prerequisites

- Understanding of networking fundamentals and firewalls
- Access to multiple servers or containers for testing
- Basic web server configuration knowledge

## Why Load Balancing Matters

Let's start with a simple example. You have one web server handling all your traffic:

```
Internet Users                Single Web Server
     │                            │
┌────▼────┐                  ┌────▼────┐
│ User 1  │                  │         │
└─────────┘                  │ nginx   │
┌─────────┐                  │ :80     │
│ User 2  │─────────────────►│         │
└─────────┘                  │ CPU:95% │
┌─────────┐                  │ Memory: │
│ User 3  │                  │ 4GB/4GB │
└─────────┘                  └─────────┘
┌─────────┐                      │
│ User N  │                      ▼
└─────────┘                 ❌ OVERLOADED
```

As traffic grows, this single server becomes overwhelmed. Load balancing solves this by distributing requests across multiple servers:

```
Internet Users            Load Balancer           Backend Servers
     │                        │                        │
┌────▼────┐              ┌────▼────┐              ┌────▼────┐
│ User 1  │              │         │              │ nginx-1 │
└─────────┘              │ nginx   │              │ :8080   │
┌─────────┐              │ LB      │──────────────┤ CPU:30% │
│ User 2  │──────────────┤ :80     │              └─────────┘
└─────────┘              │         │              ┌─────────┐
┌─────────┐              │ Routes  │──────────────│ nginx-2 │
│ User 3  │              │ Traffic │              │ :8080   │
└─────────┘              │ Evenly  │              │ CPU:25% │
┌─────────┐              └─────────┘              └─────────┘
│ User N  │                                       ┌─────────┐
└─────────┘                                       │ nginx-3 │
                                                  │ :8080   │
                                                  │ CPU:35% │
                                                  └─────────┘
```

Check current connections to your server:

```bash
# Check current connections to your server
netstat -an | grep :80 | grep ESTABLISHED | wc -l
```

### Types of Load Balancing

**Layer 4 (Transport Layer)**: Distributes based on IP addresses and ports

```bash
# Client connects to load balancer IP:80
# Load balancer forwards to backend servers
# 192.168.1.10:80 → 10.0.1.100:8080
# 192.168.1.10:80 → 10.0.1.101:8080
```

**Layer 7 (Application Layer)**: Distributes based on content like HTTP headers or URLs

```bash
# Route based on URL path
# /api/* → API servers (10.0.1.100-102)
# /static/* → Static file servers (10.0.2.100-102)
# /* → Web application servers (10.0.1.200-202)
```

## Setting Up Basic Load Balancing

### nginx Load Balancer

nginx makes an excellent HTTP load balancer. Here's a basic configuration:

```nginx
# /etc/nginx/sites-available/load-balancer
upstream backend_servers {
    server 10.0.1.100:8080;
    server 10.0.1.101:8080;
    server 10.0.1.102:8080;
}

server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and test the configuration:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/load-balancer \
           /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Test load balancing
curl -H "Host: app.example.com" http://your-load-balancer
```

### HAProxy Configuration

HAProxy provides more advanced load balancing features:

```bash
# /etc/haproxy/haproxy.cfg
global
    daemon

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend web_frontend
    bind *:80
    default_backend web_servers

backend web_servers
    balance roundrobin
    option httpchk GET /health
    server web1 10.0.1.100:8080 check
    server web2 10.0.1.101:8080 check
    server web3 10.0.1.102:8080 check
```

Start HAProxy and test:

```bash
# Test configuration
sudo haproxy -f /etc/haproxy/haproxy.cfg -c

# Start HAProxy
sudo systemctl start haproxy

# Check status
echo "show stat" | sudo socat stdio /var/lib/haproxy/stats
```

## Load Balancing Algorithms

Different algorithms distribute traffic in different ways:

### Round Robin

Requests go to each server in order:

```nginx
upstream backend {
    server server1.example.com;
    server server2.example.com;
    server server3.example.com;
}
```

Request 1 → server1, Request 2 → server2, Request 3 → server3, Request 4 → server1...

### Weighted Round Robin

Some servers get more traffic:

```nginx
upstream backend {
    server server1.example.com weight=3;
    server server2.example.com weight=2;
    server server3.example.com weight=1;
}
```

Out of 6 requests: 3 to server1, 2 to server2, 1 to server3.

### Least Connections

New requests go to the server with fewest active connections:

```nginx
upstream backend {
    least_conn;
    server server1.example.com;
    server server2.example.com;
    server server3.example.com;
}
```

### IP Hash

Requests from the same IP always go to the same server:

```nginx
upstream backend {
    ip_hash;
    server server1.example.com;
    server server2.example.com;
    server server3.example.com;
}
```

This maintains session affinity without requiring shared session storage.

## Health Checks

Load balancers should only send traffic to healthy servers.

### HTTP Health Checks

Configure health check endpoints in your applications:

```python
# Simple health check endpoint
from flask import Flask, jsonify
import psycopg2

app = Flask(__name__)

@app.route('/health')
def health_check():
    try:
        # Check database connection
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        cursor.close()
        conn.close()

        return jsonify({'status': 'healthy'}), 200
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 503
```

Configure the load balancer to use this endpoint:

```nginx
upstream backend {
    server 10.0.1.100:8080;
    server 10.0.1.101:8080;
    server 10.0.1.102:8080;
}

# nginx doesn't have built-in health checks in the free version
# Use nginx Plus or external monitoring
```

HAProxy has built-in health checking:

```bash
backend web_servers
    option httpchk GET /health
    http-check expect status 200
    server web1 10.0.1.100:8080 check inter 5s
    server web2 10.0.1.101:8080 check inter 5s
    server web3 10.0.1.102:8080 check inter 5s
```

### TCP Health Checks

For non-HTTP services, use TCP health checks:

```bash
backend database_servers
    mode tcp
    option tcp-check
    server db1 10.0.1.200:5432 check port 5432
    server db2 10.0.1.201:5432 check port 5432
```

## SSL Termination

Load balancers can handle SSL encryption, reducing load on backend servers.

### SSL Termination at Load Balancer

```nginx
server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/ssl/certs/app.example.com.crt;
    ssl_certificate_key /etc/ssl/private/app.example.com.key;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

### SSL Pass-Through

Sometimes you want end-to-end encryption:

```nginx
stream {
    upstream backend_ssl {
        server 10.0.1.100:443;
        server 10.0.1.101:443;
    }

    server {
        listen 443;
        proxy_pass backend_ssl;
        proxy_ssl on;
    }
}
```

## Database High Availability

Databases require special consideration for high availability.

### Read Replicas

Distribute read queries across multiple database replicas:

```python
# Database connection routing
import random

WRITE_DB = "postgresql://user:pass@primary-db:5432/app"
READ_DBS = [
    "postgresql://user:pass@replica1-db:5432/app",
    "postgresql://user:pass@replica2-db:5432/app",
    "postgresql://user:pass@replica3-db:5432/app"
]

def get_db_connection(read_only=False):
    if read_only:
        return random.choice(READ_DBS)
    else:
        return WRITE_DB
```

### Primary/Secondary Failover

Implement automatic failover for database writes:

```bash
# PostgreSQL streaming replication setup
# Primary server: postgresql.conf
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64

# Secondary server: recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=primary-db port=5432 user=replicator'
```

Use tools like Patroni for automatic failover:

```yaml
# patroni.yml
scope: postgres-cluster
name: postgres-node1

restapi:
  listen: 0.0.0.0:8008
  connect_address: 10.0.1.100:8008

postgresql:
  listen: 0.0.0.0:5432
  connect_address: 10.0.1.100:5432
  data_dir: /var/lib/postgresql/data

bootstrap:
  dcs:
    postgresql:
      parameters:
        wal_level: replica
        hot_standby: 'on'
        max_wal_senders: 5
```

## Container Load Balancing

Container environments have their own load balancing considerations.

### Docker Swarm Load Balancing

Docker Swarm provides built-in load balancing:

```bash
# Create a service with multiple replicas
docker service create --name web-service \
  --replicas 3 \
  --publish 80:8080 \
  nginx

# Swarm automatically load balances between replicas
curl http://swarm-manager-ip
```

### Kubernetes Services

Kubernetes Services provide load balancing for pods:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 8080
  type: LoadBalancer

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx
          ports:
            - containerPort: 8080
```

Deploy and test:

```bash
# Apply configuration
kubectl apply -f web-service.yaml

# Check service status
kubectl get services

# Test load balancing
kubectl get endpoints web-service
```

## Global Load Balancing

For applications with users worldwide, distribute traffic geographically.

### DNS-Based Global Load Balancing

Use DNS to route users to the nearest datacenter:

```bash
# Route53 geolocation routing example
app.example.com A 54.230.1.1    # US East
app.example.com A 54.230.2.1    # US West
app.example.com A 54.230.3.1    # Europe
app.example.com A 54.230.4.1    # Asia
```

### CDN Load Balancing

Content Delivery Networks provide global load balancing:

```bash
# CloudFlare configuration
# Users connect to nearest edge location
# Edge locations route to healthy origin servers
```

## Monitoring Load Balancer Performance

Track key metrics to ensure your load balancing is working effectively.

### nginx Monitoring

Enable nginx status module:

```nginx
server {
    listen 8080;
    server_name localhost;

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

Check status:

```bash
curl http://localhost:8080/nginx_status
```

### HAProxy Statistics

Enable HAProxy stats page:

```bash
# Add to haproxy.cfg
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 5s
    stats admin if TRUE
```

View statistics at `http://your-server:8404/stats`

### Application Metrics

Monitor application-level metrics:

```python
# Track requests per backend server
import time
from collections import defaultdict

request_counts = defaultdict(int)
response_times = defaultdict(list)

def track_request(server, response_time):
    request_counts[server] += 1
    response_times[server].append(response_time)

def get_stats():
    return {
        'request_counts': dict(request_counts),
        'avg_response_times': {
            server: sum(times) / len(times)
            for server, times in response_times.items()
        }
    }
```

## Troubleshooting Load Balancer Issues

### Uneven Traffic Distribution

Check if requests are being distributed evenly:

```bash
# Monitor backend server logs
tail -f /var/log/nginx/access.log | grep "backend_server_ip"

# Check connection counts per server
netstat -an | grep :8080 | grep ESTABLISHED | wc -l
```

### Session Persistence Problems

If users get logged out randomly, session data might not be shared:

```bash
# Solution 1: Use sticky sessions (ip_hash)
upstream backend {
    ip_hash;
    server server1.example.com;
    server server2.example.com;
}

# Solution 2: Use shared session storage
# Configure Redis for session storage
```

### Health Check Failures

If healthy servers are marked as down:

```bash
# Check health check endpoint manually
curl -I http://backend-server:8080/health

# Review health check configuration
# Ensure timeouts are appropriate for your application
```

## Disaster Recovery Planning

High availability extends beyond load balancing to complete disaster recovery.

### Multi-Region Deployment

Deploy applications across multiple geographic regions:

```bash
# Primary region: us-east-1
# Secondary region: us-west-2
# Tertiary region: eu-west-1

# DNS failover routes traffic to healthy regions
```

### Data Replication

Ensure data is replicated across regions:

```bash
# Database replication
# File storage replication
# Configuration management
```

### Automated Failover

Implement automated failover procedures:

```bash
#!/bin/bash
# Simple failover script
PRIMARY_HEALTH_URL="http://primary.example.com/health"
SECONDARY_HEALTH_URL="http://secondary.example.com/health"

if ! curl -f $PRIMARY_HEALTH_URL; then
    echo "Primary unhealthy, switching DNS to secondary"
    # Update DNS records to point to secondary
    aws route53 change-resource-record-sets --hosted-zone-id Z123 --change-batch file://failover.json
fi
```

In the next section, we'll explore container networking - how Docker and Kubernetes handle load balancing and service discovery in containerized environments.

Load balancing is about more than just distributing traffic. It's about creating resilient systems that gracefully handle failures and provide consistent performance for your users.

Happy load balancing!
