---
title: Terraform Configuration Language Basics
description: Learn HCL syntax, expressions, functions, and how to write maintainable Terraform configurations
order: 3
---

**TLDR**: Terraform uses HCL (HashiCorp Configuration Language), which looks like JSON but is more readable. You write blocks (like `resource`, `variable`, `output`) with arguments and nested blocks. Use interpolation `${}` to reference other values, and built-in functions for string manipulation, file reading, and data transformation.

Terraform's configuration language (HCL) is designed to be human-readable while remaining machine-friendly. Understanding its syntax and features helps you write cleaner, more maintainable infrastructure code.

## Basic Syntax

HCL looks similar to JSON but uses a more relaxed syntax. Here's a resource definition:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name        = "web-server"
    Environment = "production"
  }
}
```

Breaking down the syntax:

- **Blocks** start with a type (`resource`), optional labels (`"aws_instance"`, `"web"`), and contain a body in braces
- **Arguments** assign values to names (`ami = "ami-0c55b159cbfafe1f0"`)
- **Strings** use double quotes
- **Maps/Objects** use braces with key-value pairs
- **Lists** use brackets: `["item1", "item2"]`
- **Comments** use `#` for single lines or `/* */` for multiple lines

## Block Types

Terraform has several block types, each serving a specific purpose:

### Resource Blocks

Resources are the main block type - they define infrastructure objects:

```hcl
resource "resource_type" "local_name" {
  argument1 = "value1"
  argument2 = "value2"

  nested_block {
    nested_argument = "value"
  }
}
```

### Variable Blocks

Variables let you parameterize your configuration:

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}
```

### Output Blocks

Outputs expose values after Terraform runs:

```hcl
output "instance_ip" {
  description = "Public IP of the instance"
  value       = aws_instance.web.public_ip
}
```

### Locals Blocks

Locals define intermediate values used in your configuration:

```hcl
locals {
  common_tags = {
    Project     = "web-app"
    Environment = "production"
    ManagedBy   = "terraform"
  }

  instance_name = "${var.project}-${var.environment}-web"
}
```

## Expressions and Interpolation

You can reference other values and compute new ones using expressions.

### References

Access resource attributes using `resource_type.name.attribute`:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type  # Reference a variable
  subnet_id     = aws_subnet.public.id  # Reference another resource
}
```

Reference types:

- `var.name` - input variables
- `local.name` - local values
- `resource_type.name.attribute` - resource attributes
- `data.data_type.name.attribute` - data source attributes
- `module.module_name.output_name` - module outputs

### String Interpolation

Use `${}` to interpolate expressions into strings:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "${var.project}-web-${var.environment}"  # Interpolation
  }
}
```

For simple references, you can omit the interpolation syntax:

```hcl
# These are equivalent
subnet_id = aws_subnet.public.id
subnet_id = "${aws_subnet.public.id}"
```

Use interpolation when combining multiple values:

```hcl
name = "${var.prefix}-server-${count.index}"
```

### Arithmetic and Comparison

Terraform supports basic arithmetic and comparison operators:

```hcl
locals {
  # Arithmetic
  total_instances = var.web_count + var.api_count
  memory_gb       = var.memory_mb / 1024

  # Comparison
  is_production   = var.environment == "production"
  needs_backup    = var.environment != "development"
  large_instance  = var.cpu_count >= 4
}
```

Operators include:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
- Logical: `&&`, `||`, `!`

### Conditional Expressions

Use ternary operators for conditional logic:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.environment == "production" ? "t3.large" : "t3.micro"

  monitoring    = var.environment == "production" ? true : false
}
```

The syntax is `condition ? true_value : false_value`.

## Built-in Functions

Terraform provides many functions for string manipulation, data transformation, and file operations. You call them without a namespace:

```hcl
locals {
  uppercase_name = upper(var.project_name)
  file_content   = file("${path.module}/config.json")
  merged_tags    = merge(var.common_tags, var.specific_tags)
}
```

### String Functions

Manipulate and format strings:

```hcl
locals {
  # Change case
  upper_env = upper(var.environment)  # "PRODUCTION"
  lower_env = lower(var.environment)  # "production"

  # Split and join
  name_parts = split("-", "web-app-server")  # ["web", "app", "server"]
  full_name  = join("-", ["web", "app", var.environment])

  # Templates and formatting
  greeting = format("Hello, %s!", var.username)
  padded   = format("%05d", 42)  # "00042"

  # Substring operations
  short_id = substr(var.resource_id, 0, 8)
  trimmed  = trim(var.user_input, " ")
}
```

### Collection Functions

Work with lists and maps:

```hcl
locals {
  # Lists
  all_subnets  = concat(var.public_subnets, var.private_subnets)
  unique_zones = distinct(var.availability_zones)
  first_zone   = element(var.availability_zones, 0)
  zone_count   = length(var.availability_zones)

  # Maps
  combined_tags = merge(
    var.common_tags,
    {
      Name = var.instance_name
    }
  )

  tag_keys = keys(var.tags)
  tag_vals = values(var.tags)

  # Lookup with default
  size = lookup(var.instance_sizes, var.environment, "t3.micro")
}
```

### File Functions

Read files and paths:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  # Read a file's content
  user_data = file("${path.module}/scripts/init.sh")
}

locals {
  # Path references
  module_path = path.module  # Path to the current module
  root_path   = path.root    # Path to the root module

  # Read and parse JSON
  config = jsondecode(file("${path.module}/config.json"))

  # Read and parse YAML
  settings = yamldecode(file("${path.module}/settings.yaml"))

  # Template files with variables
  rendered = templatefile("${path.module}/template.tpl", {
    hostname = var.hostname
    port     = var.port
  })
}
```

### Encoding Functions

Convert between formats:

```hcl
locals {
  # JSON encoding/decoding
  json_string = jsonencode({
    name = "web-server"
    port = 8080
  })

  config_object = jsondecode(file("config.json"))

  # YAML encoding/decoding
  yaml_string = yamlencode(var.configuration)

  # Base64 encoding/decoding
  encoded_secret = base64encode(var.api_key)
  decoded_secret = base64decode(var.encoded_value)
}
```

## Dynamic Blocks

Sometimes you need to generate repeated nested blocks based on data. Dynamic blocks let you do this:

```hcl
resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  # Without dynamic blocks - repetitive
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

  # With dynamic blocks - cleaner
  dynamic "ingress" {
    for_each = var.allowed_ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
}

variable "allowed_ports" {
  type    = list(number)
  default = [80, 443, 8080]
}
```

The `dynamic` block iterates over a collection. Inside the `content` block, you access the current item with `block_name.value` (or `block_name.key` for maps).

For more complex data:

```hcl
variable "ingress_rules" {
  type = list(object({
    port        = number
    protocol    = string
    cidr_blocks = list(string)
    description = string
  }))

  default = [
    {
      port        = 80
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTP traffic"
    },
    {
      port        = 443
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "HTTPS traffic"
    }
  ]
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
      description = ingress.value.description
    }
  }
}
```

## For Expressions

Transform and filter collections using for expressions:

```hcl
locals {
  # Create a list from another list
  uppercase_names = [for name in var.server_names : upper(name)]

  # Filter a list
  production_servers = [
    for server in var.servers : server
    if server.environment == "production"
  ]

  # Create a map from a list
  server_map = {
    for server in var.servers : server.name => server.ip
  }

  # Transform and filter
  large_instance_names = [
    for name, config in var.instances : name
    if config.size == "large"
  ]
}
```

Real-world example:

```hcl
variable "servers" {
  type = list(object({
    name        = string
    environment = string
    size        = string
  }))
}

locals {
  # Get production server names
  prod_names = [
    for s in var.servers : s.name
    if s.environment == "production"
  ]

  # Build tags for each server
  server_tags = {
    for s in var.servers : s.name => {
      Name        = s.name
      Environment = s.environment
      Size        = s.size
      ManagedBy   = "terraform"
    }
  }
}
```

## Type Constraints

Specify types for variables to catch errors early:

```hcl
variable "instance_count" {
  type        = number
  description = "Number of instances to create"
  default     = 1
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.micro"
}

variable "enable_monitoring" {
  type        = bool
  description = "Enable detailed monitoring"
  default     = false
}

variable "availability_zones" {
  type        = list(string)
  description = "AZs to deploy into"
  default     = ["us-east-1a", "us-east-1b"]
}

variable "tags" {
  type        = map(string)
  description = "Resource tags"
  default     = {}
}

variable "server_config" {
  type = object({
    name = string
    size = string
    port = number
  })
  description = "Server configuration"
}

variable "subnet_configs" {
  type = list(object({
    cidr = string
    az   = string
    name = string
  }))
  description = "Subnet configurations"
}
```

Available types:

- Primitive: `string`, `number`, `bool`
- Complex: `list(type)`, `set(type)`, `map(type)`, `object({...})`, `tuple([...])`
- Special: `any` (accepts any type)

## Comments and Documentation

Write clear comments to explain non-obvious decisions:

```hcl
# Create VPC with DNS support enabled
# We need DNS hostnames for RDS endpoints
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true  # Required for RDS
  enable_dns_support   = true

  tags = {
    Name = "main-vpc"
  }
}

/*
  Security group for web tier

  Allows inbound HTTP and HTTPS from anywhere
  Allows outbound traffic to database tier only

  Note: Don't allow SSH (22) from 0.0.0.0/0 in production
*/
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  # ... rules ...
}
```

Use variable descriptions to document inputs:

```hcl
variable "instance_type" {
  type        = string
  description = "EC2 instance type. Use t3.micro for dev, t3.medium for prod"
  default     = "t3.micro"
}
```

## Practical Example: Building a Web Server

Here's a complete example combining these concepts:

```hcl
# Variables for customization
variable "environment" {
  type        = string
  description = "Environment name (dev, staging, prod)"
}

variable "project" {
  type    = string
  default = "webapp"
}

variable "allowed_ssh_ips" {
  type        = list(string)
  description = "IPs allowed to SSH"
  default     = []
}

# Local values
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  instance_type = var.environment == "prod" ? "t3.large" : "t3.micro"
  instance_name = "${var.project}-${var.environment}-web"
}

# Security group with dynamic ingress rules
resource "aws_security_group" "web" {
  name        = "${local.instance_name}-sg"
  description = "Security group for ${local.instance_name}"
  vpc_id      = aws_vpc.main.id

  # HTTP and HTTPS for everyone
  dynamic "ingress" {
    for_each = [80, 443]
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
      description = "Allow ${ingress.value == 80 ? "HTTP" : "HTTPS"}"
    }
  }

  # SSH only for specified IPs
  dynamic "ingress" {
    for_each = length(var.allowed_ssh_ips) > 0 ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.allowed_ssh_ips
      description = "SSH access"
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${local.instance_name}-sg"
    }
  )
}

# Web server instance
resource "aws_instance" "web" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = local.instance_type
  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = aws_subnet.public.id

  user_data = templatefile("${path.module}/init.sh", {
    hostname    = local.instance_name
    environment = var.environment
  })

  tags = merge(
    local.common_tags,
    {
      Name = local.instance_name
    }
  )
}

# Output useful information
output "instance_id" {
  value       = aws_instance.web.id
  description = "ID of the web server instance"
}

output "public_ip" {
  value       = aws_instance.web.public_ip
  description = "Public IP address"
}

output "ssh_command" {
  value       = "ssh ubuntu@${aws_instance.web.public_ip}"
  description = "Command to SSH into the instance"
}
```

This example demonstrates:

- Variables with type constraints and defaults
- Local values for computed and shared values
- Conditional expressions for environment-specific settings
- Dynamic blocks for flexible resource configuration
- String interpolation and functions
- Merging maps for tags
- Template files for user data
- Clear outputs with descriptions

Understanding these language features lets you write flexible, maintainable Terraform configurations. Next, we'll explore resources and data sources in more depth, seeing how to create and query infrastructure.
