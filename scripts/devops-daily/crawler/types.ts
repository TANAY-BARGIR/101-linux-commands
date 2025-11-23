/**
 * Source configuration from YAML
 */
export interface Source {
  name: string;
  type: 'rss' | 'web';
  url: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * News item extracted from sources
 */
export interface NewsItem {
  title: string;
  url: string;
  excerpt: string;
  source: string;
  publishedAt: string;
  category?: string;
  tags?: string[];
  summary?: string;
  include?: boolean;
}

/**
 * Classification result from AI
 */
export interface Classification {
  include: boolean;
  category: string;
  tags: string[];
  summary: string;
}

/**
 * Sources configuration
 */
export interface SourcesConfig {
  sources: Source[];
}

/**
 * Digest metadata
 */
export interface DigestMetadata {
  title: string;
  date: string;
  week: number;
  year: number;
  summary: string;
}

/**
 * Digest structure
 */
export interface Digest {
  metadata: DigestMetadata;
  categories: Record<string, NewsItem[]>;
}
