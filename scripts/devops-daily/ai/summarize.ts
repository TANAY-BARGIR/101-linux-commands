import { NewsItem } from '../crawler/types.js';
import { callOpenAI } from './openai.js';

const SUMMARIZATION_SYSTEM_PROMPT = `Write a compact, neutral technical summary.
1 sentence: what happened.
1 sentence: why DevOps engineers care.
If it's a release, add 1 short note about breaking changes or key features.
Maximum 3 lines total.
No marketing language. Be concise and technical.`;

/**
 * Summarize a single news item using AI
 */
export async function summarizeItem(item: NewsItem): Promise<string> {
  const userPrompt = `Title: ${item.title}
Excerpt: ${item.excerpt}
Source: ${item.source}
Category: ${item.category}
URL: ${item.url}

Write a technical summary.`;

  try {
    const summary = await callOpenAI(SUMMARIZATION_SYSTEM_PROMPT, userPrompt);
    return summary.trim();
  } catch (error) {
    console.error(`Error summarizing item: ${item.title}`, error);
    // Return excerpt as fallback
    return item.excerpt.substring(0, 200) + '...';
  }
}

/**
 * Summarize multiple items in batches
 */
export async function summarizeItems(
  items: NewsItem[],
  batchSize: number = 10
): Promise<NewsItem[]> {
  const summarized: NewsItem[] = [];

  console.log(`Summarizing ${items.length} items...`);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (item) => {
        // Skip if already has summary from classification
        if (item.summary && item.summary.length > 50) {
          return item;
        }

        const summary = await summarizeItem(item);
        return {
          ...item,
          summary,
        };
      })
    );

    summarized.push(...results);
    console.log(`  Summarized ${Math.min(i + batchSize, items.length)}/${items.length}`);

    // Small delay to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`  ✓ Summarized all items`);
  return summarized;
}
