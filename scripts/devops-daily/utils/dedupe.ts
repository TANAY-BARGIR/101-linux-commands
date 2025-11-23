import { NewsItem } from '../crawler/types.js';

/**
 * Remove duplicate items based on URL
 */
export function deduplicateByUrl(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const unique: NewsItem[] = [];

  for (const item of items) {
    const normalizedUrl = normalizeUrl(item.url);
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Remove duplicate items based on title similarity
 */
export function deduplicateByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const unique: NewsItem[] = [];

  for (const item of items) {
    const normalizedTitle = normalizeTitle(item.title);
    if (!seen.has(normalizedTitle)) {
      seen.add(normalizedTitle);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Remove duplicates using both URL and title
 */
export function deduplicate(items: NewsItem[]): NewsItem[] {
  // First dedupe by URL
  let deduped = deduplicateByUrl(items);

  // Then check for very similar titles
  const titleMap = new Map<string, NewsItem>();

  for (const item of deduped) {
    const normalized = normalizeTitle(item.title);
    const existing = titleMap.get(normalized);

    if (!existing) {
      titleMap.set(normalized, item);
    } else {
      // Keep the one with more recent date
      if (new Date(item.publishedAt) > new Date(existing.publishedAt)) {
        titleMap.set(normalized, item);
      }
    }
  }

  return Array.from(titleMap.values());
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove common tracking parameters
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('ref');
    // Remove trailing slash
    const normalized = parsed.toString().replace(/\/$/, '');
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Normalize title for comparison
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}
