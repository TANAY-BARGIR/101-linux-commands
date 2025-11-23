---
title: Managing Multiple Environments with Terraform
description: Learn strategies for handling development, staging, and production infrastructure with the same Terraform code
order: 8
---

**TLDR**: Use workspaces for simple environment separation with shared code. For complex setups, use separate directories with shared modules and environment-specific variable files. Never share state files between environments. Structure code so environments are isolated but share common patterns through modules.

Most projects need multiple environments - development for testing changes, staging for integration testing, and production for live traffic. Terraform provides several approaches for managing these environments.

## Workspaces: Simple Environment Separation

Terraform workspaces let you maintain multiple state files from the same configuration. Each workspace has its own state.

### Understanding Workspaces

By default, you work in the "default" workspace. Create additional workspaces for other environments:

```bash
# List workspaces
terraform workspace list

# Create new workspace
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch between workspaces
terraform workspace select dev
terraform workspace select prod

# Show current workspace
terraform workspace show
```

When you switch workspaces, Terraform uses a different state file. This lets you create the same infrastructure in multiple environments.

### Using the Current Workspace in Configuration

Reference the current workspace name in your configuration:

```hcl
locals {
  environment = terraform.workspace

  # Environment-specific settings
  instance_count = terraform.workspace == "prod" ? 5 : 1
  instance_type  = terraform.workspace == "prod" ? "t3.large" : "t3.micro"
}

resource "aws_instance" "web" {
  count         = local.instance_count
  ami           = data.aws_ami.ubuntu.id
  instance_type = local.instance_type

  tags = {
    Name        = "web-${terraform.workspace}-${count.index}"
    Environment = terraform.workspace
  }
}

output "environment" {
  value = "Deployed to ${terraform.workspace}"
}
```

Deploy to different environments:

```bash
# Deploy to dev
terraform workspace select dev
terraform apply

# Deploy to prod
terraform workspace select prod
terraform apply
```

### Workspace Limitations

Workspaces work well for simple scenarios but have limitations:

**Same backend**: All workspaces use the same backend. You can't have dev in one AWS account and prod in another.

**Easy mistakes**: Switching to the wrong workspace and running `apply` can modify the wrong environment.

**Implicit configuration**: Which workspace means which environment isn't obvious from the code.

**No isolation**: All workspaces share the same code and backend. A bad change affects all environments.

For production systems, workspace limitations often push teams toward directory-based separation.

## Directory-Based Environments

A more robust approach: separate directories for each environment, sharing code through modules.

### Directory Structure

```
terraform/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── web_server/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── database/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── terraform.tfvars
    │   └── backend.tf
    ├── staging/
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── terraform.tfvars
    │   └── backend.tf
    └── prod/
        ├── main.tf
        ├── variables.tf
        ├── terraform.tfvars
        └── backend.tf
```

Each environment directory has its own:

- State file (separate backends)
- Variable values
- Provider configurations

But they all use the same modules, keeping infrastructure patterns consistent.

### Example: Development Environment

```hcl
# environments/dev/main.tf
terraform {
  required_version = "~> 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "dev"
      ManagedBy   = "terraform"
      Project     = var.project
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"

  cidr_block         = var.vpc_cidr
  availability_zones = var.availability_zones
  name              = "${var.project}-dev"
}

module "web_servers" {
  source = "../../modules/web_server"

  count = var.web_server_count

  name          = "${var.project}-dev-web-${count.index}"
  vpc_id        = module.vpc.vpc_id
  subnet_id     = module.vpc.public_subnets[count.index % length(module.vpc.public_subnets)]
  ami_id        = var.web_server_ami
  instance_type = var.web_server_instance_type
}

module "database" {
  source = "../../modules/database"

  identifier        = "${var.project}-dev-db"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnets
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage
}
```

Development variables in `environments/dev/terraform.tfvars`:

```hcl
# environments/dev/terraform.tfvars
project            = "webapp"
aws_region         = "us-east-1"
availability_zones = ["us-east-1a", "us-east-1b"]

vpc_cidr = "10.0.0.0/16"

web_server_count         = 1
web_server_instance_type = "t3.micro"
web_server_ami           = "ami-0c55b159cbfafe1f0"

db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
```

### Example: Production Environment

Production uses the same modules but different configurations:

```hcl
# environments/prod/main.tf
terraform {
  required_version = "~> 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "prod/terraform.tfstate"  # Different state file
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      ManagedBy   = "terraform"
      Project     = var.project
    }
  }
}

# Same modules, different configurations
module "vpc" {
  source = "../../modules/vpc"

  cidr_block         = var.vpc_cidr
  availability_zones = var.availability_zones
  name              = "${var.project}-prod"
}

module "web_servers" {
  source = "../../modules/web_server"

  count = var.web_server_count

  name          = "${var.project}-prod-web-${count.index}"
  vpc_id        = module.vpc.vpc_id
  subnet_id     = module.vpc.public_subnets[count.index % length(module.vpc.public_subnets)]
  ami_id        = var.web_server_ami
  instance_type = var.web_server_instance_type
}

module "database" {
  source = "../../modules/database"

  identifier        = "${var.project}-prod-db"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnets
  instance_class    = var.db_instance_class
  allocated_storage = var.db_allocated_storage

  # Production-specific settings
  multi_az               = true
  backup_retention_period = 7
  deletion_protection    = true
}
```

Production variables in `environments/prod/terraform.tfvars`:

```hcl
# environments/prod/terraform.tfvars
project            = "webapp"
aws_region         = "us-east-1"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

vpc_cidr = "10.1.0.0/16"

web_server_count         = 5
web_server_instance_type = "t3.large"
web_server_ami           = "ami-0c55b159cbfafe1f0"

db_instance_class    = "db.t3.medium"
db_allocated_storage = 100
```

### Working with Directory-Based Environments

Deploy to each environment separately:

```bash
# Deploy development
cd environments/dev
terraform init
terraform plan
terraform apply

# Deploy production
cd ../prod
terraform init
terraform plan
terraform apply
```

Each environment is completely isolated:

- Separate state files
- Different AWS accounts possible (using different provider credentials)
- Independent apply operations
- No risk of accidentally affecting the wrong environment

## Environment-Specific Resources

Sometimes environments need fundamentally different resources. Use conditionals or separate configurations:

```hcl
# Only create in production
resource "aws_cloudwatch_alarm" "high_cpu" {
  count = var.environment == "prod" ? 1 : 0

  alarm_name          = "high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80

  alarm_actions = [aws_sns_topic.alerts[0].arn]
}

# SNS topic only in production
resource "aws_sns_topic" "alerts" {
  count = var.environment == "prod" ? 1 : 0
  name  = "infrastructure-alerts"
}
```

Or better, make this explicit in environment-specific code:

```hcl
# environments/prod/monitoring.tf
resource "aws_cloudwatch_alarm" "high_cpu" {
  # Production monitoring configuration
}

resource "aws_sns_topic" "alerts" {
  # Production alerting configuration
}
```

Development and staging don't have these files, making the differences clear.

## Shared Configuration with Terragrunt

Terragrunt is a tool that adds extra functionality to Terraform, particularly useful for managing multiple environments.

Install Terragrunt:

```bash
# macOS
brew install terragrunt

# Linux
wget https://github.com/gruntwork-io/terragrunt/releases/download/v0.54.0/terragrunt_linux_amd64
chmod +x terragrunt_linux_amd64
sudo mv terragrunt_linux_amd64 /usr/local/bin/terragrunt
```

Structure with Terragrunt:

```
terraform/
├── modules/
│   └── web_server/
│       └── main.tf
├── terragrunt.hcl  # Root configuration
└── environments/
    ├── dev/
    │   └── terragrunt.hcl
    ├── staging/
    │   └── terragrunt.hcl
    └── prod/
        └── terragrunt.hcl
```

Root `terragrunt.hcl` with shared config:

```hcl
# terragrunt.hcl
remote_state {
  backend = "s3"
  config = {
    bucket         = "mycompany-terraform-state"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

Environment-specific `terragrunt.hcl`:

```hcl
# environments/dev/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules//web_server"
}

inputs = {
  environment   = "dev"
  instance_type = "t3.micro"
  instance_count = 1
}
```

```hcl
# environments/prod/terragrunt.hcl
include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../modules//web_server"
}

inputs = {
  environment   = "prod"
  instance_type = "t3.large"
  instance_count = 5
}
```

Use Terragrunt instead of Terraform:

```bash
cd environments/dev
terragrunt plan
terragrunt apply
```

Terragrunt reduces duplication while keeping environments isolated.

## Cross-Environment References

Occasionally environments need to reference each other (dev needs the prod VPC ID for VPC peering). Use data sources with explicit state references.

In production, output the VPC ID:

```hcl
# environments/prod/outputs.tf
output "vpc_id" {
  value = module.vpc.vpc_id
}
```

In development, read prod's state:

```hcl
# environments/dev/main.tf
data "terraform_remote_state" "prod" {
  backend = "s3"
  config = {
    bucket = "mycompany-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_vpc_peering_connection" "dev_to_prod" {
  vpc_id      = module.vpc.vpc_id
  peer_vpc_id = data.terraform_remote_state.prod.outputs.vpc_id

  tags = {
    Name = "dev-to-prod-peering"
  }
}
```

Use this sparingly. Too many cross-environment references create tight coupling.

## Choosing an Approach

**Use workspaces when:**

- Learning Terraform
- Simple setups with identical environments
- All environments in the same AWS account/subscription
- Team is small and coordination is easy

**Use directory-based separation when:**

- Environments are in different accounts
- Production needs strict access controls
- Environments differ significantly
- Multiple team members work on infrastructure
- You need strong isolation between environments

Most production systems benefit from directory-based separation. The extra structure prevents mistakes and makes differences between environments explicit.

## Practical Example: Complete Multi-Environment Setup

Here's a realistic directory structure:

```
terraform/
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── database/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   ├── backend.tf
    │   └── terraform.tfvars
    ├── staging/
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   ├── backend.tf
    │   └── terraform.tfvars
    └── prod/
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        ├── backend.tf
        ├── terraform.tfvars
        └── monitoring.tf  # Production-only resources
```

Each environment is independent but uses shared modules. Changes to modules propagate to all environments, but each environment controls when to apply those changes.

Understanding environment management helps you scale Terraform from a single test environment to a production-ready multi-environment setup. Next, we'll cover remote backends and team collaboration - how to work on Terraform with multiple people safely.
