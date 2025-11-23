---
title: 'Installing and Setting Up Ansible'
description: 'Get Ansible installed on your system and establish your first connection to remote servers.'
order: 1
---

Getting Ansible up and running is straightforward. Unlike other configuration management tools, you only need to install Ansible on one machine (called the "control node") - the servers you'll manage don't need any special software installed.

## Installing Ansible

The installation method depends on your operating system and preferences. Here are the most reliable approaches:

### On macOS with Homebrew

If you're using macOS, Homebrew provides the simplest installation:

```bash
brew install ansible
```

This installs the latest stable version along with all necessary dependencies.

### On Ubuntu/Debian

For Ubuntu and Debian systems, use the official package repository:

```bash
# Add the Ansible PPA for the latest version
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository --yes --update ppa:ansible/ansible

# Install Ansible
sudo apt install ansible
```

The PPA ensures you get recent versions rather than the older packages in the default repositories.

### Using pip (Universal)

If you prefer Python's package manager or need the latest features:

```bash
# Install using pip3
pip3 install ansible

# Or install in a virtual environment (recommended)
python3 -m venv ansible-env
source ansible-env/bin/activate
pip install ansible
```

Using a virtual environment prevents conflicts with other Python packages on your system.

### Verifying Your Installation

Check that Ansible installed correctly:

```bash
ansible --version
```

You should see output showing the Ansible version, Python version, and configuration file locations. Something like:

```
ansible [core 2.14.2]
  config file = None
  configured module search path = ['/home/user/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/lib/python3/dist-packages/ansible
  ansible collection location = /home/user/.ansible/collections:/usr/share/ansible/collections
  executable location = /usr/bin/ansible
  python version = 3.10.6
```

## Preparing Your Servers

Ansible connects to remote servers using SSH, so you'll need SSH access to the machines you want to manage. Here's how to set this up properly:

### SSH Key Authentication

Password authentication works, but SSH keys are more secure and convenient for automation. If you don't already have SSH keys set up:

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy your public key to the target server
ssh-copy-id user@server-ip-address
```

Replace `user` with the username you'll use on the remote server, and `server-ip-address` with your server's IP address or hostname.

### Testing SSH Access

Verify you can connect without entering a password:

```bash
ssh user@server-ip-address
```

If this works without prompting for a password, you're ready to use Ansible.

## Your First Ansible Command

Ansible can run individual commands across servers without writing any configuration files. This "ad-hoc" mode is perfect for quick tasks and testing connectivity.

### Testing Connection

Let's verify Ansible can reach your server:

```bash
ansible all -i "server-ip-address," -u user -m ping
```

Breaking down this command:

- `all` tells Ansible to target all hosts
- `-i "server-ip-address,"` specifies your server's IP (the comma is important for single hosts)
- `-u user` specifies the SSH username
- `-m ping` uses Ansible's ping module to test connectivity

If successful, you'll see output like:

```
server-ip-address | SUCCESS => {
    "ansible_facts": {
        "discovered_interpreter_python": "/usr/bin/python3"
    },
    "changed": false,
    "ping": "pong"
}
```

This confirms Ansible can connect to your server and execute commands.

### Running System Commands

Try running a simple command on your remote server:

```bash
ansible all -i "server-ip-address," -u user -m shell -a "uptime"
```

This executes the `uptime` command and returns the results. You'll see how long the server has been running and its current load.

## Creating Your First Inventory File

Typing server details in every command gets tedious quickly. Inventory files solve this by defining your servers in a reusable format.

Create a file called `inventory.ini`:

```ini
[webservers]
web1 ansible_host=192.168.1.10 ansible_user=ubuntu
web2 ansible_host=192.168.1.11 ansible_user=ubuntu

[databases]
db1 ansible_host=192.168.1.20 ansible_user=ubuntu
```

This inventory defines two groups: `webservers` with two hosts, and `databases` with one host. Each host has an alias (like `web1`) and connection details.

Now you can run commands against groups or individual hosts:

```bash
# Ping all servers
ansible all -i inventory.ini -m ping

# Ping only web servers
ansible webservers -i inventory.ini -m ping

# Ping a specific host
ansible web1 -i inventory.ini -m ping
```

## Setting Up a Configuration File

Rather than specifying the inventory file every time, create an `ansible.cfg` file in your working directory:

```ini
[defaults]
inventory = inventory.ini
host_key_checking = False
remote_user = ubuntu
```

This configuration:

- Sets the default inventory file
- Disables SSH host key checking (useful for dynamic environments)
- Sets the default remote user

Now you can run simpler commands:

```bash
# These commands now work without specifying inventory or user
ansible all -m ping
ansible webservers -m shell -a "df -h"
```

## Common Connection Issues

If you encounter problems, here are the most common solutions:

### SSH Connection Refused

```
server-ip-address | UNREACHABLE! => {
    "changed": false,
    "msg": "Failed to connect to the host via ssh",
    "unreachable": true
}
```

Check that:

- The server IP address is correct
- SSH is running on the server (usually port 22)
- Your SSH key is properly configured
- Firewall rules allow SSH connections

### Python Not Found

```
server-ip-address | FAILED! => {
    "changed": false,
    "module_stderr": "/bin/sh: 1: /usr/bin/python: not found",
    "msg": "The module failed to execute correctly"
}
```

Some modern Linux distributions don't include Python by default. Install it:

```bash
# On the remote server
sudo apt update && sudo apt install python3

# Or specify Python 3 in your inventory
web1 ansible_host=192.168.1.10 ansible_user=ubuntu ansible_python_interpreter=/usr/bin/python3
```

### Permission Denied

If you need to run commands that require sudo access, add the `--become` flag:

```bash
ansible all -m shell -a "apt update" --become
```

Or configure sudo access in your inventory:

```ini
[webservers]
web1 ansible_host=192.168.1.10 ansible_user=ubuntu ansible_become=true
```

## Next Steps

You now have Ansible installed and can connect to your servers. You've run ad-hoc commands and created basic inventory files. In the next section, we'll explore Ansible's fundamental concepts: modules, playbooks, and how they work together to automate complex tasks.

The foundation you've built here - proper SSH connectivity and inventory management - supports everything else you'll do with Ansible.

Happy configuring!
