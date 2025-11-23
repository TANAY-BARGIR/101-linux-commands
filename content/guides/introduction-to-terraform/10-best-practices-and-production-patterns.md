---
title: Terraform Best Practices and Production Patterns
description: Learn proven patterns for writing maintainable Terraform code and operating it safely in production
order: 10
---

**TLDR**: Use consistent naming and file organization. Pin provider versions. Keep modules small and focused. Never commit secrets. Use data sources instead of hardcoding values. Test changes in dev before production. Always run plan before apply. Document your infrastructure. Implement automated validation in CI/CD.

After working with Terraform for a while, certain patterns emerge that make code more maintainable and operations safer. This section covers practices learned from running Terraform in production.

## Code Organization

### File Structure

Use consistent file naming across projects:

```
terraform/
├── main.tf              # Primary resource definitions
├── variables.tf         # Input variable declarations
├── outputs.tf           # Output declarations
├── providers.tf         # Provider configurations
├── backend.tf           # Backend configuration
├── data.tf              # Data source definitions
├── locals.tf            # Local value definitions
├── versions.tf          # Terraform and provider version constraints
└── README.md            # Documentation
```

For larger projects, split `main.tf` by resource type:

```
terraform/
├── network.tf           # VPC, subnets, route tables
├── compute.tf           # EC2 instances, ASGs
├── database.tf          # RDS, ElastiCache
├── security.tf          # Security groups, IAM roles
├── monitoring.tf        # CloudWatch alarms, dashboards
├── variables.tf
├── outputs.tf
├── providers.tf
└── backend.tf
```

### Naming Conventions

Use consistent naming for resources:

```hcl
# Pattern: <resource_type>_<descriptive_name>
resource "aws_vpc" "main" { ... }
resource "aws_subnet" "public_web" { ... }
resource "aws_instance" "web_server" { ... }

# Not: generic names
resource "aws_vpc" "vpc1" { ... }          # Too generic
resource "aws_instance" "server" { ... }   # Not descriptive
```

Use meaningful names in tags:

```hcl
resource "aws_instance" "web" {
  # ...

  tags = {
    Name        = "${var.project}-${var.environment}-web-${count.index + 1}"
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "terraform"
    Component   = "web-tier"
  }
}
```

This makes resources easy to identify in the AWS console and in cost reports.

## Version Pinning

Always pin Terraform and provider versions to avoid unexpected changes:

```hcl
terraform {
  required_version = "~> 1.6.0"  # Allow 1.6.x but not 1.7.0

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"  # Allow 5.x but not 6.0
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

Without pinning, running `terraform init` might download a new provider version with breaking changes.

The `~>` operator allows the rightmost version component to increment:

- `~> 1.6.0` matches `1.6.1`, `1.6.2`, but not `1.7.0`
- `~> 1.6` matches `1.6.0`, `1.7.0`, but not `2.0.0`

## Variable Management

### Use Validation

Catch errors before infrastructure changes:

```hcl
variable "environment" {
  type = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "instance_count" {
  type = number

  validation {
    condition     = var.instance_count > 0 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}

variable "cidr_block" {
  type = string

  validation {
    condition     = can(cidrhost(var.cidr_block, 0))
    error_message = "Must be a valid CIDR block."
  }
}
```

### Provide Descriptions

Document what each variable does:

```hcl
variable "instance_type" {
  description = "EC2 instance type. Use t3.micro for dev/staging, t3.large for prod"
  type        = string
  default     = "t3.micro"
}

variable "backup_retention_days" {
  description = <<-EOT
    Number of days to retain backups.
    Minimum 7 for compliance.
    Recommended: 30 for production, 7 for non-production.
  EOT
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_days >= 7
    error_message = "Backup retention must be at least 7 days for compliance."
  }
}
```

### Use Type Constraints

Specify exact types to catch mistakes early:

```hcl
variable "server_config" {
  description = "Server configuration"
  type = object({
    instance_type = string
    disk_size     = number
    ami_id        = string
    tags          = map(string)
  })

  default = {
    instance_type = "t3.micro"
    disk_size     = 20
    ami_id        = "ami-0c55b159cbfafe1f0"
    tags          = {}
  }
}
```

This prevents passing incorrect data structures.

## Resource Management

### Use Data Sources

Query existing infrastructure instead of hardcoding values:

```hcl
# Good - dynamic
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "web" {
  ami = data.aws_ami.ubuntu.id
  # ...
}

# Bad - hardcoded AMI ID becomes outdated
resource "aws_instance" "web" {
  ami = "ami-0c55b159cbfafe1f0"
  # ...
}
```

### Use Lifecycle Rules Appropriately

Protect critical resources:

```hcl
resource "aws_db_instance" "production" {
  identifier = "prod-db"
  # ...

  lifecycle {
    prevent_destroy = true  # Can't accidentally delete production database
  }
}

resource "aws_launch_template" "web" {
  name_prefix = "web-"
  # ...

  lifecycle {
    create_before_destroy = true  # Zero-downtime updates
  }
}
```

### Avoid Count for Stateful Resources

Use `for_each` instead of `count` for databases, volumes, and other stateful resources:

```hcl
# Good - adding/removing items doesn't affect others
variable "databases" {
  type = map(object({
    allocated_storage = number
    instance_class    = string
  }))

  default = {
    users = {
      allocated_storage = 100
      instance_class    = "db.t3.medium"
    }
    orders = {
      allocated_storage = 200
      instance_class    = "db.t3.large"
    }
  }
}

resource "aws_db_instance" "databases" {
  for_each = var.databases

  identifier        = each.key
  allocated_storage = each.value.allocated_storage
  instance_class    = each.value.instance_class
  # ...
}

# Bad - removing the first item renumbers everything
resource "aws_db_instance" "databases" {
  count = length(var.database_names)

  identifier = var.database_names[count.index]
  # ...
}
```

With `count`, removing the first database in the list would cause Terraform to destroy and recreate all other databases.

## Module Patterns

### Keep Modules Small

Each module should do one thing well:

```
# Good - focused modules
modules/
├── vpc/                 # Just networking
├── ec2_instance/        # Just compute
├── rds_database/        # Just database
└── alb/                 # Just load balancing

# Bad - too broad
modules/
└── complete_infrastructure/  # Everything in one module
```

### Use Module Composition

Combine small modules into larger patterns:

```hcl
# High-level module that composes smaller modules
module "web_application" {
  source = "./modules/web_application"

  # This module internally uses:
  # - vpc module
  # - ec2_instance module
  # - alb module
  # - rds_database module
}
```

### Version Your Modules

Tag modules with semantic versioning:

```bash
git tag -a v1.0.0 -m "Initial release"
git tag -a v1.1.0 -m "Added monitoring"
git tag -a v2.0.0 -m "Breaking: changed variable names"
git push --tags
```

Reference specific versions:

```hcl
module "vpc" {
  source = "git::https://github.com/myorg/terraform-modules.git//vpc?ref=v1.0.0"
  # ...
}
```

This prevents breaking changes from affecting existing infrastructure.

## State Management

### Use Remote State with Locking

Never use local state for production. Always configure a remote backend:

```hcl
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

### Separate State by Environment

Never share state between environments:

```
state/
├── dev/terraform.tfstate
├── staging/terraform.tfstate
└── prod/terraform.tfstate
```

### Enable State Versioning

Use S3 versioning or similar to maintain state history:

```bash
aws s3api put-bucket-versioning \
  --bucket mycompany-terraform-state \
  --versioning-configuration Status=Enabled
```

This lets you recover from state corruption.

## Security Practices

### Never Commit Secrets

Use environment variables or secret managers:

```hcl
# Good - from environment variable
variable "database_password" {
  type      = string
  sensitive = true
}

# Set via: export TF_VAR_database_password="secret"

# Better - from secret manager
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "prod/database/password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
  # ...
}
```

### Use Least Privilege IAM

Grant only necessary permissions:

```hcl
data "aws_iam_policy_document" "instance_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "instance" {
  name               = "instance-role"
  assume_role_policy = data.aws_iam_policy_document.instance_assume_role.json
}

# Grant specific permissions, not full access
data "aws_iam_policy_document" "instance" {
  statement {
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.app_data.arn,
      "${aws_s3_bucket.app_data.arn}/*",
    ]
  }
}

resource "aws_iam_role_policy" "instance" {
  name   = "instance-policy"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.instance.json
}
```

### Tag Sensitive Outputs

Prevent secrets from appearing in logs:

```hcl
output "database_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "database_password" {
  value     = aws_db_instance.main.password
  sensitive = true  # Won't show in console output
}
```

## Testing and Validation

### Use terraform fmt

Format code consistently:

```bash
terraform fmt -recursive
```

Add this to your CI pipeline:

```bash
terraform fmt -check -recursive || exit 1
```

### Validate Configuration

Check for syntax errors:

```bash
terraform validate
```

### Use tflint

Install additional validation:

```bash
# Install tflint
brew install tflint  # macOS
# or download from https://github.com/terraform-linters/tflint

# Run it
tflint
```

Configure tflint in `.tflint.hcl`:

```hcl
plugin "aws" {
  enabled = true
  version = "0.27.0"
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_documented_variables" {
  enabled = true
}
```

### Plan Before Apply

Always review changes:

```bash
# Save the plan
terraform plan -out=tfplan

# Review it carefully
terraform show tfplan

# Apply the exact plan
terraform apply tfplan
```

Never run `terraform apply -auto-approve` in production without first reviewing a plan.

### Test in Development First

Never test changes directly in production:

1. Apply to dev environment
2. Verify everything works
3. Apply to staging
4. Verify again
5. Apply to production

## CI/CD Integration

Automate Terraform operations for consistency:

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  pull_request:
    paths:
      - 'terraform/**'
  push:
    branches: [main]
    paths:
      - 'terraform/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.5

      - name: Terraform Format Check
        run: terraform fmt -check -recursive
        working-directory: terraform

      - name: Terraform Init
        run: terraform init
        working-directory: terraform/environments/dev

      - name: Terraform Validate
        run: terraform validate
        working-directory: terraform/environments/dev

      - name: Run tflint
        uses: terraform-linters/setup-tflint@v3
        with:
          tflint_version: latest

      - name: Initialize tflint
        run: tflint --init
        working-directory: terraform/environments/dev

      - name: Run tflint
        run: tflint --recursive
        working-directory: terraform/environments/dev

  plan:
    needs: validate
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: terraform/environments/dev

      - name: Terraform Plan
        run: terraform plan -no-color
        working-directory: terraform/environments/dev
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

  apply:
    needs: validate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: terraform/environments/dev

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: terraform/environments/dev
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

This workflow:

- Validates format and syntax on every PR
- Runs plan on PRs to show what will change
- Applies changes when merging to main
- Catches errors before they reach production

## Documentation

### README Files

Every Terraform project should have a README:

```markdown
# Production Infrastructure

Terraform configuration for production environment.

## Prerequisites

- Terraform 1.6.x
- AWS CLI configured
- Access to terraform-state S3 bucket

## Usage

\`\`\`bash
cd terraform/environments/prod
terraform init
terraform plan
terraform apply
\`\`\`

## Architecture

- VPC: 10.1.0.0/16
- 3 AZs with public and private subnets
- NAT gateways for private subnet internet access
- Application load balancer for web tier
- RDS Multi-AZ for database

## Variables

See `variables.tf` for all available options.

Required variables:
- `database_password`: Set via `TF_VAR_database_password`

## Outputs

After applying:
- `load_balancer_dns`: Application endpoint
- `database_endpoint`: Database connection string

## Disaster Recovery

State is versioned in S3. To restore:

\`\`\`bash
aws s3api list-object-versions --bucket mycompany-terraform-state --prefix prod/
# Find the version ID you want to restore
aws s3api get-object --bucket mycompany-terraform-state --key prod/terraform.tfstate --version-id VERSION_ID terraform.tfstate
\`\`\`
```

### Inline Documentation

Use comments for non-obvious decisions:

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  # Disable source/dest check for NAT functionality
  source_dest_check = false

  # Use GP3 for better price/performance ratio
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    iops        = 3000  # GP3 includes 3000 IOPS at base cost
  }

  # User data runs on first boot only
  # For configuration changes, update the AMI instead
  user_data = templatefile("${path.module}/init.sh", {
    environment = var.environment
  })
}
```

## Monitoring and Alerts

Track Terraform operations:

```hcl
resource "aws_cloudwatch_log_group" "terraform" {
  name              = "/terraform/runs"
  retention_in_days = 30
}

resource "aws_sns_topic" "terraform_alerts" {
  name = "terraform-alerts"
}

resource "aws_cloudwatch_metric_alarm" "state_lock_held" {
  alarm_name          = "terraform-state-lock-held-too-long"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "LockHeldDuration"
  namespace           = "Terraform"
  period              = 3600
  statistic           = "Maximum"
  threshold           = 1800  # 30 minutes

  alarm_actions = [aws_sns_topic.terraform_alerts.arn]
}
```

## Drift Detection

Check if infrastructure was modified outside Terraform:

```bash
# Show differences between state and reality
terraform plan -detailed-exitcode

# Exit code 2 means drift detected
```

Automate this with scheduled runs:

```yaml
# .github/workflows/drift-detection.yml
name: Drift Detection

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  detect-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: terraform/environments/prod

      - name: Detect Drift
        run: terraform plan -detailed-exitcode
        working-directory: terraform/environments/prod
        continue-on-error: true
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Notify on Drift
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Drift detected in production infrastructure!"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Next Steps

You now have the foundation to use Terraform effectively. Consider exploring:

- **Terraform Cloud**: Managed service with more features
- **Policy as Code**: Use Sentinel or OPA for compliance
- **Testing**: Tools like Terratest for infrastructure testing
- **Advanced Modules**: Study popular modules for patterns
- **Multi-Region**: Strategies for global infrastructure

The Terraform ecosystem is large and active. Join the community, read provider documentation, and keep learning from others' experiences. Infrastructure as code is a journey - these practices will help you build maintainable systems that scale.
