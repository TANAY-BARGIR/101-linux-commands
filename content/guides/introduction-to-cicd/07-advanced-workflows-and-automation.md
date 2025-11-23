---
title: 'Advanced Workflows and Automation'
description: 'Learn complex GitHub Actions patterns including matrix builds, conditional logic, and workflow orchestration for sophisticated automation.'
order: 7
---

Simple workflows are great for getting started, but real projects often need more sophisticated automation. You might need to test across multiple operating systems, coordinate complex deployment sequences, or build different versions of your application for different platforms. As your projects grow, your automation needs to grow with them.

The challenge is building complex workflows that remain maintainable and debuggable. It's easy to create workflows that work but are impossible to understand or modify later. Understanding advanced GitHub Actions patterns helps you build powerful automation that your team can actually maintain.

## Matrix Builds for Multi-Platform Testing

Matrix builds let you run the same workflow across multiple configurations simultaneously. Instead of creating separate workflows for each platform or version, you define a matrix of variables and GitHub Actions runs your workflow for each combination.

Here's how matrix builds work:

```
Single Configuration (Traditional):
┌─────────────────────────────────┐
│        One Job                  │
│  OS: ubuntu-latest              │
│  Node: 18                       │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 1. Checkout             │    │
│  │ 2. Setup Node.js 18     │    │
│  │ 3. Install deps         │    │
│  │ 4. Run tests            │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘

Matrix Configuration (Parallel):
Matrix: { os: [ubuntu-latest, windows-latest, macos-latest],
          node: [16, 18, 20] }

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Job 1-1       │  │   Job 1-2       │  │   Job 1-3       │
│ ubuntu + node16 │  │ ubuntu + node18 │  │ ubuntu + node20 │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │1. Checkout  │ │  │ │1. Checkout  │ │  │ │1. Checkout  │ │
│ │2. Setup N16 │ │  │ │2. Setup N18 │ │  │ │2. Setup N20 │ │
│ │3. Install   │ │  │ │3. Install   │ │  │ │3. Install   │ │
│ │4. Test      │ │  │ │4. Test      │ │  │ │4. Test      │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Job 2-1       │  │   Job 2-2       │  │   Job 2-3       │
│ windows + node16│  │ windows + node18│  │ windows + node20│
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │1. Checkout  │ │  │ │1. Checkout  │ │  │ │1. Checkout  │ │
│ │2. Setup N16 │ │  │ │2. Setup N18 │ │  │ │2. Setup N20 │ │
│ │3. Install   │ │  │ │3. Install   │ │  │ │3. Install   │ │
│ │4. Test      │ │  │ │4. Test      │ │  │ │4. Test      │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Job 3-1       │  │   Job 3-2       │  │   Job 3-3       │
│  macos + node16 │  │  macos + node18 │  │  macos + node20 │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │
│ │1. Checkout  │ │  │ │1. Checkout  │ │  │ │1. Checkout  │ │
│ │2. Setup N16 │ │  │ │2. Setup N18 │ │  │ │2. Setup N20 │ │
│ │3. Install   │ │  │ │3. Install   │ │  │ │3. Install   │ │
│ │4. Test      │ │  │ │4. Test      │ │  │ │4. Test      │ │
│ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │
└─────────────────┘  └─────────────────┘  └─────────────────┘

Result: 9 parallel jobs test all combinations!
```

Here's a practical example that tests a Node.js application across multiple versions and operating systems:

```yaml
name: Cross-Platform Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      # Don't cancel other matrix jobs if one fails
      fail-fast: false
      matrix:
        # Test on multiple operating systems
        os: [ubuntu-latest, windows-latest, macos-latest]
        # Test multiple Node.js versions
        node-version: [16, 18, 20]
        # Exclude problematic combinations
        exclude:
          # Node 16 has issues on Windows in our specific setup
          - os: windows-latest
            node-version: 16
        # Add specific configurations
        include:
          # Test latest Node.js on Ubuntu with additional checks
          - os: ubuntu-latest
            node-version: 20
            run-integration-tests: true
            run-performance-tests: true

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run integration tests
        if: matrix.run-integration-tests
        run: npm run test:integration

      - name: Run performance tests
        if: matrix.run-performance-tests
        run: npm run test:performance

      - name: Build application
        run: npm run build

      # Upload test results with matrix info in the name
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results-${{ matrix.os }}-node${{ matrix.node-version }}
          path: |
            coverage/
            test-results.xml
```

The matrix strategy creates separate jobs for each combination of OS and Node.js version. The `fail-fast: false` setting ensures that if one combination fails, the others continue running so you can see the full picture of what works and what doesn't.

## Dynamic Matrix Generation

Sometimes you need to generate matrix configurations dynamically based on your repository contents or external data:

```yaml
name: Dynamic Multi-Service Build

on:
  push:
    branches: [main]

jobs:
  # Generate the matrix based on directories in the repository
  generate-matrix:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.generate.outputs.matrix }}

    steps:
      - uses: actions/checkout@v4

      - name: Generate service matrix
        id: generate
        run: |
          # Find all directories that contain a Dockerfile
          services=$(find . -name "Dockerfile" -type f | \
            sed 's|/Dockerfile||' | \
            sed 's|^\./||' | \
            jq -R -s -c 'split("\n")[:-1]')

          echo "Found services: $services"
          echo "matrix={\"service\":$services}" >> $GITHUB_OUTPUT

  # Build each service found in the previous job
  build-services:
    runs-on: ubuntu-latest
    needs: generate-matrix
    if: needs.generate-matrix.outputs.matrix != '{"service":[]}'

    strategy:
      matrix: ${{ fromJson(needs.generate-matrix.outputs.matrix) }}

    steps:
      - uses: actions/checkout@v4

      - name: Build ${{ matrix.service }}
        run: |
          echo "Building service: ${{ matrix.service }}"

          cd ${{ matrix.service }}

          # Build Docker image
          docker build -t ${{ matrix.service }}:${{ github.sha }} .

          # Run service-specific tests if they exist
          if [ -f "test.sh" ]; then
            echo "Running tests for ${{ matrix.service }}"
            chmod +x test.sh
            ./test.sh
          fi

      - name: Upload service artifacts
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.service }}-build
          path: ${{ matrix.service }}/dist/
```

This pattern is useful for monorepos where you want to automatically build and test all services without manually maintaining a list of what exists.

## Conditional Workflows and Smart Triggers

Not every workflow needs to run on every change. Smart conditional logic helps you run only the workflows that are actually needed:

```yaml
name: Smart Conditional Builds

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Detect what changed to decide what to build
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend-changed: ${{ steps.changes.outputs.frontend }}
      backend-changed: ${{ steps.changes.outputs.backend }}
      docs-changed: ${{ steps.changes.outputs.docs }}
      docker-changed: ${{ steps.changes.outputs.docker }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect changed files
        id: changes
        run: |
          # Compare with the merge base for PRs, or previous commit for pushes
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            BASE="${{ github.event.pull_request.base.sha }}"
          else
            BASE="HEAD~1"
          fi

          # Check if frontend files changed
          if git diff --name-only $BASE HEAD | grep -E '^(frontend/|src/.*\.(js|jsx|ts|tsx|css|scss))'; then
            echo "frontend=true" >> $GITHUB_OUTPUT
          else
            echo "frontend=false" >> $GITHUB_OUTPUT
          fi

          # Check if backend files changed
          if git diff --name-only $BASE HEAD | grep -E '^(backend/|api/|server/)'; then
            echo "backend=true" >> $GITHUB_OUTPUT
          else
            echo "backend=false" >> $GITHUB_OUTPUT
          fi

          # Check if documentation changed
          if git diff --name-only $BASE HEAD | grep -E '\.(md|rst|txt)$'; then
            echo "docs=true" >> $GITHUB_OUTPUT
          else
            echo "docs=false" >> $GITHUB_OUTPUT
          fi

          # Check if Docker files changed
          if git diff --name-only $BASE HEAD | grep -E '(Dockerfile|docker-compose)'; then
            echo "docker=true" >> $GITHUB_OUTPUT
          else
            echo "docker=false" >> $GITHUB_OUTPUT
          fi

  # Only build frontend if frontend files changed
  build-frontend:
    runs-on: ubuntu-latest
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend-changed == 'true'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Upload frontend build
        uses: actions/upload-artifact@v4
        with:
          name: frontend-build
          path: frontend/dist/

  # Only build backend if backend files changed
  build-backend:
    runs-on: ubuntu-latest
    needs: detect-changes
    if: needs.detect-changes.outputs.backend-changed == 'true'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21'

      - name: Build backend
        run: |
          cd backend
          go mod download
          go build -o app ./cmd/server

      - name: Upload backend build
        uses: actions/upload-artifact@v4
        with:
          name: backend-build
          path: backend/app

  # Only build Docker images if Docker files or application code changed
  build-docker:
    runs-on: ubuntu-latest
    needs: detect-changes
    if: |
      needs.detect-changes.outputs.docker-changed == 'true' ||
      needs.detect-changes.outputs.frontend-changed == 'true' ||
      needs.detect-changes.outputs.backend-changed == 'true'

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker images
        run: |
          echo "Building Docker images..."
          docker build -t myapp:${{ github.sha }} .

  # Deploy only if application code changed and we're on main branch
  deploy:
    runs-on: ubuntu-latest
    needs: [detect-changes, build-frontend, build-backend]
    if: |
      always() &&
      github.ref == 'refs/heads/main' &&
      (needs.detect-changes.outputs.frontend-changed == 'true' ||
       needs.detect-changes.outputs.backend-changed == 'true') &&
      (needs.build-frontend.result == 'success' || needs.build-frontend.result == 'skipped') &&
      (needs.build-backend.result == 'success' || needs.build-backend.result == 'skipped')

    steps:
      - name: Deploy application
        run: echo "Deploying application..."
```

This approach saves significant CI/CD time and resources by only running builds when they're actually needed.

## Workflow Orchestration with Reusable Workflows

As your automation grows, you'll find yourself repeating similar patterns across multiple repositories. Reusable workflows let you share common automation patterns:

```yaml
# .github/workflows/reusable-node-build.yml
name: Reusable Node.js Build

on:
  workflow_call:
    inputs:
      node-version:
        description: 'Node.js version to use'
        required: false
        default: '18'
        type: string
      working-directory:
        description: 'Working directory for Node.js app'
        required: false
        default: '.'
        type: string
      run-tests:
        description: 'Whether to run tests'
        required: false
        default: true
        type: boolean
    secrets:
      NPM_TOKEN:
        description: 'NPM authentication token'
        required: false
    outputs:
      build-version:
        description: 'Version of the built application'
        value: ${{ jobs.build.outputs.version }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.version }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'
          cache-dependency-path: ${{ inputs.working-directory }}/package-lock.json

      - name: Configure npm authentication
        if: secrets.NPM_TOKEN != ''
        run: |
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc

      - name: Install dependencies
        working-directory: ${{ inputs.working-directory }}
        run: npm ci

      - name: Run tests
        if: inputs.run-tests
        working-directory: ${{ inputs.working-directory }}
        run: npm test

      - name: Build application
        working-directory: ${{ inputs.working-directory }}
        run: npm run build

      - name: Get version
        id: version
        working-directory: ${{ inputs.working-directory }}
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts-${{ steps.version.outputs.version }}
          path: ${{ inputs.working-directory }}/dist/
```

Now you can use this reusable workflow in multiple repositories:

```yaml
# In any repository
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-frontend:
    uses: ./.github/workflows/reusable-node-build.yml
    with:
      working-directory: frontend
      node-version: '18'
      run-tests: true
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

  build-backend:
    uses: ./.github/workflows/reusable-node-build.yml
    with:
      working-directory: backend
      node-version: '20'
      run-tests: false

  deploy:
    needs: [build-frontend, build-backend]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy application
        run: |
          echo "Frontend version: ${{ needs.build-frontend.outputs.build-version }}"
          echo "Backend version: ${{ needs.build-backend.outputs.build-version }}"
          # Deploy logic here
```

## Complex Conditional Logic

Sometimes you need more sophisticated conditional logic than simple if statements can provide:

```yaml
name: Advanced Conditional Logic

on:
  push:
    branches: [main, develop, 'feature/*', 'hotfix/*']
  pull_request:
    branches: [main, develop]

jobs:
  determine-strategy:
    runs-on: ubuntu-latest
    outputs:
      deploy-environment: ${{ steps.strategy.outputs.environment }}
      run-integration-tests: ${{ steps.strategy.outputs.integration-tests }}
      notify-team: ${{ steps.strategy.outputs.notify }}
      deployment-strategy: ${{ steps.strategy.outputs.strategy }}

    steps:
      - name: Determine deployment strategy
        id: strategy
        run: |
          # Complex logic to determine what to do based on branch and event
          BRANCH="${{ github.ref_name }}"
          EVENT="${{ github.event_name }}"

          echo "Branch: $BRANCH, Event: $EVENT"

          # Determine environment
          if [[ "$BRANCH" == "main" && "$EVENT" == "push" ]]; then
            echo "environment=production" >> $GITHUB_OUTPUT
            echo "integration-tests=true" >> $GITHUB_OUTPUT
            echo "notify=true" >> $GITHUB_OUTPUT
            echo "strategy=blue-green" >> $GITHUB_OUTPUT
          elif [[ "$BRANCH" == "develop" && "$EVENT" == "push" ]]; then
            echo "environment=staging" >> $GITHUB_OUTPUT
            echo "integration-tests=true" >> $GITHUB_OUTPUT
            echo "notify=false" >> $GITHUB_OUTPUT
            echo "strategy=rolling" >> $GITHUB_OUTPUT
          elif [[ "$BRANCH" =~ ^feature/ ]]; then
            echo "environment=review" >> $GITHUB_OUTPUT
            echo "integration-tests=false" >> $GITHUB_OUTPUT
            echo "notify=false" >> $GITHUB_OUTPUT
            echo "strategy=direct" >> $GITHUB_OUTPUT
          elif [[ "$BRANCH" =~ ^hotfix/ ]]; then
            echo "environment=hotfix" >> $GITHUB_OUTPUT
            echo "integration-tests=true" >> $GITHUB_OUTPUT
            echo "notify=true" >> $GITHUB_OUTPUT
            echo "strategy=direct" >> $GITHUB_OUTPUT
          elif [[ "$EVENT" == "pull_request" ]]; then
            echo "environment=preview" >> $GITHUB_OUTPUT
            echo "integration-tests=false" >> $GITHUB_OUTPUT
            echo "notify=false" >> $GITHUB_OUTPUT
            echo "strategy=direct" >> $GITHUB_OUTPUT
          else
            echo "environment=none" >> $GITHUB_OUTPUT
            echo "integration-tests=false" >> $GITHUB_OUTPUT
            echo "notify=false" >> $GITHUB_OUTPUT
            echo "strategy=none" >> $GITHUB_OUTPUT
          fi

  deploy:
    needs: determine-strategy
    runs-on: ubuntu-latest
    if: needs.determine-strategy.outputs.deploy-environment != 'none'
    environment: ${{ needs.determine-strategy.outputs.deploy-environment }}

    steps:
      - name: Deploy using ${{ needs.determine-strategy.outputs.deployment-strategy }} strategy
        run: |
          echo "Deploying to ${{ needs.determine-strategy.outputs.deploy-environment }}"
          echo "Using ${{ needs.determine-strategy.outputs.deployment-strategy }} strategy"

          # Execute deployment based on strategy
          case "${{ needs.determine-strategy.outputs.deployment-strategy }}" in
            "blue-green")
              echo "Executing blue-green deployment..."
              ;;
            "rolling")
              echo "Executing rolling deployment..."
              ;;
            "direct")
              echo "Executing direct deployment..."
              ;;
          esac

  integration-tests:
    needs: [determine-strategy, deploy]
    runs-on: ubuntu-latest
    if: needs.determine-strategy.outputs.run-integration-tests == 'true'

    steps:
      - name: Run integration tests
        run: echo "Running integration tests for ${{ needs.determine-strategy.outputs.deploy-environment }}"

  notify:
    needs: [determine-strategy, deploy, integration-tests]
    runs-on: ubuntu-latest
    if: always() && needs.determine-strategy.outputs.notify-team == 'true'

    steps:
      - name: Send notification
        run: |
          if [[ "${{ needs.deploy.result }}" == "success" && "${{ needs.integration-tests.result }}" == "success" ]]; then
            echo "✅ Deployment successful!"
          else
            echo "❌ Deployment failed!"
          fi
```

## Parallel Workflows with Coordination

Sometimes you need multiple workflows to coordinate their activities:

```yaml
# Primary build workflow
name: Build Application

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build application
        run: echo "Building..."

      - name: Trigger deployment workflow
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'deploy.yml',
              ref: 'main',
              inputs: {
                build_sha: context.sha,
                environment: 'staging'
              }
            });
```

```yaml
# Separate deployment workflow
name: Deploy Application

on:
  workflow_dispatch:
    inputs:
      build_sha:
        description: 'Build SHA to deploy'
        required: true
      environment:
        description: 'Environment to deploy to'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy build ${{ github.event.inputs.build_sha }}
        run: |
          echo "Deploying ${{ github.event.inputs.build_sha }} to ${{ github.event.inputs.environment }}"
```

This separation allows you to trigger deployments independently of builds, which is useful for promoting the same build artifact through different environments.

## Error Handling and Recovery

Advanced workflows need sophisticated error handling:

```yaml
name: Robust Workflow with Error Handling

jobs:
  deploy-with-retry:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy with automatic retry
        uses: nick-fields/retry@v2
        with:
          timeout_minutes: 10
          max_attempts: 3
          retry_wait_seconds: 30
          command: |
            echo "Attempting deployment..."
            # Your deployment command here
            if [ $RANDOM -lt 16384 ]; then
              echo "Deployment failed, will retry..."
              exit 1
            else
              echo "Deployment successful!"
            fi

      - name: Handle deployment failure
        if: failure()
        run: |
          echo "Deployment failed after all retries"
          # Send alert, create incident, etc.

      - name: Cleanup on failure
        if: failure()
        run: |
          echo "Running cleanup after failure..."
          # Cleanup partially deployed resources

      - name: Success notification
        if: success()
        run: |
          echo "Deployment completed successfully"
```

Advanced workflows give you the power to handle complex scenarios, but they require careful planning and testing. Start with simpler patterns and gradually add complexity as your needs grow and your confidence with GitHub Actions increases.

In the next section, we'll explore monitoring, debugging, and optimization techniques that help you maintain reliable automation as your workflows become more sophisticated.
