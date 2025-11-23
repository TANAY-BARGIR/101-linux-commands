import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { getAllPosts } from './posts';
import { getAllGuides } from './guides';

const AUTHORS_DIR = path.join(process.cwd(), 'content', 'authors');

export type Author = {
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  postCount?: number;
  guideCount?: number;
};

export async function getAllAuthors(): Promise<Author[]> {
  const files = await fs.readdir(AUTHORS_DIR);
  const authors = await Promise.all(
    files
      .filter((f) => f.endsWith('.md'))
      .map(async (filename) => {
        const filePath = path.join(AUTHORS_DIR, filename);
        const file = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(file);
        const slug = filename.replace(/\.md$/, '');

        // Count posts and guides by this author
        const [posts, guides] = await Promise.all([getAllPosts(), getAllGuides()]);

        const postCount = posts.filter((post) => post.author?.slug === slug).length;
        const guideCount = guides.filter((guide) => guide.author?.slug === slug).length;

        return {
          ...data,
          slug,
          postCount,
          guideCount,
        } as Author;
      })
  );

  return authors.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const filePath = path.join(AUTHORS_DIR, `${slug}.md`);
  try {
    const file = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(file);

    // Count posts and guides by this author
    const [posts, guides] = await Promise.all([getAllPosts(), getAllGuides()]);

    const postCount = posts.filter((post) => post.author?.slug === slug).length;
    const guideCount = guides.filter((guide) => guide.author?.slug === slug).length;

    return {
      ...data,
      slug,
      postCount,
      guideCount,
    } as Author;
  } catch {
    return null;
  }
}

export async function getPostsByAuthor(authorSlug: string) {
  const posts = await getAllPosts();
  return posts.filter((post) => post.author?.slug === authorSlug);
}

export async function getGuidesByAuthor(authorSlug: string) {
  const guides = await getAllGuides();
  return guides.filter((guide) => guide.author?.slug === authorSlug);
}
