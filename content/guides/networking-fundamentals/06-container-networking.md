---
title: 'Container Networking'
description: 'Understanding how Docker and Kubernetes handle networking, service discovery, and inter-container communication.'
order: 6
---

Containers revolutionized how we deploy applications, but they also introduced new networking complexities. Understanding container networking helps you troubleshoot connectivity issues, optimize performance, and design secure multi-container applications.

## Prerequisites

- Docker installed and running
- Basic understanding of containers and their lifecycle
- Knowledge of networking fundamentals from previous sections

## Docker Networking Basics

When you run a container, Docker automatically handles networking. But what's actually happening behind the scenes?

```
Host Machine (192.168.1.100)
│
├── Docker Bridge Network (172.17.0.0/16)
│   │
│   ├── Container 1 (nginx)
│   │   ├── IP: 172.17.0.2
│   │   └── Port: 80 → Host:8080
│   │
│   ├── Container 2 (api)
│   │   ├── IP: 172.17.0.3
│   │   └── Port: 3000 (internal only)
│   │
│   └── Container 3 (db)
│       ├── IP: 172.17.0.4
│       └── Port: 5432 (internal only)
│
└── Host Network Interface
    ├── eth0: 192.168.1.100
    └── docker0: 172.17.0.1 (bridge)

Communication Flow:
Internet → Host:8080 → docker0 → nginx:80
nginx:80 → api:3000 (direct container communication)
api:3000 → db:5432 (direct container communication)
```

Let's examine Docker's default network setup:

```bash
# List Docker networks
docker network ls

# Inspect the default bridge network
docker network inspect bridge
```

You'll see output showing the bridge network with a subnet like `172.17.0.0/16`. This is Docker's default network where containers communicate.

### Docker Network Types

**Bridge Network (Default)**: Containers on the same host can communicate

```bash
# Run containers on default bridge network
docker run -d --name web nginx
docker run -d --name api node:alpine sleep 3600

# Check their IP addresses
docker inspect web | grep IPAddress
docker inspect api | grep IPAddress
```

**Host Network**: Container uses the host's network directly

```bash
# Container uses host networking
docker run -d --network host --name host-web nginx

# This container is accessible on the host's IP address
```

**None Network**: Container has no network access

```bash
# Isolated container with no networking
docker run -d --network none --name isolated alpine sleep 3600
```

## Custom Docker Networks

The default bridge network has limitations. Custom networks provide better isolation and features:

```bash
# Create a custom bridge network
docker network create --driver bridge ecommerce-network

# Inspect the new network
docker network inspect ecommerce-network
```

Run containers on your custom network:

```bash
# Run containers on the custom network
docker run -d --network ecommerce-network --name frontend nginx
docker run -d --network ecommerce-network --name backend node:alpine sleep 3600
docker run -d --network ecommerce-network --name database postgres:13

# Test connectivity between containers
docker exec frontend ping backend
docker exec backend ping database
```

### Container Name Resolution

Containers on custom networks can reach each other by name:

```bash
# From inside the frontend container
docker exec -it frontend sh
# ping backend    # This works!
# ping database   # This also works!
```

This automatic DNS resolution doesn't work on the default bridge network - you'd need to use IP addresses or container linking.

## Multi-Container Applications

Real applications typically involve multiple containers working together.

### Docker Compose Networking

Docker Compose automatically creates a network for your application:

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    image: nginx
    ports:
      - '80:80'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api

  api:
    image: node:alpine
    command: node server.js
    volumes:
      - ./api:/app
    working_dir: /app
    environment:
      - DATABASE_URL=postgresql://user:pass@database:5432/app
    depends_on:
      - database

  database:
    image: postgres:13
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start the application:

```bash
# Start all services
docker-compose up -d

# Check the network Docker Compose created
docker network ls
docker network inspect $(basename $(pwd))_default
```

### Service Discovery in Compose

Services can reach each other using service names:

```javascript
// api/server.js - connecting to database
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://user:pass@database:5432/app',
  // Note: 'database' resolves to the database container
});
```

## Port Mapping and Exposure

Containers run in isolated networks. To access them from outside, you need to map ports:

```bash
# Map container port 8080 to host port 3000
docker run -d -p 3000:8080 --name api-server node:alpine

# Map to specific host interface
docker run -d -p 127.0.0.1:3000:8080 --name local-api node:alpine

# Map to random host port
docker run -d -P --name random-ports nginx
```

Check which ports are mapped:

```bash
# Show port mappings
docker port api-server

# See all container details including ports
docker ps
```

### Internal vs External Communication

Design your port strategy carefully:

```bash
# External services (accessible from outside)
docker run -d -p 80:80 --name web nginx        # Web server
docker run -d -p 443:443 --name web-ssl nginx  # HTTPS

# Internal services (no port mapping needed)
docker run -d --name database postgres         # Database
docker run -d --name cache redis               # Cache
docker run -d --name queue rabbitmq            # Message queue
```

Internal services communicate through the Docker network without exposing ports to the host.

## Kubernetes Networking

Kubernetes networking is more complex but provides powerful features for container orchestration.

### Pod Networking

In Kubernetes, the smallest unit is a pod, which can contain multiple containers:

```yaml
# pod-example.yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-pod
  labels:
    app: web
spec:
  containers:
    - name: nginx
      image: nginx
      ports:
        - containerPort: 80
    - name: app
      image: node:alpine
      command: ['node', 'server.js']
      ports:
        - containerPort: 3000
```

Containers in the same pod share the same network interface:

```bash
# Deploy the pod
kubectl apply -f pod-example.yaml

# Get pod IP address
kubectl get pod web-pod -o wide

# Containers in the pod can reach each other via localhost
kubectl exec web-pod -c nginx -- curl localhost:3000
```

### Services for Load Balancing

Kubernetes Services provide load balancing and service discovery:

```yaml
# service-example.yaml
apiVersion: v1
kind: Service
metadata:
  name: web-service
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP

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
        - name: nginx
          image: nginx
          ports:
            - containerPort: 80
```

Deploy and test the service:

```bash
# Deploy the service and deployment
kubectl apply -f service-example.yaml

# Check service endpoints
kubectl get endpoints web-service

# Test service from another pod
kubectl run test-pod --image=busybox --rm -it -- sh
# wget -qO- http://web-service
```

### Service Types

**ClusterIP**: Internal service only

```yaml
spec:
  type: ClusterIP # Default, accessible only within cluster
  ports:
    - port: 80
      targetPort: 8080
```

**NodePort**: Accessible from outside the cluster

```yaml
spec:
  type: NodePort
  ports:
    - port: 80
      targetPort: 8080
      nodePort: 30080 # Accessible on any node's IP:30080
```

**LoadBalancer**: Cloud provider creates external load balancer

```yaml
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8080
  # Cloud provider creates external load balancer
```

## Network Policies

Kubernetes allows fine-grained network security policies:

```yaml
# network-policy-example.yaml
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

Apply network policies:

```bash
# Apply policies
kubectl apply -f network-policy-example.yaml

# Verify policies are active
kubectl get networkpolicies -n production
```

## Service Mesh Networking

For complex microservice architectures, service meshes provide advanced networking features.

### Istio Service Mesh

Istio adds a sidecar proxy to each pod for advanced traffic management:

```yaml
# istio-example.yaml
apiVersion: v1
kind: Service
metadata:
  name: productpage
spec:
  ports:
    - port: 9080
      name: http
  selector:
    app: productpage

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: productpage-v1
spec:
  replicas: 1
  selector:
    matchLabels:
      app: productpage
      version: v1
  template:
    metadata:
      labels:
        app: productpage
        version: v1
      annotations:
        sidecar.istio.io/inject: 'true' # Enable Istio sidecar
    spec:
      containers:
        - name: productpage
          image: istio/examples-bookinfo-productpage-v1:1.16.2
          ports:
            - containerPort: 9080
```

### Traffic Routing with Istio

Control traffic flow between service versions:

```yaml
# virtual-service-example.yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: productpage
spec:
  http:
    - match:
        - headers:
            canary:
              exact: 'true'
      route:
        - destination:
            host: productpage
            subset: v2
          weight: 100
    - route:
        - destination:
            host: productpage
            subset: v1
          weight: 90
        - destination:
            host: productpage
            subset: v2
          weight: 10

---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: productpage
spec:
  host: productpage
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

## Container Network Troubleshooting

When container networking doesn't work, systematic troubleshooting helps identify the issue.

### Docker Network Debugging

Check container connectivity:

```bash
# Inspect container network settings
docker inspect container-name | grep -A 20 NetworkSettings

# Test connectivity between containers
docker exec container1 ping container2

# Check if ports are listening
docker exec container-name netstat -tuln

# View container logs for network errors
docker logs container-name
```

### Kubernetes Network Debugging

Debug pod networking issues:

```bash
# Check pod network configuration
kubectl describe pod pod-name

# Get detailed network information
kubectl get pod pod-name -o yaml | grep -A 10 status

# Test connectivity from within a pod
kubectl exec -it pod-name -- nslookup service-name
kubectl exec -it pod-name -- wget -qO- http://service-name

# Check service endpoints
kubectl get endpoints service-name
```

### DNS Resolution Issues

Container DNS problems are common:

```bash
# Test DNS resolution in Docker
docker exec container-name nslookup google.com

# Test DNS in Kubernetes
kubectl exec -it pod-name -- nslookup kubernetes.default

# Check DNS configuration
kubectl get configmap coredns -n kube-system -o yaml
```

## Performance Optimization

Container networking can impact application performance.

### Network Namespace Overhead

Each container has its own network namespace, which adds some overhead:

```bash
# Compare performance with and without network namespace
# Host networking (less overhead)
docker run --network host --rm nginx

# Bridge networking (more overhead but better isolation)
docker run --rm nginx
```

### Connection Pooling

Containers that make many network requests should use connection pooling:

```javascript
// Node.js example with connection pooling
const http = require('http');

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
});

const options = {
  hostname: 'api-service',
  port: 8080,
  path: '/data',
  agent: agent,
};
```

### Network Policies Impact

Network policies add processing overhead:

```bash
# Monitor network policy performance
kubectl top nodes
kubectl describe node node-name | grep -A 5 "System Info"
```

Excessive network policies can slow down pod-to-pod communication.

## Multi-Cluster Networking

Large organizations often run multiple Kubernetes clusters.

### Cluster Federation

Connect multiple clusters for failover and load distribution:

```yaml
# cluster-federation-example.yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: cross-cluster-gateway
spec:
  selector:
    istio: eastwestgateway
  servers:
    - port:
        number: 15443
        name: tls
        protocol: TLS
      tls:
        mode: ISTIO_MUTUAL
      hosts:
        - '*.local'
```

### Service Mirroring

Mirror traffic between clusters for testing:

```yaml
# traffic-mirroring-example.yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: mirror-traffic
spec:
  http:
    - match:
        - uri:
            prefix: '/api'
      route:
        - destination:
            host: api-service
      mirror:
        host: api-service.test-cluster.local
      mirrorPercentage:
        value: 10.0
```

In the next section, we'll explore cloud networking - how major cloud providers handle networking at scale and integrate with container platforms.

Container networking abstracts away many networking complexities, but understanding the underlying mechanisms helps you design better applications and troubleshoot issues effectively.

Happy containerizing!
