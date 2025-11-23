---
title: 'Handlers and Notifications'
description: 'Learn to use Ansible handlers and notifications to trigger actions only when needed, creating efficient and reliable automation.'
order: 6
---

Handlers are one of Ansible's most powerful features for building efficient automation. They let you trigger actions - like restarting services - only when configuration changes actually occur. This approach prevents unnecessary service restarts and creates more reliable automation that responds appropriately to changes.

## Understanding Handlers

Handlers are special tasks that run only when "notified" by other tasks. Unlike regular tasks that run every time, handlers run once per playbook execution and only if triggered. This makes them perfect for actions that should happen after configuration changes.

### Basic Handler Syntax

Here's a simple example showing how handlers work:

```yaml
---
- name: Configure web server
  hosts: webservers
  become: yes

  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Copy nginx configuration
      copy:
        src: nginx.conf
        dest: /etc/nginx/nginx.conf
        backup: yes
      notify: restart nginx

    - name: Copy site configuration
      template:
        src: site.conf.j2
        dest: /etc/nginx/sites-available/default
      notify: restart nginx

  handlers:
    - name: restart nginx
      service:
        name: nginx
        state: restarted
```

In this example:

1. Two tasks can potentially trigger the handler using `notify`
2. The handler runs only once, even if both tasks make changes
3. The handler runs after all tasks complete
4. If no tasks trigger notifications, the handler doesn't run

### When Handlers Execute

Handlers run at specific points during playbook execution:

- **After all tasks in a play complete** (normal behavior)
- **When explicitly flushed** using `meta: flush_handlers`
- **At the end of each block** when using error handling blocks

This timing ensures that configuration changes are complete before services restart.

## Practical Handler Examples

### Web Server Configuration

Here's a realistic example managing nginx configuration with multiple potential triggers:

```yaml
---
- name: Configure nginx web server
  hosts: webservers
  become: yes

  vars:
    nginx_sites:
      - name: api
        port: 8080
        backend: "{{ groups['api_servers'] }}"
      - name: admin
        port: 8081
        backend: "{{ groups['admin_servers'] }}"

  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Configure nginx main settings
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        backup: yes
      notify:
        - validate nginx config
        - restart nginx

    - name: Configure nginx sites
      template:
        src: site.conf.j2
        dest: '/etc/nginx/sites-available/{{ item.name }}'
      loop: '{{ nginx_sites }}'
      notify:
        - validate nginx config
        - restart nginx

    - name: Enable nginx sites
      file:
        src: '/etc/nginx/sites-available/{{ item.name }}'
        dest: '/etc/nginx/sites-enabled/{{ item.name }}'
        state: link
      loop: '{{ nginx_sites }}'
      notify:
        - validate nginx config
        - restart nginx

    - name: Remove default nginx site
      file:
        path: /etc/nginx/sites-enabled/default
        state: absent
      notify:
        - validate nginx config
        - restart nginx

  handlers:
    - name: validate nginx config
      command: nginx -t
      changed_when: false

    - name: restart nginx
      service:
        name: nginx
        state: restarted
```

Notice how multiple tasks can notify the same handlers. The handlers run in the order they're defined, so validation happens before restart.

### Database Configuration

Handlers work well for database configuration that requires service restarts:

```yaml
---
- name: Configure PostgreSQL
  hosts: databases
  become: yes
  become_user: postgres

  tasks:
    - name: Configure PostgreSQL settings
      lineinfile:
        path: /etc/postgresql/13/main/postgresql.conf
        regexp: '{{ item.regexp }}'
        line: '{{ item.line }}'
        backup: yes
      loop:
        - { regexp: '^#?shared_buffers', line: 'shared_buffers = {{ shared_buffers }}' }
        - { regexp: '^#?max_connections', line: 'max_connections = {{ max_connections }}' }
        - { regexp: '^#?listen_addresses', line: "listen_addresses = '{{ listen_addresses }}'" }
      notify: restart postgresql

    - name: Configure client authentication
      template:
        src: pg_hba.conf.j2
        dest: /etc/postgresql/13/main/pg_hba.conf
        backup: yes
      notify:
        - validate postgresql config
        - reload postgresql

    - name: Create application database
      postgresql_db:
        name: '{{ app_database }}'
        state: present

    - name: Create application user
      postgresql_user:
        name: '{{ app_user }}'
        password: '{{ app_password }}'
        db: '{{ app_database }}'
        priv: ALL
        state: present

  handlers:
    - name: validate postgresql config
      command: /usr/lib/postgresql/13/bin/postgres --config-file=/etc/postgresql/13/main/postgresql.conf --check-config
      become_user: postgres
      changed_when: false

    - name: restart postgresql
      service:
        name: postgresql
        state: restarted

    - name: reload postgresql
      service:
        name: postgresql
        state: reloaded
```

This example shows different types of handlers: restart for major configuration changes, reload for authentication changes, and validation to ensure configuration is correct.

## Advanced Handler Techniques

### Handler Dependencies

Sometimes handlers must run in a specific order. Use `listen` to create handler groups:

```yaml
tasks:
  - name: Update SSL certificate
    copy:
      src: '{{ item }}'
      dest: '/etc/ssl/certs/'
    loop:
      - server.crt
      - server.key
    notify: ssl certificate updated

handlers:
  - name: validate ssl certificate
    command: openssl x509 -in /etc/ssl/certs/server.crt -text -noout
    listen: ssl certificate updated
    changed_when: false

  - name: restart nginx
    service:
      name: nginx
      state: restarted
    listen: ssl certificate updated

  - name: restart apache
    service:
      name: apache2
      state: restarted
    listen: ssl certificate updated
```

When a task notifies "ssl certificate updated", all handlers listening for that notification run in order.

### Conditional Handlers

Handlers can include conditionals, making them run only under specific circumstances:

```yaml
handlers:
  - name: restart application
    service:
      name: '{{ app_name }}'
      state: restarted
    when: not maintenance_mode | default(false)

  - name: reload configuration
    command: '{{ app_command }} reload'
    when:
      - app_running is defined
      - app_running.rc == 0
```

### Forcing Handler Execution

Use `meta: flush_handlers` to run handlers immediately instead of waiting for the end of the play:

```yaml
tasks:
  - name: Update database configuration
    template:
      src: postgresql.conf.j2
      dest: /etc/postgresql/13/main/postgresql.conf
    notify: restart postgresql

  - name: Flush handlers to restart database now
    meta: flush_handlers

  - name: Run database migrations (requires running database)
    command: 'python manage.py migrate'
    become_user: '{{ app_user }}'
```

This pattern is useful when later tasks depend on services being restarted.

### Error Handling in Handlers

Handlers can fail, potentially leaving systems in inconsistent states. Handle this with proper error checking:

```yaml
handlers:
  - name: restart nginx with validation
    block:
      - name: validate nginx configuration
        command: nginx -t
        changed_when: false

      - name: restart nginx service
        service:
          name: nginx
          state: restarted

    rescue:
      - name: restore nginx configuration backup
        command: cp /etc/nginx/nginx.conf.ansible-backup /etc/nginx/nginx.conf
        ignore_errors: yes

      - name: ensure nginx is running with old config
        service:
          name: nginx
          state: started

      - name: report configuration failure
        fail:
          msg: 'nginx configuration update failed, reverted to backup'
```

## Real-World Handler Patterns

### Multi-Service Coordination

When changes affect multiple services, coordinate their restarts properly:

```yaml
---
- name: Update application stack
  hosts: app_servers
  become: yes

  tasks:
    - name: Update application code
      git:
        repo: '{{ app_repository }}'
        dest: '{{ app_directory }}'
        version: '{{ app_version }}'
      notify:
        - restart application
        - restart workers

    - name: Update nginx proxy configuration
      template:
        src: proxy.conf.j2
        dest: /etc/nginx/conf.d/app.conf
      notify: reload nginx

    - name: Update application configuration
      template:
        src: app.conf.j2
        dest: '{{ app_directory }}/config.ini'
      notify:
        - restart application
        - restart workers

  handlers:
    - name: restart application
      service:
        name: '{{ app_name }}'
        state: restarted

    - name: restart workers
      service:
        name: '{{ app_name }}-workers'
        state: restarted

    - name: reload nginx
      service:
        name: nginx
        state: reloaded
```

### Rolling Restarts

For applications that need graceful restarts, implement rolling restart patterns:

```yaml
---
- name: Rolling restart of web servers
  hosts: webservers
  serial: 1 # Process one host at a time
  become: yes

  tasks:
    - name: Remove server from load balancer
      uri:
        url: 'http://{{ load_balancer_host }}/api/servers/{{ inventory_hostname }}/disable'
        method: POST
      delegate_to: localhost

    - name: Wait for existing connections to drain
      wait_for:
        timeout: 30

    - name: Update application configuration
      template:
        src: app.conf.j2
        dest: /etc/myapp/app.conf
      notify: restart application

    - name: Flush handlers to restart application
      meta: flush_handlers

    - name: Wait for application to be ready
      wait_for:
        port: '{{ app_port }}'
        host: '{{ inventory_hostname }}'
        delay: 5
        timeout: 60

    - name: Add server back to load balancer
      uri:
        url: 'http://{{ load_balancer_host }}/api/servers/{{ inventory_hostname }}/enable'
        method: POST
      delegate_to: localhost

  handlers:
    - name: restart application
      service:
        name: myapp
        state: restarted
```

### Configuration Validation Chain

Create handler chains that validate configuration before applying changes:

```yaml
handlers:
  - name: validate and restart services
    block:
      - name: validate nginx configuration
        command: nginx -t
        changed_when: false

      - name: validate ssl certificates
        command: openssl x509 -in {{ item }} -text -noout
        loop:
          - /etc/ssl/certs/server.crt
        changed_when: false

      - name: restart nginx
        service:
          name: nginx
          state: restarted

      - name: verify nginx is responding
        uri:
          url: 'http://{{ ansible_default_ipv4.address }}'
          status_code: 200
        retries: 3
        delay: 5

    rescue:
      - name: restore configuration backups
        command: '{{ item }}'
        loop:
          - cp /etc/nginx/nginx.conf.backup /etc/nginx/nginx.conf
          - cp /etc/ssl/certs/server.crt.backup /etc/ssl/certs/server.crt
        ignore_errors: yes

      - name: restart nginx with old configuration
        service:
          name: nginx
          state: restarted

      - name: fail with detailed message
        fail:
          msg: 'Configuration update failed and was rolled back'
```

## Best Practices for Handlers

### Naming and Organization

Use descriptive names and organize handlers logically:

```yaml
handlers:
  # Service management
  - name: restart web server
    service:
      name: nginx
      state: restarted

  - name: reload web server
    service:
      name: nginx
      state: reloaded

  # Configuration validation
  - name: validate web server config
    command: nginx -t
    changed_when: false

  # Application specific
  - name: restart application server
    service:
      name: '{{ app_name }}'
      state: restarted
```

### Handler Efficiency

Prefer reloads over restarts when possible:

```yaml
# Better - faster, doesn't interrupt existing connections
- name: reload nginx configuration
  service:
    name: nginx
    state: reloaded

# Use only when reload isn't sufficient
- name: restart nginx service
  service:
    name: nginx
    state: restarted
```

### Testing Handler Behavior

Test that handlers work correctly by making intentional changes:

```bash
# Make a change that should trigger handlers
ansible-playbook site.yml --check --diff

# Run the playbook and verify handlers execute
ansible-playbook site.yml -v

# Verify services are running correctly
ansible webservers -m service -a "name=nginx state=started"
```

## Next Steps

Handlers provide the foundation for creating automation that responds intelligently to changes. You've learned to trigger actions conditionally, coordinate multiple services, and implement error handling for critical operations.

In the next section, we'll explore templates and files - how to generate dynamic configuration files and manage file deployments across your infrastructure.

The handler patterns you've learned here ensure your automation is both efficient and reliable, avoiding unnecessary service disruptions while maintaining system consistency.
