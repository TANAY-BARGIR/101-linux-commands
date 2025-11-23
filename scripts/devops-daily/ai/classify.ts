import { NewsItem, Classification } from '../crawler/types.js';
import { callOpenAIJson } from './openai.js';

const CLASSIFICATION_SYSTEM_PROMPT = `You are a DevOps editor. You classify news items into categories:
- Kubernetes: K8s core, distributions, tools
- Cloud Native: CNCF projects, containers, service mesh, networking
- CI/CD: Continuous integration/deployment, GitOps, pipelines
- IaC: Infrastructure as Code (Terraform, Pulumi, Ansible, etc.)
- Observability: Monitoring, logging, tracing, metrics
- Security: Container security, secrets management, policy enforcement
- Databases: SQL, NoSQL, data stores
- Platforms: Cloud providers, PaaS, hosting
- Misc: Everything else

Return strict JSON:
{
  "include": boolean,
  "category": "...",
  "tags": [],
  "summary": "1-2 sentences"
}

Include only technical, actionable updates.
Exclude: marketing fluff, company announcements without technical content, duplicate content.`;

/**
 * Simple keyword-based classification without AI
 */
function simpleClassifyItem(item: NewsItem): Classification {
  const titleLower = item.title.toLowerCase();
  const excerptLower = item.excerpt.toLowerCase();
  const combined = `${titleLower} ${excerptLower}`;

  // Exclude event announcements
  if (
    titleLower.includes('is coming!') ||
    titleLower.match(/\b(conference|event|meetup)\s+\d{4}\b/)
  ) {
    return {
      include: false,
      category: 'Misc',
      tags: ['event'],
      summary: item.excerpt.substring(0, 200),
    };
  }

  // Simple keyword-based categorization
  let category = item.category || 'Misc';

  if (combined.match(/\b(kubernetes|k8s|kubectl|helm|kube)\b/)) {
    category = 'Kubernetes';
  } else if (combined.match(/\b(docker|container|cncf|cloud native|service mesh|istio|envoy)\b/)) {
    category = 'Cloud Native';
  } else if (combined.match(/\b(ci\/cd|cicd|github actions|gitlab|jenkins|argo|flux)\b/)) {
    category = 'CI/CD';
  } else if (combined.match(/\b(terraform|pulumi|ansible|iac|infrastructure as code)\b/)) {
    category = 'IaC';
  } else if (
    combined.match(/\b(monitoring|observability|prometheus|grafana|datadog|logging|tracing)\b/)
  ) {
    category = 'Observability';
  } else if (combined.match(/\b(security|vulnerability|cve|secrets|compliance)\b/)) {
    category = 'Security';
  } else if (combined.match(/\b(database|postgres|mysql|mongodb|redis|sql)\b/)) {
    category = 'Databases';
  } else if (combined.match(/\b(aws|azure|gcp|cloud|platform)\b/)) {
    category = 'Platforms';
  }

  return {
    include: true,
    category,
    tags: [],
    summary: item.excerpt.substring(0, 200),
  };
}

/**
 * Classify a single news item using AI
 */
export async function classifyItem(
  item: NewsItem,
  skipAI: boolean = false
): Promise<Classification> {
  // If skipAI is true, use simple keyword-based classification
  if (skipAI) {
    return simpleClassifyItem(item);
  }

  // Handle event announcements - typically exclude conference announcements
  if (
    item.title.toLowerCase().includes('is coming!') ||
    item.title.toLowerCase().match(/\b(conference|event|meetup)\s+\d{4}\b/)
  ) {
    return {
      include: false,
      category: 'Misc',
      tags: ['event'],
      summary: item.excerpt.substring(0, 200),
    };
  }

  const userPrompt = `Title: ${item.title}
Excerpt: ${item.excerpt}
Source: ${item.source}
Date: ${item.publishedAt}

Classify this item and return only valid JSON.`;

  try {
    const result = await callOpenAIJson<Classification>(CLASSIFICATION_SYSTEM_PROMPT, userPrompt);

    return {
      include: result.include ?? true,
      category: result.category || 'Misc',
      tags: result.tags || [],
      summary: result.summary || item.excerpt.substring(0, 200),
    };
  } catch (error) {
    console.error(`Error classifying item: ${item.title}`);
    // Fallback to simple classification
    return simpleClassifyItem(item);
  }
}

/**
 * Classify multiple items in batches
 */
export async function classifyItems(
  items: NewsItem[],
  batchSize: number = 10,
  skipAI: boolean = false
): Promise<NewsItem[]> {
  const classified: NewsItem[] = [];

  console.log(
    `Classifying ${items.length} items ${skipAI ? '(using keyword-based classification)' : '(using AI)'}...`
  );

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (item) => {
        const classification = await classifyItem(item, skipAI);
        return {
          ...item,
          category: classification.category,
          tags: classification.tags,
          summary: classification.summary,
          include: classification.include,
        };
      })
    );

    classified.push(...results);
    console.log(`  Classified ${Math.min(i + batchSize, items.length)}/${items.length}`);

    // Small delay to avoid rate limits (only needed for AI mode)
    if (!skipAI && i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Filter out items marked as exclude
  const included = classified.filter((item) => item.include !== false);
  console.log(`  ✓ ${included.length}/${items.length} items included after classification`);

  return included;
}
