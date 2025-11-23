import { NewsItem } from '../crawler/types.js';

/**
 * Limit items per source
 */
export function limitPerSource(items: NewsItem[], maxPerSource: number = 4): NewsItem[] {
  const sourceMap = new Map<string, NewsItem[]>();

  // Group by source
  for (const item of items) {
    const source = item.source;
    if (!sourceMap.has(source)) {
      sourceMap.set(source, []);
    }
    sourceMap.get(source)!.push(item);
  }

  // Take top N from each source (most recent)
  const limited: NewsItem[] = [];
  for (const [source, sourceItems] of sourceMap.entries()) {
    const sorted = sourceItems.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    limited.push(...sorted.slice(0, maxPerSource));
  }

  return limited;
}

/**
 * Limit items per category
 */
export function limitPerCategory(
  items: NewsItem[],
  maxPerCategory: number = 12
): NewsItem[] {
  const categoryMap = new Map<string, NewsItem[]>();

  // Group by category
  for (const item of items) {
    const category = item.category || 'Misc';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, []);
    }
    categoryMap.get(category)!.push(item);
  }

  // Take top N from each category (most recent)
  const limited: NewsItem[] = [];
  for (const [category, categoryItems] of categoryMap.entries()) {
    const sorted = categoryItems.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    limited.push(...sorted.slice(0, maxPerCategory));
  }

  return limited;
}

/**
 * Apply all limits
 */
export function applyLimits(
  items: NewsItem[],
  maxPerSource: number = 4,
  maxPerCategory: number = 12
): NewsItem[] {
  // First limit by source
  const sourceLimited = limitPerSource(items, maxPerSource);

  // Then limit by category
  const categoryLimited = limitPerCategory(sourceLimited, maxPerCategory);

  return categoryLimited;
}

/**
 * Sort items by date (most recent first)
 */
export function sortByDate(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Filter items by priority (if source has priority metadata)
 */
export function filterByPriority(
  items: NewsItem[],
  minPriority: 'low' | 'medium' | 'high' = 'low'
): NewsItem[] {
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const threshold = priorityOrder[minPriority];

  return items.filter((item) => {
    const itemPriority = (item as any).priority || 'low';
    return priorityOrder[itemPriority as keyof typeof priorityOrder] >= threshold;
  });
}
