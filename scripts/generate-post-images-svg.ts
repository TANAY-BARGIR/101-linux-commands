// scripts/generate-post-images-svg.ts
import fs from 'fs/promises';
import path from 'path';
import { getAllPosts } from '../lib/posts.js';
import { getAllGuides } from '../lib/guides.js';
import { getAllExercises } from '../lib/exercises.js';
import { getAllNews } from '../lib/news.js';

// Configuration
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

// Brand colors
const COLORS = {
  background: '#0f172a',
  primary: '#3b82f6',
  text: '#f8fafc',
  accent: '#60a5fa',
};

function generateSVG(title: string, category: string): string {
  // Escape special characters for SVG
  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category.toUpperCase());

  // Word wrap for long titles
  const words = title.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  const maxLineLength = 30; // approximate characters per line

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length > maxLineLength) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  // Create text elements for each line
  const titleElements = lines
    .map(
      (line, index) =>
        `<text x="80" y="${
          300 + index * 70
        }" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="bold" fill="${
          COLORS.text
        }">${escapeXml(line)}</text>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.background};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <!-- Pattern overlay -->
    <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="40" stroke="${COLORS.accent}" stroke-width="1" opacity="0.1"/>
      <line x1="0" y1="0" x2="40" y2="0" stroke="${COLORS.accent}" stroke-width="1" opacity="0.1"/>
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" fill="url(#bgGradient)"/>
  
  <!-- Grid pattern -->
  <rect width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" fill="url(#grid)"/>
  
  <!-- Category badge -->
  <rect x="80" y="80" width="${100 + safeCategory.length * 12}" height="40" rx="20" fill="${
    COLORS.primary
  }"/>
  <text x="100" y="107" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="bold" fill="${
    COLORS.text
  }">${safeCategory}</text>
  
  <!-- Title -->
  ${titleElements}
  
  <!-- DevOps Daily branding -->
  <text x="80" y="${
    IMAGE_HEIGHT - 80
  }" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="bold" fill="${
    COLORS.accent
  }">DevOps Daily</text>
</svg>`;
}

async function generateImage(title: string, category: string, outputPath: string) {
  const svg = generateSVG(title, category);

  // Save as SVG file
  const svgPath = outputPath.replace('.png', '.svg');
  await fs.mkdir(path.dirname(svgPath), { recursive: true });
  await fs.writeFile(svgPath, svg, 'utf-8');

  // Note: For now we'll save as SVG. You can convert to PNG using sharp or another tool if needed
}

async function main() {
  console.log('🎨 Generating post images...');

  // Generate images for posts
  const posts = await getAllPosts();
  for (const post of posts) {
    if (!post.image || post.image.includes('placeholder')) {
      const imagePath = path.join(process.cwd(), 'public', 'images', 'posts', `${post.slug}.svg`);
      await generateImage(post.title, post.category?.name || 'DevOps', imagePath);
      console.log(`✓ Generated image for: ${post.title}`);
    }
  }

  // Generate images for guides
  const guides = await getAllGuides();
  for (const guide of guides) {
    if (!guide.image || guide.image.includes('placeholder')) {
      const imagePath = path.join(process.cwd(), 'public', 'images', 'guides', `${guide.slug}.svg`);
      await generateImage(guide.title, guide.category?.name || 'Guide', imagePath);
      console.log(`✓ Generated image for: ${guide.title}`);
    }
  }

  // Generate images for exercises
  const exercises = await getAllExercises();
  for (const exercise of exercises) {
    if (!exercise.image || exercise.image.includes('placeholder')) {
      const imagePath = path.join(
        process.cwd(),
        'public',
        'images',
        'exercises',
        `${exercise.id}.svg`
      );
      await generateImage(exercise.title, exercise.category?.name || 'Exercise', imagePath);
      console.log(`✓ Generated image for exercise: ${exercise.title}`);
    }
  }

  // Generate images for news digests
  const news = await getAllNews();
  for (const digest of news) {
    if (!digest.image || digest.image.includes('placeholder')) {
      const imagePath = path.join(process.cwd(), 'public', 'images', 'news', `${digest.slug}.svg`);
      await generateImage(
        digest.title,
        `Week ${digest.week}, ${digest.year}`,
        imagePath
      );
      console.log(`✓ Generated image for news: ${digest.title}`);
    }
  }

  console.log('✅ Image generation complete!');
}

main().catch((error) => {
  console.error('Error generating images:', error);
  process.exit(1);
});
