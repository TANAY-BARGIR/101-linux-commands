---
title: Installing and Setting Up Terraform
description: Get Terraform installed on your system and create your first infrastructure
order: 2
---

**TLDR**: Download the Terraform binary for your OS, add it to your PATH, and run `terraform version` to verify. Set up credentials for your cloud provider. Create a directory with a `.tf` file, run `terraform init`, then `terraform plan` and `terraform apply` to create infrastructure.

Getting Terraform running is straightforward - it's a single binary with no dependencies. The challenge is often configuring authentication with your cloud provider, which we'll cover for the most common platforms.

## Installing Terraform

Terraform works on Linux, macOS, and Windows. Choose the method that fits your workflow.

### On macOS with Homebrew

For macOS users, Homebrew provides the easiest installation:

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

This installs the latest version and sets up automatic updates through Homebrew.

### On Linux

For Debian/Ubuntu:

```bash
# Add HashiCorp's GPG key
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

# Add the HashiCorp repository
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list

# Install Terraform
sudo apt update && sudo apt install terraform
```

For Red Hat/CentOS/Fedora:

```bash
# Add HashiCorp repository
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo

# Install Terraform
sudo yum install terraform
```

### Manual Installation (All Platforms)

If you prefer manual installation or use Windows:

1. Download the appropriate package from [terraform.io/downloads](https://terraform.io/downloads)
2. Extract the archive
3. Move the terraform binary to a directory in your system PATH

On Linux/macOS:

```bash
# Download (replace with current version)
wget https://releases.hashicorp.com/terraform/1.6.5/terraform_1.6.5_linux_amd64.zip

# Extract
unzip terraform_1.6.5_linux_amd64.zip

# Move to PATH
sudo mv terraform /usr/local/bin/

# Verify
terraform version
```

On Windows, extract the zip file and add the directory containing `terraform.exe` to your PATH environment variable through System Properties.

### Verifying Installation

Check that Terraform is installed correctly:

```bash
terraform version
```

You should see output like:

```
Terraform v1.6.5
on linux_amd64
```

The version number may differ, but seeing this output confirms Terraform is ready to use.

## Setting Up Cloud Provider Credentials

Terraform needs credentials to create resources in your cloud provider. We'll cover AWS, DigitalOcean, and Google Cloud - the setup pattern is similar for other providers.

### AWS Credentials

The AWS provider needs access keys to authenticate. Create an IAM user with programmatic access if you don't have one:

1. Go to AWS Console → IAM → Users → Add User
2. Enable "Programmatic access"
3. Attach appropriate policies (start with AdministratorAccess for learning, use more restrictive policies for production)
4. Save the Access Key ID and Secret Access Key

Configure credentials using the AWS CLI:

```bash
# Install AWS CLI if needed
# On macOS: brew install awscli
# On Linux: sudo apt install awscli or sudo yum install awscli

# Configure credentials
aws configure
```

Enter your access key, secret key, default region (like `us-east-1`), and output format (use `json`).

This creates `~/.aws/credentials` and `~/.aws/config` files that Terraform automatically uses.

Alternatively, set environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="us-east-1"
```

### DigitalOcean Credentials

DigitalOcean uses API tokens instead of key pairs:

1. Go to DigitalOcean Control Panel → API → Generate New Token
2. Give it a name and enable both read and write scopes
3. Copy the token immediately (you can't view it again)

Set it as an environment variable:

```bash
export DIGITALOCEAN_TOKEN="your-api-token"
```

Or specify it directly in your Terraform configuration (less secure):

```hcl
provider "digitalocean" {
  token = "your-api-token"  # Don't commit this to version control
}
```

### Google Cloud Credentials

For Google Cloud, create a service account:

1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Create a service account with appropriate roles
3. Create and download a JSON key file

Set the credentials file path:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/keyfile.json"
```

Or reference it in your configuration:

```hcl
provider "google" {
  credentials = file("/path/to/keyfile.json")
  project     = "your-project-id"
  region      = "us-central1"
}
```

## Creating Your First Infrastructure

Let's create a simple DigitalOcean Droplet to see the complete workflow. This example works with a free trial account.

### Project Setup

Create a directory for your Terraform project:

```bash
mkdir terraform-learn
cd terraform-learn
```

Create a file called `main.tf`:

```hcl
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

resource "digitalocean_droplet" "web" {
  image  = "ubuntu-22-04-x64"
  name   = "web-1"
  region = "nyc3"
  size   = "s-1vcpu-1gb"
}

output "droplet_ip" {
  value = digitalocean_droplet.web.ipv4_address
}
```

This configuration:

- Declares the DigitalOcean provider as a dependency
- Configures the provider with an API token from a variable
- Creates a 1GB Droplet running Ubuntu 22.04 in New York
- Outputs the Droplet's IP address after creation

### Initialize Terraform

Download the required provider:

```bash
terraform init
```

You'll see Terraform download the DigitalOcean provider plugin:

```
Initializing the backend...

Initializing provider plugins...
- Finding digitalocean/digitalocean versions matching "~> 2.0"...
- Installing digitalocean/digitalocean v2.34.1...
- Installed digitalocean/digitalocean v2.34.1

Terraform has been successfully initialized!
```

This creates a `.terraform` directory containing the provider plugin and a `.terraform.lock.hcl` file that locks provider versions.

### Plan the Changes

See what Terraform will do before actually doing it:

```bash
terraform plan -var="do_token=$DIGITALOCEAN_TOKEN"
```

Terraform shows you the execution plan:

```
Terraform will perform the following actions:

  # digitalocean_droplet.web will be created
  + resource "digitalocean_droplet" "web" {
      + backups              = false
      + created_at           = (known after apply)
      + disk                 = (known after apply)
      + id                   = (known after apply)
      + image                = "ubuntu-22-04-x64"
      + ipv4_address         = (known after apply)
      + ipv4_address_private = (known after apply)
      + ipv6                 = false
      + locked               = (known after apply)
      + memory               = (known after apply)
      + monitoring           = false
      + name                 = "web-1"
      + price_hourly         = (known after apply)
      + price_monthly        = (known after apply)
      + region               = "nyc3"
      + size                 = "s-1vcpu-1gb"
      + status               = (known after apply)
      + urn                  = (known after apply)
      + vcpus                = (known after apply)
      + volume_ids           = (known after apply)
      + vpc_uuid             = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.

Changes to Outputs:
  + droplet_ip = (known after apply)
```

Review this carefully. The `+` means creating a new resource. Properties showing `(known after apply)` will be populated after the resource is created.

### Apply the Changes

If the plan looks good, create the infrastructure:

```bash
terraform apply -var="do_token=$DIGITALOCEAN_TOKEN"
```

Terraform shows the same plan and asks for confirmation:

```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value:
```

Type `yes` and press Enter. Terraform creates the Droplet:

```
digitalocean_droplet.web: Creating...
digitalocean_droplet.web: Still creating... [10s elapsed]
digitalocean_droplet.web: Still creating... [20s elapsed]
digitalocean_droplet.web: Creation complete after 30s [id=123456789]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

droplet_ip = "143.198.123.45"
```

Your Droplet is now running. Check DigitalOcean's control panel to see it.

### Verify State

Terraform created a `terraform.tfstate` file tracking the resources it manages:

```bash
terraform show
```

This displays the current state in a readable format, showing all resource details.

### Modify Infrastructure

Let's add tags to the Droplet. Edit `main.tf`:

```hcl
resource "digitalocean_droplet" "web" {
  image  = "ubuntu-22-04-x64"
  name   = "web-1"
  region = "nyc3"
  size   = "s-1vcpu-1gb"
  tags   = ["web", "production"]  # Add this line
}
```

Plan and apply the change:

```bash
terraform plan -var="do_token=$DIGITALOCEAN_TOKEN"
terraform apply -var="do_token=$DIGITALOCEAN_TOKEN"
```

Terraform detects the modification:

```
  # digitalocean_droplet.web will be updated in-place
  ~ resource "digitalocean_droplet" "web" {
        id     = "123456789"
        name   = "web-1"
      ~ tags   = [
          + "production",
          + "web",
        ]
        # (other attributes unchanged)
    }

Plan: 0 to add, 1 to change, 0 to destroy.
```

The `~` symbol indicates an in-place update. This won't recreate the Droplet, just modify it.

### Clean Up

When you're done experimenting, destroy the resources to avoid charges:

```bash
terraform destroy -var="do_token=$DIGITALOCEAN_TOKEN"
```

Terraform shows what it will delete:

```
  # digitalocean_droplet.web will be destroyed
  - resource "digitalocean_droplet" "web" {
      - id     = "123456789" -> null
      - image  = "ubuntu-22-04-x64" -> null
      - name   = "web-1" -> null
      - region = "nyc3" -> null
      - size   = "s-1vcpu-1gb" -> null
      - tags   = ["production", "web"] -> null
        # (other attributes omitted)
    }

Plan: 0 to add, 0 to change, 1 to destroy.

Do you really want to destroy all resources?
  Terraform will destroy all your managed infrastructure, as shown above.
  There is no undo. Only 'yes' will be accepted to confirm.

  Enter a value:
```

Type `yes` to confirm. Terraform deletes the Droplet.

## Understanding What Just Happened

You completed the entire Terraform workflow:

1. **Wrote configuration** describing desired infrastructure
2. **Initialized** to download required providers
3. **Planned** to preview changes before making them
4. **Applied** to create actual infrastructure
5. **Modified** existing infrastructure by changing configuration
6. **Destroyed** resources when no longer needed

This same workflow works for any provider and any scale. Whether you're managing one resource or thousands, the process stays consistent.

## Common Setup Issues

### Provider Plugin Installation Fails

If `terraform init` can't download providers:

```bash
# Clear the plugin cache and try again
rm -rf .terraform
terraform init
```

Check your internet connection and firewall settings. Corporate networks sometimes block the Terraform registry.

### Authentication Errors

If you see "authentication failed" or "unauthorized":

- Verify credentials are correct
- Check that environment variables are set in your current shell session
- Make sure your cloud account is active and has billing enabled
- Confirm your IAM user or service account has necessary permissions

For AWS, test credentials:

```bash
aws sts get-caller-identity
```

This should return your user information if credentials work.

### State File Conflicts

If you see "state file locked" or similar errors, someone else might be running Terraform in the same directory, or a previous run crashed. We'll cover state locking in detail later.

## Securing Your Setup

Before moving forward, understand these security basics:

**Never commit credentials to version control**. Use environment variables or credential files outside your project directory.

**Don't commit `terraform.tfstate`** to version control. It contains sensitive information about your infrastructure. Use a `.gitignore` file:

```bash
# Create .gitignore
cat > .gitignore << EOF
.terraform/
*.tfstate
*.tfstate.backup
.terraform.lock.hcl
EOF
```

**Use variables for sensitive values**. Mark them as sensitive so they won't appear in logs:

```hcl
variable "database_password" {
  type      = string
  sensitive = true
}
```

We'll cover more security practices later, but these basics prevent common mistakes.

## Next Steps

You now have Terraform installed and have created your first infrastructure. You've seen the basic workflow and understand how Terraform tracks state. In the next section, we'll dive deeper into the configuration language itself - how to write resources, use expressions, and organize your code.
