---
title: 'Deployment Strategies and Environments'
description: 'Learn to safely deploy applications across different environments using proven strategies that minimize risk and maximize reliability.'
order: 6
---

Deployment day used to mean sleepless nights, emergency rollbacks, and frantic troubleshooting sessions. You've probably experienced the stomach-dropping moment when a deployment breaks production, users start complaining, and you're scrambling to figure out what went wrong while the entire team breathes down your neck.

Modern deployment strategies eliminate this stress by making deployments predictable, reversible, and low-risk. When you understand how to deploy safely across different environments, releases become routine events that happen frequently without drama.

## Why Deployment Strategy Matters

The difference between a good deployment strategy and a bad one is the difference between sleeping soundly and getting emergency calls at 3 AM. A good strategy catches problems before they reach users, provides quick rollback options when things go wrong, and gives you confidence that deployments will work as expected.

Most deployment failures stem from differences between environments or untested deployment processes. Your application works perfectly in development but uses different database configurations in production. Your deployment script works on your machine but fails on the production server due to permission issues. These problems are preventable with the right approach.

The key insight is that deployments should be boring. The exciting part is building features - deployments should be automated, predictable processes that Just Work™.

## Setting Up Environment Hierarchies

Most teams use a progression of environments that mirror the path from development to production. Each environment serves a specific purpose and catches different types of issues before they reach users.

Here's how to set up a practical environment progression:

```yaml
name: Multi-Environment Deployment Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Build once, deploy everywhere
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: app-build-${{ github.sha }}
          path: dist/

  # Automatically deploy to development environment
  deploy-dev:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: development

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: app-build-${{ github.sha }}
          path: dist/

      - name: Deploy to development
        env:
          DEPLOY_HOST: ${{ secrets.DEV_DEPLOY_HOST }}
          DEPLOY_KEY: ${{ secrets.DEV_DEPLOY_KEY }}
          API_URL: https://api.dev.example.com
        run: |
          echo "Deploying to development environment..."

          # Configure SSH for deployment
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          # Deploy files
          rsync -avz --delete \
            -e "ssh -o StrictHostKeyChecking=no" \
            dist/ deployer@$DEPLOY_HOST:/var/www/dev/

          # Restart application
          ssh -o StrictHostKeyChecking=no deployer@$DEPLOY_HOST \
            "sudo systemctl restart app-dev"

          echo "✅ Development deployment completed"

  # Deploy to staging with manual approval
  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: app-build-${{ github.sha }}
          path: dist/

      - name: Deploy to staging
        env:
          DEPLOY_HOST: ${{ secrets.STAGING_DEPLOY_HOST }}
          DEPLOY_KEY: ${{ secrets.STAGING_DEPLOY_KEY }}
          API_URL: https://api.staging.example.com
        run: |
          echo "Deploying to staging environment..."

          # Deploy with staging-specific configuration
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          rsync -avz --delete \
            -e "ssh -o StrictHostKeyChecking=no" \
            dist/ deployer@$DEPLOY_HOST:/var/www/staging/

          ssh -o StrictHostKeyChecking=no deployer@$DEPLOY_HOST \
            "sudo systemctl restart app-staging"

      - name: Run smoke tests
        run: |
          echo "Running smoke tests on staging..."

          # Wait for service to start
          sleep 30

          # Basic health check
          curl --fail https://staging.example.com/health || exit 1

          # Test critical functionality
          curl --fail https://staging.example.com/api/status || exit 1

          echo "✅ Smoke tests passed"

  # Production deployment with additional safety checks
  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: app-build-${{ github.sha }}
          path: dist/

      - name: Pre-deployment checks
        run: |
          echo "Running pre-deployment safety checks..."

          # Verify staging is healthy
          curl --fail https://staging.example.com/health || {
            echo "❌ Staging environment is unhealthy, aborting production deployment"
            exit 1
          }

          # Check for any ongoing incidents
          echo "✅ Pre-deployment checks passed"

      - name: Deploy to production
        env:
          DEPLOY_HOST: ${{ secrets.PROD_DEPLOY_HOST }}
          DEPLOY_KEY: ${{ secrets.PROD_DEPLOY_KEY }}
          API_URL: https://api.example.com
        run: |
          echo "Deploying to production environment..."

          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          # Create backup before deployment
          ssh -o StrictHostKeyChecking=no deployer@$DEPLOY_HOST \
            "sudo cp -r /var/www/prod /var/www/prod-backup-$(date +%Y%m%d-%H%M%S)"

          # Deploy new version
          rsync -avz --delete \
            -e "ssh -o StrictHostKeyChecking=no" \
            dist/ deployer@$DEPLOY_HOST:/var/www/prod/

          # Graceful restart
          ssh -o StrictHostKeyChecking=no deployer@$DEPLOY_HOST \
            "sudo systemctl reload app-prod"

      - name: Post-deployment verification
        run: |
          echo "Verifying production deployment..."

          # Wait for service to stabilize
          sleep 60

          # Health check
          curl --fail https://example.com/health || {
            echo "❌ Production health check failed"
            exit 1
          }

          # Test critical user journeys
          curl --fail https://example.com/api/status || {
            echo "❌ API status check failed"
            exit 1
          }

          echo "✅ Production deployment verified"

      - name: Send deployment notification
        if: always()
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
        run: |
          if [ "${{ job.status }}" = "success" ]; then
            MESSAGE="✅ Production deployment successful for commit ${{ github.sha }}"
          else
            MESSAGE="❌ Production deployment failed for commit ${{ github.sha }}"
          fi

          curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-type: application/json' \
            --data "{\"text\":\"$MESSAGE\"}"
```

This workflow demonstrates a realistic environment progression where development deployments happen automatically, staging requires the main branch, and production requires both staging success and additional safety checks.

## Blue-Green Deployments

Blue-green deployments eliminate downtime by maintaining two identical production environments. You deploy to the inactive environment, test it thoroughly, then switch traffic over. If something goes wrong, you can instantly switch back.

Here's how blue-green deployment works:

```
Initial State - Blue is Live:
                    ┌─────────────────┐
    User Traffic ──▶│  Load Balancer  │
                    └─────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────┐
    │              Blue Environment         │
    │                 (ACTIVE)              │
    │  ┌───────┐ ┌───────┐ ┌───────┐        │
    │  │App v1 │ │App v1 │ │App v1 │        │
    │  └───────┘ └───────┘ └───────┘        │
    └───────────────────────────────────────┘

    ┌───────────────────────────────────────┐
    │             Green Environment         │
    │                (IDLE)                 │
    │  ┌───────┐ ┌───────┐ ┌───────┐        │
    │  │   -   │ │   -   │ │   -   │        │
    │  └───────┘ └───────┘ └───────┘        │
    └───────────────────────────────────────┘

Step 1 - Deploy to Green:
                    ┌─────────────────┐
    User Traffic ──▶│  Load Balancer  │
                    └─────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────┐
    │              Blue Environment         │
    │                 (ACTIVE)              │
    │  ┌───────┐ ┌───────┐ ┌───────┐        │
    │  │App v1 │ │App v1 │ │App v1 │        │
    │  └───────┘ └───────┘ └───────┘        │
    └───────────────────────────────────────┘

    ┌───────────────────────────────────────┐
    │             Green Environment         │
    │              (DEPLOYING)              │
    │  ┌───────┐ ┌───────┐ ┌───────┐        │ ← Deploy v2 here
    │  │App v2 │ │App v2 │ │App v2 │        │   Test thoroughly
    │  └───────┘ └───────┘ └───────┘        │
    └───────────────────────────────────────┘

Step 2 - Switch Traffic to Green:
                    ┌─────────────────┐
    User Traffic ──▶│  Load Balancer  │
                    └─────────────────┘
                            │
                            ▼
    ┌───────────────────────────────────────┐
    │              Blue Environment         │
    │                 (IDLE)                │ ← Now idle
    │  ┌───────┐ ┌───────┐ ┌───────┐        │   (rollback ready)
    │  │App v1 │ │App v1 │ │App v1 │        │
    │  └───────┘ └───────┘ └───────┘        │
    └───────────────────────────────────────┘

    ┌───────────────────────────────────────┐
    │             Green Environment         │
    │                (ACTIVE)               │ ← Now serving users
    │  ┌───────┐ ┌───────┐ ┌───────┐        │
    │  │App v2 │ │App v2 │ │App v2 │        │
    │  └───────┘ └───────┘ └───────┘        │
    └───────────────────────────────────────┘
```

Here's how to implement blue-green deployments:

```yaml
name: Blue-Green Deployment

on:
  workflow_dispatch:
    inputs:
      target_environment:
        description: 'Target environment (blue or green)'
        required: true
        type: choice
        options: [blue, green]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: production-build
          path: dist/

      - name: Deploy to ${{ github.event.inputs.target_environment }} environment
        env:
          TARGET_ENV: ${{ github.event.inputs.target_environment }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          echo "Deploying to $TARGET_ENV environment..."

          # Deploy to the target environment
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          # Deploy files to target environment
          rsync -avz --delete \
            -e "ssh -o StrictHostKeyChecking=no" \
            dist/ deployer@$DEPLOY_HOST:/var/www/app-$TARGET_ENV/

          # Start services on target environment
          ssh -o StrictHostKeyChecking=no deployer@$DEPLOY_HOST \
            "sudo systemctl start app-$TARGET_ENV"

      - name: Run comprehensive tests on ${{ github.event.inputs.target_environment }}
        run: |
          TARGET_ENV="${{ github.event.inputs.target_environment }}"

          # Wait for application to start
          sleep 30

          # Get the internal URL for testing
          if [ "$TARGET_ENV" = "blue" ]; then
            TEST_URL="https://blue.internal.example.com"
          else
            TEST_URL="https://green.internal.example.com"
          fi

          echo "Testing $TARGET_ENV environment at $TEST_URL"

          # Health check
          curl --fail "$TEST_URL/health" || exit 1

          # API functionality test
          curl --fail "$TEST_URL/api/status" || exit 1

          # Database connectivity test
          curl --fail "$TEST_URL/api/db-check" || exit 1

          echo "✅ All tests passed on $TARGET_ENV environment"

      - name: Switch traffic to ${{ github.event.inputs.target_environment }}
        env:
          TARGET_ENV: ${{ github.event.inputs.target_environment }}
          LOAD_BALANCER_HOST: ${{ secrets.LOAD_BALANCER_HOST }}
          LB_API_KEY: ${{ secrets.LOAD_BALANCER_API_KEY }}
        run: |
          echo "Switching traffic to $TARGET_ENV environment..."

          # Update load balancer to point to new environment
          curl -X POST "https://$LOAD_BALANCER_HOST/api/switch" \
            -H "Authorization: Bearer $LB_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{\"active_environment\": \"$TARGET_ENV\"}"

          echo "✅ Traffic switched to $TARGET_ENV environment"

      - name: Monitor new deployment
        run: |
          echo "Monitoring new deployment for 5 minutes..."

          for i in {1..10}; do
            echo "Health check $i/10..."
            
            if ! curl --fail https://example.com/health; then
              echo "❌ Health check failed, consider rollback"
              exit 1
            fi
            
            sleep 30
          done

          echo "✅ Deployment stable after monitoring period"
```

Blue-green deployments are perfect for applications where downtime is unacceptable, but they require infrastructure that can support running two full environments simultaneously.

## Rolling Deployments

Rolling deployments update servers one at a time, maintaining availability throughout the process. This strategy works well when you have multiple servers behind a load balancer.

Here's how rolling deployment works:

```
Initial State - All servers running v1:
                 ┌─────────────────┐
User Traffic ───▶│  Load Balancer  │
                 └─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │Server 1 │       │Server 2 │       │Server 3 │
   │ App v1  │       │ App v1  │       │ App v1  │
   │(active) │       │(active) │       │(active) │
   └─────────┘       └─────────┘       └─────────┘

Step 1 - Remove Server 1, Deploy v2:
                 ┌─────────────────┐
User Traffic ───▶│  Load Balancer  │
                 └─────────────────┘
                          │
                    ┌─────┼─────┐
                    │     │     │
                    ▼     ▼     ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │Server 1 │       │Server 2 │       │Server 3 │
   │ App v2  │       │ App v1  │       │ App v1  │
   │(deploy) │       │(active) │       │(active) │ ← Traffic continues
   └─────────┘       └─────────┘       └─────────┘
        ↑
    Removed from
    load balancer

Step 2 - Add Server 1 back, Remove Server 2:
                 ┌─────────────────┐
User Traffic ───▶│  Load Balancer  │
                 └─────────────────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
                ▼         ▼         ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │Server 1 │       │Server 2 │       │Server 3 │
   │ App v2  │       │ App v2  │       │ App v1  │
   │(active) │       │(deploy) │       │(active) │ ← Still serving users
   └─────────┘       └─────────┘       └─────────┘
                          ↑
                     Removed from
                     load balancer

Final State - All servers updated:
                 ┌─────────────────┐
User Traffic ───▶│  Load Balancer  │
                 └─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │Server 1 │       │Server 2 │       │Server 3 │
   │ App v2  │       │ App v2  │       │ App v2  │
   │(active) │       │(active) │       │(active) │ ← All updated!
   └─────────┘       └─────────┘       └─────────┘
```

```yaml
name: Rolling Deployment

on:
  push:
    branches: [main]

jobs:
  rolling-deploy:
    runs-on: ubuntu-latest
    environment: production

    strategy:
      # Deploy to servers one at a time
      max-parallel: 1
      matrix:
        server: [web1, web2, web3, web4]

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: production-build
          path: dist/

      - name: Remove ${{ matrix.server }} from load balancer
        env:
          SERVER: ${{ matrix.server }}
          LB_HOST: ${{ secrets.LOAD_BALANCER_HOST }}
          LB_API_KEY: ${{ secrets.LOAD_BALANCER_API_KEY }}
        run: |
          echo "Removing $SERVER from load balancer..."

          curl -X POST "https://$LB_HOST/api/servers/$SERVER/disable" \
            -H "Authorization: Bearer $LB_API_KEY"

          # Wait for connections to drain
          sleep 30

      - name: Deploy to ${{ matrix.server }}
        env:
          SERVER: ${{ matrix.server }}
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          echo "Deploying to $SERVER..."

          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          # Get server hostname
          SERVER_HOST="${{ secrets[format('{0}_HOST', matrix.server)] }}"

          # Deploy files
          rsync -avz --delete \
            -e "ssh -o StrictHostKeyChecking=no" \
            dist/ deployer@$SERVER_HOST:/var/www/app/

          # Restart application
          ssh -o StrictHostKeyChecking=no deployer@$SERVER_HOST \
            "sudo systemctl restart app"

      - name: Verify ${{ matrix.server }} health
        env:
          SERVER: ${{ matrix.server }}
        run: |
          SERVER_HOST="${{ secrets[format('{0}_HOST', matrix.server)] }}"

          echo "Testing $SERVER health..."

          # Wait for service to start
          sleep 30

          # Health check
          for i in {1..6}; do
            if curl --fail "http://$SERVER_HOST:8080/health"; then
              echo "✅ $SERVER is healthy"
              break
            fi
            
            if [ $i -eq 6 ]; then
              echo "❌ $SERVER failed health check"
              exit 1
            fi
            
            sleep 10
          done

      - name: Add ${{ matrix.server }} back to load balancer
        env:
          SERVER: ${{ matrix.server }}
          LB_HOST: ${{ secrets.LOAD_BALANCER_HOST }}
          LB_API_KEY: ${{ secrets.LOAD_BALANCER_API_KEY }}
        run: |
          echo "Adding $SERVER back to load balancer..."

          curl -X POST "https://$LB_HOST/api/servers/$SERVER/enable" \
            -H "Authorization: Bearer $LB_API_KEY"

          echo "✅ $SERVER deployment completed"
```

Rolling deployments provide a good balance between safety and simplicity, though they take longer than other strategies since servers are updated sequentially.

## Canary Releases

Canary releases deploy new versions to a small subset of users first, allowing you to detect problems before they affect everyone. This strategy is excellent for catching issues that only appear under real user load.

```yaml
name: Canary Release

on:
  workflow_dispatch:
    inputs:
      canary_percentage:
        description: 'Percentage of traffic for canary'
        required: true
        default: '10'
        type: choice
        options: ['5', '10', '25', '50', '100']

jobs:
  canary-deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: production-build
          path: dist/

      - name: Deploy canary version
        env:
          DEPLOY_HOST: ${{ secrets.CANARY_DEPLOY_HOST }}
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          echo "Deploying canary version..."

          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          # Deploy to canary servers
          rsync -avz --delete \
            -e "ssh -o StrictHostKeyChecking=no" \
            dist/ deployer@$DEPLOY_HOST:/var/www/app-canary/

          ssh -o StrictHostKeyChecking=no deployer@$DEPLOY_HOST \
            "sudo systemctl restart app-canary"

      - name: Configure traffic split
        env:
          CANARY_PERCENTAGE: ${{ github.event.inputs.canary_percentage }}
          LB_HOST: ${{ secrets.LOAD_BALANCER_HOST }}
          LB_API_KEY: ${{ secrets.LOAD_BALANCER_API_KEY }}
        run: |
          echo "Configuring $CANARY_PERCENTAGE% traffic to canary..."

          curl -X POST "https://$LB_HOST/api/traffic-split" \
            -H "Authorization: Bearer $LB_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
              \"canary_percentage\": $CANARY_PERCENTAGE,
              \"canary_backend\": \"canary\",
              \"stable_backend\": \"stable\"
            }"

          echo "✅ Traffic split configured"

      - name: Monitor canary metrics
        env:
          CANARY_PERCENTAGE: ${{ github.event.inputs.canary_percentage }}
        run: |
          echo "Monitoring canary for 10 minutes..."

          for i in {1..20}; do
            echo "Check $i/20 - monitoring canary health..."
            
            # Check error rates
            ERROR_RATE=$(curl -s "https://monitoring.example.com/api/error-rate/canary")
            STABLE_ERROR_RATE=$(curl -s "https://monitoring.example.com/api/error-rate/stable")
            
            echo "Canary error rate: $ERROR_RATE%"
            echo "Stable error rate: $STABLE_ERROR_RATE%"
            
            # Abort if canary error rate is significantly higher
            if (( $(echo "$ERROR_RATE > $STABLE_ERROR_RATE * 2" | bc -l) )); then
              echo "❌ Canary error rate too high, rolling back..."
              
              # Reset traffic to stable version
              curl -X POST "https://$LB_HOST/api/traffic-split" \
                -H "Authorization: Bearer $LB_API_KEY" \
                -H "Content-Type: application/json" \
                -d '{"canary_percentage": 0, "stable_percentage": 100}'
              
              exit 1
            fi
            
            sleep 30
          done

          echo "✅ Canary monitoring completed successfully"
```

Canary releases require sophisticated monitoring and traffic management, but they provide the safest way to deploy changes that might have unexpected effects under real user load.

## Rollback Strategies

No deployment strategy is complete without a rollback plan. When things go wrong, you need to restore service quickly.

```yaml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      rollback_target:
        description: 'Commit SHA to rollback to'
        required: true
      environment:
        description: 'Environment to rollback'
        required: true
        type: choice
        options: [staging, production]

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.rollback_target }}

      - name: Download rollback artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-${{ github.event.inputs.rollback_target }}
          path: dist/

      - name: Execute rollback
        env:
          ENVIRONMENT: ${{ github.event.inputs.environment }}
          ROLLBACK_TARGET: ${{ github.event.inputs.rollback_target }}
        run: |
          echo "🚨 EMERGENCY ROLLBACK 🚨"
          echo "Rolling back $ENVIRONMENT to commit $ROLLBACK_TARGET"

          # Confirm rollback (in real scenario, this might be automated)
          echo "Executing rollback in 10 seconds..."
          sleep 10

          # Deploy the previous version
          DEPLOY_HOST="${{ secrets[format('{0}_DEPLOY_HOST', env.ENVIRONMENT)] }}"
          DEPLOY_KEY="${{ secrets[format('{0}_DEPLOY_KEY', env.ENVIRONMENT)] }}"

          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa

          rsync -avz --delete \
            -e "ssh -o StrictHostKeyChecking=no" \
            dist/ deployer@$DEPLOY_HOST:/var/www/app/

          ssh -o StrictHostKeyChecking=no deployer@$DEPLOY_HOST \
            "sudo systemctl restart app"

          echo "✅ Rollback completed"

      - name: Verify rollback
        run: |
          ENVIRONMENT="${{ github.event.inputs.environment }}"

          if [ "$ENVIRONMENT" = "production" ]; then
            TEST_URL="https://example.com"
          else
            TEST_URL="https://staging.example.com"
          fi

          echo "Verifying rollback..."
          sleep 30

          curl --fail "$TEST_URL/health" || {
            echo "❌ Rollback verification failed"
            exit 1
          }

          echo "✅ Rollback verified"

      - name: Send rollback notification
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          ENVIRONMENT: ${{ github.event.inputs.environment }}
          ROLLBACK_TARGET: ${{ github.event.inputs.rollback_target }}
        run: |
          curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-type: application/json' \
            --data "{
              \"text\": \"🚨 Emergency rollback completed for $ENVIRONMENT to commit $ROLLBACK_TARGET\",
              \"username\": \"Deployment Bot\",
              \"icon_emoji\": \":warning:\"
            }"
```

## Environment Configuration Management

Different environments need different configurations, but managing these differences can become complex. Here's a clean approach:

```yaml
# Use GitHub Variables for environment-specific configuration
- name: Set environment configuration
  run: |
    case "${{ github.event.inputs.environment || 'staging' }}" in
      "development")
        echo "API_URL=${{ vars.DEV_API_URL }}" >> $GITHUB_ENV
        echo "DATABASE_POOL_SIZE=5" >> $GITHUB_ENV
        echo "LOG_LEVEL=debug" >> $GITHUB_ENV
        ;;
      "staging")
        echo "API_URL=${{ vars.STAGING_API_URL }}" >> $GITHUB_ENV
        echo "DATABASE_POOL_SIZE=10" >> $GITHUB_ENV
        echo "LOG_LEVEL=info" >> $GITHUB_ENV
        ;;
      "production")
        echo "API_URL=${{ vars.PROD_API_URL }}" >> $GITHUB_ENV
        echo "DATABASE_POOL_SIZE=20" >> $GITHUB_ENV
        echo "LOG_LEVEL=warn" >> $GITHUB_ENV
        ;;
    esac
```

Use GitHub's Variables feature for non-sensitive environment-specific configuration, and Secrets for sensitive values. This keeps configuration organized and makes it easy to see what differs between environments.

The key to successful deployments is choosing the right strategy for your application and infrastructure. Start simple with basic environment progression, then add more sophisticated strategies as your needs grow and your confidence in the deployment process increases.

In the next section, we'll explore advanced workflow patterns and automation techniques that help you handle complex deployment scenarios and optimize your CI/CD pipelines.
