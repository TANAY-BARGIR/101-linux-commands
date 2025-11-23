import Parser from 'rss-parser';
import { NewsItem, Source } from './types.js';
import { fetchWithRetry } from './fetch.js';

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['description', 'description'],
    ],
  },
});

/**
 * Crawl an RSS feed
 */
export async function crawlRssFeed(source: Source): Promise<NewsItem[]> {
  try {
    console.log(`Crawling RSS: ${source.name} (${source.url})`);

    const feed = await parser.parseURL(source.url);
    const items: NewsItem[] = [];

    for (const item of feed.items) {
      if (!item.title || !item.link) {
        continue;
      }

      items.push({
        title: item.title,
        url: item.link,
        excerpt: extractExcerpt(item),
        source: source.name,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        category: source.category,
      });
    }

    console.log(`  ✓ Found ${items.length} items from ${source.name}`);
    return items;
  } catch (error) {
    console.error(`  ✗ Error crawling ${source.name}:`, error);
    return [];
  }
}

/**
 * Extract excerpt from RSS item
 */
function extractExcerpt(item: any): string {
  // Try different fields for content
  const content =
    item.contentSnippet ||
    item.content ||
    item.contentEncoded ||
    item.description ||
    item.summary ||
    '';

  // Clean HTML tags and limit length
  return content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
}

/**
 * Crawl multiple RSS feeds in parallel
 */
export async function crawlRssFeeds(
  sources: Source[],
  concurrency: number = 5
): Promise<NewsItem[]> {
  const rssFeeds = sources.filter((s) => s.type === 'rss');
  const allItems: NewsItem[] = [];

  // Process in batches to avoid overwhelming servers
  for (let i = 0; i < rssFeeds.length; i += concurrency) {
    const batch = rssFeeds.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(crawlRssFeed));
    allItems.push(...results.flat());
  }

  return allItems;
}
