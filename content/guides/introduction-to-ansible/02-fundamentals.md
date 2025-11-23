---
title: 'Ansible Fundamentals'
description: 'Understand the core concepts of Ansible: modules, playbooks, tasks, and how they work together to automate infrastructure.'
order: 2
---

Ansible works through three core concepts that fit together like building blocks. Understanding these concepts will help you think in "Ansible terms" and write automation that's both powerful and maintainable.

## Modules: The Building Blocks

Modules are Ansible's tools for getting work done. Each module handles a specific type of task, like installing packages, copying files, or managing services. Think of modules as specialized functions that know how to make specific changes to systems.

### Exploring Available Modules

Ansible includes hundreds of modules. Let's look at some essential ones:

```bash
# Get help for any module
ansible-doc apt
ansible-doc copy
ansible-doc service
```

The `ansible-doc` command shows detailed documentation, including parameters and examples for each module.

### Using Modules in Ad-Hoc Commands

You've already used modules in ad-hoc commands. Here are more examples:

```bash
# Install a package using the apt module
ansible webservers -m apt -a "name=nginx state=present" --become

# Copy a file using the copy module
ansible webservers -m copy -a "src=./index.html dest=/var/www/html/index.html" --become

# Start a service using the service module
ansible webservers -m service -a "name=nginx state=started enabled=yes" --become
```

Each module takes different parameters (`-a` specifies the arguments). The `apt` module needs `name` and `state`, while `copy` needs `src` and `dest`.

### Module Idempotency

One of Ansible's key features is idempotency - running the same module multiple times produces the same result without causing problems. If a package is already installed, the `apt` module won't try to install it again.

Test this by running the same command twice:

```bash
ansible webservers -m apt -a "name=nginx state=present" --become
```

The first time shows `"changed": true`, but subsequent runs show `"changed": false` because nginx is already installed.

## Tasks: Combining Modules with Logic

Tasks combine modules with additional logic like conditions, loops, and error handling. While ad-hoc commands are useful for quick operations, tasks provide more structure and flexibility.

A task consists of:

- A module to run
- Parameters for that module
- Optional metadata like names and conditions

Here's what a task looks like in YAML format:

```yaml
- name: Install nginx web server
  apt:
    name: nginx
    state: present
  become: yes
```

This task uses the `apt` module with specific parameters and includes a descriptive name. The `become: yes` directive runs the task with sudo privileges.

## Playbooks: Orchestrating Multiple Tasks

Playbooks are YAML files that contain one or more "plays". Each play defines:

- Which hosts to target
- What tasks to run on those hosts
- How to run those tasks (with what privileges, in what order)

### Your First Playbook

Create a file called `webserver.yml`:

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes

  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present

    - name: Start and enable nginx
      service:
        name: nginx
        state: started
        enabled: yes

    - name: Copy index page
      copy:
        src: ./index.html
        dest: /var/www/html/index.html
        mode: '0644'
```

This playbook contains one play with three tasks. It targets the `webservers` group from your inventory and runs all tasks with elevated privileges.

### Running Your Playbook

First, create a simple HTML file for the copy task:

```bash
echo "<h1>Hello from Ansible!</h1>" > index.html
```

Then run the playbook:

```bash
ansible-playbook webserver.yml
```

Ansible will execute each task in order, showing the results for each host. You'll see output indicating whether each task made changes or found the system already in the desired state.

### Understanding Playbook Structure

Let's break down the playbook structure:

```yaml
--- # YAML document start marker
- name: Configure web servers # Play name (descriptive)
  hosts: webservers # Target host group
  become: yes # Run tasks with sudo

  tasks: # List of tasks to execute
    - name: Install nginx # Task name (descriptive)
      apt: # Module name
        name: nginx # Module parameters
        state: present
```

The three-dash marker (`---`) starts a YAML document. Indentation matters in YAML - use spaces, not tabs, and be consistent with spacing.

## Variables: Making Playbooks Flexible

Hard-coding values in playbooks makes them difficult to reuse. Variables solve this problem by letting you define values separately from the tasks that use them.

### Defining Variables in Playbooks

Add variables directly in your playbook:

```yaml
---
- name: Configure web servers
  hosts: webservers
  become: yes

  vars:
    web_package: nginx
    web_service: nginx
    web_port: 80

  tasks:
    - name: Install web server
      apt:
        name: '{{ web_package }}'
        state: present

    - name: Start web service
      service:
        name: '{{ web_service }}'
        state: started
        enabled: yes
```

Variables use double curly braces (`{{ variable_name }}`) when referenced in tasks.

### Using Variables from Files

For better organization, store variables in separate files. Create `group_vars/webservers.yml`:

```yaml
---
web_package: nginx
web_service: nginx
document_root: /var/www/html
admin_email: admin@example.com
```

Ansible automatically loads variables from `group_vars/` directories based on your inventory groups. Any host in the `webservers` group will have access to these variables.

## Facts: Discovering System Information

Ansible automatically collects "facts" about each system it manages - information like IP addresses, operating system details, memory, and disk space. These facts are available as variables in your playbooks.

### Viewing Facts

See all facts for a host:

```bash
ansible webservers -m setup
```

This produces a large JSON output with system information. You can filter for specific facts:

```bash
# Show only memory information
ansible webservers -m setup -a "filter=ansible_memory_mb"

# Show only network information
ansible webservers -m setup -a "filter=ansible_default_ipv4"
```

### Using Facts in Playbooks

Facts are available as variables in your playbooks:

```yaml
- name: Display system information
  debug:
    msg: '{{ inventory_hostname }} has {{ ansible_memory_mb.real.total }}MB of RAM and runs {{ ansible_distribution }} {{ ansible_distribution_version }}'
```

The `debug` module prints messages, making it useful for troubleshooting and displaying information.

## Putting It All Together

Here's a more complete playbook that demonstrates these concepts:

```yaml
---
- name: Configure web servers with system-specific settings
  hosts: webservers
  become: yes

  vars:
    web_packages:
      - nginx
      - ufw

  tasks:
    - name: Update package cache
      apt:
        update_cache: yes

    - name: Install web server packages
      apt:
        name: '{{ web_packages }}'
        state: present

    - name: Configure firewall for web traffic
      ufw:
        rule: allow
        port: '{{ item }}'
      loop:
        - '22'
        - '80'
        - '443'

    - name: Create index page with system info
      copy:
        content: |
          <h1>Web Server Info</h1>
          <p>Hostname: {{ inventory_hostname }}</p>
          <p>OS: {{ ansible_distribution }} {{ ansible_distribution_version }}</p>
          <p>Memory: {{ ansible_memory_mb.real.total }}MB</p>
        dest: /var/www/html/index.html
        mode: '0644'

    - name: Ensure nginx is running
      service:
        name: nginx
        state: started
        enabled: yes
```

This playbook demonstrates:

- Variables (both simple values and lists)
- Loops (the `loop` keyword with ufw)
- Facts (system information in the HTML content)
- Multiple modules working together

## Best Practices for Organization

As your playbooks grow, follow these organizational practices:

### Use Descriptive Names

Every play and task should have a clear, descriptive name:

```yaml
# Good
- name: Install nginx web server package

# Less helpful
- name: Install package
```

### Group Related Tasks

Organize tasks logically within plays:

```yaml
tasks:
  # Package installation tasks
  - name: Update package cache
    apt:
      update_cache: yes

  - name: Install required packages
    apt:
      name: '{{ required_packages }}'
      state: present

  # Configuration tasks
  - name: Copy nginx configuration
    template:
      src: nginx.conf.j2
      dest: /etc/nginx/nginx.conf

  # Service management tasks
  - name: Start and enable services
    service:
      name: '{{ item }}'
      state: started
      enabled: yes
    loop: '{{ services_to_start }}'
```

### Test Your Playbooks

Before running playbooks against production systems, test them in safe environments. Use the `--check` flag to see what would change without making actual changes:

```bash
ansible-playbook webserver.yml --check
```

This "dry run" mode shows what Ansible would do without actually doing it.

## Next Steps

You now understand Ansible's core building blocks: modules, tasks, playbooks, variables, and facts. These concepts form the foundation for all Ansible automation.

In the next section, we'll dive deeper into writing effective playbooks, including error handling, conditionals, and organizing complex automation workflows.

The patterns you've learned here - combining modules into tasks, organizing tasks into playbooks, and using variables for flexibility - will serve you well as we explore more advanced Ansible features.

Happy automating!
