import fs from 'fs/promises';
import path from 'path';
import { getAllPosts } from '../lib/posts.js';
import { getAllNews } from '../lib/news.js';
import { parseMarkdown } from '../lib/markdown.js';

async function generateFeed() {
  const [posts, news] = await Promise.all([getAllPosts(), getAllNews()]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://devops-daily.com';

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>DevOps Daily</title>
    <link>${siteUrl}</link>
    <description>The latest DevOps news, tutorials, and guides</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${[
      ...posts.map((p) => ({
        ...p,
        type: 'post',
        url: `/posts/${p.slug}`,
        dateKey: p.publishedAt || p.date,
      })),
      ...news.map((n) => ({
        ...n,
        type: 'news',
        url: `/news/${n.slug}`,
        dateKey: n.date,
      })),
    ]
      .sort((a, b) => {
        const dateA = new Date(a.dateKey || 0);
        const dateB = new Date(b.dateKey || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 50) // Limit to 50 most recent items
      .map((item) => {
        if (item.type === 'news') {
          return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${siteUrl}${item.url}</link>
      <description><![CDATA[${item.excerpt || item.summary || ''}]]></description>
      <pubDate>${new Date(item.dateKey || Date.now()).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteUrl}${item.url}</guid>
      <category><![CDATA[DevOps News]]></category>
      <content:encoded><![CDATA[${item.content ? parseMarkdown(item.content) : item.excerpt || item.summary || ''}]]></content:encoded>
    </item>`;
        } else {
          return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${siteUrl}${item.url}</link>
      <description><![CDATA[${item.excerpt || ''}]]></description>
      <pubDate>${new Date(item.publishedAt || item.date || Date.now()).toUTCString()}</pubDate>
      <guid isPermaLink="true">${siteUrl}${item.url}</guid>
      ${item.category?.name ? `<category><![CDATA[${item.category.name}]]></category>` : ''}
      ${item.author?.name ? `<author><![CDATA[${item.author.name}]]></author>` : ''}
      ${
        item.tags && item.tags.length > 0
          ? item.tags.map((tag) => `<category><![CDATA[${tag}]]></category>`).join('')
          : ''
      }
      <content:encoded><![CDATA[${item.content ? parseMarkdown(item.content) : item.excerpt || ''}]]></content:encoded>
    </item>`;
        }
      })
      .join('')}
  </channel>
</rss>`;

  const outPath = path.join(process.cwd(), 'public', 'feed.xml');
  await fs.writeFile(outPath, rss, 'utf-8');
  console.log('✅ RSS feed generated at public/feed.xml');
}

// Execute the function
generateFeed().catch((error) => {
  console.error('Error generating RSS feed:', error);
  process.exit(1);
});
