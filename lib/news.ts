import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { getPostImagePath } from './image-utils';

const NEWS_DIR = path.join(process.cwd(), 'content', 'news');

// Define the News type for type safety
export type NewsDigest = {
  title: string;
  slug: string;
  week: number;
  year: number;
  excerpt?: string;
  summary?: string;
  content: string;
  date?: string;
  publishedAt?: string;
  image?: string;
  itemCount?: number;
};

export async function getAllNews(): Promise<NewsDigest[]> {
  try {
    // Ensure directory exists
    try {
      await fs.access(NEWS_DIR);
    } catch {
      // Directory doesn't exist, return empty array
      return [];
    }

    // Get all year directories
    const years = await fs.readdir(NEWS_DIR);
    const allNews: NewsDigest[] = [];

    for (const year of years) {
      const yearPath = path.join(NEWS_DIR, year);
      const stat = await fs.stat(yearPath);

      if (stat.isDirectory()) {
        const files = await fs.readdir(yearPath);
        const newsItems = await Promise.all(
          files
            .filter((f) => f.endsWith('.md'))
            .map(async (filename) => {
              const filePath = path.join(yearPath, filename);
              const file = await fs.readFile(filePath, 'utf-8');
              const { data, content } = matter(file);

              // Extract week number from filename (week-1.md -> 1)
              const weekMatch = filename.match(/week-(\d+)\.md/);
              const week = weekMatch ? parseInt(weekMatch[1], 10) : 0;

              // Generate slug as year-week-N
              const slug = `${year}-week-${week}`;
              const image = data.image || getPostImagePath(slug, 'news');

              return {
                ...data,
                slug,
                week,
                year: parseInt(year, 10),
                content,
                image,
                excerpt: data.summary || data.excerpt,
              } as NewsDigest;
            })
        );
        allNews.push(...newsItems);
      }
    }

    return allNews.sort((a, b) => {
      // Sort by year desc, then week desc
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.week - a.week;
    });
  } catch (error) {
    console.error('Error loading news:', error);
    return [];
  }
}

export async function getNewsBySlug(slug: string): Promise<NewsDigest | null> {
  try {
    // Extract year and week from slug (2025-week-47 -> year: 2025, week: 47)
    const match = slug.match(/(\d{4})-week-(\d+)/);
    if (!match) {
      return null;
    }

    const [, year, week] = match;
    const filePath = path.join(NEWS_DIR, year, `week-${week}.md`);

    const file = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(file);
    const image = data.image || getPostImagePath(slug, 'news');

    return {
      ...data,
      slug,
      week: parseInt(week, 10),
      year: parseInt(year, 10),
      content,
      image,
      excerpt: data.summary || data.excerpt,
    } as NewsDigest;
  } catch {
    return null;
  }
}

export async function getLatestNews(limit = 6): Promise<NewsDigest[]> {
  const news = await getAllNews();
  return news.slice(0, limit);
}

export async function getNewsByYear(year: number): Promise<NewsDigest[]> {
  const news = await getAllNews();
  return news.filter((item) => item.year === year);
}

export async function getNewsYears(): Promise<number[]> {
  try {
    // Ensure directory exists
    try {
      await fs.access(NEWS_DIR);
    } catch {
      return [];
    }

    const years = await fs.readdir(NEWS_DIR);
    const yearNumbers = years
      .filter((year) => /^\d{4}$/.test(year))
      .map((year) => parseInt(year, 10))
      .sort((a, b) => b - a);
    return yearNumbers;
  } catch {
    return [];
  }
}
