---
title: "DevOps Weekly Digest - Week 6, 2026"
date: "2026-02-02"
summary: "⚡ Curated updates from Kubernetes, cloud native tooling, CI/CD, IaC, observability, and security - handpicked for DevOps professionals!"
---

> 📌 **Handpicked by DevOps Daily** - Your weekly dose of curated DevOps news and updates!

---

## ⚓ Kubernetes

### 📄 New Conversion from cgroup v1 CPU Shares to v2 CPU Weight

I'm excited to announce the implementation of an improved conversion formula from cgroup v1 CPU shares to cgroup v2 CPU weight. This enhancement addresses critical issues with CPU priority allocation 

**📅 Jan 30, 2026** • **📰 Kubernetes Blog**

[**🔗 Read more**](https://kubernetes.io/blog/2026/01/30/new-cgroup-v1-to-v2-cpu-conversion-formula/)

### 📄 Ingress NGINX: Statement from the Kubernetes Steering and Security Response Committees

In March 2026, Kubernetes will retire Ingress NGINX, a piece of critical infrastructure for about half of cloud native environments. The retirement of Ingress NGINX was announced for March 2026, after

**📅 Jan 29, 2026** • **📰 Kubernetes Blog**

[**🔗 Read more**](https://kubernetes.io/blog/2026/01/29/ingress-nginx-statement/)

### 📄 How Banco do Brasil uses hyperautomation and platform engineering to drive efficiency

At the recent OpenShift Commons gathering in Atlanta, we had the opportunity to hear from Gustavo Fiuza, IT leader, and Welton Felipe, DevOps engineer, about the remarkable digital transformation at B

**📅 Jan 29, 2026** • **📰 OpenShift Blog**

[**🔗 Read more**](https://www.redhat.com/en/blog/how-banco-do-brasil-uses-hyperautomation-and-platform-engineering-drive-efficiency)

### 📄 The new Smartscape: Move faster and make better decisions with a real-time dependency graph of all your digital systems

Making the right decisions in modern IT can feel like changing a tire on a moving car. These environments span millions of rapidly changing entities across the cloud, on-premises, and Kubernetes, with

**📅 Jan 28, 2026** • **📰 Dynatrace Blog**

[**🔗 Read more**](https://www.dynatrace.com/news/blog/new-smartscape-make-better-decisions-with-real-time-dependency-graph-of-digital-systems/)

### 📄 Experimenting with Gateway API using kind

This document will guide you through setting up a local experimental environment with Gateway API on kind. This setup is designed for learning and testing. It helps you understand Gateway API concepts

**📅 Jan 28, 2026** • **📰 Kubernetes Blog**

[**🔗 Read more**](https://kubernetes.io/blog/2026/01/28/experimenting-gateway-api-with-kind/)

### 📄 Cluster API v1.12: Introducing In-place Updates and Chained Upgrades

Cluster API brings declarative management to Kubernetes cluster lifecycle, allowing users and platform teams to define the desired state of clusters and rely on controllers to continuously reconcile t

**📅 Jan 27, 2026** • **📰 Kubernetes Blog**

[**🔗 Read more**](https://kubernetes.io/blog/2026/01/27/cluster-api-v1-12-release/)

### 📄 Navigating the ingress-nginx archival: why now is the time to move to Cilium

This Member Blog was originally published on the Isovalent blog and is republished here with permission. If you’re running Kubernetes, there’s a good chance you rely on ingress-nginx to route external

**📅 Jan 27, 2026** • **📰 CNCF Blog**

[**🔗 Read more**](https://www.cncf.io/blog/2026/01/27/navigating-the-ingress-nginx-archival-why-now-is-the-time-to-move-to-cilium/)

### 📄 How should OpenFaaS users approach nodes/proxy RCE in Kubernetes?

We spin up a temporary Kubernetes cluster to explore and address a newly surfaced security vulnerability in Kubernetes. Security researcher Graham Helton recently disclosed an interesting Kubernetes R

**📅 Jan 27, 2026** • **📰 OpenFaaS Blog**

[**🔗 Read more**](https://www.openfaas.com/blog/kubernetes-node-proxy-rce/)

### 📄 k0s in 2025: A year of community growth, governance, and Kubernetes innovation

As we begin 2026, it’s worth reflecting on the remarkable progress we made with k0s as a project and as a community during 2025. Last year brought exciting advancements, adoption, and stronger communi

**📅 Jan 26, 2026** • **📰 CNCF Blog**

[**🔗 Read more**](https://www.cncf.io/blog/2026/01/26/k0s-in-2025-a-year-of-community-growth-governance-and-kubernetes-innovation/)

---

## ☁️ Cloud Native

### 📄 Docker Sandboxes: Run Claude Code and Other Coding Agents Unsupervised (but Safely)

We introduced Docker Sandboxes in experimental preview a few months ago. Today, we’re launching the next evolution with microVM isolation, available now for macOS and Windows. We started Docker Sandbo

**📅 Jan 30, 2026** • **📰 Docker Blog**

[**🔗 Read more**](https://www.docker.com/blog/docker-sandboxes-run-claude-code-and-other-coding-agents-unsupervised-but-safely/)

### 📄 Amazon ECS now publishes container health status as a CloudWatch metric

Amazon Elastic Container Service (Amazon ECS) now publishes container health status as a new metric in CloudWatch Container Insights with enhanced observability. Customers can now track the operationa

**📅 Jan 30, 2026** • **📰 CloudFormation Updates**

[**🔗 Read more**](https://aws.amazon.com/about-aws/whats-new/2026/01/amazon-ecs-container-health-status-metric/)

### 📄 Setting Up AWS Distro for OpenTelemetry with Container-Based Lambda Functions and New Relic

Learn how to implement AWS Distro for OpenTelemetry in container-based Lambda functions using multi-stage Docker builds for full observability.

**📅 Jan 30, 2026** • **📰 New Relic Blog**

[**🔗 Read more**](https://newrelic.com/blog/infrastructure-monitoring/setting-up-aws-distro-for-opentelemetry-with-container-based-lambda-functions-and-new-relic)

### 📄 From global stages to a local landmark: Organizing KCD Sri Lanka 2025

Learning from the global cloud native community Before KCD Sri Lanka 2025, our organizing team received an incredible opportunity to attend and speak at KubeCon events for the very first time. Our org

**📅 Jan 29, 2026** • **📰 CNCF Blog**

[**🔗 Read more**](https://www.cncf.io/blog/2026/01/29/from-global-stages-to-a-local-landmark-organizing-kcd-sri-lanka-2025/)

### 📄 Redefining cloud operations: Dynatrace brings intelligence to observability

Managing cloud environments has never been more complex; Dynatrace is redefining cloud operations to make them simple and easy. As organizations adopt hyperscaler technologies and cloud native archite

**📅 Jan 28, 2026** • **📰 Dynatrace Blog**

[**🔗 Read more**](https://www.dynatrace.com/news/blog/redefining-cloud-operations-dynatrace-brings-intelligence-to-observability/)

### 📄 Introducing Kthena: LLM inference for the cloud native era

The Volcano community is proud to announce the launch of Kthena, a new sub-project designed for global developers and MLOps engineers. Kthena is a cloud native, high-performance system for Large Langu

**📅 Jan 28, 2026** • **📰 CNCF Blog**

[**🔗 Read more**](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/)

### 📄 Clawdbot with Docker Model Runner, a Private Personal AI Assistant

Personal AI assistants are transforming how we manage our daily lives—from handling emails and calendars to automating smart homes. However, as these assistants gain more access to our private data, c

**📅 Jan 26, 2026** • **📰 Docker Blog**

[**🔗 Read more**](https://www.docker.com/blog/clawdbot-docker-model-runner-private-personal-ai/)

### 📄 Run Claude Code Locally with Docker Model Runner

We recently showed how to pair OpenCode with Docker Model Runner for a privacy-first, cost-effective AI coding setup. Today, we're bringing the same approach to Claude Code, Anthropic's agentic coding

**📅 Jan 26, 2026** • **📰 Docker Blog**

[**🔗 Read more**](https://www.docker.com/blog/run-claude-code-locally-docker-model-runner/)

---

## 🔄 CI/CD

### 📄 Meet the new navigation in LaunchDarkly

A cleaner, more focused navigation reduces noise and helps you move faster.

**📅 Feb 2, 2026** • **📰 LaunchDarkly Blog**

[**🔗 Read more**](https://launchdarkly.com/blog/new-launchdarkly-navigation/)

### 📄 Introducing LLM Playground for AI Configs

Test, compare, and trace LLM prompt and model variations before they reach production.

**📅 Feb 2, 2026** • **📰 LaunchDarkly Blog**

[**🔗 Read more**](https://launchdarkly.com/blog/llm-playground-for-ai-configs/)

### 📄 Introducing stratified sampling for LaunchDarkly Experimentation

Support fair, reliable experiment outcomes by eliminating hidden sample bias.

**📅 Feb 2, 2026** • **📰 LaunchDarkly Blog**

[**🔗 Read more**](https://launchdarkly.com/blog/stratified-sampling/)

### 📄 From pixels to characters: The engineering behind GitHub Copilot CLI’s animated ASCII banner

Learn how GitHub built an accessible, multi-terminal-safe ASCII animation for the Copilot CLI using custom tooling, ANSI color roles, and advanced terminal engineering. The post From pixels to charact

**📅 Jan 28, 2026** • **📰 GitHub Blog**

[**🔗 Read more**](https://github.blog/engineering/from-pixels-to-characters-the-engineering-behind-github-copilot-clis-animated-ascii-banner/)

### 📄 Year recap and future goals for the GitHub Innovation Graph

Discover the latest trends and insights on public software development activity on GitHub with data from the Innovation Graph through Q3 2025. The post Year recap and future goals for the GitHub Innov

**📅 Jan 28, 2026** • **📰 GitHub Blog**

[**🔗 Read more**](https://github.blog/news-insights/policy-news-and-insights/year-recap-and-future-goals-for-the-github-innovation-graph/)

### 📄 7 learnings from Anders Hejlsberg: The architect behind C# and TypeScript

Anders Hejlsberg shares lessons from C# and TypeScript on fast feedback loops, scaling software, open source visibility, and building tools that last. The post 7 learnings from Anders Hejlsberg: The a

**📅 Jan 27, 2026** • **📰 GitHub Blog**

[**🔗 Read more**](https://github.blog/developer-skills/programming-languages-and-frameworks/7-learnings-from-anders-hejlsberg-the-architect-behind-c-and-typescript/)

### 📄 Help shape the future of open source in Europe

Read GitHub’s position on the European Open Digital Ecosystem Strategy and learn how to participate. The post Help shape the future of open source in Europe appeared first on The GitHub Blog.

**📅 Jan 27, 2026** • **📰 GitHub Blog**

[**🔗 Read more**](https://github.blog/news-insights/policy-news-and-insights/help-shape-the-future-of-open-source-in-europe/)

### 📄 How to set up GitLab SAML SSO with Google Workspace

Single sign-on (SSO) simplifies user authentication and improves security by allowing employees to access multiple applications with one set of credentials. For organizations using both GitLab and Goo

**📅 Jan 27, 2026** • **📰 GitLab Blog**

[**🔗 Read more**](https://about.gitlab.com/blog/how-to-set-up-gitlab-saml-sso-with-google-workspace/)

---

## 🏗️ IaC

### 📄 Why Terraform Pipeline Failures Still Take 30 Minutes — and How We Cut Them to 2

The Problem Pipeline failures interrupt development workflows. The typical remediation process: Scan through thousands of lines of build logs to find the error Understand the root cause Write the fix 

**📅 Jan 29, 2026** • **📰 DZone DevOps**

[**🔗 Read more**](https://feeds.dzone.com/link/23568/17265976/automating-terraform-pipeline-failure-remediation)

### 📄 Pulumi Agent Skills: Best practices and more for AI coding assistants

AI coding assistants have transformed how developers write software, including infrastructure code. Tools like Claude Code, Cursor, and GitHub Copilot can generate code, explain complex systems, and a

**📅 Jan 29, 2026** • **📰 Pulumi Blog**

[**🔗 Read more**](https://www.pulumi.com/blog/pulumi-agent-skills/)

### 📄 AWS CloudFormation 2025 Year In Review

AWS CloudFormation enables you to model and provision your cloud application infrastructure as code-base templates. Whether you prefer writing templates directly in JSON or YAML, or using programming 

**📅 Jan 28, 2026** • **📰 AWS DevOps Blog**

[**🔗 Read more**](https://aws.amazon.com/blogs/devops/aws-cloudformation-2025-year-in-review/)

### 📄 The Rise of Platform Engineering: How Internal Developer Platforms Are Replacing Traditional DevOps

Platform engineering has shed its experimental veneer. What began as isolated attempts by infrastructure teams to tame cloud sprawl — ServiceNow tickets piling up, Terraform modules copy-pasted across

**📅 Jan 27, 2026** • **📰 DZone DevOps**

[**🔗 Read more**](https://feeds.dzone.com/link/23568/17264430/rise-of-platform-engineering-how-internal-dev-platforms)

### 📄 Manage Cloud Visibility and Governance with Infrastructure as Code

Do you know what cloud resources are running in your environment right now? Many organizations struggle to maintain visibility across their cloud estate, especially for resources created outside of in

**📅 Jan 26, 2026** • **📰 Pulumi Blog**

[**🔗 Read more**](https://www.pulumi.com/blog/pulumi-service-provider-insights-resources/)

---

## 📊 Observability

### 📄 AWS Lambda launches enhanced observability for Kafka event source mappings

AWS Lambda launches enhanced observability for Kafka event source mappings (ESM) that provides Amazon CloudWatch Logs and metrics to monitor event polling setup, scaling, and processing state of Kafka

**📅 Jan 30, 2026** • **📰 CloudFormation Updates**

[**🔗 Read more**](https://aws.amazon.com/about-aws/whats-new/2026/01/aws-Lambda-observability-for-kafka-esm/)

### 📄 The Power of Community: Applying Dr. King’s Lessons at New Relic

See how Dr. King’s lessons on equity shape life at New Relic. From inclusive ERGs to social impact partnerships, we're building a culture of belonging.

**📅 Jan 30, 2026** • **📰 New Relic Blog**

[**🔗 Read more**](https://newrelic.com/blog/news/the-power-of-community)

### 📄 Preventing network outages: How we use New Relic to monitor our multi-cloud infrastructure

Learn how we built Weather Station, an internal network monitoring system that achieved 90% faster incident detection across our multi-cloud infrastructure.

**📅 Jan 29, 2026** • **📰 New Relic Blog**

[**🔗 Read more**](https://newrelic.com/blog/observability/preventing-network-outages-how-we-use-new-relic-to-monitor-our-multi-cloud-infrastructure)

### 📄 The Declarative configuration journey: Why it took 5 years to ignore health check endpoints in tracing

One of the most persistent and popular feature requests for Java OpenTelemetry over the past couple of years has been the ability to efficiently drop spans for health check endpoints – or any other lo

**📅 Jan 29, 2026** • **📰 OpenTelemetry Blog**

[**🔗 Read more**](https://opentelemetry.io/blog/2025/declarative-config/)

### 📄 Less code, faster builds, same telemetry: Turbopack support for the Next.js SDK

TL;DR - Turbopack became the default in Next.js, so we reworked our SDK to stop depending on bundlers. The result is less code, faster builds, and the same tele...

**📅 Jan 29, 2026** • **📰 Sentry Blog**

[**🔗 Read more**](https://blog.sentry.io/turbopack-support-next-js-sdk/)

### 📄 OpenTelemetry Collector Follow-up Survey

In 2024, the End User SIG conducted a Collector Survey to gather feedback on how the OpenTelemetry Collector is used in practice and the user experience. Insights from that survey informed several dev

**📅 Jan 28, 2026** • **📰 OpenTelemetry Blog**

[**🔗 Read more**](https://opentelemetry.io/blog/2026/otel-collector-follow-up-survey-analysis/)

### 📄 Dynatrace Assist: Ask, analyze, and act with Dynatrace Intelligence

AI is changing the way we work, from boosting our efficiency and executing tasks on our behalf. As AI enters the agentic era, Dynatrace Assist is your trusted partner for working smarter with Dynatrac

**📅 Jan 28, 2026** • **📰 Dynatrace Blog**

[**🔗 Read more**](https://www.dynatrace.com/news/blog/dynatrace-assist-ask-analyze-and-act-with-dynatrace-intelligence/)

### 📄 Announcing agentic framework support and General Availability of the Dynatrace AI Observability app

As agentic AI becomes mission-critical, systems that reason, act, and self-optimize introduce new operational challenges. Their dynamic and non-deterministic behavior makes them difficult to debug, th

**📅 Jan 28, 2026** • **📰 Dynatrace Blog**

[**🔗 Read more**](https://www.dynatrace.com/news/blog/announcing-agentic-framework-support-and-general-availability-of-the-dynatrace-ai-observability-app/)

### 📄 Decoding Zabbix Proxy Traffic for Faster Troubleshooting

Usually, it is enough to simply look at the Zabbix proxy administration page or proxy health metrics to perform basic proxy troubleshooting. However, there are situations when a deeper look is require

**📅 Jan 27, 2026** • **📰 Zabbix Blog**

[**🔗 Read more**](https://blog.zabbix.com/decoding-zabbix-proxy-traffic-for-faster-troubleshooting/31898/)

### 📄 Seer: debug with AI at every stage of development

When we launched Seer, our AI debugging agent, we built it on a core belief: production context is essential for understanding the complex failure modes of real...

**📅 Jan 27, 2026** • **📰 Sentry Blog**

[**🔗 Read more**](https://blog.sentry.io/seer-debug-with-ai-at-every-stage-of-development/)

### 📄 Reducing Log Volume with the OpenTelemetry Log Deduplication Processor

Your logs are probably at least 80% repetitive noise. Connection retries, health checks, heartbeat messages: the same log line repeated thousands of times per minute. You pay storage costs for each on

**📅 Jan 26, 2026** • **📰 OpenTelemetry Blog**

[**🔗 Read more**](https://opentelemetry.io/blog/2026/log-deduplication-processor/)

### 📄 New Relic AI Impact Report 2026: How AIOps is Solving the "Firefighting" Crisis for Engineers

See how AIOps, intelligent observability, and AIOps is turning incidence response from reactive emergencies to proactive exercises.

**📅 Jan 26, 2026** • **📰 New Relic Blog**

[**🔗 Read more**](https://newrelic.com/blog/ai/new-relic-ai-impact-report-2026)

---

## 🔐 Security

### 📄 Threats Making WAVs - Incident Response to a Cryptomining Attack

Guardicore security researchers describe and uncover a full analysis of a cryptomining attack, which hid a cryptominer inside WAV files. The report includes the full attack vectors, from detection, in

**📅 Feb 2, 2026** • **📰 Linode Blog**

[**🔗 Read more**](https://www.akamai.com/blog/security/threats-making-wavs-incident-reponse-cryptomining-attack)

### 📄 Barman 3.17 Released

We are pleased to announce the release of Barman 3.17.0. Barman (Backup and Recovery Manager) is an open-source administration tool for remote backups and disaster recovery of PostgreSQL servers in bu

**📅 Feb 2, 2026** • **📰 PostgreSQL News**

[**🔗 Read more**](https://www.postgresql.org/about/news/barman-317-released-3223/)

### 📄 The shift left hangover: Why modern platforms are shifting down to cure developer fatigue

Over the last decade, “shift left” became the mantra of high-performing engineering organizations. The premise was sound: Move testing, security, The post The shift left hangover: Why modern platforms

**📅 Jan 31, 2026** • **📰 The New Stack**

[**🔗 Read more**](https://thenewstack.io/shift-left-hangover-steve-corndell/)

### 📄 Technical Deep Dive: How we Created a Security-hardened 1-Click Deploy OpenClaw

OpenClaw, an open source AI assistant (recently renamed from Moltbot, and earlier Clawdbot), has exploded in popularity over the last few days, and at DigitalOcean we immediately wondered “how can we 

**📅 Jan 30, 2026** • **📰 DigitalOcean Blog**

[**🔗 Read more**](https://www.digitalocean.com/blog/technical-dive-openclaw-hardened-1-click-app)

### 📄 Stop Guessing Your Compliance: Master the EU Cloud Sovereignty Framework in Minutes

For the last 2 years, Digital Sovereignty has been the “elephant in the room” for many. You know you need to comply with NIS2, DORA and the upcoming Cyber Resilience Act, but where do you actually sta

**📅 Jan 29, 2026** • **📰 SUSE Blog**

[**🔗 Read more**](https://www.suse.com/c/master-the-eu-cloud-sovereignty-framework-in-minutes/)

### 📄 Introducing OpenClaw on DigitalOcean: One-Click Deploy, Security-hardened, Production-Ready Agentic AI

Note: OpenClaw is formerly known as Moltbot and Clawdbot We’re excited to announce 1-Click deployment for OpenClaw on DigitalOcean Droplet® servers, making it faster to run always-on, agentic AI in a 

**📅 Jan 29, 2026** • **📰 DigitalOcean Blog**

[**🔗 Read more**](https://www.digitalocean.com/blog/moltbot-on-digitalocean)

### 📄 Game Dev in 2025: Excerpts From the State of Game Development Report

As we approach the midpoint of the decade, game developers face an evolving landscape shaped by shifting job security, technology choices, platform strategies, and practical AI adoption. Our State of 

**📅 Jan 29, 2026** • **📰 JetBrains Blog**

[**🔗 Read more**](https://blog.jetbrains.com/dotnet/2026/01/29/game-dev-in-2025-excerpts-from-the-state-of-game-development-report/)

### 📄 Harness AI Jan 2026: Human-Aware SRE & AI-Powered API & App Security

See the January 2026 Harness AI updates: Human-Aware SRE, AI-based API naming, and AppSec agents that automate incidents and security workflows. | Blog

**📅 Jan 29, 2026** • **📰 Harness Blog**

[**🔗 Read more**](https://www.harness.io/blog/harness-ai-january-2026-updates)

### 📄 AI-Powered DevSecOps: Automating Security with Machine Learning Tools

The VP of Engineering at a mid-sized SaaS company told me something last month that stuck with me. His team had grown their codebase by 340% in two years, but headcount in security had increased by ex

**📅 Jan 28, 2026** • **📰 DZone DevOps**

[**🔗 Read more**](https://feeds.dzone.com/link/23568/17265405/ai-powered-devsecops-automating-security-with-ml-tools)

### 📄 4 Reasons Why CTFs Are One of the Best Ways to Grow in Cybersecurity

Capture The Flag (CTF) competitions are a powerful way to accelerate your cybersecurity career by exposing you to real-world vulnerabilities and diverse technical niches. Discover why CTFs are one of 

**📅 Jan 27, 2026** • **📰 Snyk Blog**

[**🔗 Read more**](https://snyk.io/blog/ctfs-grow-cybersecurity/)

---

## 💾 Databases

### 📄 pg-status: microservice for checking the status of PostgreSQL hosts

Hi all! I'd like to share a small open‑source project I've been working on: pg-status. pg-status is a lightweight microservice (sidecar) that helps you instantly determine the status of your PostgreSQ

**📅 Feb 2, 2026** • **📰 PostgreSQL News**

[**🔗 Read more**](https://www.postgresql.org/about/news/pg-status-microservice-for-checking-the-status-of-postgresql-hosts-3222/)

### 📄 Introducing langcache-embed-v3-small

Semantic caching is a powerful idea, but most of the tools we’ve been using for it were never really built for the job. Until now, we’ve mostly relied on generic “RAG” embedding models – the kind used

**📅 Jan 30, 2026** • **📰 Redis Blog**

[**🔗 Read more**](https://redis.io/blog/introducing-langcache-embed-v3-small/)

### 📄 Redis vs ElastiCache (Valkey): Reserved Nodes, Database Savings Plans, and commitment risk

Everyone loves a discount. Nobody loves paying for stranded capacity and on-demand overages at the same time. The problem is commitment risk. That’s the gap between what you committed to buy and what 

**📅 Jan 30, 2026** • **📰 Redis Blog**

[**🔗 Read more**](https://redis.io/blog/redis-vs-elasticache-valkey/)

### 📄 What is a key value database?

You've hit this before: your app works fine with 100 users, but everything slows down at 10,000. Your relational database can't keep up with session lookups, cache misses are killing your API response

**📅 Jan 29, 2026** • **📰 Redis Blog**

[**🔗 Read more**](https://redis.io/blog/key-value-database/)

### 📄 Vector databases: what you need to know before production

You have your product requirements. You want to build a system that will search 10 million embeddings with sub-100ms latency and handle thousands of concurrent queries without performance degrading. B

**📅 Jan 29, 2026** • **📰 Redis Blog**

[**🔗 Read more**](https://redis.io/blog/vector-databases-what-you-need-to-know/)

### 📄 Litestream Writable VFS

I’m Ben Johnson, and I work on Litestream at Fly.io. Litestream is the missing backup/restore system for SQLite. It’s free, open-source software that should run anywhere, and you can read more about i

**📅 Jan 29, 2026** • **📰 Fly.io Blog**

[**🔗 Read more**](https://fly.io/blog/litestream-writable-vfs/)

### 📄 You Got OLAP in My OLTP: Can Analytics and Real-Time Database Workloads Coexist?

Explore isolation mechanisms and prioritization strategies that allow different database workloads to coexist without resource contention issues

**📅 Jan 28, 2026** • **📰 ScyllaDB Blog**

[**🔗 Read more**](https://www.scylladb.com/2026/01/28/can-database-workloads-coexist/)

### 📄 Seamless TiDB Cloud Upgrades: Replicating Production Workloads with Traffic Replay

Database upgrades are often a source of “performance anxiety.” Even with extensive testing, the gap between a sterile staging environment and the chaotic reality of production—characterized by shiftin

**📅 Jan 27, 2026** • **📰 TiDB Blog**

[**🔗 Read more**](https://www.pingcap.com/blog/seamless-tidb-cloud-upgrades-replicating-production-workloads-traffic-replay/)

---

## 🌐 Platforms

### 📄 Creating better runtime control with LaunchDarkly and AWS

Ship bold AI changes without the guesswork.

**📅 Feb 2, 2026** • **📰 LaunchDarkly Blog**

[**🔗 Read more**](https://launchdarkly.com/blog/runtime-control-launchdarkly-aws/)

### 📄 Keep Your Tech Flame Alive: Trailblazer Rachel Bayley

In this Akamai FLAME Trailblazer blog post, Rachel Bayley encourages women to step into the unknown and to be their authentic selves.

**📅 Feb 2, 2026** • **📰 Linode Blog**

[**🔗 Read more**](https://www.akamai.com/blog/culture/2024/may/keep-your-tech-flame-alive-trailblazer-rachel-bayley)

### 📄 The Oracle of Delphi Will Steal Your Credentials

Our deception technology is able to reroute attackers into honeypots, where they believe that they found their real target. The attacks brute forced passwords for RDP credentials to connect to the vic

**📅 Feb 2, 2026** • **📰 Linode Blog**

[**🔗 Read more**](https://www.akamai.com/blog/security/the-oracle-of-delphi-steal-your-credentials)

### 📄 The Nansh0u Campaign – Hackers Arsenal Grows Stronger

In the beginning of April, three attacks detected in the Guardicore Global Sensor Network (GGSN) caught our attention. All three had source IP addresses originating in South-Africa and hosted by Volum

**📅 Feb 2, 2026** • **📰 Linode Blog**

[**🔗 Read more**](https://www.akamai.com/blog/security/the-nansh0u-campaign-hackers-arsenal-grows-stronger)

### 📄 The Fire-and-Forget Pattern: Scaling Game Analytics with TiDB Cloud and Convex

Three developers, one hackathon, and a viral meme turned into a mission. This is the story of B40 Life Simulator, a financial literacy game inspired by the real B40 experience and the financial strugg

**📅 Feb 2, 2026** • **📰 TiDB Blog**

[**🔗 Read more**](https://www.pingcap.com/blog/the-fire-and-forget-pattern-scaling-game-analytics-with-tidb-cloud-and-convex/)

### 📄 Qodana for Android: Increasing Code Quality for Kotlin-First Teams

When people think about tooling for Android development, the conversation often gravitates towards platform-specific concerns: UI performance, layout validation, device compatibility, or resource mana

**📅 Jan 31, 2026** • **📰 JetBrains Blog**

[**🔗 Read more**](https://blog.jetbrains.com/qodana/2026/01/qodana-for-android-kotlin/)

### 📄 Amazon RDS now supports IPv6 for VPC endpoints of RDS Service APIs

Amazon RDS now supports Internet Protocol version 6 (IPv6) for VPC endpoints of RDS Service APIs, in addition to the existing IPv6 support for public endpoints. This allows you to configure dual-stack

**📅 Jan 30, 2026** • **📰 CloudFormation Updates**

[**🔗 Read more**](https://aws.amazon.com/about-aws/whats-new/2026/01/amazon-rds-ipv6-vpc-endpoints-service-apis)

### 📄 Amazon SageMaker Unified Studio now supports AWS PrivateLink

Today, Amazon SageMaker announced a new capability allowing you to establish connectivity between your Amazon Virtual Private Cloud (VPC) and Amazon SageMaker Unified Studio without customer data traf

**📅 Jan 30, 2026** • **📰 CloudFormation Updates**

[**🔗 Read more**](https://aws.amazon.com/about-aws/whats-new/2026/01/amazon-sagemaker-unified-studio-aws-privatelink/)

### 📄 Google’s AI advantage: why crawler separation is the only path to a fair Internet

Google's dual-purpose crawler creates an unfair AI advantage. To protect publishers and foster competition, the UK’s Competition and Markets Authority must mandate crawler separation for search and AI

**📅 Jan 30, 2026** • **📰 Cloudflare Blog**

[**🔗 Read more**](https://blog.cloudflare.com/uk-google-ai-crawler-policy/)

### 📄 Cloud CISO Perspectives: 5 top CISO priorities in 2026

Welcome to the second Cloud CISO Perspectives for January 2026. Today, Taylor Lehmann, director of healthcare and life sciences, Office of the CISO, offers his insights after decades of experience on 

**📅 Jan 30, 2026** • **📰 Google Cloud Blog**

[**🔗 Read more**](https://cloud.google.com/blog/products/identity-security/cloud-ciso-perspectives-5-top-ciso-priorities-in-2026/)

### 📄 What Google Cloud announced in AI this month

Editor’s note: Want to keep up with the latest from Google Cloud? Check back here for a monthly recap of our latest updates, announcements, resources, events, learning opportunities, and more. We used

**📅 Jan 30, 2026** • **📰 Google Cloud Blog**

[**🔗 Read more**](https://cloud.google.com/blog/products/ai-machine-learning/what-google-cloud-announced-in-ai-this-month/)

### 📄 Guidance from the Frontlines: Proactive Defense Against ShinyHunters-Branded Data Theft Targeting SaaS

Introduction Mandiant is tracking a significant expansion and escalation in the operations of threat clusters associated with ShinyHunters-branded extortion. As detailed in our companion report, 'Vish

**📅 Jan 30, 2026** • **📰 Google Cloud Blog**

[**🔗 Read more**](https://cloud.google.com/blog/topics/threat-intelligence/defense-against-shinyhunters-cybercrime-saas/)

---

## 📰 Misc

### 📄 January 2026 Insiders (version 1.109)

Learn what is new in the Visual Studio Code January 2026 Release (1.109). Read the full article

**📅 Feb 4, 2026** • **📰 VS Code Blog**

[**🔗 Read more**](https://code.visualstudio.com/updates/v1_109)

### 📄 Bot-Driven Development: Redefining DevOps Workflow

Explore the future of DevOps with bot-driven development (BotDD) that integrates AI-powered tools. Learn how intelligent agents enhance automation, testing, and project management, transforming the so

**📅 Feb 2, 2026** • **📰 DevOps.com**

[**🔗 Read more**](https://devops.com/bot-driven-development-redefining-devops-workflow/)

### 📄 Please Grow Up, Coder Launches AI Maturity Self-Assessment Tool

Coder introduces an AI maturity self-assessment service to help organizations evaluate their AI adoption in software development. As teams transition from ad hoc usage to structured workflows, this to

**📅 Feb 2, 2026** • **📰 DevOps.com**

[**🔗 Read more**](https://devops.com/please-grow-up-coder-launches-ai-maturity-self-assessment-tool/)

### 📄 Five Great DevOps Job Opportunities

Explore top DevOps job opportunities from companies like Technology Resource Experts, Thermo Fisher Scientific, Regeneron, Mutual of Omaha, and Macquarie Global Services. Advance your career with our 

**📅 Feb 2, 2026** • **📰 DevOps.com**

[**🔗 Read more**](https://devops.com/five-great-devops-job-opportunities-174/)

### 📄 SRE Weekly Issue #508

View on sreweekly.com SRE Weekly will be going on hiatus for 6 weeks, while I’m on leave caring for my partner after her kidney transplant surgery this week. It’s incredible that the National Kidney R

**📅 Feb 2, 2026** • **📰 SRE Weekly**

[**🔗 Read more**](https://sreweekly.com/sre-weekly-issue-508/)

### 📄 Liya Linux proves high performance doesn’t require a command line

Any Linux distribution claiming that it wants to make Linux easy and accessible to the general public, as well as The post Liya Linux proves high performance doesn’t require a command line appeared fi

**📅 Feb 1, 2026** • **📰 The New Stack**

[**🔗 Read more**](https://thenewstack.io/liya-linux-proves-high-performance-doesnt-require-a-command-line/)

### 📄 50 years ago, a young Bill Gates took on the ‘software pirates’

Just months after his 20th birthday, Bill Gates had already angered the programmer community. As the first home computers began The post 50 years ago, a young Bill Gates took on the ‘software pirates’

**📅 Feb 1, 2026** • **📰 The New Stack**

[**🔗 Read more**](https://thenewstack.io/50-years-ago-a-young-bill-gates-took-on-the-software-pirates/)

### 📄 Beating context rot in Claude Code with GSD

Until now, I’ve generally only used LLM tools with existing projects. Attempts to create detailed projects from scratch via agentic The post Beating context rot in Claude Code with GSD appeared first 

**📅 Jan 31, 2026** • **📰 The New Stack**

[**🔗 Read more**](https://thenewstack.io/beating-the-rot-and-getting-stuff-done/)

### 📄 Universal Proxy: Bringing Hidden Tech into the Light

Enterprises are embracing AI at an incredible pace—and that’s exciting! However, this rapid adoption creates significant operational challenges. Without a clear, centralized strategy, many of these am

**📅 Jan 30, 2026** • **📰 SUSE Blog**

[**🔗 Read more**](https://www.suse.com/c/universal-proxy-bringing-hidden-tech-into-the-light/)

### 📄 Busy Plugin Developers Newsletter – Q4 2025

Your quarterly dose of plugin dev news, tools, and tips from JetBrains. 🧩 Marketplace Updates Integration Tests Now Part of Automated Moderation Integration test results are now displayed directly on

**📅 Jan 30, 2026** • **📰 JetBrains Blog**

[**🔗 Read more**](https://blog.jetbrains.com/platform/2026/01/busy-plugin-developers-newsletter-q4-2025/)

### 📄 ‘PackageGate’ Vulnerabilities Can Let Attackers Bypass Shai-Hulud Defenses

In the wake of the massive Shai-Hulud supply chain attack that ripped through npm late last year and compromised more than 700 packages and exposed 25,000 repositories, developers in the JavaScript wo

**📅 Jan 30, 2026** • **📰 DevOps.com**

[**🔗 Read more**](https://devops.com/packagegate-vulnerabilities-can-let-attackers-bypass-shai-hulud-defenses/)

### 📄 ReSharper and Rider 2025.3.2 Updates Out Now!

We’ve just released another update for ReSharper, Rider and the .NET tools version 2025.3. You can update to this version from inside those tools, using the Toolbox app or our website. Let’s take a lo

**📅 Jan 29, 2026** • **📰 JetBrains Blog**

[**🔗 Read more**](https://blog.jetbrains.com/dotnet/2026/01/29/resharper-and-rider-2025-3-2/)
