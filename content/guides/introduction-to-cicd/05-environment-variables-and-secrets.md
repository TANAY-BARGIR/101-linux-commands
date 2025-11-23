---
title: 'Environment Variables and Secrets Management'
description: 'Learn to manage configuration and sensitive data securely in GitHub Actions workflows using environment variables, secrets, and best practices.'
order: 5
---

Every developer has accidentally committed an API key or database password to version control at some point. It's one of those mistakes that makes your stomach drop when you realize what happened - especially if it's a production database password or an AWS key with billing access. The panic of trying to figure out who might have seen it, rotating credentials, and hoping no damage was done is something you never want to experience again.

GitHub Actions workflows need access to sensitive information like deployment credentials, API keys, and database passwords, but they also need to keep this information secure. Understanding how to handle configuration and secrets properly protects your applications, infrastructure, and users while maintaining the flexibility to deploy across different environments.

## The Configuration Security Spectrum

Not all configuration is equally sensitive, and understanding these differences helps you choose the right storage mechanism. Public configuration like Node.js versions, build flags, or documentation URLs can be stored as plain environment variables. Semi-private configuration like internal API endpoints or database names might reveal architectural details but won't cause security breaches. Truly sensitive information like passwords, API keys, and certificates must be stored as encrypted secrets.

GitHub Actions provides different mechanisms for each level of sensitivity. Environment variables handle public and semi-private configuration that you don't mind appearing in logs. GitHub Secrets encrypt sensitive information and mask it in logs, preventing accidental exposure.

The key principle is that secrets should never appear in your workflow files, even if your repository is private. Workflow files are often shared, copied to other repositories, or included in documentation, creating opportunities for accidental exposure.

## Using Environment Variables Effectively

Environment variables in GitHub Actions work at multiple levels - workflow, job, and step - with step-level variables taking precedence over job-level, which take precedence over workflow-level. Understanding this hierarchy helps you organize configuration logically.

Here's a practical example of environment variable management:

```yaml
name: Multi-Environment Deployment

# Workflow-level variables available to all jobs
env:
  NODE_VERSION: '18'
  BUILD_ENVIRONMENT: 'development'

on:
  push:
    branches: [main, develop]
  workflow_dispatch:
    inputs:
      target_environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options: [staging, production]

jobs:
  build:
    runs-on: ubuntu-latest

    # Job-level variables can override workflow-level ones
    env:
      BUILD_ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}
      API_BASE_URL: ${{ github.ref == 'refs/heads/main' && 'https://api.example.com' || 'https://api.staging.example.com' }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Show build configuration
        run: |
          echo "Node Version: $NODE_VERSION"
          echo "Build Environment: $BUILD_ENVIRONMENT"
          echo "API Base URL: $API_BASE_URL"
          echo "Git Branch: ${{ github.ref_name }}"

      - name: Install dependencies
        run: npm ci

      # Step-level variables have highest precedence
      - name: Build application
        env:
          NODE_ENV: production
          BUILD_ID: ${{ github.run_number }}
          COMMIT_SHA: ${{ github.sha }}
        run: |
          echo "Building with environment: $NODE_ENV"
          echo "Build ID: $BUILD_ID"
          echo "Commit: $COMMIT_SHA"

          # Create build-time configuration
          cat > src/config.js << EOF
          export const config = {
            environment: '$BUILD_ENVIRONMENT',
            apiBaseUrl: '$API_BASE_URL',
            buildId: '$BUILD_ID',
            commitSha: '$COMMIT_SHA'
          };
          EOF

          npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ env.BUILD_ENVIRONMENT }}
          path: dist/
```

This example shows how environment variables can be computed dynamically based on branch names, user inputs, and other context information. The configuration becomes part of the built application, enabling environment-specific behavior without hardcoding values.

## Secrets Management Done Right

GitHub Secrets provide encrypted storage for sensitive information. Secrets are encrypted at rest and only decrypted when accessed by authorized workflows. They're automatically masked in logs, so even if you accidentally try to print them, they appear as `***` instead of the actual values.

Here's how to use secrets properly in a deployment workflow:

```yaml
name: Secure Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # Use environment protection

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: production-build
          path: dist/

      - name: Deploy to AWS
        env:
          # Access secrets through the secrets context
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          # Combine secrets with public configuration
          AWS_REGION: us-east-1
          S3_BUCKET: my-app-production
        run: |
          echo "Deploying to AWS S3..."
          echo "Region: $AWS_REGION"
          echo "Bucket: $S3_BUCKET"

          # Configure AWS CLI with credentials
          aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
          aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
          aws configure set region "$AWS_REGION"

          # Sync files to S3
          aws s3 sync dist/ s3://$S3_BUCKET/ --delete

          # Invalidate CloudFront cache
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Update database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          echo "Running database migrations..."
          # Use the database connection securely
          # Never echo the DATABASE_URL directly
          echo "Database connection configured"

          # Run migrations (example)
          # npx prisma migrate deploy

      - name: Send deployment notification
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Production deployment completed for commit ${{ github.sha }}\"}"
```

Notice how secrets are accessed through `${{ secrets.SECRET_NAME }}` and combined with public configuration. The workflow never echoes secret values directly, and all sensitive operations are contained within the steps that need them.

## Environment Protection and Approval Gates

GitHub Environments provide an additional layer of security for sensitive deployments. You can configure environments to require manual approval, restrict deployment to specific branches, or add time delays before deployments proceed.

```yaml
# This job uses environment protection
deploy-production:
  runs-on: ubuntu-latest
  environment:
    name: production
    url: https://myapp.com

  steps:
    - name: Deploy to production
      run: echo "Deploying to production..."
```

To set up environment protection:

1. Go to your repository's Settings → Environments
2. Create a "production" environment
3. Add required reviewers who must approve deployments
4. Restrict deployments to specific branches (like `main`)
5. Add secrets that are only available to this environment

This ensures that production deployments can't happen accidentally and provides an audit trail of who approved what deployments.

## Dynamic Configuration Based on Context

Sometimes you need to compute configuration values based on workflow context, Git information, or external conditions. Here's how to create dynamic configuration:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Determine deployment configuration
        run: |
          # Set environment based on branch
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            echo "DEPLOY_ENV=production" >> $GITHUB_ENV
            echo "API_URL=https://api.example.com" >> $GITHUB_ENV
            echo "DEBUG_MODE=false" >> $GITHUB_ENV
          elif [ "${{ github.ref }}" = "refs/heads/develop" ]; then
            echo "DEPLOY_ENV=staging" >> $GITHUB_ENV
            echo "API_URL=https://api.staging.example.com" >> $GITHUB_ENV
            echo "DEBUG_MODE=true" >> $GITHUB_ENV
          else
            echo "DEPLOY_ENV=review" >> $GITHUB_ENV
            echo "API_URL=https://api.review.example.com" >> $GITHUB_ENV
            echo "DEBUG_MODE=true" >> $GITHUB_ENV
          fi

          # Create unique deployment identifier
          echo "DEPLOY_ID=${{ github.run_number }}-$(date +%s)" >> $GITHUB_ENV

          # Set feature flags based on environment
          if [ "$DEPLOY_ENV" = "production" ]; then
            echo "FEATURE_NEW_UI=true" >> $GITHUB_ENV
            echo "FEATURE_BETA_API=false" >> $GITHUB_ENV
          else
            echo "FEATURE_NEW_UI=true" >> $GITHUB_ENV
            echo "FEATURE_BETA_API=true" >> $GITHUB_ENV
          fi

      - name: Show computed configuration
        run: |
          echo "Deploy Environment: $DEPLOY_ENV"
          echo "API URL: $API_URL"
          echo "Debug Mode: $DEBUG_MODE"
          echo "Deploy ID: $DEPLOY_ID"
          echo "Feature Flags: NEW_UI=$FEATURE_NEW_UI, BETA_API=$FEATURE_BETA_API"

      - name: Deploy with computed configuration
        run: |
          # Use the dynamically computed values
          echo "Deploying to $DEPLOY_ENV environment..."
          # Your deployment commands would use these environment variables
```

The `GITHUB_ENV` file allows you to create environment variables during workflow execution that subsequent steps can use. This enables complex configuration logic while keeping the values available throughout the workflow.

## Validating Configuration

Configuration errors are a common source of deployment failures. Add validation steps to catch problems early:

```yaml
- name: Validate required configuration
  run: |
    # Check required environment variables
    REQUIRED_VARS="NODE_VERSION API_URL DEPLOY_ENV"
    MISSING_VARS=""

    for var in $REQUIRED_VARS; do
      if [ -z "${!var}" ]; then
        echo "❌ Missing required variable: $var"
        MISSING_VARS="$MISSING_VARS $var"
      else
        echo "✅ $var is configured"
      fi
    done

    if [ -n "$MISSING_VARS" ]; then
      echo "Missing required variables:$MISSING_VARS"
      exit 1
    fi

    # Validate configuration values
    if [[ ! "$API_URL" =~ ^https:// ]]; then
      echo "❌ API_URL must start with https://"
      exit 1
    fi

    if [[ ! "$DEPLOY_ENV" =~ ^(production|staging|development)$ ]]; then
      echo "❌ DEPLOY_ENV must be production, staging, or development"
      exit 1
    fi

    echo "✅ All configuration validation passed"
```

## Security Best Practices

Here are essential practices for keeping your secrets secure:

**Never Log Secrets**:

```yaml
# Bad - never do this
- name: Debug deployment
  run: echo "Database password is ${{ secrets.DB_PASSWORD }}"

# Good - secrets are automatically masked but don't risk it
- name: Debug deployment
  run: echo "Database connection configured: ✅"
```

**Use Environment-Specific Secrets**:

```yaml
# Instead of one DATABASE_URL secret, use environment-specific ones
DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}
# Or
DATABASE_URL: ${{ secrets[format('DATABASE_URL_{0}', env.DEPLOY_ENV)] }}
```

**Rotate Secrets Regularly**:

```yaml
# Add secret rotation reminders
- name: Check secret age
  run: |
    echo "⚠️ Remember to rotate secrets regularly"
    echo "Last deployment: $(date)"
    echo "Consider rotating AWS keys, database passwords, and API tokens"
```

**Limit Secret Scope**:
Use GitHub Environments to restrict which workflows can access which secrets. Production secrets should only be available to production deployment workflows.

## Troubleshooting Configuration Issues

When configuration doesn't work as expected, here's how to diagnose problems:

```yaml
- name: Debug configuration (safe values only)
  run: |
    echo "=== Environment Variables ==="
    env | grep -E '^(NODE_|API_|DEPLOY_|GITHUB_)' | sort

    echo "=== GitHub Context ==="
    echo "Repository: ${{ github.repository }}"
    echo "Branch: ${{ github.ref_name }}"
    echo "Event: ${{ github.event_name }}"
    echo "Actor: ${{ github.actor }}"

    echo "=== Computed Values ==="
    echo "Build Environment: $BUILD_ENVIRONMENT"
    echo "Deploy Environment: $DEPLOY_ENV"

    # Check file system for configuration files
    echo "=== Configuration Files ==="
    if [ -f "src/config.js" ]; then
      echo "Config file exists:"
      cat src/config.js
    else
      echo "No config file found"
    fi
```

**Common Issues and Solutions**:

- **Variable not set**: Check the scope (workflow/job/step level) and spelling
- **Secret access denied**: Verify the secret exists and the workflow has permission to access it
- **Environment-specific config not working**: Check branch names and conditions in your logic
- **Masked values in logs**: This is normal for secrets - they're working correctly

Understanding configuration and secrets management is crucial for building secure, flexible workflows that work across different environments. In the next section, we'll explore deployment strategies and environment management, showing how to safely deliver your applications using the configuration techniques you've learned.
