---
title: 'Best Practices and Production Patterns'
description: 'Learn production-ready patterns for security, testing, error handling, and team collaboration in Ansible automation.'
order: 9
---

Running Ansible in production environments requires more than functional playbooks. You need security controls, testing procedures, error handling strategies, and organizational patterns that support team collaboration. This section covers the practices that separate hobby automation from enterprise-grade infrastructure management.

## Security Best Practices

### Secrets Management

Never store sensitive data in plain text. Use Ansible Vault for encrypting secrets:

```bash
# Create an encrypted file
ansible-vault create group_vars/production/vault.yml

# Edit an encrypted file
ansible-vault edit group_vars/production/vault.yml

# Encrypt an existing file
ansible-vault encrypt secrets.yml

# Decrypt for viewing
ansible-vault view group_vars/production/vault.yml
```

Structure your variables to clearly separate sensitive data:

```yaml
# group_vars/production/vars.yml (unencrypted)
database_host: db.production.example.com
database_port: 5432
database_name: app_production
database_user: app_user

# group_vars/production/vault.yml (encrypted)
vault_database_password: supersecretpassword
vault_api_key: abcd1234567890
vault_ssl_private_key: |
  -----BEGIN PRIVATE KEY-----
  MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
  -----END PRIVATE KEY-----
```

Reference vault variables in your regular variables:

```yaml
# group_vars/production/vars.yml
database_password: '{{ vault_database_password }}'
api_key: '{{ vault_api_key }}'
ssl_private_key: '{{ vault_ssl_private_key }}'
```

### Vault Management Strategies

For team environments, use multiple vault files with different access levels:

```bash
# Structure for team access control
group_vars/
├── production/
│   ├── vars.yml                    # Public variables
│   ├── vault-common.yml           # Shared secrets (team access)
│   ├── vault-database.yml         # Database secrets (DBA access)
│   └── vault-certificates.yml     # SSL secrets (security team access)
```

Use external secret management systems for enterprise environments:

```yaml
# Using HashiCorp Vault lookup
tasks:
  - name: Get database password from HashiCorp Vault
    set_fact:
      database_password: "{{ lookup('hashi_vault', 'secret=secret/database/production:password') }}"
    no_log: true

  - name: Configure application with secret
    template:
      src: app.conf.j2
      dest: /etc/myapp/app.conf
      mode: '0600'
    no_log: true
```

### Privilege Management

Follow the principle of least privilege:

```yaml
# Bad: Running everything as root
- name: Configure application
  hosts: appservers
  become: yes # Everything runs as root

# Better: Selective privilege escalation
- name: Configure application
  hosts: appservers

  tasks:
    - name: Install packages (requires root)
      package:
        name: myapp
        state: present
      become: yes

    - name: Configure application (app user is sufficient)
      template:
        src: app.conf.j2
        dest: /opt/myapp/app.conf
      become: yes
      become_user: myapp

    - name: Start service (requires root)
      service:
        name: myapp
        state: started
      become: yes
```

Use sudo rules that limit specific commands:

```yaml
# Configure sudo for specific Ansible operations
- name: Configure limited sudo for deployment user
  lineinfile:
    path: /etc/sudoers.d/ansible-deploy
    line: 'deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart myapp, /bin/systemctl reload nginx'
    create: yes
    validate: 'visudo -cf %s'
```

### Input Validation and Sanitization

Validate user inputs to prevent injection attacks:

```yaml
tasks:
  - name: Validate database name format
    fail:
      msg: 'Database name contains invalid characters'
    when: database_name is not match("^[a-zA-Z][a-zA-Z0-9_]*$")

  - name: Validate port range
    fail:
      msg: 'Port must be between 1024 and 65535'
    when: app_port | int < 1024 or app_port | int > 65535

  - name: Sanitize user input
    set_fact:
      clean_app_name: "{{ app_name | regex_replace('[^a-zA-Z0-9_-]', '') }}"
```

## Testing Strategies

### Syntax and Lint Testing

Implement automated testing in your development workflow:

```bash
# Create a testing script
cat > scripts/test.sh << 'EOF'
#!/bin/bash
set -e

echo "=== Syntax Check ==="
ansible-playbook --syntax-check site.yml

echo "=== Ansible Lint ==="
ansible-lint site.yml

echo "=== YAML Lint ==="
yamllint .

echo "=== Check Mode (Dry Run) ==="
ansible-playbook site.yml --check --diff

echo "All tests passed!"
EOF

chmod +x scripts/test.sh
```

### Ansible Lint Configuration

Create `.ansible-lint` configuration:

```yaml
# .ansible-lint
---
exclude_paths:
  - .cache/ # implicit unless exclude_paths is defined in config
  - .github/
  - test/fixtures/formatting-before/
  - test/fixtures/formatting-prettier/

use_default_rules: true

# Disable specific rules
skip_list:
  - yaml[line-length] # Allow long lines in specific cases
  - name[casing] # Allow flexible task naming

# Enable additional rules
enable_list:
  - no-log-password
  - name[prefix]

# Set rule-specific configuration
rules:
  line-length:
    max: 120
    allow-non-breakable-words: true
    allow-non-breakable-inline-mappings: true
```

### Infrastructure Testing

Test your infrastructure changes in isolated environments:

```yaml
# test-environment.yml
---
- name: Test infrastructure changes
  hosts: test_servers
  become: yes

  pre_tasks:
    - name: Create snapshot before changes (if supported)
      uri:
        url: '{{ cloud_api_endpoint }}/snapshots'
        method: POST
        body_format: json
        body:
          server_id: '{{ ansible_default_ipv4.address }}'
          name: 'pre-ansible-{{ ansible_date_time.epoch }}'
      delegate_to: localhost
      when: cloud_snapshots_enabled | default(false)

  roles:
    - webserver
    - database

  post_tasks:
    - name: Run application health checks
      uri:
        url: 'http://{{ inventory_hostname }}:{{ app_port }}/health'
        method: GET
        status_code: 200
      register: health_check
      retries: 5
      delay: 10

    - name: Validate database connectivity
      postgresql_ping:
        db: '{{ database_name }}'
        login_host: '{{ inventory_hostname }}'
        login_user: '{{ database_user }}'
        login_password: '{{ database_password }}'
      when: "'databases' in group_names"
```

### Molecule Testing

Use Molecule for comprehensive role testing:

```yaml
# molecule/default/molecule.yml
---
dependency:
  name: galaxy

driver:
  name: docker

platforms:
  - name: ubuntu-instance
    image: ubuntu:20.04
    pre_build_image: true
    command: /lib/systemd/systemd
    v2: true
    privileged: true
    volumes:
      - /sys/fs/cgroup:/sys/fs/cgroup:ro

provisioner:
  name: ansible
  config_options:
    defaults:
      interpreter_python: auto_silent
      callback_whitelist: profile_tasks, timer, yaml
    ssh_connection:
      pipelining: false

verifier:
  name: ansible

scenario:
  test_sequence:
    - dependency
    - lint
    - cleanup
    - destroy
    - syntax
    - create
    - prepare
    - converge
    - idempotence
    - side_effect
    - verify
    - cleanup
    - destroy
```

## Error Handling and Recovery

### Graceful Failure Handling

Implement proper error handling to prevent partial configurations:

```yaml
---
- name: Deploy application with rollback capability
  hosts: appservers
  become: yes

  vars:
    app_backup_dir: /opt/backups/{{ app_name }}
    max_failures: '{{ (ansible_play_hosts | length * 0.3) | int }}'

  pre_tasks:
    - name: Create backup directory
      file:
        path: '{{ app_backup_dir }}'
        state: directory
        mode: '0755'

  tasks:
    - name: Backup current application
      block:
        - name: Stop application service
          service:
            name: '{{ app_name }}'
            state: stopped
          register: service_stopped

        - name: Create application backup
          archive:
            path: '{{ app_directory }}'
            dest: '{{ app_backup_dir }}/backup-{{ ansible_date_time.epoch }}.tar.gz'
            format: gz
          register: backup_created

        - name: Deploy new application version
          unarchive:
            src: '{{ app_package_url }}'
            dest: '{{ app_directory }}'
            remote_src: yes
            owner: '{{ app_user }}'
            group: '{{ app_user }}'
          register: app_deployed

        - name: Start application service
          service:
            name: '{{ app_name }}'
            state: started
          register: service_started

        - name: Verify application health
          uri:
            url: 'http://{{ inventory_hostname }}:{{ app_port }}/health'
            status_code: 200
          register: health_check
          retries: 5
          delay: 10

      rescue:
        - name: Rollback on failure
          block:
            - name: Stop failed application
              service:
                name: '{{ app_name }}'
                state: stopped
              ignore_errors: yes

            - name: Restore from backup
              unarchive:
                src: '{{ app_backup_dir }}/backup-{{ ansible_date_time.epoch }}.tar.gz'
                dest: '{{ app_directory | dirname }}'
                remote_src: yes
                owner: '{{ app_user }}'
                group: '{{ app_user }}'
              when: backup_created is succeeded

            - name: Start restored application
              service:
                name: '{{ app_name }}'
                state: started

            - name: Report rollback completion
              debug:
                msg: 'Application rolled back due to deployment failure on {{ inventory_hostname }}'

          always:
            - name: Notify deployment failure
              mail:
                to: '{{ ops_email }}'
                subject: 'Deployment failed on {{ inventory_hostname }}'
                body: 'Deployment failed and was rolled back. Check logs for details.'
              delegate_to: localhost
              when: notify_on_failure | default(true)

      always:
        - name: Clean old backups (keep last 5)
          shell: |
            cd {{ app_backup_dir }}
            ls -t backup-*.tar.gz | tail -n +6 | xargs -r rm
          ignore_errors: yes
```

### Circuit Breaker Pattern

Stop execution if too many hosts fail:

```yaml
- name: Deploy with failure limits
  hosts: webservers
  max_fail_percentage: 25 # Stop if more than 25% of hosts fail
  serial: 5 # Process 5 hosts at a time

  tasks:
    - name: Deploy application
      include_role:
        name: app_deployment
```

### Retry and Recovery Patterns

Implement intelligent retry logic:

```yaml
tasks:
  - name: Download application package with retries
    get_url:
      url: '{{ app_download_url }}'
      dest: '/tmp/{{ app_package_name }}'
      timeout: 30
    register: download_result
    retries: 3
    delay: 10
    until: download_result is succeeded

  - name: Deploy with database connectivity check
    block:
      - name: Wait for database to be ready
        wait_for:
          host: '{{ database_host }}'
          port: '{{ database_port }}'
          timeout: 300
          delay: 5

      - name: Test database connection
        postgresql_ping:
          login_host: '{{ database_host }}'
          login_user: '{{ database_user }}'
          login_password: '{{ database_password }}'
        register: db_connection
        retries: 5
        delay: 15
        until: db_connection is succeeded

      - name: Run database migrations
        command: '{{ app_directory }}/migrate.sh'
        become_user: '{{ app_user }}'

    rescue:
      - name: Handle database connectivity issues
        debug:
          msg: 'Database not available, deployment postponed'

      - name: Schedule retry job
        cron:
          name: 'retry-deployment-{{ inventory_hostname }}'
          minute: '*/30'
          job: 'ansible-playbook /opt/ansible/retry-deployment.yml'
          user: ansible
```

## Performance Optimization

### Execution Strategies

Optimize playbook execution for large infrastructures:

```yaml
# Parallel execution strategies
- name: Fast deployment across many hosts
  hosts: webservers
  strategy: free # Don't wait for all hosts to complete each task
  gather_facts: no # Skip fact gathering if not needed

  tasks:
    - name: Quick service restart
      service:
        name: myapp
        state: restarted

# Serial execution for rolling updates
- name: Rolling update with load balancer management
  hosts: webservers
  serial: 2 # Process 2 hosts at a time
  max_fail_percentage: 10

  pre_tasks:
    - name: Remove from load balancer
      uri:
        url: '{{ lb_api_endpoint }}/disable/{{ inventory_hostname }}'
        method: POST

  roles:
    - app_update

  post_tasks:
    - name: Add back to load balancer
      uri:
        url: '{{ lb_api_endpoint }}/enable/{{ inventory_hostname }}'
        method: POST
```

### Fact Caching

Enable fact caching to improve performance:

```ini
# ansible.cfg
[defaults]
fact_caching = redis
fact_caching_connection = localhost:6379:0
fact_caching_timeout = 3600
fact_caching_prefix = ansible_facts_

# Or use JSON file caching
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_fact_cache
```

### Pipelining and Connection Optimization

Optimize SSH connections:

```ini
# ansible.cfg
[defaults]
host_key_checking = False
pipelining = True
forks = 20

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o PreferredAuthentications=publickey
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r
```

## CI/CD Integration

### GitLab CI Integration

Create `.gitlab-ci.yml` for automated testing and deployment:

```yaml
# .gitlab-ci.yml
---
stages:
  - lint
  - test
  - deploy-staging
  - deploy-production

variables:
  ANSIBLE_HOST_KEY_CHECKING: 'False'
  ANSIBLE_STDOUT_CALLBACK: 'yaml'

before_script:
  - pip install ansible ansible-lint yamllint
  - mkdir -p ~/.ssh
  - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
  - chmod 600 ~/.ssh/id_rsa

lint:
  stage: lint
  script:
    - yamllint .
    - ansible-lint site.yml
    - ansible-playbook --syntax-check site.yml

test:
  stage: test
  script:
    - ansible-playbook site.yml --check --diff -i inventories/test/

deploy-staging:
  stage: deploy-staging
  script:
    - ansible-playbook site.yml -i inventories/staging/ --vault-password-file $VAULT_PASSWORD
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy-production:
  stage: deploy-production
  script:
    - ansible-playbook site.yml -i inventories/production/ --vault-password-file $VAULT_PASSWORD
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main
```

### GitHub Actions Integration

Create `.github/workflows/ansible.yml`:

```yaml
name: Ansible CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install ansible ansible-lint yamllint

      - name: Run YAML Lint
        run: yamllint .

      - name: Run Ansible Lint
        run: ansible-lint site.yml

      - name: Syntax check
        run: ansible-playbook --syntax-check site.yml

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v3

      - name: Run molecule tests
        run: |
          pip install molecule[docker]
          molecule test

  deploy-staging:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to staging
        run: |
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > private_key
          chmod 600 private_key
          ansible-playbook site.yml -i inventories/staging/ \
            --private-key private_key \
            --vault-password-file <(echo "${{ secrets.VAULT_PASSWORD }}")

  deploy-production:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to production
        run: |
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > private_key
          chmod 600 private_key
          ansible-playbook site.yml -i inventories/production/ \
            --private-key private_key \
            --vault-password-file <(echo "${{ secrets.VAULT_PASSWORD }}")
```

## Team Collaboration Patterns

### Code Review Process

Establish clear review criteria for Ansible changes:

```yaml
# .github/pull_request_template.md
## Ansible Playbook Changes

### Checklist
- [ ] All tasks have descriptive names
- [ ] Variables are properly documented
- [ ] Secrets are encrypted with ansible-vault
- [ ] Changes are tested in staging environment
- [ ] Handlers are used appropriately
- [ ] Role dependencies are documented

### Testing
- [ ] `ansible-lint` passes without errors
- [ ] `yamllint` passes without errors
- [ ] Syntax check passes
- [ ] Dry run completes successfully

### Security Review
- [ ] No hardcoded secrets
- [ ] Appropriate privilege escalation
- [ ] Input validation where needed
- [ ] Backup and rollback procedures considered

### Documentation
- [ ] README updated if needed
- [ ] Variable documentation updated
- [ ] Change log entry added
```

### Environment Management

Structure environments for safe testing and deployment:

```
inventories/
├── development/
│   ├── hosts.yml
│   ├── group_vars/
│   └── host_vars/
├── staging/
│   ├── hosts.yml
│   ├── group_vars/
│   └── host_vars/
├── production/
│   ├── hosts.yml
│   ├── group_vars/
│   └── host_vars/
└── shared/
    └── group_vars/
        └── all.yml
```

Use environment-specific variable validation:

```yaml
# group_vars/production/vars.yml
---
environment: production
ssl_required: true
backup_enabled: true
monitoring_enabled: true
debug_mode: false

# Add validation
- name: Validate production environment
  assert:
    that:
      - ssl_required | bool
      - backup_enabled | bool
      - not debug_mode | bool
    fail_msg: "Production environment validation failed"
  when: environment == "production"
```

### Documentation Standards

Maintain comprehensive documentation:

    # Role: webserver

    ## Description

    Configures and manages nginx web servers with SSL support and performance optimization.

    ## Requirements

    - Ubuntu 18.04+ or CentOS 7+
    - SSL certificates (if SSL enabled)
    - Firewall configuration allowing ports 80/443

    ## Role Variables

    ### Required Variables

    - `server_name`: Primary server name for SSL certificate
    - `document_root`: Web document root directory

    ### Optional Variables

    - `ssl_enabled`: Enable SSL configuration (default: false)
    - `worker_processes`: Number of nginx worker processes (default: CPU cores)
    - `max_client_body_size`: Maximum upload size (default: 1m)

    ### Example Usage

    ```yaml
    - hosts: webservers
    roles:
        - role: webserver
        server_name: example.com
        ssl_enabled: true
        worker_processes: 4
    ```

## Testing

Run the test playbook:

```bash
ansible-playbook tests/test.yml
```

## Changelog

### v2.1.0

- Added HTTP/2 support
- Improved SSL configuration
- Added rate limiting options

### v2.0.0

- Breaking: Changed variable naming convention
- Added multi-site support
- Improved performance tuning

## Next Steps

Production-ready Ansible automation requires attention to security, testing, error handling, and team collaboration. You've learned patterns that ensure your automation is reliable, secure, and maintainable at scale.

In the final section, we'll explore advanced Ansible features and discuss how to continue your automation journey - from dynamic inventories to custom modules and integration with other tools.

The production patterns you've learned here form the foundation for managing infrastructure automation in enterprise environments, where reliability and security are paramount.
