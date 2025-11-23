---
title: Working with Resources and Data Sources
description: Learn how to create infrastructure resources and query existing infrastructure with data sources
order: 4
---

**TLDR**: Resources create and manage infrastructure (servers, databases, networks). Data sources query existing infrastructure without managing it. Use resource dependencies to control creation order. Apply lifecycle rules to prevent accidental deletion or control update behavior.

Resources are the heart of Terraform - they represent the infrastructure components you want to create and manage. Data sources let you reference information about existing infrastructure. Understanding both is key to building real configurations.

## Creating Resources

A resource block declares a piece of infrastructure to create. The general syntax is:

```hcl
resource "provider_type" "local_name" {
  argument1 = "value1"
  argument2 = "value2"
}
```

Let's create a complete example with a VPC, subnet, and EC2 instance on AWS:

```hcl
# VPC to isolate our resources
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "main-vpc"
  }
}

# Public subnet in the VPC
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet"
  }
}

# Internet gateway for external access
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-igw"
  }
}

# Route table for public internet access
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "public-rt"
  }
}

# Associate route table with subnet
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Security group
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Allow web traffic"
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

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "web-sg"
  }
}

# EC2 instance
resource "aws_instance" "web" {
  ami                    = "ami-0c55b159cbfafe1f0"
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.web.id]

  tags = {
    Name = "web-server"
  }
}
```

When you run `terraform apply`, Terraform creates these resources in the correct order based on their dependencies.

## Understanding Resource Dependencies

Terraform automatically determines the order to create resources by analyzing references. In our example:

```
aws_vpc.main
    ↓
    ├── aws_subnet.public
    │       ↓
    │   aws_instance.web ← aws_security_group.web
    │
    └── aws_internet_gateway.main
            ↓
        aws_route_table.public
            ↓
        aws_route_table_association.public
```

The VPC must exist before creating the subnet or internet gateway. The subnet must exist before creating the instance. Terraform handles this automatically.

Sometimes you need explicit dependencies that Terraform can't infer. Use `depends_on`:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id

  # Explicit dependency - make sure internet gateway exists
  depends_on = [aws_internet_gateway.main]
}
```

Use `depends_on` sparingly. Terraform usually figures out dependencies correctly. You need it when:

- Resources have a hidden dependency that Terraform can't detect
- An external system needs time to become available
- You need to control creation order for logical reasons

## Resource Attributes

After Terraform creates a resource, it exposes attributes you can reference. Some attributes you provide (like `cidr_block`), others are set by the provider (like `id`).

Check provider documentation to see available attributes. For an AWS instance:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id
}

# Reference the instance's attributes
output "instance_id" {
  value = aws_instance.web.id  # Set by AWS
}

output "private_ip" {
  value = aws_instance.web.private_ip  # Set by AWS
}

output "public_ip" {
  value = aws_instance.web.public_ip  # Set by AWS
}

output "instance_type" {
  value = aws_instance.web.instance_type  # What we set
}
```

## Data Sources: Querying Existing Infrastructure

Data sources let you fetch information about resources that exist outside your Terraform configuration. They don't create or modify anything - they just query.

Syntax for data sources:

```hcl
data "provider_type" "local_name" {
  # Query parameters
}
```

Common use cases:

### Finding AMIs

Instead of hardcoding an AMI ID, find the latest version dynamically:

```hcl
# Find the latest Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical's AWS account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Use it in a resource
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id  # Always the latest
  instance_type = "t3.micro"
}
```

This ensures you always use the newest Ubuntu image without manual updates.

### Referencing Existing VPCs

If your VPC was created outside Terraform:

```hcl
# Find VPC by tag
data "aws_vpc" "main" {
  tags = {
    Name = "main-vpc"
  }
}

# Find subnets in that VPC
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }

  tags = {
    Tier = "public"
  }
}

# Use the VPC and subnets
resource "aws_security_group" "web" {
  vpc_id = data.aws_vpc.main.id

  # ... rules ...
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = data.aws_subnets.public.ids[0]
}
```

### Getting Account and Region Information

```hcl
# Get current AWS account ID
data "aws_caller_identity" "current" {}

# Get current region
data "aws_region" "current" {}

# Get available availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Use them
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
  azs        = data.aws_availability_zones.available.names
}

output "deployment_info" {
  value = "Deploying in account ${local.account_id}, region ${local.region}"
}
```

### Reading External Data

The `local_file` data source reads local files:

```hcl
data "local_file" "ssh_key" {
  filename = "${path.module}/keys/id_rsa.pub"
}

resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = data.local_file.ssh_key.content
}
```

## Resource Lifecycle

Control how Terraform handles resource updates with lifecycle rules.

### Prevent Deletion

Protect critical resources from accidental deletion:

```hcl
resource "aws_db_instance" "production" {
  identifier        = "prod-db"
  engine            = "postgres"
  instance_class    = "db.t3.medium"
  allocated_storage = 100

  lifecycle {
    prevent_destroy = true  # Terraform will error if you try to destroy this
  }
}
```

If someone tries to destroy this resource, Terraform refuses:

```
Error: Instance cannot be destroyed

  on main.tf line 10:
  10: resource "aws_db_instance" "production" {

Resource aws_db_instance.production has lifecycle.prevent_destroy set, but
the plan calls for this resource to be destroyed.
```

### Create Before Destroy

Some resources can't have downtime during updates. Create the replacement first:

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true  # New instance before deleting old one
  }
}
```

When you change the AMI, Terraform:

1. Creates a new instance with the new AMI
2. Updates references to point to the new instance
3. Deletes the old instance

Without this setting, Terraform would delete first (causing downtime) then create.

### Ignore Changes

Sometimes external systems modify resources outside Terraform. Prevent Terraform from reverting these changes:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server"
  }

  lifecycle {
    ignore_changes = [
      tags["LastModified"],  # Ignore changes to specific tag
      user_data,             # Ignore user_data modifications
    ]
  }
}
```

Or ignore all changes:

```hcl
lifecycle {
  ignore_changes = all
}
```

This is useful when:

- External automation adds tags
- Auto-scaling modifies certain properties
- You're gradually adopting Terraform for existing infrastructure

### Replace Triggered By

Force replacement when specific values change:

```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  lifecycle {
    replace_triggered_by = [
      aws_security_group.web.id  # Replace instance if security group changes
    ]
  }
}
```

## Count and For_Each: Multiple Instances

Create multiple similar resources using `count` or `for_each`.

### Using Count

Create a fixed number of resources:

```hcl
resource "aws_instance" "web" {
  count = 3

  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = "web-${count.index}"  # web-0, web-1, web-2
  }
}

# Access specific instances
output "first_instance_ip" {
  value = aws_instance.web[0].public_ip
}

# Access all instances
output "all_instance_ips" {
  value = aws_instance.web[*].public_ip
}
```

`count.index` gives you the current iteration number (starting from 0).

### Using For_Each

Create resources based on a map or set, giving each a meaningful name:

```hcl
variable "instances" {
  type = map(object({
    instance_type = string
    ami           = string
  }))

  default = {
    web = {
      instance_type = "t3.micro"
      ami           = "ami-0c55b159cbfafe1f0"
    }
    api = {
      instance_type = "t3.small"
      ami           = "ami-0c55b159cbfafe1f0"
    }
    worker = {
      instance_type = "t3.medium"
      ami           = "ami-0c55b159cbfafe1f0"
    }
  }
}

resource "aws_instance" "server" {
  for_each = var.instances

  ami           = each.value.ami
  instance_type = each.value.instance_type
  subnet_id     = aws_subnet.public.id

  tags = {
    Name = each.key  # "web", "api", or "worker"
  }
}

# Access specific instance
output "web_server_ip" {
  value = aws_instance.server["web"].public_ip
}

# Access all instances
output "all_server_ips" {
  value = { for k, v in aws_instance.server : k => v.public_ip }
}
```

With `for_each`:

- `each.key` is the map key or set value
- `each.value` is the map value (for sets, same as `each.key`)

`for_each` is generally better than `count` because:

- Resources have meaningful names instead of numbers
- Adding/removing items doesn't renumber everything
- The intent is clearer

Use `count` when you just need N identical resources. Use `for_each` when each resource is configured differently.

## Practical Example: Multi-Tier Application

Here's a complete example combining resources, data sources, and these concepts:

```hcl
# Find latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Get available AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true

  tags = {
    Name = "main-vpc"
  }
}

# Create subnets in multiple AZs
resource "aws_subnet" "public" {
  for_each = toset(slice(data.aws_availability_zones.available.names, 0, 2))

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${index(data.aws_availability_zones.available.names, each.value) + 1}.0/24"
  availability_zone       = each.value
  map_public_ip_on_launch = true

  tags = {
    Name = "public-${each.value}"
  }
}

# Security groups for different tiers
resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name   = "app-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]  # Only from web tier
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Launch template for web servers
resource "aws_launch_template" "web" {
  name_prefix   = "web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.web.id]

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y httpd
              systemctl start httpd
              systemctl enable httpd
              echo "<h1>Web Server</h1>" > /var/www/html/index.html
              EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

# Auto-scaling group
resource "aws_autoscaling_group" "web" {
  desired_capacity    = 2
  max_size            = 4
  min_size            = 1
  vpc_zone_identifier = [for s in aws_subnet.public : s.id]

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "web-server"
    propagate_at_launch = true
  }
}
```

This example demonstrates:

- Using data sources to find AMIs and availability zones
- Creating multiple subnets with `for_each`
- Setting up security groups with tier-to-tier access
- Using launch templates for scalable instances
- Lifecycle rules for zero-downtime updates

Understanding resources and data sources gives you the building blocks for any infrastructure. Next, we'll explore state management - how Terraform tracks what it has created and how to handle state safely.
