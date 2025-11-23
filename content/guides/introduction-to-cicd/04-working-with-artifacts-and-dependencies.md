---
title: 'Working with Artifacts and Dependencies'
description: 'Learn to manage build artifacts, optimize dependency handling, and create efficient pipelines that share data between workflow jobs.'
order: 4
---

One of the most frustrating aspects of CI/CD is dealing with slow builds caused by repeatedly downloading the same dependencies, or worse, having builds fail because of flaky network connections during dependency installation. You've probably waited impatiently as npm downloads hundreds of packages for the third time today, or watched a deployment fail because a package registry was temporarily unavailable.

GitHub Actions provides powerful tools to eliminate these problems through intelligent caching and artifact management. When you understand how to preserve build outputs and share data efficiently between jobs, your workflows become faster, more reliable, and less prone to external failures.

## Understanding the Isolation Challenge

Every GitHub Actions job runs in a completely fresh virtual machine with no memory of previous executions. This isolation provides consistency and prevents workflows from interfering with each other, but it creates a challenge: how do you share data between jobs that need to work together?

Here's how data flows between isolated jobs using artifacts:

```
Job 1: Build Application
┌─────────────────────────┐
│  Fresh VM Environment   │
│  ┌─────────────────┐    │
│  │ 1. Checkout     │    │
│  │ 2. Install deps │    │
│  │ 3. Run tests    │    │
│  │ 4. Build app    │    │
│  │ 5. Create files │    │
│  └─────────────────┘    │
│           │             │
│           ▼             │
│    ┌─────────────┐      │
│    │   dist/     │      │ ← Build outputs
│    │   reports/  │      │
│    └─────────────┘      │
└─────────────────────────┘
           │
           ▼ Upload Artifact
    ┌─────────────────┐
    │  GitHub Storage │  ← Persistent storage
    │   "build-123"   │
    └─────────────────┘
           │
           ▼ Download Artifact
Job 2: Deploy Application
┌─────────────────────────┐
│  Fresh VM Environment   │  ← Completely new VM
│  ┌─────────────────┐    │
│  │ 1. Checkout     │    │
│  │ 2. Download     │    │
│  │    artifacts    │    │
│  │ 3. Deploy files │    │
│  └─────────────────┘    │
│    ┌─────────────┐      │
│    │   dist/     │      │ ← Same files as Job 1
│    │   reports/  │      │   but in new VM
│    └─────────────┘      │
└─────────────────────────┘
```

Without artifacts, each job would need to rebuild everything from scratch:

```
Without Artifacts (Inefficient):
Job 1: Test        Job 2: Build       Job 3: Deploy
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ 1. Checkout  │   │ 1. Checkout  │   │ 1. Checkout  │
│ 2. Install   │   │ 2. Install   │   │ 2. Install   │
│ 3. Test      │   │ 3. Build     │   │ 3. Build     │ ← Rebuild again!
└──────────────┘   └──────────────┘   │ 4. Deploy    │
                                      └──────────────┘

With Artifacts (Efficient):
Job 1: Test & Build    Job 2: Deploy
┌──────────────────┐   ┌──────────────┐
│ 1. Checkout      │   │ 1. Download  │
│ 2. Install       │   │    artifacts │
│ 3. Test          │   │ 2. Deploy    │ ← Use existing build
│ 4. Build         │───┤──────────────│
│ 5. Upload        │   └──────────────┘
└──────────────────┘
```

Think of artifacts as a way to preserve the valuable outputs of your build process - the compiled code, test reports, documentation, or deployment packages that represent the tangible results of your automation.

## Creating and Using Build Artifacts

Let's start with a practical example that shows how to create and consume build artifacts in a real workflow:

```yaml
name: Build and Deploy Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
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

      # Create a deployment package with everything needed
      - name: Create deployment package
        run: |
          mkdir -p deploy-package
          cp -r dist/* deploy-package/
          cp package.json deploy-package/
          cp package-lock.json deploy-package/

          # Add deployment metadata
          echo "{
            \"version\": \"${{ github.sha }}\",
            \"buildTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"branch\": \"${{ github.ref_name }}\"
          }" > deploy-package/build-info.json

      # Upload the complete deployment package
      - name: Upload deployment package
        uses: actions/upload-artifact@v4
        with:
          name: deployment-package
          path: deploy-package/
          retention-days: 30

      # Also upload test results for analysis
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: |
            coverage/
            test-results.xml
          retention-days: 7

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - name: Download deployment package
        uses: actions/download-artifact@v4
        with:
          name: deployment-package
          path: ./package

      - name: Verify package contents
        run: |
          echo "Deployment package contents:"
          ls -la package/

          echo "Build information:"
          cat package/build-info.json

          # Verify required files exist
          if [ ! -f "package/index.html" ]; then
            echo "Error: Missing index.html in deployment package"
            exit 1
          fi

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # Your deployment commands would go here
          # rsync -avz package/ user@staging-server:/var/www/app/
```

This workflow demonstrates several key concepts:

- The build job creates a complete deployment package with all necessary files
- Metadata is included in the package to track what's being deployed
- Different artifacts have different retention periods based on their purpose
- The deployment job downloads and verifies the package before deploying

## Smart Dependency Caching

Dependency caching can dramatically improve build performance, but it needs to be done correctly to avoid cache invalidation issues or stale dependencies. Here's how to implement intelligent caching:

```yaml
name: Optimized Build with Smart Caching

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          # Built-in npm cache that handles most scenarios
          cache: 'npm'

      # For more complex caching scenarios
      - name: Cache node modules
        uses: actions/cache@v3
        with:
          path: node_modules
          # Cache key includes package-lock.json hash
          # When dependencies change, cache automatically invalidates
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
          # Fallback to partial cache matches if exact key not found
          restore-keys: |
            ${{ runner.os }}-node-

      - name: Install dependencies
        run: |
          # Only install if node_modules doesn't exist or is outdated
          if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules/.package-lock.json" ]; then
            echo "Installing dependencies..."
            npm ci
            cp package-lock.json node_modules/.package-lock.json
          else
            echo "Using cached dependencies"
          fi

      # Cache other build artifacts that are expensive to recreate
      - name: Cache build cache
        uses: actions/cache@v3
        with:
          path: .next/cache
          key: ${{ runner.os }}-nextjs-${{ hashFiles('package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
          restore-keys: |
            ${{ runner.os }}-nextjs-${{ hashFiles('package-lock.json') }}-
            ${{ runner.os }}-nextjs-
```

The key to effective caching is understanding what changes and when. Package manager caches (like npm's) should be invalidated when lockfiles change. Build caches might need more sophisticated keys that include source code hashes.

## Handling Multiple Environments

Real projects often need to create different builds for different environments. Here's how to handle this efficiently:

```yaml
name: Multi-Environment Build

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        environment: [staging, production]
        include:
          - environment: staging
            api_url: https://api.staging.example.com
            debug: true
          - environment: production
            api_url: https://api.example.com
            debug: false

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build for ${{ matrix.environment }}
        run: npm run build
        env:
          NODE_ENV: production
          API_URL: ${{ matrix.api_url }}
          DEBUG: ${{ matrix.debug }}

      - name: Upload ${{ matrix.environment }} build
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ matrix.environment }}
          path: dist/
```

The matrix strategy creates separate builds for each environment in parallel, with environment-specific configuration applied during the build process.

## Sharing Data Between Workflows

Sometimes you need to share artifacts between different workflows. For example, a build workflow might create artifacts that a separate deployment workflow needs:

```yaml
# build.yml workflow
name: Build Application

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # ... build steps ...

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ github.sha }}
          path: dist/
          retention-days: 90
```

```yaml
# deploy.yml workflow
name: Deploy Application

on:
  workflow_dispatch:
    inputs:
      build_sha:
        description: 'Git SHA of build to deploy'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Download artifacts from a different workflow run
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-${{ github.event.inputs.build_sha }}
          path: dist/
          run-id: ${{ github.event.inputs.build_sha }}

      # ... deployment steps ...
```

This pattern separates build and deploy concerns while ensuring you can deploy any previously built version.

## Optimizing Artifact Storage

Artifacts consume storage space and can impact your GitHub Actions usage limits. Here's how to optimize artifact management:

```yaml
- name: Upload artifacts with smart retention
  uses: actions/upload-artifact@v4
  with:
    name: build-artifacts
    path: dist/
    # Keep production builds longer than development builds
    retention-days: ${{ github.ref == 'refs/heads/main' && 90 || 7 }}
    # Compress artifacts to save space
    compression-level: 9

# Clean up old artifacts automatically
- name: Clean up old artifacts
  uses: actions/github-script@v7
  with:
    script: |
      const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: context.runId
      });

      // Delete artifacts older than 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (const artifact of artifacts.data.artifacts) {
        if (new Date(artifact.created_at) < thirtyDaysAgo) {
          await github.rest.actions.deleteArtifact({
            owner: context.repo.owner,
            repo: context.repo.repo,
            artifact_id: artifact.id
          });
        }
      }
```

## Handling Large Dependencies

Some projects have unusually large dependencies or datasets that don't fit well in normal caching strategies. Here's how to handle them:

```yaml
- name: Cache large dependencies
  uses: actions/cache@v3
  with:
    path: |
      large-dataset/
      ml-models/
    key: large-deps-${{ hashFiles('data-version.txt') }}
    restore-keys: large-deps-

- name: Download large dependencies if needed
  run: |
    if [ ! -d "large-dataset" ]; then
      echo "Downloading large dataset..."
      wget -O dataset.tar.gz https://example.com/large-dataset.tar.gz
      tar -xzf dataset.tar.gz
      rm dataset.tar.gz
    else
      echo "Using cached large dataset"
    fi
```

For very large files, consider using Git LFS or external storage services like AWS S3, then downloading only when needed.

## Debugging Artifact Issues

When artifacts don't work as expected, here's how to troubleshoot:

```yaml
- name: Debug artifact creation
  run: |
    echo "Files to be uploaded:"
    find dist/ -type f -ls

    echo "Total size:"
    du -sh dist/

- name: Upload with debugging
  uses: actions/upload-artifact@v4
  with:
    name: debug-build
    path: dist/
  continue-on-error: true

- name: Check upload status
  run: |
    if [ $? -eq 0 ]; then
      echo "Artifact upload successful"
    else
      echo "Artifact upload failed"
      ls -la dist/
    fi
```

## Performance Best Practices

Here are practical tips to make your artifact and dependency management faster and more reliable:

**Parallel Artifact Operations**:

```yaml
- name: Upload multiple artifacts in parallel
  uses: actions/upload-artifact@v4
  with:
    name: logs
    path: logs/

- name: Upload test results
  uses: actions/upload-artifact@v4
  with:
    name: test-results
    path: test-results/
```

**Smart Cache Keys**:

```yaml
# Good: includes all relevant files in cache key
key: ${{ runner.os }}-deps-${{ hashFiles('package-lock.json', 'requirements.txt') }}

# Better: includes environment variables that affect dependencies
key: ${{ runner.os }}-deps-${{ env.NODE_VERSION }}-${{ hashFiles('package-lock.json') }}
```

**Avoid Cache Thrashing**:

```yaml
# Use restore-keys to provide fallback cache options
restore-keys: |
  ${{ runner.os }}-deps-${{ env.NODE_VERSION }}-
  ${{ runner.os }}-deps-
```

Understanding artifact and dependency management transforms slow, unreliable workflows into fast, predictable automation. In the next section, we'll explore how to handle environment variables and secrets securely, which is crucial for building workflows that work safely across different environments.
