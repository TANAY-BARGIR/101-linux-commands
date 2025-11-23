---
title: 'Roles and Organization'
description: 'Learn to organize Ansible automation using roles - reusable, shareable components that make complex infrastructure management maintainable.'
order: 8
---

As your Ansible automation grows, managing everything in single playbooks becomes unwieldy. Roles provide a structured way to organize tasks, variables, files, and templates into reusable components. Think of roles as building blocks that you can combine to create sophisticated infrastructure automation while keeping everything organized and maintainable.

## Understanding Ansible Roles

A role is a predefined directory structure that groups related automation components. Instead of having massive playbooks with hundreds of tasks, you create focused roles that handle specific responsibilities like "web server setup" or "database configuration."

### Role Directory Structure

Every role follows a standard directory layout:

```
roles/
├── webserver/
│   ├── tasks/
│   │   └── main.yml
│   ├── handlers/
│   │   └── main.yml
│   ├── templates/
│   │   ├── nginx.conf.j2
│   │   └── site.conf.j2
│   ├── files/
│   │   └── ssl/
│   ├── vars/
│   │   └── main.yml
│   ├── defaults/
│   │   └── main.yml
│   ├── meta/
│   │   └── main.yml
│   └── README.md
```

Each directory serves a specific purpose:

- **tasks/**: The main automation logic
- **handlers/**: Service restart and notification handlers
- **templates/**: Jinja2 templates for configuration files
- **files/**: Static files to copy to target hosts
- **vars/**: Role-specific variables (high precedence)
- **defaults/**: Default variable values (low precedence)
- **meta/**: Role metadata and dependencies

## Creating Your First Role

### Generating Role Structure

Use `ansible-galaxy` to create the standard directory structure:

```bash
# Create a new role
ansible-galaxy init roles/webserver

# View the created structure
tree roles/webserver
```

This creates all the directories and placeholder files you need.

### Building a Web Server Role

Let's create a complete web server role. Start with the main tasks file:

```yaml
# roles/webserver/tasks/main.yml
---
- name: Include OS-specific variables
  include_vars: '{{ ansible_os_family }}.yml'
  tags: always

- name: Update package cache
  package:
    update_cache: yes
  when: ansible_os_family == "Debian"
  tags: packages

- name: Install web server packages
  package:
    name: '{{ webserver_packages }}'
    state: present
  tags: packages

- name: Create web user
  user:
    name: '{{ webserver_user }}'
    system: yes
    shell: /bin/false
    home: '{{ webserver_document_root }}'
  tags: user

- name: Create web directories
  file:
    path: '{{ item }}'
    state: directory
    owner: '{{ webserver_user }}'
    group: '{{ webserver_user }}'
    mode: '0755'
  loop:
    - '{{ webserver_document_root }}'
    - '{{ webserver_log_dir }}'
    - /etc/{{ webserver_service }}/sites-available
    - /etc/{{ webserver_service }}/sites-enabled
  tags: directories

- name: Configure web server
  template:
    src: '{{ webserver_service }}.conf.j2'
    dest: '/etc/{{ webserver_service }}/{{ webserver_service }}.conf'
    backup: yes
  notify: restart webserver
  tags: configuration

- name: Configure default site
  template:
    src: default-site.conf.j2
    dest: '/etc/{{ webserver_service }}/sites-available/default'
    backup: yes
  notify: restart webserver
  tags: configuration

- name: Enable default site
  file:
    src: '/etc/{{ webserver_service }}/sites-available/default'
    dest: '/etc/{{ webserver_service }}/sites-enabled/default'
    state: link
  notify: restart webserver
  tags: configuration

- name: Start and enable web server
  service:
    name: '{{ webserver_service }}'
    state: started
    enabled: yes
  tags: service
```

### Defining Default Variables

Set sensible defaults in `roles/webserver/defaults/main.yml`:

```yaml
---
# Default web server configuration
webserver_service: nginx
webserver_user: www-data
webserver_document_root: /var/www/html
webserver_log_dir: /var/log/nginx
webserver_port: 80
webserver_ssl_port: 443

# Performance settings
webserver_worker_processes: '{{ ansible_processor_vcpus }}'
webserver_worker_connections: 1024
webserver_keepalive_timeout: 65

# Security settings
webserver_server_tokens: off
webserver_ssl_protocols:
  - TLSv1.2
  - TLSv1.3

# Default packages for different OS families
webserver_packages:
  - '{{ webserver_service }}'

# SSL configuration
webserver_ssl_enabled: false
webserver_ssl_certificate: /etc/ssl/certs/server.crt
webserver_ssl_certificate_key: /etc/ssl/private/server.key

# Site configuration
webserver_sites: []
```

### OS-Specific Variables

Handle different operating systems with specific variable files:

```yaml
# roles/webserver/vars/Debian.yml
---
webserver_packages:
  - nginx
  - nginx-common
  - nginx-core

webserver_service: nginx
webserver_user: www-data
webserver_config_dir: /etc/nginx
```

```yaml
# roles/webserver/vars/RedHat.yml
---
webserver_packages:
  - nginx
  - nginx-mod-ssl

webserver_service: nginx
webserver_user: nginx
webserver_config_dir: /etc/nginx
```

### Creating Role Templates

Add templates for configuration files:

```jinja2
# roles/webserver/templates/nginx.conf.j2
user {{ webserver_user }};
worker_processes {{ webserver_worker_processes }};
pid /run/nginx.pid;

events {
    worker_connections {{ webserver_worker_connections }};
    use epoll;
    multi_accept on;
}

http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout {{ webserver_keepalive_timeout }};
    types_hash_max_size 2048;
    server_tokens {{ webserver_server_tokens }};

    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log {{ webserver_log_dir }}/access.log main;
    error_log {{ webserver_log_dir }}/error.log warn;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Virtual host configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Adding Handlers

Define handlers in `roles/webserver/handlers/main.yml`:

```yaml
---
- name: restart webserver
  service:
    name: '{{ webserver_service }}'
    state: restarted

- name: reload webserver
  service:
    name: '{{ webserver_service }}'
    state: reloaded

- name: validate webserver config
  command: '{{ webserver_service }} -t'
  changed_when: false
```

## Using Roles in Playbooks

### Basic Role Usage

Apply roles to hosts in your playbooks:

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes

  roles:
    - webserver
    - firewall
    - monitoring
```

### Role Variables and Parameters

Pass variables to roles for customization:

```yaml
---
- name: Configure specialized web servers
  hosts: webservers
  become: yes

  roles:
    - role: webserver
      webserver_port: 8080
      webserver_ssl_enabled: true
      webserver_sites:
        - name: api
          server_name: api.example.com
          document_root: /var/www/api
        - name: admin
          server_name: admin.example.com
          document_root: /var/www/admin
          auth_required: true
```

### Conditional Role Application

Apply roles conditionally based on host characteristics:

```yaml
---
- name: Configure servers based on their purpose
  hosts: all
  become: yes

  roles:
    - role: common
      tags: always

    - role: webserver
      when: "'webservers' in group_names"

    - role: database
      when: "'databases' in group_names"

    - role: loadbalancer
      when: "'loadbalancers' in group_names"
```

## Role Dependencies

### Defining Dependencies

Specify role dependencies in `roles/webserver/meta/main.yml`:

```yaml
---
galaxy_info:
  role_name: webserver
  author: Your Name
  description: Web server configuration role
  license: MIT
  min_ansible_version: 2.9

  platforms:
    - name: Ubuntu
      versions:
        - focal
        - jammy
    - name: Debian
      versions:
        - bullseye
        - bookworm

  galaxy_tags:
    - web
    - nginx
    - server

dependencies:
  - role: common
    tags: common

  - role: firewall
    firewall_rules:
      - port: '{{ webserver_port }}'
        protocol: tcp
        source: any
      - port: '{{ webserver_ssl_port }}'
        protocol: tcp
        source: any
    when: firewall_enabled | default(true)

  - role: ssl_certificates
    ssl_domains: '{{ webserver_ssl_domains | default([]) }}'
    when: webserver_ssl_enabled
```

Dependencies run before the role itself, ensuring prerequisites are met.

### Role Execution Order

Understanding the execution order helps with complex role dependencies:

1. Dependencies of dependencies (recursive)
2. Role dependencies
3. Role tasks
4. Role handlers (after all tasks complete)

## Advanced Role Patterns

### Parameterized Role Inclusion

Include roles dynamically with different parameters:

```yaml
---
- name: Configure multiple applications
  hosts: appservers
  become: yes

  tasks:
    - name: Configure each application
      include_role:
        name: webapp
      vars:
        app_name: '{{ item.name }}'
        app_port: '{{ item.port }}'
        app_version: '{{ item.version }}'
        app_database: '{{ item.database }}'
      loop:
        - name: api
          port: 8080
          version: '2.1.0'
          database: api_db
        - name: admin
          port: 8081
          version: '1.5.2'
          database: admin_db
        - name: worker
          port: 8082
          version: '3.0.1'
          database: worker_db
```

### Role with Multiple Entry Points

Create roles with different entry points for different scenarios:

```yaml
# roles/database/tasks/main.yml
---
- name: Include installation tasks
  include_tasks: install.yml
  when: database_action == 'install' or database_action == 'configure'

- name: Include configuration tasks
  include_tasks: configure.yml
  when: database_action == 'configure'

- name: Include backup tasks
  include_tasks: backup.yml
  when: database_action == 'backup'

- name: Include maintenance tasks
  include_tasks: maintenance.yml
  when: database_action == 'maintenance'
```

Use it with different actions:

```yaml
roles:
  - role: database
    database_action: install

  - role: database
    database_action: backup
```

### Role Testing and Validation

Add validation tasks to ensure role execution was successful:

```yaml
# roles/webserver/tasks/validate.yml
---
- name: Validate web server is responding
  uri:
    url: 'http://{{ ansible_default_ipv4.address }}:{{ webserver_port }}'
    method: GET
    status_code: 200
  register: webserver_health_check
  retries: 3
  delay: 5
  until: webserver_health_check.status == 200

- name: Validate SSL configuration
  uri:
    url: 'https://{{ ansible_default_ipv4.address }}:{{ webserver_ssl_port }}'
    method: GET
    status_code: 200
    validate_certs: no
  when: webserver_ssl_enabled
  register: ssl_health_check
  retries: 3
  delay: 5

- name: Report validation results
  debug:
    msg: |
      Web server validation completed:
      - HTTP response: {{ webserver_health_check.status }}
      - SSL response: {{ ssl_health_check.status | default('N/A - SSL not enabled') }}
```

Include validation in your main tasks:

```yaml
# roles/webserver/tasks/main.yml
- name: Run validation checks
  include_tasks: validate.yml
  when: webserver_validate | default(true)
  tags: validate
```

## Organizing Multiple Roles

### Project Structure

Organize larger projects with multiple roles:

```
ansible-infrastructure/
├── inventories/
│   ├── production/
│   │   ├── hosts.yml
│   │   └── group_vars/
│   └── staging/
│       ├── hosts.yml
│       └── group_vars/
├── roles/
│   ├── common/
│   ├── webserver/
│   ├── database/
│   ├── loadbalancer/
│   ├── monitoring/
│   └── backup/
├── playbooks/
│   ├── site.yml
│   ├── webservers.yml
│   ├── databases.yml
│   └── maintenance.yml
├── group_vars/
│   ├── all.yml
│   ├── webservers.yml
│   └── databases.yml
├── host_vars/
└── ansible.cfg
```

### Site-Wide Playbook

Create a main playbook that orchestrates all roles:

```yaml
# playbooks/site.yml
---
- name: Configure all infrastructure
  hosts: all
  become: yes

  pre_tasks:
    - name: Update package cache
      package:
        update_cache: yes
      when: ansible_os_family == "Debian"

    - name: Gather service facts
      service_facts:

  roles:
    - role: common
      tags: [common, always]

- name: Configure web servers
  hosts: webservers
  become: yes

  roles:
    - role: webserver
      tags: [webserver, web]

    - role: ssl_certificates
      when: ssl_enabled | default(false)
      tags: [ssl, web]

- name: Configure database servers
  hosts: databases
  become: yes

  roles:
    - role: database
      tags: [database, db]

    - role: backup
      tags: [backup, db]

- name: Configure load balancers
  hosts: loadbalancers
  become: yes

  roles:
    - role: loadbalancer
      tags: [loadbalancer, lb]

- name: Configure monitoring on all hosts
  hosts: all
  become: yes

  roles:
    - role: monitoring
      tags: [monitoring, observe]

  post_tasks:
    - name: Verify all services are running
      service_facts:

    - name: Generate deployment report
      template:
        src: deployment-report.j2
        dest: /tmp/deployment-{{ ansible_date_time.date }}.txt
      delegate_to: localhost
      run_once: true
```

### Role-Specific Playbooks

Create focused playbooks for specific operations:

```yaml
# playbooks/webservers.yml
---
- name: Manage web servers
  hosts: webservers
  become: yes

  vars_prompt:
    - name: maintenance_mode
      prompt: 'Enable maintenance mode? (yes/no)'
      default: 'no'
      private: no

  pre_tasks:
    - name: Enable maintenance page
      copy:
        src: maintenance.html
        dest: '{{ webserver_document_root }}/maintenance.html'
      when: maintenance_mode == "yes"

  roles:
    - role: webserver
      webserver_maintenance_mode: "{{ maintenance_mode == 'yes' }}"

  post_tasks:
    - name: Remove maintenance page
      file:
        path: '{{ webserver_document_root }}/maintenance.html'
        state: absent
      when: maintenance_mode == "no"
```

## Sharing and Reusing Roles

### Ansible Galaxy

Share roles with the community through Ansible Galaxy:

```bash
# Search for roles
ansible-galaxy search nginx

# Install a role from Galaxy
ansible-galaxy install geerlingguy.nginx

# Install roles from requirements file
echo "geerlingguy.nginx" > requirements.yml
ansible-galaxy install -r requirements.yml
```

### Requirements File

Define role dependencies in `requirements.yml`:

```yaml
---
# From Ansible Galaxy
- name: geerlingguy.nginx
  version: '3.1.4'

- name: geerlingguy.postgresql
  version: '3.4.2'

# From Git repositories
- name: custom-role
  src: https://github.com/company/ansible-custom-role.git
  version: main

# From local filesystem
- name: internal-role
  src: /path/to/local/role
```

Install all requirements:

```bash
ansible-galaxy install -r requirements.yml --roles-path roles/
```

## Best Practices for Role Development

### Role Design Principles

1. **Single Responsibility**: Each role should handle one specific aspect of system configuration
2. **Idempotency**: Roles should be safe to run multiple times
3. **Flexibility**: Use variables and defaults to make roles adaptable
4. **Documentation**: Include comprehensive README files

### Variable Management

Use clear variable naming conventions:

```yaml
# Good: Prefixed and descriptive
nginx_worker_processes: 4
nginx_ssl_enabled: true
nginx_sites_configuration:
  - name: example
    port: 80

# Avoid: Generic names that might conflict
worker_processes: 4
ssl_enabled: true
sites: []
```

### Testing Roles

Test roles using molecule or simple validation playbooks:

```yaml
# tests/test.yml
---
- name: Test webserver role
  hosts: test_servers
  become: yes

  roles:
    - role: webserver
      webserver_ssl_enabled: true

  post_tasks:
    - name: Verify nginx is running
      service:
        name: nginx
        state: started
      check_mode: yes
      register: nginx_status

    - name: Assert nginx is running
      assert:
        that:
          - nginx_status is not changed
        fail_msg: 'nginx is not running'
```

## Next Steps

Roles transform Ansible from a simple automation tool into a powerful infrastructure-as-code platform. You've learned to create reusable, well-organized automation components that can be shared and combined to manage complex infrastructure.

In the next section, we'll explore production best practices - security, testing, CI/CD integration, and patterns that make Ansible automation reliable and maintainable in enterprise environments.

The role-based organization you've learned here provides the foundation for scaling Ansible automation across large, complex infrastructures while maintaining clarity and reusability.
