---
title: Understanding Terraform Fundamentals
description: Learn the core concepts behind Terraform and how it manages infrastructure as code
order: 1
---

**TLDR**: Terraform uses declarative configuration files to describe infrastructure. You write what you want (resources, their properties), and Terraform figures out how to create or modify them. It tracks everything in a state file and uses providers to talk to different cloud services and APIs.

Before writing any Terraform code, you need to understand how it thinks about infrastructure. Terraform's approach is different from scripting or manual provisioning, and understanding these differences helps you use it effectively.

## The Declarative Approach

When you write a shell script to create infrastructure, you specify exact steps: first create this network, then create this server, then configure it. This is imperative programming - you tell the system how to do things.

Terraform works differently. You describe the end result you want, and Terraform figures out how to get there. This is declarative programming. Instead of writing:

```bash
# Imperative approach - step by step
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-12345 --cidr-block 10.0.1.0/24
aws ec2 run-instances --subnet-id subnet-67890 --image-id ami-abc123
```

You write Terraform configuration that describes the desired state:

```hcl
# Declarative approach - describe what you want
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  ami           = "ami-abc123"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id
}
```

The difference becomes more important when you run Terraform a second time. The script might try to create duplicate resources or fail. Terraform checks what already exists, compares it to your configuration, and only makes necessary changes.

This makes Terraform idempotent - running it multiple times with the same configuration produces the same result. You don't need different scripts for creating resources versus updating them.

## How Terraform Tracks Infrastructure

Terraform needs to remember what infrastructure it has created so it can manage updates and deletions. It does this through a state file.

When you run Terraform for the first time, it creates resources and records details about them in `terraform.tfstate`:

```
Local Terraform Files          Cloud Provider (AWS)          Terraform State File
┌─────────────────┐           ┌─────────────────┐           ┌──────────────────┐
│  main.tf        │           │                 │           │ terraform.tfstate│
│  ─────────      │           │  ╔══════════╗   │           │ ──────────────── │
│  resource       │  apply    │  ║ EC2      ║   │   tracks  │ {                │
│  "aws_instance" │  ───────> │  ║ Instance ║   │  <──────  │   "aws_instance":│
│  "web" {        │           │  ║ i-abc123 ║   │           │   {id: "i-abc123"│
│    ...          │           │  ╚══════════╝   │           │    type: "t3..." │
│  }              │           │                 │           │   }              │
└─────────────────┘           └─────────────────┘           └──────────────────┘
```

Next time you run Terraform, it:

1. Reads your configuration files to see what you want
2. Reads the state file to see what currently exists
3. Queries the actual infrastructure to verify the state file is accurate
4. Calculates what needs to change
5. Shows you a plan of changes before making them

This three-way comparison (desired state, recorded state, actual state) is what makes Terraform safe and predictable.

## Providers: Terraform's Plugin System

Terraform itself doesn't know how to create an AWS server or a DigitalOcean droplet. That knowledge lives in providers - plugins that implement resource types for specific platforms.

When you write:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}
```

You're telling Terraform to download the AWS provider plugin. This provider knows how to translate Terraform's resource definitions into AWS API calls.

There are providers for:

- Cloud platforms (AWS, Azure, Google Cloud, DigitalOcean)
- Infrastructure services (Cloudflare, Datadog, PagerDuty)
- Version control (GitHub, GitLab)
- Databases (PostgreSQL, MySQL)
- Kubernetes and containers
- And hundreds more

The same Terraform workflow works across all providers. Learn it once, use it everywhere.

## Resources: The Building Blocks

Resources are the most important concept in Terraform. A resource is anything you want to create or manage - a virtual machine, a database, a DNS record, a monitoring alert.

Every resource has a type and a name:

```hcl
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"

  tags = {
    Name = "web-server-01"
  }
}
```

Breaking this down:

- `resource` - keyword indicating a resource block
- `"aws_instance"` - the resource type (defined by the AWS provider)
- `"web_server"` - a name you choose to reference this resource
- Everything in braces - arguments that configure the resource

The resource type determines what arguments are available. An `aws_instance` needs an AMI and instance type. An `aws_s3_bucket` needs a bucket name. The provider documentation tells you what's required and what's optional.

## Referencing Between Resources

Resources often depend on each other. A server needs a network. A DNS record needs the server's IP address. Terraform handles this through references.

You reference a resource's attributes using `resource_type.resource_name.attribute`:

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id  # Reference the VPC's ID
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id  # Reference the subnet's ID

  tags = {
    Name = "web-server"
  }
}

resource "aws_eip" "web_ip" {
  instance = aws_instance.web.id  # Reference the instance's ID
  domain   = "vpc"
}
```

Terraform analyzes these references to build a dependency graph. It knows it must create the VPC before the subnet, the subnet before the instance, and the instance before the Elastic IP. When you run `terraform apply`, it creates resources in the correct order automatically.

If you delete the VPC from your configuration, Terraform knows it needs to delete the Elastic IP, then the instance, then the subnet, then the VPC - in reverse dependency order.

## The Terraform Workflow

Working with Terraform follows a consistent pattern:

1. **Write** - Create or modify `.tf` configuration files
2. **Initialize** - Run `terraform init` to download required providers
3. **Plan** - Run `terraform plan` to see what changes Terraform will make
4. **Review** - Check the plan to verify it matches your intentions
5. **Apply** - Run `terraform apply` to execute the changes
6. **Verify** - Check that resources were created correctly

This workflow stays the same whether you're creating one resource or a hundred, working alone or on a team, managing AWS or any other provider.

The plan step is particularly important. It shows you exactly what will change before anything actually changes:

```
Terraform will perform the following actions:

  # aws_instance.web will be created
  + resource "aws_instance" "web" {
      + ami                    = "ami-0c55b159cbfafe1f0"
      + instance_type          = "t3.micro"
      + subnet_id              = "subnet-abc123"
      ...
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

Never run `terraform apply` without reviewing the plan first. Always check what's being created, modified, or destroyed.

## Configuration Files and Directory Structure

Terraform reads all `.tf` files in the current directory and treats them as one big configuration. This means you can organize your code however makes sense:

```
infrastructure/
├── main.tf          # Main resource definitions
├── variables.tf     # Input variables
├── outputs.tf       # Output values
├── providers.tf     # Provider configuration
└── terraform.tfstate  # State file (created by Terraform)
```

Or keep everything in one file:

```
infrastructure/
└── main.tf          # Everything in one file
```

Terraform doesn't care. Use whatever organization helps you understand the configuration. Smaller projects often start with one file. As complexity grows, splitting into multiple files improves readability.

## Understanding Immutable Infrastructure

Terraform encourages immutable infrastructure - replacing resources rather than modifying them. This differs from traditional system administration where you update servers in place.

If you need to change a server's configuration, you don't SSH in and modify files. Instead, you:

1. Update your Terraform configuration
2. Run terraform apply
3. Terraform creates a new server with the new configuration
4. Switch traffic to the new server
5. Destroy the old server

This approach reduces drift (servers slowly becoming different from each other), makes rollbacks easier (just apply the old configuration), and makes it clear what the current configuration actually is (it's all in version control).

Not every resource works this way. Changing some properties causes replacement, while others can be updated in place. Terraform's plan output shows you which is which:

```
  # aws_instance.web must be replaced
-/+ resource "aws_instance" "web" {
      ~ ami           = "ami-old123" -> "ami-new456"  # forces replacement
        instance_type = "t3.micro"
    }
```

The `-/+` symbol means Terraform will destroy and recreate this resource. A `~` symbol means it will update in place.

## Data Sources: Reading Existing Infrastructure

Sometimes you need to reference infrastructure that Terraform doesn't manage. Data sources let you query existing resources:

```hcl
# Look up the latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical's AWS account

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
}

# Use it in a resource
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id  # Reference the data source
  instance_type = "t3.micro"
}
```

Data sources start with `data` instead of `resource`. They don't create anything - they just query and return information you can use in your configuration.

This is useful for:

- Finding the latest AMI or container image
- Referencing VPCs or networks created outside Terraform
- Looking up account information or region details
- Integrating with existing infrastructure

Understanding these fundamentals - declarative configuration, state management, providers, resources, and the basic workflow - gives you the foundation to start writing actual Terraform code. In the next section, we'll install Terraform and create your first infrastructure.
