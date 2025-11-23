---
title: 'Variables and Facts'
description: 'Learn to use variables and system facts to create flexible, dynamic Ansible playbooks that adapt to different environments and systems.'
order: 5
---

Variables transform static playbooks into flexible automation that adapts to different environments, hosts, and situations. Combined with Ansible's fact-gathering system, variables let you write playbooks that make intelligent decisions based on system characteristics and user-defined configuration.

## Understanding Variable Precedence

Ansible evaluates variables from multiple sources, following a specific precedence order. Understanding this hierarchy prevents confusion when the same variable is defined in multiple places.

### Variable Sources (Lowest to Highest Precedence)

1. Role defaults
2. Inventory variables (group_vars, host_vars)
3. Playbook variables
4. Extra variables (`-e` on command line)

Higher precedence sources override lower ones. Here's how this works in practice:

```yaml
# group_vars/webservers.yml (precedence: 2)
web_port: 80

# In your playbook (precedence: 3)
---
- hosts: webservers
  vars:
    web_port: 8080 # This overrides group_vars
```

Command line variables have the highest precedence:

```bash
# This overrides everything else
ansible-playbook site.yml -e web_port=3000
```

## Defining Variables in Multiple Ways

### Playbook Variables

Define variables directly in playbooks for values specific to that automation:

```yaml
---
- name: Configure web application
  hosts: webservers
  vars:
    app_name: ecommerce-site
    app_version: '2.1.3'
    database_host: db.internal.com
    cache_enabled: true
    allowed_origins:
      - https://example.com
      - https://www.example.com
      - https://app.example.com

  tasks:
    - name: Deploy application version {{ app_version }}
      git:
        repo: 'https://github.com/company/{{ app_name }}.git'
        dest: '/opt/{{ app_name }}'
        version: '{{ app_version }}'
```

### External Variable Files

For larger variable sets, use separate YAML files:

```yaml
# vars/app-config.yml
---
application:
  name: customer-portal
  version: '1.4.2'
  port: 8080
  workers: 4

database:
  host: postgres.internal.com
  port: 5432
  name: customer_db
  pool_size: 20

cache:
  enabled: true
  ttl: 3600
  max_memory: 512mb

features:
  user_registration: true
  payment_processing: true
  analytics: false
```

Load these variables in your playbook:

```yaml
---
- name: Deploy customer portal
  hosts: app_servers
  vars_files:
    - vars/app-config.yml
    - vars/secrets.yml

  tasks:
    - name: Configure application
      template:
        src: app.conf.j2
        dest: '/etc/{{ application.name }}/app.conf'
      notify: restart application
```

### Prompt for Variables

For sensitive or environment-specific values, prompt users during playbook execution:

```yaml
---
- name: Database maintenance
  hosts: databases
  vars_prompt:
    - name: maintenance_window
      prompt: 'Enter maintenance window (hours)'
      default: '2'
      private: no

    - name: admin_password
      prompt: 'Enter database admin password'
      private: yes
      encrypt: 'sha512_crypt'
      confirm: yes

  tasks:
    - name: Schedule maintenance
      debug:
        msg: 'Scheduling {{ maintenance_window }} hour maintenance window'
```

The `private: yes` option hides input for sensitive values. The `encrypt` option hashes passwords for security.

## Working with System Facts

Ansible automatically collects detailed information about each system it manages. These "facts" are available as variables in your playbooks, enabling automation that adapts to different system configurations.

### Exploring Available Facts

See all facts for a system:

```bash
ansible webservers -m setup | less
```

Filter facts by category:

```bash
# Network information
ansible webservers -m setup -a "filter=ansible_default_ipv4"

# Memory information
ansible webservers -m setup -a "filter=ansible_memory_mb"

# Disk information
ansible webservers -m setup -a "filter=ansible_mounts"
```

### Commonly Used Facts

Here are facts you'll frequently use in playbooks:

```yaml
tasks:
  - name: Display system information
    debug:
      msg: |
        Hostname: {{ inventory_hostname }}
        FQDN: {{ ansible_fqdn }}
        OS: {{ ansible_distribution }} {{ ansible_distribution_version }}
        Architecture: {{ ansible_architecture }}
        IP Address: {{ ansible_default_ipv4.address }}
        Total Memory: {{ ansible_memory_mb.real.total }}MB
        CPU Cores: {{ ansible_processor_vcpus }}
        Python Version: {{ ansible_python_version }}
```

### Using Facts for Conditional Logic

Facts enable playbooks to make intelligent decisions:

```yaml
tasks:
  - name: Install package manager update (Ubuntu)
    apt:
      update_cache: yes
    when: ansible_distribution == "Ubuntu"

  - name: Install package manager update (CentOS)
    yum:
      name: '*'
      state: latest
    when: ansible_distribution == "CentOS"

  - name: Configure memory-based settings
    lineinfile:
      path: /etc/myapp/config.ini
      regexp: '^max_memory='
      line: 'max_memory={{ (ansible_memory_mb.real.total * 0.8) | int }}MB'
    when: ansible_memory_mb.real.total > 2048
```

### Custom Facts

Create custom facts for application-specific information:

```bash
# Create facts directory on target hosts
sudo mkdir -p /etc/ansible/facts.d

# Create a custom fact script
sudo tee /etc/ansible/facts.d/application.fact << 'EOF'
#!/bin/bash
echo '{
  "version": "'$(cat /opt/myapp/VERSION 2>/dev/null || echo "unknown")'",
  "last_deployment": "'$(stat -c %Y /opt/myapp/deployed 2>/dev/null || echo "never")'",
  "database_status": "'$(systemctl is-active postgresql 2>/dev/null || echo "unknown")'"
}'
EOF

sudo chmod +x /etc/ansible/facts.d/application.fact
```

Access custom facts in playbooks:

```yaml
tasks:
  - name: Display application status
    debug:
      msg: |
        App Version: {{ ansible_local.application.version }}
        Last Deployment: {{ ansible_local.application.last_deployment }}
        Database Status: {{ ansible_local.application.database_status }}
```

## Variable Manipulation and Filters

Ansible provides filters to transform variable values:

### String Manipulation

```yaml
tasks:
  - name: Work with strings
    debug:
      msg: |
        Original: {{ app_name }}
        Uppercase: {{ app_name | upper }}
        Lowercase: {{ app_name | lower }}
        Title Case: {{ app_name | title }}
        Replace: {{ app_name | replace('-', '_') }}
```

### List and Dictionary Operations

```yaml
vars:
  server_list:
    - web1
    - web2
    - web3

  server_config:
    web1: { cpu: 2, memory: 4096 }
    web2: { cpu: 4, memory: 8192 }
    web3: { cpu: 2, memory: 4096 }

tasks:
  - name: List operations
    debug:
      msg: |
        First server: {{ server_list | first }}
        Last server: {{ server_list | last }}
        Random server: {{ server_list | random }}
        Sorted servers: {{ server_list | sort }}
        Server count: {{ server_list | length }}

  - name: Dictionary operations
    debug:
      msg: |
        All servers: {{ server_config.keys() | list }}
        High-memory servers: {{ server_config | dict2items | selectattr('value.memory', '>', 4096) | map(attribute='key') | list }}
```

### Mathematical Operations

```yaml
vars:
  base_memory: 1024
  cpu_count: '{{ ansible_processor_vcpus }}'

tasks:
  - name: Calculate optimal settings
    set_fact:
      optimal_memory: '{{ (base_memory * cpu_count) | int }}'
      worker_processes: '{{ [cpu_count | int, 8] | min }}'
      cache_size: '{{ (ansible_memory_mb.real.total * 0.1) | int }}'
```

## Advanced Variable Techniques

### Variable Registration

Capture task output for use in later tasks:

```yaml
tasks:
  - name: Check disk usage
    shell: df -h / | tail -1 | awk '{print $5}' | sed 's/%//'
    register: disk_usage
    changed_when: false

  - name: Display disk usage
    debug:
      msg: 'Root filesystem is {{ disk_usage.stdout }}% full'

  - name: Warn about high disk usage
    debug:
      msg: 'WARNING: Disk usage is critically high!'
    when: disk_usage.stdout | int > 90
```

### Setting Facts Dynamically

Use `set_fact` to create variables during playbook execution:

```yaml
tasks:
  - name: Determine deployment strategy
    set_fact:
      deployment_strategy: "{{ 'blue_green' if ansible_memory_mb.real.total > 4096 else 'rolling' }}"
      backup_required: "{{ true if environment == 'production' else false }}"

  - name: Configure based on strategy
    debug:
      msg: 'Using {{ deployment_strategy }} deployment strategy'
```

### Variable Scoping

Variables can be scoped to hosts, groups, or globally:

```yaml
tasks:
  - name: Set host-specific variable
    set_fact:
      host_role: primary
    when: inventory_hostname == groups['databases'][0]

  - name: Set host-specific variable
    set_fact:
      host_role: secondary
    when: inventory_hostname != groups['databases'][0]

  - name: Configure based on role
    template:
      src: 'database-{{ host_role }}.conf.j2'
      dest: /etc/postgresql/postgresql.conf
```

## Practical Example: Environment-Aware Configuration

Here's a complete example showing how variables and facts work together:

```yaml
---
- name: Deploy application with environment-specific configuration
  hosts: app_servers
  vars:
    app_name: customer-api
    app_repository: 'https://github.com/company/customer-api.git'

  vars_files:
    - 'vars/{{ environment }}.yml'
    - 'vars/secrets-{{ environment }}.yml'

  pre_tasks:
    - name: Validate environment variable
      fail:
        msg: 'Environment must be defined (dev, staging, prod)'
      when: environment is not defined

    - name: Set deployment facts
      set_fact:
        app_user: '{{ app_name }}'
        app_dir: '/opt/{{ app_name }}'
        log_level: "{{ 'info' if environment == 'prod' else 'debug' }}"
        worker_count: "{{ ansible_processor_vcpus if environment == 'prod' else 2 }}"

  tasks:
    - name: Create application user
      user:
        name: '{{ app_user }}'
        system: yes
        shell: /bin/false

    - name: Deploy application code
      git:
        repo: '{{ app_repository }}'
        dest: '{{ app_dir }}'
        version: '{{ app_version }}'
      become_user: '{{ app_user }}'
      notify: restart application

    - name: Generate configuration file
      template:
        src: app.conf.j2
        dest: '{{ app_dir }}/config/app.conf'
        owner: '{{ app_user }}'
        group: '{{ app_user }}'
        mode: '0640'
      notify: restart application

    - name: Configure systemd service
      template:
        src: app.service.j2
        dest: '/etc/systemd/system/{{ app_name }}.service'
      notify:
        - reload systemd
        - restart application

    - name: Ensure application is running
      systemd:
        name: '{{ app_name }}'
        state: started
        enabled: yes
        daemon_reload: yes

  handlers:
    - name: reload systemd
      systemd:
        daemon_reload: yes

    - name: restart application
      systemd:
        name: '{{ app_name }}'
        state: restarted
```

Supporting template file (`templates/app.conf.j2`):

```jinja2
# {{ app_name }} configuration
# Generated by Ansible on {{ ansible_date_time.iso8601 }}

[server]
host = {{ ansible_default_ipv4.address }}
port = {{ app_port | default(8080) }}
workers = {{ worker_count }}
log_level = {{ log_level }}

[database]
host = {{ database.host }}
port = {{ database.port }}
name = {{ database.name }}
user = {{ database.user }}
password = {{ database.password }}

[performance]
max_memory = {{ (ansible_memory_mb.real.total * 0.6) | int }}MB
cache_enabled = {{ cache_enabled | default(true) }}

[environment]
name = {{ environment }}
debug = {{ environment != 'prod' }}
ssl_enabled = {{ ssl_enabled | default(false) }}
```

## Next Steps

Variables and facts provide the foundation for creating intelligent, adaptable automation. You've learned to define variables from multiple sources, use system facts for decision-making, and apply filters to transform data.

In the next section, we'll explore handlers and notifications - how to trigger actions only when changes occur and coordinate complex service management across multiple systems.

The variable techniques you've learned here enable the dynamic, environment-aware automation that makes Ansible powerful for managing diverse infrastructure at scale.

Happy automating!
