---
title: 'Network Automation'
description: 'Automating network configuration, deployment, and management using infrastructure as code and configuration management tools.'
order: 9
---

Manual network configuration doesn't scale. As your infrastructure grows, automating network setup, monitoring, and maintenance becomes essential for consistency, reliability, and efficiency. This section shows you how to treat network configuration as code.

## Prerequisites

- Understanding of networking concepts from previous sections
- Basic familiarity with YAML, JSON, or similar configuration formats
- Experience with command-line tools and scripting

## Infrastructure as Code for Networking

Network infrastructure should be version-controlled, repeatable, and testable like application code.

### Terraform for Network Infrastructure

Terraform lets you define network infrastructure declaratively:

```hcl
# main.tf - AWS VPC with subnets
provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
    Type = "private"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

resource "aws_nat_gateway" "main" {
  count         = length(aws_subnet.public)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"
  }
}

resource "aws_eip" "nat" {
  count  = length(aws_subnet.public)
  domain = "vpc"

  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  }
}
```

Define variables for flexibility:

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}
```

Deploy the infrastructure:

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var="project_name=ecommerce" -var="environment=production"

# Apply the configuration
terraform apply -var="project_name=ecommerce" -var="environment=production"

# View the created resources
terraform show
```

### Security Groups as Code

Define security groups with explicit rules:

```hcl
# security-groups.tf
resource "aws_security_group" "web" {
  name        = "${var.project_name}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "SSH from bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}

resource "aws_security_group" "database" {
  name        = "${var.project_name}-db-sg"
  description = "Security group for database servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from app servers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-db-sg"
  }
}
```

## Configuration Management with Ansible

Ansible automates server configuration, including network settings.

### Network Configuration Playbook

```yaml
# network-setup.yml
---
- name: Configure network settings
  hosts: all
  become: yes
  vars:
    dns_servers:
      - 8.8.8.8
      - 8.8.4.4
    ntp_servers:
      - pool.ntp.org
      - time.google.com

  tasks:
    - name: Configure DNS resolution
      template:
        src: resolv.conf.j2
        dest: /etc/resolv.conf
        backup: yes
      notify: restart networking

    - name: Install network monitoring tools
      package:
        name:
          - netstat-nat
          - tcpdump
          - nmap
          - iftop
        state: present

    - name: Configure firewall rules
      ufw:
        rule: '{{ item.rule }}'
        port: '{{ item.port }}'
        proto: '{{ item.proto }}'
        src: '{{ item.src | default(omit) }}'
      loop:
        - { rule: allow, port: 22, proto: tcp, src: '10.0.0.0/8' }
        - { rule: allow, port: 80, proto: tcp }
        - { rule: allow, port: 443, proto: tcp }
        - { rule: deny, port: 22, proto: tcp }
      notify: reload firewall

    - name: Enable firewall
      ufw:
        state: enabled
        policy: deny
        direction: incoming

  handlers:
    - name: restart networking
      service:
        name: networking
        state: restarted

    - name: reload firewall
      ufw:
        state: reloaded
```

Template for DNS configuration:

```jinja2
# templates/resolv.conf.j2
# Generated by Ansible
{% for server in dns_servers %}
nameserver {{ server }}
{% endfor %}

search {{ ansible_domain | default('local') }}
options timeout:2 attempts:3
```

Run the playbook:

```bash
# Run against all hosts
ansible-playbook -i inventory network-setup.yml

# Run against specific group
ansible-playbook -i inventory network-setup.yml --limit webservers

# Check what would change without applying
ansible-playbook -i inventory network-setup.yml --check --diff
```

### Load Balancer Configuration

Automate load balancer setup:

```yaml
# load-balancer.yml
---
- name: Configure nginx load balancer
  hosts: load_balancers
  become: yes
  vars:
    backend_servers:
      - { name: web1, address: '10.0.1.10:8080' }
      - { name: web2, address: '10.0.1.11:8080' }
      - { name: web3, address: '10.0.1.12:8080' }

  tasks:
    - name: Install nginx
      package:
        name: nginx
        state: present

    - name: Generate nginx configuration
      template:
        src: nginx-lb.conf.j2
        dest: /etc/nginx/sites-available/load-balancer
      notify: reload nginx

    - name: Enable load balancer site
      file:
        src: /etc/nginx/sites-available/load-balancer
        dest: /etc/nginx/sites-enabled/load-balancer
        state: link
      notify: reload nginx

    - name: Remove default site
      file:
        path: /etc/nginx/sites-enabled/default
        state: absent
      notify: reload nginx

    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: yes

  handlers:
    - name: reload nginx
      service:
        name: nginx
        state: reloaded
```

nginx configuration template:

```jinja2
# templates/nginx-lb.conf.j2
upstream backend_servers {
{% for server in backend_servers %}
    server {{ server.address }};
{% endfor %}
}

server {
    listen 80;
    server_name {{ inventory_hostname }};

    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Health check
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }

    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
    }
}
```

## Container Network Automation

Automate container networking setup and management.

### Docker Compose Network Configuration

```yaml
# docker-compose.yml - Multi-tier application
version: '3.8'

networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.1.0/24
  backend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.2.0/24
  database:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.3.0/24

services:
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    networks:
      - frontend
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api

  api:
    build: ./api
    networks:
      - frontend
      - backend
    environment:
      - DATABASE_URL=postgresql://user:pass@database:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      - database
      - cache

  database:
    image: postgres:13
    networks:
      - database
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  cache:
    image: redis:6-alpine
    networks:
      - backend
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Network Policies as Code

```yaml
# k8s-network-policies.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress

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

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-api-to-database
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: database
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: api
      ports:
        - protocol: TCP
          port: 5432

---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to: []
      ports:
        - protocol: UDP
          port: 53
```

Apply network policies:

```bash
# Apply all network policies
kubectl apply -f k8s-network-policies.yml

# Verify policies are active
kubectl get networkpolicies -n production

# Test connectivity between pods
kubectl exec -it web-pod -- curl api-service:8080/health
```

## Automated Network Monitoring

Set up monitoring that scales with your infrastructure.

### Prometheus Network Monitoring Stack

```yaml
# prometheus-stack.yml
version: '3.8'

networks:
  monitoring:
    driver: bridge

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    networks:
      - monitoring
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    networks:
      - monitoring
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - '9100:9100'
    networks:
      - monitoring
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

  blackbox-exporter:
    image: prom/blackbox-exporter:latest
    ports:
      - '9115:9115'
    networks:
      - monitoring
    volumes:
      - ./blackbox.yml:/config/blackbox.yml
    command:
      - '--config.file=/config/blackbox.yml'

volumes:
  prometheus_data:
  grafana_data:
```

Prometheus configuration for network monitoring:

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'network-alerts.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'blackbox'
    metrics_path: /probe
    params:
      module: [http_2xx]
    static_configs:
      - targets:
          - https://api.example.com
          - https://app.example.com
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: blackbox-exporter:9115
```

Network alerting rules:

```yaml
# network-alerts.yml
groups:
  - name: network-alerts
    rules:
      - alert: HighNetworkLatency
        expr: probe_duration_seconds > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High network latency detected'
          description: '{{ $labels.instance }} has latency of {{ $value }}s'

      - alert: ServiceDown
        expr: probe_success == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Service is down'
          description: '{{ $labels.instance }} is not responding'

      - alert: HighNetworkErrors
        expr: rate(node_network_receive_errs_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High network error rate'
          description: '{{ $labels.device }} has {{ $value }} errors/sec'
```

## Automated Network Testing

Include network testing in your CI/CD pipeline.

### Network Connectivity Tests

```bash
#!/bin/bash
# network-tests.sh - Run in CI pipeline

set -e

echo "Running network connectivity tests..."

# Test internal service connectivity
test_internal_connectivity() {
    local service=$1
    local port=$2

    echo "Testing connectivity to $service:$port"
    if nc -zv $service $port 2>/dev/null; then
        echo "✓ $service:$port is reachable"
    else
        echo "✗ $service:$port is not reachable"
        exit 1
    fi
}

# Test external service connectivity
test_external_connectivity() {
    local url=$1
    local expected_status=$2

    echo "Testing HTTP connectivity to $url"
    status=$(curl -s -o /dev/null -w "%{http_code}" $url)

    if [ "$status" -eq "$expected_status" ]; then
        echo "✓ $url returned $status"
    else
        echo "✗ $url returned $status, expected $expected_status"
        exit 1
    fi
}

# Test DNS resolution
test_dns_resolution() {
    local hostname=$1

    echo "Testing DNS resolution for $hostname"
    if nslookup $hostname > /dev/null 2>&1; then
        echo "✓ $hostname resolves correctly"
    else
        echo "✗ $hostname DNS resolution failed"
        exit 1
    fi
}

# Run tests
test_internal_connectivity "database" "5432"
test_internal_connectivity "redis" "6379"
test_external_connectivity "https://api.example.com/health" "200"
test_dns_resolution "api.example.com"

echo "All network tests passed!"
```

### Performance Testing

```python
#!/usr/bin/env python3
# network-performance-test.py

import requests
import time
import statistics
import sys

def test_response_time(url, iterations=10):
    """Test HTTP response time"""
    times = []

    for i in range(iterations):
        start_time = time.time()
        try:
            response = requests.get(url, timeout=10)
            end_time = time.time()

            if response.status_code == 200:
                times.append(end_time - start_time)
            else:
                print(f"HTTP {response.status_code} for {url}")

        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")

    if times:
        avg_time = statistics.mean(times)
        max_time = max(times)
        min_time = min(times)

        print(f"URL: {url}")
        print(f"Average response time: {avg_time:.3f}s")
        print(f"Min response time: {min_time:.3f}s")
        print(f"Max response time: {max_time:.3f}s")

        # Alert if average response time is too high
        if avg_time > 1.0:
            print(f"⚠️  High response time: {avg_time:.3f}s")
            return False

        return True
    else:
        print(f"No successful requests to {url}")
        return False

def main():
    urls = [
        "https://api.example.com/health",
        "https://app.example.com",
        "https://cdn.example.com/status"
    ]

    all_passed = True

    for url in urls:
        if not test_response_time(url):
            all_passed = False

    if not all_passed:
        sys.exit(1)

    print("All performance tests passed!")

if __name__ == "__main__":
    main()
```

## GitOps for Network Configuration

Manage network configurations through Git workflows.

### Network Configuration Repository Structure

```
network-configs/
├── environments/
│   ├── dev/
│   │   ├── terraform/
│   │   ├── ansible/
│   │   └── kubernetes/
│   ├── staging/
│   └── production/
├── modules/
│   ├── vpc/
│   ├── security-groups/
│   └── load-balancer/
├── scripts/
│   ├── deploy.sh
│   └── test.sh
└── .github/
    └── workflows/
        ├── plan.yml
        ├── apply.yml
        └── test.yml
```

GitHub Actions workflow for network changes:

```yaml
# .github/workflows/network-deploy.yml
name: Network Infrastructure Deploy

on:
  push:
    branches: [main]
    paths: ['environments/production/**']
  pull_request:
    branches: [main]
    paths: ['environments/production/**']

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.3.0

      - name: Terraform Init
        run: |
          cd environments/production/terraform
          terraform init

      - name: Terraform Plan
        run: |
          cd environments/production/terraform
          terraform plan -out=tfplan

      - name: Save Plan
        uses: actions/upload-artifact@v3
        with:
          name: terraform-plan
          path: environments/production/terraform/tfplan

  test:
    runs-on: ubuntu-latest
    needs: plan
    steps:
      - uses: actions/checkout@v3

      - name: Run Network Tests
        run: |
          chmod +x scripts/test.sh
          ./scripts/test.sh

  apply:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: [plan, test]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Download Plan
        uses: actions/download-artifact@v3
        with:
          name: terraform-plan
          path: environments/production/terraform/

      - name: Terraform Apply
        run: |
          cd environments/production/terraform
          terraform init
          terraform apply tfplan
```

## Network Automation Best Practices

### Version Control Everything

Store all network configurations in version control:

```bash
# Network configuration repository
git init network-configs
cd network-configs

# Create directory structure
mkdir -p {environments/{dev,staging,prod},modules/{vpc,security,lb},scripts,docs}

# Track all configuration files
git add .
git commit -m "Initial network configuration structure"

# Use branches for changes
git checkout -b feature/add-monitoring-subnet
# Make changes...
git add .
git commit -m "Add dedicated monitoring subnet"
git push -u origin feature/add-monitoring-subnet
```

### Test Before Applying

Always test network changes:

```bash
# Terraform plan before apply
terraform plan -out=network-plan

# Review the plan
terraform show network-plan

# Apply only after review
terraform apply network-plan
```

### Implement Rollback Procedures

Prepare for when things go wrong:

```bash
#!/bin/bash
# rollback.sh - Emergency rollback script

echo "Rolling back network changes..."

# Revert to previous Terraform state
terraform state pull > current-state.json
terraform state push previous-state.json

# Revert firewall rules
ufw --force reset
ansible-playbook -i inventory firewall-rollback.yml

echo "Rollback complete. Check connectivity."
```

In the final section, we'll explore advanced networking concepts including service meshes, network policies, and emerging networking patterns in modern infrastructure.

Network automation reduces human error, improves consistency, and enables rapid, reliable deployments. Start by automating your most common network tasks, then gradually expand to full infrastructure as code.

Happy automating!
