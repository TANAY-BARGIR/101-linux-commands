---
title: 'Working with Inventory'
description: 'Learn to organize and manage multiple servers using Ansible inventory files, groups, and host-specific configurations.'
order: 4
---

As your infrastructure grows, manually listing servers in ad-hoc commands becomes impractical. Ansible's inventory system provides a structured way to organize hosts, define groups, and manage different environments. You'll learn to create flexible inventory configurations that scale from a few servers to hundreds.

## Understanding Inventory Structure

Inventory files define which servers Ansible manages and how to connect to them. You can organize hosts into logical groups, set connection parameters, and define variables that apply to specific hosts or groups.

### Basic Inventory Formats

Ansible supports both INI and YAML inventory formats. Let's start with INI format since it's more commonly used:

```ini
# Basic inventory.ini
[webservers]
web1.example.com
web2.example.com
web3.example.com

[databases]
db1.example.com
db2.example.com

[monitoring]
monitor.example.com
```

This creates three groups: `webservers`, `databases`, and `monitoring`. Each group contains one or more hosts.

### Adding Connection Details

Real servers need connection information. Add these details to your inventory:

```ini
[webservers]
web1 ansible_host=192.168.1.10 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/web_key
web2 ansible_host=192.168.1.11 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/web_key
web3 ansible_host=192.168.1.12 ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/web_key

[databases]
db-primary ansible_host=192.168.1.20 ansible_user=postgres ansible_port=2222
db-replica ansible_host=192.168.1.21 ansible_user=postgres ansible_port=2222

[loadbalancers]
lb1 ansible_host=10.0.1.5 ansible_user=admin
```

Here's what these parameters do:

- `ansible_host`: The actual IP address or hostname to connect to
- `ansible_user`: SSH username for connections
- `ansible_ssh_private_key_file`: Path to SSH private key
- `ansible_port`: SSH port (default is 22)

Using aliases (like `web1`, `db-primary`) makes your playbooks more readable than using IP addresses directly.

## Group Variables and Host Variables

Rather than repeating connection details, use variables to set common parameters for groups or individual hosts.

### Group Variables

Create a `group_vars` directory and add YAML files named after your groups:

```bash
mkdir -p group_vars
```

Create `group_vars/webservers.yml`:

```yaml
---
ansible_user: ubuntu
ansible_ssh_private_key_file: ~/.ssh/web_servers_key
web_port: 80
nginx_worker_processes: 2
ssl_enabled: false
```

Create `group_vars/databases.yml`:

```yaml
---
ansible_user: postgres
ansible_port: 2222
db_port: 5432
max_connections: 100
shared_buffers: 256MB
```

Now your inventory becomes much cleaner:

```ini
[webservers]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11
web3 ansible_host=192.168.1.12

[databases]
db-primary ansible_host=192.168.1.20
db-replica ansible_host=192.168.1.21
```

### Host Variables

For host-specific settings, create a `host_vars` directory:

```bash
mkdir -p host_vars
```

Create `host_vars/db-primary.yml`:

```yaml
---
db_role: primary
backup_enabled: true
replication_user: replicator
```

Create `host_vars/db-replica.yml`:

```yaml
---
db_role: replica
backup_enabled: false
primary_host: db-primary
```

These variables are automatically available in playbooks when targeting the specific hosts.

## Creating Group Hierarchies

Groups can contain other groups, creating hierarchies that make management easier.

### Parent and Child Groups

```ini
[webservers]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11

[api_servers]
api1 ansible_host=192.168.1.15
api2 ansible_host=192.168.1.16

[databases]
db1 ansible_host=192.168.1.20
db2 ansible_host=192.168.1.21

# Create parent groups
[frontend:children]
webservers

[backend:children]
api_servers
databases

[production:children]
frontend
backend
```

Now you can target different levels:

- `ansible all -m ping`: All hosts
- `ansible frontend -m shell -a "uptime"`: Just web servers
- `ansible backend -m shell -a "df -h"`: API servers and databases
- `ansible production -m setup`: Everything in production

### Environment Separation

Organize different environments using group hierarchies:

```ini
[web-prod]
web-prod-1 ansible_host=10.0.1.10
web-prod-2 ansible_host=10.0.1.11

[web-staging]
web-staging-1 ansible_host=10.0.2.10

[web-dev]
web-dev-1 ansible_host=192.168.1.10

[db-prod]
db-prod-primary ansible_host=10.0.1.20
db-prod-replica ansible_host=10.0.1.21

[db-staging]
db-staging-1 ansible_host=10.0.2.20

# Environment groupings
[production:children]
web-prod
db-prod

[staging:children]
web-staging
db-staging

[development:children]
web-dev
```

Create corresponding variable files for each environment in `group_vars/`:

`group_vars/production.yml`:

```yaml
---
environment: production
log_level: warn
debug_mode: false
ssl_required: true
backup_retention_days: 30
```

`group_vars/staging.yml`:

```yaml
---
environment: staging
log_level: info
debug_mode: true
ssl_required: false
backup_retention_days: 7
```

## Dynamic Ranges and Patterns

For large numbers of similar hosts, use patterns to avoid repetitive definitions:

```ini
[webservers]
web[01:05].prod.example.com

[databases]
db[a:c].prod.example.com ansible_user=postgres

[workers]
worker-[001:100].example.com
```

This creates:

- `web01.prod.example.com` through `web05.prod.example.com`
- `dba.prod.example.com`, `dbb.prod.example.com`, `dbc.prod.example.com`
- `worker-001.example.com` through `worker-100.example.com`

## Advanced Inventory Techniques

### Multiple Inventory Files

Split large inventories across multiple files for better organization:

```bash
inventories/
├── production/
│   ├── hosts.ini
│   └── group_vars/
│       ├── webservers.yml
│       └── databases.yml
└── staging/
    ├── hosts.ini
    └── group_vars/
        ├── webservers.yml
        └── databases.yml
```

Specify the inventory directory when running playbooks:

```bash
ansible-playbook -i inventories/production/ web-setup.yml
ansible-playbook -i inventories/staging/ web-setup.yml
```

### Using YAML Inventory Format

For complex inventories, YAML format offers more flexibility:

```yaml
# inventory.yml
all:
  children:
    webservers:
      hosts:
        web1:
          ansible_host: 192.168.1.10
          nginx_worker_processes: 4
        web2:
          ansible_host: 192.168.1.11
          nginx_worker_processes: 2
      vars:
        ansible_user: ubuntu
        web_port: 80

    databases:
      hosts:
        db-primary:
          ansible_host: 192.168.1.20
          db_role: primary
        db-replica:
          ansible_host: 192.168.1.21
          db_role: replica
      vars:
        ansible_user: postgres
        db_port: 5432

    production:
      children:
        webservers:
        databases:
      vars:
        environment: prod
        ssl_enabled: true
```

### Local Connections

For tasks that run on your control machine, add it to inventory:

```ini
[control]
localhost ansible_connection=local

[webservers]
web1 ansible_host=192.168.1.10
web2 ansible_host=192.168.1.11
```

This lets you run tasks locally (like generating configuration files) as part of your playbooks:

```yaml
- name: Generate deployment report
  hosts: control
  tasks:
    - name: Create deployment summary
      copy:
        content: |
          Deployment completed at {{ ansible_date_time.iso8601 }}
          Hosts updated: {{ groups['webservers'] | length }}
        dest: ./deployment-report.txt
```

## Testing Your Inventory

Before running playbooks, verify your inventory configuration:

```bash
# List all hosts
ansible-inventory --list

# List hosts in specific group
ansible-inventory --list --limit webservers

# Show host variables
ansible-inventory --host web1

# Graph group relationships
ansible-inventory --graph
```

Test connectivity to different groups:

```bash
# Test all hosts
ansible all -m ping

# Test specific environment
ansible production -m ping

# Test specific group
ansible webservers -m ping
```

## Practical Example: Multi-Environment Setup

Here's a complete example showing how to structure inventory for multiple environments:

```ini
# inventories/production/hosts.ini
[web-servers]
web-prod-1 ansible_host=10.0.1.10
web-prod-2 ansible_host=10.0.1.11
web-prod-3 ansible_host=10.0.1.12

[api-servers]
api-prod-1 ansible_host=10.0.1.15
api-prod-2 ansible_host=10.0.1.16

[db-servers]
db-prod-primary ansible_host=10.0.1.20
db-prod-replica1 ansible_host=10.0.1.21
db-prod-replica2 ansible_host=10.0.1.22

[load-balancers]
lb-prod-1 ansible_host=10.0.1.5
lb-prod-2 ansible_host=10.0.1.6

[frontend:children]
web-servers
load-balancers

[backend:children]
api-servers
db-servers

[production:children]
frontend
backend
```

Corresponding playbook that uses this structure:

```yaml
---
- name: Deploy frontend components
  hosts: frontend
  become: yes
  tasks:
    - name: Update frontend applications
      git:
        repo: '{{ app_repository }}'
        dest: '{{ app_directory }}'
        version: '{{ app_version }}'
      when: inventory_hostname in groups['web-servers']

- name: Configure load balancers
  hosts: load-balancers
  become: yes
  tasks:
    - name: Update upstream servers
      template:
        src: upstream.conf.j2
        dest: /etc/nginx/conf.d/upstream.conf
      notify: reload nginx

- name: Database maintenance
  hosts: db-servers
  become: yes
  tasks:
    - name: Run database backups
      shell: pg_dump {{ database_name }} | gzip > /backups/{{ inventory_hostname }}-{{ ansible_date_time.date }}.sql.gz
      when: backup_enabled | default(false)
```

## Next Steps

You now understand how to organize hosts using Ansible inventory files, create group hierarchies, and manage variables across different environments. This foundation lets you scale your automation from single servers to complex multi-environment infrastructures.

In the next section, we'll dive deeper into variables and facts - how to make your playbooks flexible and responsive to different system configurations and environments.

The inventory patterns you've learned here will support increasingly sophisticated automation as your infrastructure grows and your playbooks become more complex.

Happy organizing!
