---
title: 'Real-World Examples and Next Steps'
description: 'Explore complete CI/CD implementations for different project types and learn how to continue your automation journey.'
order: 10
---

You've learned the individual pieces of GitHub Actions, but seeing how they fit together in real projects makes the difference between understanding concepts and being able to implement them effectively. Real-world CI/CD isn't just about running tests and deployments - it's about creating systems that handle the messy complexities of actual software development.

Different types of projects need different automation approaches. A React frontend has different requirements than a Python API, a mobile app, or a multi-service microservices architecture. Understanding these patterns helps you adapt the concepts you've learned to your specific situation.

Here's how different project types typically structure their CI/CD pipelines:

```
Single Application (React/Node.js):
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Push to main/develop → Trigger Workflow             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
        ┌─────────────────────────────────────────┐
        │            Parallel Quality             │
        │              ┌─────────────┐            │
        │              │    Lint     │            │
        │              └─────────────┘            │
        │              ┌─────────────┐            │
        │              │    Test     │            │
        │              └─────────────┘            │
        │              ┌─────────────┐            │
        │              │ Type Check  │            │
        │              └─────────────┘            │
        └─────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │      Build      │
                    │   Application   │
                    └─────────────────┘
                               │
                               ▼
    ┌──────────────────────────────────────────────────────────┐
    │                    Deploy Pipeline                       │
    │                                                          │
    │  Dev Environment ──▶ Staging Environment ──▶ Production  │
    │  (auto on develop)   (auto on main)        (manual gate) │
    └──────────────────────────────────────────────────────────┘

Microservices/Monorepo:
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Repository                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ services/api/  services/web/  services/mobile/      │    │
│  │ packages/shared/                                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │ Detect Changes  │
                    │ (path filtering)│
                    └─────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│ API Service │        │ Web Service │        │Mobile App   │
│             │        │             │        │             │
│ ┌─────────┐ │        │ ┌─────────┐ │        │ ┌─────────┐ │
│ │ Test    │ │        │ │ Test    │ │        │ │ Test    │ │
│ │ Build   │ │        │ │ Build   │ │        │ │ Build   │ │
│ │ Deploy  │ │        │ │ Deploy  │ │        │ │ Deploy  │ │
│ └─────────┘ │        │ └─────────┘ │        │ └─────────┘ │
└─────────────┘        └─────────────┘        └─────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │ Integration     │
                    │ Tests (E2E)     │
                    └─────────────────┘
```

## Complete React Application Pipeline

Let's examine a full-featured React application with modern tooling, multiple environments, and production-ready practices:

```yaml
name: React Application CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '18'
  CACHE_VERSION: 'v1'

jobs:
  # Quality checks run in parallel for fast feedback
  quality-checks:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # Run multiple quality checks in parallel using step-level parallelism
      - name: Lint code
        run: npm run lint

      - name: Check TypeScript types
        run: npm run type-check

      - name: Check code formatting
        run: npm run format:check

      - name: Run unit tests
        run: npm test -- --coverage --watchAll=false
        env:
          CI: true

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info

  # Build application for different environments
  build:
    runs-on: ubuntu-latest
    needs: quality-checks

    strategy:
      matrix:
        environment: [development, staging, production]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for ${{ matrix.environment }}
        run: npm run build
        env:
          NODE_ENV: production
          REACT_APP_ENV: ${{ matrix.environment }}
          REACT_APP_API_URL: ${{ matrix.environment == 'production' && 'https://api.myapp.com' || matrix.environment == 'staging' && 'https://api.staging.myapp.com' || 'https://api.dev.myapp.com' }}
          REACT_APP_SENTRY_DSN: ${{ secrets[format('SENTRY_DSN_{0}', matrix.environment)] }}
          GENERATE_SOURCEMAP: ${{ matrix.environment != 'production' }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.environment }}
          path: build/
          retention-days: ${{ matrix.environment == 'production' && 30 || 7 }}

  # End-to-end tests using Playwright
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [quality-checks, build]
    if: github.event_name == 'pull_request' || github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Download development build
        uses: actions/download-artifact@v4
        with:
          name: build-development
          path: build/

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Start application server
        run: |
          npm install -g serve
          serve -s build -l 3000 &
          # Wait for server to start
          sleep 5

      - name: Run E2E tests
        run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  # Deploy to different environments based on branch
  deploy-development:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: development

    steps:
      - name: Download development build
        uses: actions/download-artifact@v4
        with:
          name: build-development
          path: build/

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './build'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: 'Deploy from GitHub Actions'
          enable-pull-request-comment: false
          enable-commit-comment: true
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID_DEV }}

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [build, e2e-tests]
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - name: Download staging build
        uses: actions/download-artifact@v4
        with:
          name: build-staging
          path: build/

      - name: Deploy to staging
        run: |
          # Deploy to S3 and invalidate CloudFront
          aws s3 sync build/ s3://${{ secrets.S3_BUCKET_STAGING }}/ --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_STAGING }} --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1

      - name: Run smoke tests on staging
        run: |
          # Wait for deployment to propagate
          sleep 30

          # Basic smoke tests
          curl --fail https://staging.myapp.com/
          curl --fail https://staging.myapp.com/health

  deploy-production:
    runs-on: ubuntu-latest
    needs: [build, deploy-staging]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Download production build
        uses: actions/download-artifact@v4
        with:
          name: build-production
          path: build/

      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          aws s3 sync build/ s3://${{ secrets.S3_BUCKET_PRODUCTION }}/ --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_PRODUCTION }} --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: us-east-1

      - name: Run production smoke tests
        run: |
          sleep 30
          curl --fail https://myapp.com/
          curl --fail https://myapp.com/health

      - name: Send deployment notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed!'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

This example demonstrates a complete React application pipeline with quality checks, multi-environment builds, end-to-end testing, and progressive deployment through development, staging, and production environments.

## Node.js API with Database Pipeline

Here's a complete pipeline for a Node.js API that includes database migrations and integration testing:

```yaml
name: Node.js API CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: testdb
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432

jobs:
  test:
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

      - name: Run database migrations
        run: npm run migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

      - name: Run unit tests
        run: npm test
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:${{ github.sha }}
            ghcr.io/${{ github.repository }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            # Pull latest image
            docker pull ghcr.io/${{ github.repository }}:${{ github.sha }}

            # Run database migrations
            docker run --rm \
              --network app-network \
              -e DATABASE_URL=${{ secrets.DATABASE_URL }} \
              ghcr.io/${{ github.repository }}:${{ github.sha }} \
              npm run migrate

            # Update running container
            docker stop api-production || true
            docker rm api-production || true

            docker run -d \
              --name api-production \
              --network app-network \
              -p 3000:3000 \
              -e NODE_ENV=production \
              -e DATABASE_URL=${{ secrets.DATABASE_URL }} \
              -e JWT_SECRET=${{ secrets.JWT_SECRET }} \
              --restart unless-stopped \
              ghcr.io/${{ github.repository }}:${{ github.sha }}

            # Wait for health check
            sleep 10
            curl --fail http://localhost:3000/health || exit 1
```

## Monorepo with Multiple Services

For complex projects with multiple services, you need more sophisticated workflow coordination:

```yaml
name: Monorepo CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Detect which services changed
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      api-changed: ${{ steps.changes.outputs.api }}
      web-changed: ${{ steps.changes.outputs.web }}
      mobile-changed: ${{ steps.changes.outputs.mobile }}
      shared-changed: ${{ steps.changes.outputs.shared }}

    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            api:
              - 'services/api/**'
              - 'packages/shared/**'
            web:
              - 'services/web/**'
              - 'packages/shared/**'
            mobile:
              - 'services/mobile/**'
              - 'packages/shared/**'
            shared:
              - 'packages/shared/**'

  # Test shared packages first since other services depend on them
  test-shared:
    runs-on: ubuntu-latest
    needs: detect-changes
    if: needs.detect-changes.outputs.shared-changed == 'true'

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test --workspace=packages/shared

  # Test and build API service
  test-api:
    runs-on: ubuntu-latest
    needs: [detect-changes, test-shared]
    if: always() && needs.detect-changes.outputs.api-changed == 'true' && (needs.test-shared.result == 'success' || needs.test-shared.result == 'skipped')

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test --workspace=services/api
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb

  # Test web service
  test-web:
    runs-on: ubuntu-latest
    needs: [detect-changes, test-shared]
    if: always() && needs.detect-changes.outputs.web-changed == 'true' && (needs.test-shared.result == 'success' || needs.test-shared.result == 'skipped')

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test --workspace=services/web
      - run: npm run build --workspace=services/web

  # Deploy services that changed and passed tests
  deploy:
    runs-on: ubuntu-latest
    needs: [detect-changes, test-api, test-web]
    if: always() && github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy API service
        if: needs.detect-changes.outputs.api-changed == 'true' && needs.test-api.result == 'success'
        run: |
          echo "Deploying API service..."
          # API deployment commands

      - name: Deploy Web service
        if: needs.detect-changes.outputs.web-changed == 'true' && needs.test-web.result == 'success'
        run: |
          echo "Deploying Web service..."
          # Web deployment commands
```

## Mobile App CI/CD with App Store Deployment

Mobile applications have unique requirements for building, signing, and distributing apps:

```yaml
name: React Native Mobile App

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
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

      - name: Run linting
        run: npm run lint

  build-android:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '11'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Install dependencies
        run: npm ci

      - name: Build Android app
        run: |
          cd android
          ./gradlew assembleRelease
        env:
          MYAPP_UPLOAD_STORE_FILE: ${{ secrets.ANDROID_KEYSTORE_FILE }}
          MYAPP_UPLOAD_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          MYAPP_UPLOAD_STORE_PASSWORD: ${{ secrets.ANDROID_STORE_PASSWORD }}
          MYAPP_UPLOAD_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: android/app/build/outputs/apk/release/

  build-ios:
    runs-on: macos-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install iOS dependencies
        run: |
          cd ios
          pod install

      - name: Build iOS app
        run: |
          cd ios
          xcodebuild -workspace MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Release \
            -destination generic/platform=iOS \
            -archivePath MyApp.xcarchive \
            archive

      - name: Export IPA
        run: |
          cd ios
          xcodebuild -exportArchive \
            -archivePath MyApp.xcarchive \
            -exportOptionsPlist ExportOptions.plist \
            -exportPath build

      - name: Upload IPA
        uses: actions/upload-artifact@v4
        with:
          name: ios-ipa
          path: ios/build/*.ipa
```

## Expanding Your CI/CD Knowledge

Now that you understand the fundamentals and have seen real-world examples, here are areas to explore next:

### Infrastructure as Code Integration

Combine GitHub Actions with infrastructure management tools:

```yaml
name: Infrastructure and Application Deployment

jobs:
  provision-infrastructure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0

      - name: Terraform Init
        run: terraform init

      - name: Terraform Plan
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        run: terraform apply tfplan

      - name: Output infrastructure details
        run: terraform output -json > infrastructure.json

      - name: Upload infrastructure details
        uses: actions/upload-artifact@v4
        with:
          name: infrastructure-config
          path: infrastructure.json

  deploy-application:
    needs: provision-infrastructure
    runs-on: ubuntu-latest
    steps:
      - name: Download infrastructure config
        uses: actions/download-artifact@v4
        with:
          name: infrastructure-config

      - name: Deploy to provisioned infrastructure
        run: |
          # Use infrastructure.json to get deployment targets
          # Deploy application using the provisioned resources
```

### Advanced Testing Strategies

Implement sophisticated testing approaches:

- **Contract Testing**: Ensure API compatibility between services
- **Performance Testing**: Automated load testing in CI/CD
- **Security Testing**: SAST, DAST, and dependency scanning
- **Accessibility Testing**: Automated a11y testing for web applications

### Monitoring and Observability Integration

Connect your CI/CD pipeline to monitoring systems:

```yaml
- name: Create deployment marker
  run: |
    curl -X POST "https://api.datadog.com/api/v1/events" \
      -H "DD-API-KEY: ${{ secrets.DATADOG_API_KEY }}" \
      -H "Content-Type: application/json" \
      -d '{
        "title": "Deployment",
        "text": "Deployed version ${{ github.sha }} to production",
        "tags": ["deployment", "production", "github-actions"]
      }'
```

### GitOps and Deployment Automation

Explore GitOps patterns where infrastructure and deployment configurations are managed through Git:

- **ArgoCD**: Kubernetes-native GitOps
- **Flux**: CNCF GitOps toolkit
- **GitHub Environments**: Advanced deployment protection and tracking

### Enterprise Patterns

For larger organizations, consider:

- **Self-hosted Runners**: Custom runner infrastructure for sensitive workloads
- **Organizational Policies**: Standardize workflows across repositories
- **Cost Management**: Monitor and optimize CI/CD resource usage
- **Compliance Integration**: SOC2, ISO27001, and other compliance frameworks

## Common Pitfalls and How to Avoid Them

As you build more complex CI/CD systems, watch out for these common issues:

### Over-Engineering Early

Start simple and add complexity gradually. A basic workflow that works is better than a complex workflow that's unreliable.

### Ignoring Security from the Start

Security should be built in from the beginning, not added later. Review the security practices from the previous section regularly.

### Poor Secret Management

Never hardcode secrets, even in private repositories. Use GitHub Secrets appropriately and rotate them regularly.

### Flaky Tests

Unreliable tests are worse than no tests. Invest time in making tests deterministic and fixing intermittent failures.

### Slow Feedback Loops

Optimize for fast feedback. Developers should know within minutes if their changes break something.

### Lack of Monitoring

Monitor your CI/CD system itself. Track build times, failure rates, and resource usage to identify improvement opportunities.

## Building a Learning Plan

To continue improving your CI/CD skills:

1. **Practice with Personal Projects**: Apply these concepts to your own projects, even simple ones
2. **Read Industry Content**: Follow DevOps blogs, conference talks, and case studies
3. **Experiment with Tools**: Try different CI/CD platforms and tools to understand their strengths
4. **Join Communities**: Participate in DevOps and GitHub Actions communities
5. **Contribute to Open Source**: Many open source projects have sophisticated CI/CD that you can learn from

## The Journey Continues

CI/CD is not a destination but a journey of continuous improvement. The fundamentals you've learned here - automation, testing, security, monitoring - apply regardless of which specific tools you use. Technology changes, but the principles of reliable software delivery remain constant.

Start with simple automation and gradually add sophistication as your needs grow and your confidence increases. Focus on solving real problems rather than implementing complex solutions for their own sake. Most importantly, remember that CI/CD exists to help teams deliver better software faster - keep that goal in mind as you design and improve your automation.

The investment you make in learning CI/CD pays dividends throughout your career. These skills are valuable across industries, technologies, and team sizes. Whether you're working on a solo project or managing deployment pipelines for a large organization, understanding how to automate software delivery effectively makes you a more valuable developer and team member.

Keep experimenting, keep learning, and keep improving your automation. The journey from manual deployments to sophisticated CI/CD systems is rewarding, and the skills you develop will serve you well throughout your career in software development.
