---
title: Organizing Code with Terraform Modules
description: Learn how to create reusable infrastructure components with modules and use community modules
order: 7
---

**TLDR**: Modules are reusable Terraform configurations. Put related resources in a directory with variables and outputs, then call that module multiple times with different inputs. Use modules to avoid repetition, enforce standards, and share infrastructure patterns across teams.

As your Terraform configurations grow, modules help organize code into reusable components. Instead of copying infrastructure definitions, package them as modules and use them wherever needed.

## What Are Modules?

Every Terraform configuration is a module. The files in your working directory form the "root module". When you create subdirectories with their own configurations, those become "child modules" that the root module can call.

A module is just a directory containing:

- Resource definitions (`.tf` files)
- Variable declarations (inputs)
- Output declarations (return values)
- Optionally: documentation, examples, tests

```
project/
├── main.tf              # Root module
├── variables.tf
├── outputs.tf
└── modules/             # Child modules
    ├── vpc/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── web_server/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

## Creating Your First Module

Let's create a module for a web server with a security group.

Create `modules/web_server/main.tf`:

```hcl
# modules/web_server/main.tf
resource "aws_security_group" "web" {
  name        = "${var.name}-sg"
  description = "Security group for ${var.name}"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP from anywhere"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS from anywhere"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name}-sg"
    }
  )
}

resource "aws_instance" "web" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [aws_security_group.web.id]

  user_data = var.user_data

  root_block_device {
    volume_size = var.disk_size
  }

  tags = merge(
    var.tags,
    {
      Name = var.name
    }
  )
}
```

Define inputs in `modules/web_server/variables.tf`:

```hcl
# modules/web_server/variables.tf
variable "name" {
  description = "Name for the web server"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where resources will be created"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID for the instance"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for the instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "disk_size" {
  description = "Root disk size in GB"
  type        = number
  default     = 20
}

variable "user_data" {
  description = "User data script"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

Define outputs in `modules/web_server/outputs.tf`:

```hcl
# modules/web_server/outputs.tf
output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "instance_public_ip" {
  description = "Public IP address"
  value       = aws_instance.web.public_ip
}

output "instance_private_ip" {
  description = "Private IP address"
  value       = aws_instance.web.private_ip
}

output "security_group_id" {
  description = "ID of the security group"
  value       = aws_security_group.web.id
}
```

## Using Modules

Now use this module in your root configuration:

```hcl
# main.tf
module "web_server" {
  source = "./modules/web_server"

  name          = "production-web"
  vpc_id        = aws_vpc.main.id
  subnet_id     = aws_subnet.public.id
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t3.small"
  disk_size     = 30

  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y nginx
              systemctl start nginx
              EOF

  tags = {
    Environment = "production"
    Project     = "web-app"
  }
}

# Access module outputs
output "web_server_ip" {
  value = module.web_server.instance_public_ip
}
```

The `source` argument tells Terraform where to find the module. It can be:

- Local path: `./modules/web_server`
- Git repository: `git::https://github.com/user/terraform-modules.git//web_server?ref=v1.0.0`
- Terraform Registry: `terraform-aws-modules/vpc/aws` (shown later)
- HTTP URL: `https://example.com/terraform-modules/web_server.zip`

When you run `terraform init`, Terraform downloads and caches modules from remote sources.

## Multiple Module Instances

Use the same module multiple times with different configurations:

```hcl
module "web_server_1" {
  source = "./modules/web_server"

  name          = "web-1"
  vpc_id        = aws_vpc.main.id
  subnet_id     = aws_subnet.public_a.id
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  tags = {
    Environment = "dev"
    Role        = "web"
  }
}

module "web_server_2" {
  source = "./modules/web_server"

  name          = "web-2"
  vpc_id        = aws_vpc.main.id
  subnet_id     = aws_subnet.public_b.id
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  tags = {
    Environment = "dev"
    Role        = "web"
  }
}

module "api_server" {
  source = "./modules/web_server"

  name          = "api"
  vpc_id        = aws_vpc.main.id
  subnet_id     = aws_subnet.private.id
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = "t3.small"

  tags = {
    Environment = "dev"
    Role        = "api"
  }
}
```

Each module call creates its own set of resources.

## Module Count and For_Each

Create multiple instances of an entire module:

```hcl
variable "web_servers" {
  type = map(object({
    subnet_id     = string
    instance_type = string
  }))

  default = {
    web-1 = {
      subnet_id     = "subnet-abc123"
      instance_type = "t3.micro"
    }
    web-2 = {
      subnet_id     = "subnet-def456"
      instance_type = "t3.micro"
    }
    api = {
      subnet_id     = "subnet-ghi789"
      instance_type = "t3.small"
    }
  }
}

module "servers" {
  for_each = var.web_servers
  source   = "./modules/web_server"

  name          = each.key
  vpc_id        = aws_vpc.main.id
  subnet_id     = each.value.subnet_id
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = each.value.instance_type

  tags = {
    Environment = "production"
  }
}

# Access a specific module's output
output "web_1_ip" {
  value = module.servers["web-1"].instance_public_ip
}

# Access all module outputs
output "all_server_ips" {
  value = { for k, v in module.servers : k => v.instance_public_ip }
}
```

## Using Public Modules

The Terraform Registry hosts thousands of community modules. Let's use the popular AWS VPC module:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false

  tags = {
    Environment = "dev"
    Project     = "web-app"
  }
}

# Use module outputs
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = module.vpc.public_subnets[0]

  vpc_security_group_ids = [aws_security_group.web.id]
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = module.vpc.vpc_id

  # ... rules ...
}
```

Always pin module versions to avoid unexpected changes:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"  # Allow 5.x but not 6.0

  # ...
}
```

Find modules at [registry.terraform.io](https://registry.terraform.io/browse/modules).

## Nested Modules

Modules can call other modules. Create a module for a complete application:

```hcl
# modules/web_app/main.tf
module "vpc" {
  source = "../vpc"

  cidr_block = var.vpc_cidr
  name       = "${var.name}-vpc"
  tags       = var.tags
}

module "web_servers" {
  source = "../web_server"

  for_each = var.server_configs

  name          = "${var.name}-${each.key}"
  vpc_id        = module.vpc.vpc_id
  subnet_id     = module.vpc.public_subnet_ids[0]
  ami_id        = var.ami_id
  instance_type = each.value.instance_type

  tags = merge(var.tags, {
    Server = each.key
  })
}

module "database" {
  source = "../rds"

  name             = "${var.name}-db"
  vpc_id           = module.vpc.vpc_id
  subnet_ids       = module.vpc.private_subnet_ids
  instance_class   = var.db_instance_class
  allocated_storage = var.db_allocated_storage

  tags = var.tags
}
```

This "web_app" module orchestrates VPC, web server, and database modules.

## Module Best Practices

### Keep Modules Focused

Each module should have a single, clear purpose:

- Good: `vpc`, `web_server`, `rds_database`
- Bad: `entire_infrastructure`

Small, focused modules are easier to test, understand, and reuse.

### Document Your Modules

Add a `README.md` explaining what the module does, required inputs, and outputs:

```markdown
# Web Server Module

Creates an EC2 instance with a security group configured for web traffic.

## Usage

\`\`\`hcl
module "web" {
  source = "./modules/web_server"

  name      = "my-web-server"
  vpc_id    = "vpc-abc123"
  subnet_id = "subnet-def456"
  ami_id    = "ami-0c55b159cbfafe1f0"
}
\`\`\`

## Requirements

- AWS provider >= 5.0
- VPC must already exist
- Subnet must be in the VPC

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| name | Server name | string | - | yes |
| vpc_id | VPC ID | string | - | yes |
| instance_type | Instance type | string | t3.micro | no |

## Outputs

| Name | Description |
|------|-------------|
| instance_id | EC2 instance ID |
| instance_public_ip | Public IP address |
```

### Provide Examples

Include an `examples/` directory showing how to use the module:

```
modules/web_server/
├── main.tf
├── variables.tf
├── outputs.tf
├── README.md
└── examples/
    ├── basic/
    │   └── main.tf
    └── complete/
        └── main.tf
```

### Version Your Modules

If sharing modules across projects, version them with Git tags:

```bash
git tag -a v1.0.0 -m "Initial release"
git push --tags
```

Reference specific versions:

```hcl
module "web_server" {
  source = "git::https://github.com/yourorg/terraform-modules.git//web_server?ref=v1.0.0"

  # ...
}
```

### Avoid Hardcoded Values

Make modules configurable with variables instead of hardcoding values:

```hcl
# Bad - hardcoded
resource "aws_instance" "web" {
  instance_type = "t3.micro"
  # ...
}

# Good - configurable
resource "aws_instance" "web" {
  instance_type = var.instance_type
  # ...
}
```

### Use Sensible Defaults

Provide defaults for optional variables:

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "disk_size" {
  description = "Root disk size in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.disk_size >= 8 && var.disk_size <= 1000
    error_message = "Disk size must be between 8 and 1000 GB."
  }
}
```

This makes modules easier to use while still allowing customization.

## Practical Example: Complete Application

Here's a realistic multi-module setup:

```hcl
# Root main.tf
terraform {
  required_version = "~> 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC module
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.2"

  name = "${var.project}-${var.environment}-vpc"
  cidr = var.vpc_cidr

  azs             = data.aws_availability_zones.available.names
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "prod"
  enable_dns_hostnames = true

  tags = local.common_tags
}

# Web server module
module "web_servers" {
  source = "./modules/web_server"

  for_each = var.web_server_configs

  name          = "${var.project}-${var.environment}-${each.key}"
  vpc_id        = module.vpc.vpc_id
  subnet_id     = module.vpc.public_subnets[each.value.subnet_index]
  ami_id        = data.aws_ami.ubuntu.id
  instance_type = each.value.instance_type

  tags = merge(local.common_tags, {
    Role = "web"
  })
}

# Database module
module "database" {
  source = "./modules/rds"

  identifier        = "${var.project}-${var.environment}-db"
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnets
  instance_class    = var.environment == "prod" ? "db.t3.medium" : "db.t3.micro"
  allocated_storage = var.environment == "prod" ? 100 : 20

  allowed_security_groups = [
    for server in module.web_servers : server.security_group_id
  ]

  tags = merge(local.common_tags, {
    Role = "database"
  })
}

# Load balancer module
module "load_balancer" {
  source = "./modules/alb"

  name               = "${var.project}-${var.environment}-alb"
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.public_subnets
  target_instance_ids = [
    for server in module.web_servers : server.instance_id
  ]

  tags = merge(local.common_tags, {
    Role = "load-balancer"
  })
}

# Outputs
output "load_balancer_endpoint" {
  description = "Application endpoint"
  value       = "http://${module.load_balancer.dns_name}"
}

output "web_server_ips" {
  description = "Web server IP addresses"
  value       = { for k, v in module.web_servers : k => v.instance_public_ip }
}

output "database_endpoint" {
  description = "Database connection string"
  value       = module.database.endpoint
  sensitive   = true
}
```

This setup demonstrates:

- Using public registry modules (VPC)
- Using custom local modules (web servers, database, load balancer)
- Module for_each for multiple instances
- Passing outputs between modules
- Environment-specific configurations
- Consistent tagging across all modules

Modules are how you scale Terraform from simple configurations to complex, maintainable infrastructure. Next, we'll explore managing multiple environments with the same code.
