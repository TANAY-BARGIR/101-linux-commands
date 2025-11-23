---
title: 'Writing Your First Playbook'
description: 'Build a complete, production-ready playbook with error handling, conditionals, and proper structure.'
order: 3
---

Now that you understand Ansible's basic concepts, let's build a complete playbook that demonstrates real-world patterns. You'll create a playbook that sets up a web server with proper error handling, security configurations, and flexibility to work across different environments.

## Planning Your Playbook

Before writing any code, think about what you want to accomplish. Our example playbook will:

- Install and configure nginx
- Set up a firewall with appropriate rules
- Create a custom index page
- Handle different operating systems
- Include proper error checking
- Be flexible enough for different environments

This approach - planning before coding - prevents playbooks from becoming disorganized collections of tasks.

## Building the Basic Structure

Create a new file called `web-setup.yml`:

```yaml
---
- name: Set up web server with security configurations
  hosts: webservers
  become: yes
  gather_facts: yes

  vars:
    web_user: www-data
    web_port: 80
    allowed_ports:
      - 22
      - 80
      - 443

  tasks:
    - name: Update package cache (Debian/Ubuntu)
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Install nginx web server
      package:
        name: nginx
        state: present
```

Notice several improvements over basic examples:

- `gather_facts: yes` explicitly enables fact collection
- The `package` module works across different Linux distributions
- `when` conditions make tasks conditional
- `cache_valid_time` prevents unnecessary cache updates

## Adding Conditional Logic

Different Linux distributions require different approaches. Let's handle multiple operating systems:

```yaml
- name: Install firewall (Ubuntu/Debian)
  apt:
    name: ufw
    state: present
  when: ansible_os_family == "Debian"

- name: Install firewall (CentOS/RHEL)
  yum:
    name: firewalld
    state: present
  when: ansible_os_family == "RedHat"

- name: Configure ufw firewall rules (Ubuntu/Debian)
  ufw:
    rule: allow
    port: '{{ item }}'
    proto: tcp
  loop: '{{ allowed_ports }}'
  when: ansible_os_family == "Debian"

- name: Enable ufw firewall (Ubuntu/Debian)
  ufw:
    state: enabled
  when: ansible_os_family == "Debian"
```

The `when` clause uses Ansible facts to determine the operating system family. This makes your playbook work across different Linux distributions without modification.

## Implementing Error Handling

Real-world automation needs robust error handling. Let's add checks to ensure our configuration is successful:

```yaml
- name: Start nginx service
  service:
    name: nginx
    state: started
    enabled: yes
  register: nginx_service_result

- name: Verify nginx is responding
  uri:
    url: 'http://{{ ansible_default_ipv4.address }}:{{ web_port }}'
    method: GET
    status_code: 200
  register: nginx_response
  retries: 3
  delay: 5
  until: nginx_response.status == 200

- name: Display service status
  debug:
    msg: 'Nginx is running and responding on port {{ web_port }}'
  when: nginx_response.status == 200
```

This sequence:

1. Starts nginx and registers the result
2. Tests that nginx responds to HTTP requests
3. Retries the test up to 3 times with 5-second delays
4. Displays success only when verification passes

The `register` keyword captures task output for use in later tasks. The `until` clause repeats the task until the condition is met.

## Creating Dynamic Content

Instead of static files, let's generate content based on system information:

```yaml
- name: Create custom index page
  copy:
    content: |
      <!DOCTYPE html>
      <html>
      <head>
          <title>{{ inventory_hostname }} - Web Server</title>
          <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .info { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
          </style>
      </head>
      <body>
          <h1>Web Server Information</h1>
          <div class="info">
              <p><strong>Hostname:</strong> {{ inventory_hostname }}</p>
              <p><strong>IP Address:</strong> {{ ansible_default_ipv4.address }}</p>
              <p><strong>Operating System:</strong> {{ ansible_distribution }} {{ ansible_distribution_version }}</p>
              <p><strong>Total Memory:</strong> {{ ansible_memory_mb.real.total }}MB</p>
              <p><strong>Processor Count:</strong> {{ ansible_processor_vcpus }}</p>
              <p><strong>Server Status:</strong> Online and Running</p>
          </div>
          <p><em>Last updated: {{ ansible_date_time.iso8601 }}</em></p>
      </body>
      </html>
    dest: /var/www/html/index.html
    owner: '{{ web_user }}'
    group: '{{ web_user }}'
    mode: '0644'
  notify: reload nginx
```

This task creates a dynamic HTML page using Ansible facts. The `notify` directive triggers a handler when the file changes.

## Adding Handlers

Handlers run only when notified by other tasks and only run once, even if notified multiple times. They're perfect for restarting services after configuration changes:

```yaml
handlers:
  - name: reload nginx
    service:
      name: nginx
      state: reloaded

  - name: restart nginx
    service:
      name: nginx
      state: restarted
```

Place handlers at the same indentation level as `tasks`. They run after all tasks complete, ensuring services restart only once even if multiple configuration files change.

## Adding Pre-task Validation

Before making changes, validate that the system meets requirements:

```yaml
pre_tasks:
  - name: Check if system has sufficient memory
    fail:
      msg: 'System requires at least 1GB RAM, but only has {{ ansible_memory_mb.real.total }}MB'
    when: ansible_memory_mb.real.total < 1024

  - name: Verify SSH connectivity
    ping:

  - name: Check disk space
    shell: df / | tail -1 | awk '{print $5}' | sed 's/%//'
    register: disk_usage
    changed_when: false

  - name: Fail if disk usage is too high
    fail:
      msg: 'Root filesystem is {{ disk_usage.stdout }}% full. Need at least 20% free space.'
    when: disk_usage.stdout|int > 80
```

Pre-tasks run before regular tasks and can prevent playbook execution if conditions aren't met. The `changed_when: false` directive prevents the shell command from being marked as a change.

## The Complete Playbook

Here's the full playbook with all components:

```yaml
---
- name: Set up web server with security configurations
  hosts: webservers
  become: yes
  gather_facts: yes

  vars:
    web_user: www-data
    web_port: 80
    allowed_ports:
      - 22
      - 80
      - 443

  pre_tasks:
    - name: Check system requirements
      fail:
        msg: 'System requires at least 1GB RAM'
      when: ansible_memory_mb.real.total < 1024

    - name: Verify connectivity
      ping:

  tasks:
    - name: Update package cache (Debian/Ubuntu)
      apt:
        update_cache: yes
        cache_valid_time: 3600
      when: ansible_os_family == "Debian"

    - name: Install required packages
      package:
        name: '{{ item }}'
        state: present
      loop:
        - nginx
        - ufw
      when: ansible_os_family == "Debian"

    - name: Configure firewall rules
      ufw:
        rule: allow
        port: '{{ item }}'
        proto: tcp
      loop: '{{ allowed_ports }}'
      when: ansible_os_family == "Debian"

    - name: Enable firewall
      ufw:
        state: enabled
      when: ansible_os_family == "Debian"

    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: yes
      register: nginx_start

    - name: Create custom index page
      copy:
        content: |
          <!DOCTYPE html>
          <html>
          <head>
              <title>{{ inventory_hostname }} - Web Server</title>
              <style>
                  body { font-family: Arial, sans-serif; margin: 40px; }
                  .info { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
              </style>
          </head>
          <body>
              <h1>{{ inventory_hostname }} Web Server</h1>
              <div class="info">
                  <p><strong>IP:</strong> {{ ansible_default_ipv4.address }}</p>
                  <p><strong>OS:</strong> {{ ansible_distribution }} {{ ansible_distribution_version }}</p>
                  <p><strong>Memory:</strong> {{ ansible_memory_mb.real.total }}MB</p>
                  <p><strong>Status:</strong> Online</p>
              </div>
              <p><em>Configured by Ansible on {{ ansible_date_time.iso8601 }}</em></p>
          </body>
          </html>
        dest: /var/www/html/index.html
        owner: '{{ web_user }}'
        group: '{{ web_user }}'
        mode: '0644'
      notify: reload nginx

    - name: Verify web server is responding
      uri:
        url: 'http://{{ ansible_default_ipv4.address }}:{{ web_port }}'
        method: GET
        status_code: 200
      register: web_check
      retries: 3
      delay: 5
      until: web_check.status == 200

    - name: Display success message
      debug:
        msg: 'Web server successfully configured at http://{{ ansible_default_ipv4.address }}'

  handlers:
    - name: reload nginx
      service:
        name: nginx
        state: reloaded

  post_tasks:
    - name: Run final verification
      uri:
        url: 'http://{{ ansible_default_ipv4.address }}'
        return_content: yes
      register: final_check

    - name: Confirm deployment
      debug:
        msg: 'Deployment complete. Server is responding correctly.'
      when: final_check.status == 200
```

## Running and Testing Your Playbook

Execute your playbook with additional options for better output:

```bash
# Run with verbose output to see detailed information
ansible-playbook web-setup.yml -v

# Run in check mode to see what would change
ansible-playbook web-setup.yml --check

# Run and limit to specific hosts
ansible-playbook web-setup.yml --limit web1

# Run with step-by-step confirmation
ansible-playbook web-setup.yml --step
```

The `--step` option asks for confirmation before each task, useful for testing or when you want to carefully control execution.

## Troubleshooting Common Issues

When playbooks don't work as expected, use these debugging techniques:

### Adding Debug Output

Insert debug tasks to inspect variables:

```yaml
- name: Debug system information
  debug:
    var: ansible_facts
  when: debug_mode is defined
```

Run with: `ansible-playbook web-setup.yml -e debug_mode=true`

### Using Tags for Selective Execution

Add tags to run only specific parts of your playbook:

```yaml
- name: Install packages
  package:
    name: nginx
    state: present
  tags:
    - packages
    - install

- name: Configure firewall
  ufw:
    rule: allow
    port: 80
  tags:
    - security
    - firewall
```

Run only firewall tasks: `ansible-playbook web-setup.yml --tags firewall`

### Handling Task Failures

Some tasks might fail in ways you can recover from:

```yaml
- name: Attempt to install optional package
  package:
    name: htop
    state: present
  ignore_errors: yes
  register: htop_install

- name: Report optional package status
  debug:
    msg: "htop installation: {{ 'successful' if htop_install.failed == false else 'failed (not critical)' }}"
```

The `ignore_errors: yes` directive continues playbook execution even if the task fails.

## Next Steps

You've built a comprehensive playbook that demonstrates many of Ansible's powerful features. This playbook includes validation, error handling, cross-platform support, and verification - patterns you'll use in production automation.

In the next section, we'll explore how to organize multiple servers using inventory files, groups, and variables. You'll learn to manage different environments and scale your automation across larger infrastructures.

The structured approach you've learned here - planning, implementing with error handling, and thorough testing - will serve you well as we tackle more complex scenarios.

Happy configuring!
