---
title: Variables and Outputs in Terraform
description: Learn how to parameterize configurations with input variables and expose information with outputs
order: 6
---

**TLDR**: Variables make configurations reusable - define them with type and default, set them via CLI, files, or environment variables. Outputs expose values after applying - like IP addresses or resource IDs. Use validation rules to catch errors early and sensitive flags to hide secrets.

Variables and outputs are how you make Terraform configurations flexible and informative. Variables let you customize behavior without changing code. Outputs extract information about created resources.

## Input Variables

Variables parameterize your configuration so you can use it in different scenarios without modification.

### Basic Variable Declaration

Declare variables with the `variable` block:

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "instance_count" {
  description = "Number of instances to create"
  type        = number
  default     = 1
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = false
}
```

Use variables in your configuration:

```hcl
resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type
  monitoring    = var.enable_monitoring

  tags = {
    Name = "web-${count.index}"
  }
}
```

### Variable Types

Terraform supports several types:

**Primitive types**:

```hcl
variable "string_example" {
  type    = string
  default = "hello"
}

variable "number_example" {
  type    = number
  default = 42
}

variable "bool_example" {
  type    = bool
  default = true
}
```

**Collection types**:

```hcl
variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "instance_tags" {
  type = map(string)
  default = {
    Environment = "development"
    Project     = "web-app"
  }
}

variable "allowed_ports" {
  type    = set(number)
  default = [80, 443, 8080]
}
```

**Structural types**:

```hcl
variable "server_config" {
  type = object({
    instance_type = string
    disk_size     = number
    enable_backup = bool
  })

  default = {
    instance_type = "t3.micro"
    disk_size     = 20
    enable_backup = false
  }
}

variable "subnet_configs" {
  type = list(object({
    cidr_block        = string
    availability_zone = string
    public            = bool
  }))

  default = [
    {
      cidr_block        = "10.0.1.0/24"
      availability_zone = "us-east-1a"
      public            = true
    },
    {
      cidr_block        = "10.0.2.0/24"
      availability_zone = "us-east-1b"
      public            = false
    }
  ]
}
```

Using complex types:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.server_config.instance_type

  root_block_device {
    volume_size = var.server_config.disk_size
  }

  tags = var.instance_tags
}

resource "aws_subnet" "subnets" {
  for_each = { for idx, subnet in var.subnet_configs : idx => subnet }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr_block
  availability_zone       = each.value.availability_zone
  map_public_ip_on_launch = each.value.public
}
```

### Setting Variable Values

There are several ways to provide values:

**Command line**:

```bash
terraform apply -var="instance_type=t3.large" -var="instance_count=3"
```

**Variable files**:

Create `terraform.tfvars`:

```hcl
instance_type   = "t3.large"
instance_count  = 3
enable_monitoring = true

instance_tags = {
  Environment = "production"
  Project     = "web-app"
  Team        = "platform"
}
```

Terraform automatically loads `terraform.tfvars` and `*.auto.tfvars` files.

For environment-specific configs:

```bash
# dev.tfvars
instance_type  = "t3.micro"
instance_count = 1

# prod.tfvars
instance_type  = "t3.large"
instance_count = 5
```

Apply with:

```bash
terraform apply -var-file="dev.tfvars"
terraform apply -var-file="prod.tfvars"
```

**Environment variables**:

```bash
export TF_VAR_instance_type="t3.large"
export TF_VAR_instance_count=3
terraform apply
```

Terraform reads any environment variable starting with `TF_VAR_`.

**Interactive input**:

If a variable has no default and you don't provide a value, Terraform prompts:

```bash
$ terraform apply
var.instance_type
  EC2 instance type

  Enter a value: t3.micro
```

### Variable Priority

When multiple sources provide values, Terraform uses this precedence (highest to lowest):

1. Command-line flags (`-var`)
2. `*.auto.tfvars` files (alphabetical order)
3. `terraform.tfvars` file
4. Environment variables (`TF_VAR_*`)
5. Default values in variable declarations

### Variable Validation

Add validation rules to catch errors before infrastructure changes:

```hcl
variable "instance_type" {
  type        = string
  description = "EC2 instance type"

  validation {
    condition     = can(regex("^t3\\.", var.instance_type))
    error_message = "Instance type must be from the t3 family."
  }
}

variable "environment" {
  type        = string
  description = "Environment name"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "disk_size" {
  type        = number
  description = "Root disk size in GB"

  validation {
    condition     = var.disk_size >= 20 && var.disk_size <= 1000
    error_message = "Disk size must be between 20 and 1000 GB."
  }
}
```

If validation fails, Terraform shows the error before making changes:

```
Error: Invalid value for variable

  on variables.tf line 12:
  12: variable "environment" {

Environment must be dev, staging, or prod.
```

### Sensitive Variables

Mark variables containing secrets:

```hcl
variable "database_password" {
  type        = string
  description = "Database admin password"
  sensitive   = true
}

variable "api_key" {
  type      = string
  sensitive = true
}
```

Terraform won't show these values in logs or output:

```
# aws_db_instance.main will be created
+ resource "aws_db_instance" "main" {
    + password = (sensitive value)
    ...
  }
```

Still never commit secrets to version control. Use environment variables or secret management systems.

## Output Values

Outputs expose information about your infrastructure after Terraform creates it.

### Basic Outputs

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}

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
```

After `terraform apply`, outputs appear:

```
Apply complete! Resources: 1 added, 0 changed, 0 destroyed.

Outputs:

instance_id = "i-0123456789abcdef"
instance_private_ip = "10.0.1.25"
instance_public_ip = "54.123.45.67"
```

View outputs anytime:

```bash
terraform output
```

Get a specific output:

```bash
terraform output instance_public_ip
```

Get JSON format:

```bash
terraform output -json
```

### Complex Outputs

Output collections and structures:

```hcl
resource "aws_instance" "web" {
  count         = 3
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
}

output "all_instance_ids" {
  description = "IDs of all instances"
  value       = aws_instance.web[*].id
}

output "all_instance_ips" {
  description = "Public IPs of all instances"
  value       = aws_instance.web[*].public_ip
}

output "instance_details" {
  description = "Detailed information about instances"
  value = {
    ids         = aws_instance.web[*].id
    public_ips  = aws_instance.web[*].public_ip
    private_ips = aws_instance.web[*].private_ip
  }
}
```

Output:

```
Outputs:

all_instance_ids = [
  "i-0123456789abcdef",
  "i-0123456789abcdeg",
  "i-0123456789abcdeh",
]

instance_details = {
  "ids" = [
    "i-0123456789abcdef",
    "i-0123456789abcdeg",
    "i-0123456789abcdeh",
  ]
  "private_ips" = [
    "10.0.1.25",
    "10.0.1.26",
    "10.0.1.27",
  ]
  "public_ips" = [
    "54.123.45.67",
    "54.123.45.68",
    "54.123.45.69",
  ]
}
```

### Sensitive Outputs

Hide sensitive information in output:

```hcl
resource "aws_db_instance" "main" {
  identifier = "mydb"
  engine     = "postgres"
  password   = var.database_password
  # ... other config ...
}

output "database_endpoint" {
  description = "Database connection endpoint"
  value       = aws_db_instance.main.endpoint
}

output "database_password" {
  description = "Database password"
  value       = aws_db_instance.main.password
  sensitive   = true
}
```

Sensitive outputs don't appear in normal output:

```
Outputs:

database_endpoint = "mydb.abc123.us-east-1.rds.amazonaws.com:5432"
database_password = <sensitive>
```

Retrieve the value explicitly:

```bash
terraform output database_password
```

Or with `-json` to parse it:

```bash
terraform output -json database_password | jq -r
```

### Outputs from Modules

Outputs are how modules return values. If you use a VPC module:

```hcl
module "vpc" {
  source = "./modules/vpc"

  cidr_block = "10.0.0.0/16"
  name       = "main-vpc"
}

# Use the module's outputs
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = module.vpc.public_subnet_id  # Output from module
}

# Re-export module outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}
```

## Practical Example: Flexible Infrastructure

Here's a complete example using variables and outputs:

```hcl
# variables.tf
variable "environment" {
  description = "Environment name"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "webapp"
}

variable "instance_configs" {
  description = "Configuration for each instance type"
  type = map(object({
    instance_type = string
    count         = number
    disk_size     = number
  }))

  default = {
    dev = {
      instance_type = "t3.micro"
      count         = 1
      disk_size     = 20
    }
    staging = {
      instance_type = "t3.small"
      count         = 2
      disk_size     = 30
    }
    prod = {
      instance_type = "t3.large"
      count         = 5
      disk_size     = 50
    }
  }
}

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed to SSH"
  type        = list(string)
  default     = []
}

# main.tf
locals {
  config = var.instance_configs[var.environment]
  common_tags = {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "web" {
  name        = "${var.project}-${var.environment}-sg"
  description = "Security group for ${var.environment}"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "ingress" {
    for_each = length(var.allowed_ssh_cidrs) > 0 ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_cidrs
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-${var.environment}-sg"
  })
}

resource "aws_instance" "web" {
  count         = local.config.count
  ami           = data.aws_ami.ubuntu.id
  instance_type = local.config.instance_type

  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = aws_subnet.public.id

  root_block_device {
    volume_size = local.config.disk_size
  }

  tags = merge(local.common_tags, {
    Name = "${var.project}-${var.environment}-web-${count.index + 1}"
  })
}

# outputs.tf
output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "instance_count" {
  description = "Number of instances created"
  value       = local.config.count
}

output "instance_ids" {
  description = "IDs of all web instances"
  value       = aws_instance.web[*].id
}

output "instance_ips" {
  description = "Public IP addresses"
  value       = aws_instance.web[*].public_ip
}

output "ssh_commands" {
  description = "SSH commands for each instance"
  value = [
    for idx, instance in aws_instance.web :
    "ssh ubuntu@${instance.public_ip}  # ${var.project}-${var.environment}-web-${idx + 1}"
  ]
}

output "load_balancer_endpoint" {
  description = "Load balancer endpoint"
  value       = aws_lb.web.dns_name
  depends_on  = [aws_lb.web]
}
```

Use it for different environments:

```bash
# Development
terraform apply -var="environment=dev"

# Staging
terraform apply -var="environment=staging" -var="allowed_ssh_cidrs=[\"203.0.113.0/24\"]"

# Production
terraform apply -var-file="prod.tfvars"
```

Where `prod.tfvars` contains:

```hcl
environment = "prod"
project     = "webapp"

allowed_ssh_cidrs = [
  "203.0.113.0/24",  # Office network
  "198.51.100.0/24"  # VPN network
]
```

This setup gives you:

- Environment-specific instance counts and sizes
- Validation preventing typos in environment names
- Flexible SSH access control
- Detailed outputs for connecting to resources
- Reusable configuration across environments

Understanding variables and outputs lets you build flexible, reusable Terraform configurations. Next, we'll explore modules - how to organize and share Terraform code across projects.
