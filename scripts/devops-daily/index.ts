#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { SourcesConfig, NewsItem } from './crawler/types.js';
import { crawlRssFeeds } from './crawler/rss.js';
import { crawlWebSources } from './crawler/web.js';
import { normalizeItems } from './utils/normalize.js';
import { deduplicate } from './utils/dedupe.js';
import { applyLimits } from './utils/limit.js';
import { isWithinLastDays, getCurrentWeek, getCurrentYear } from './utils/date.js';
import { classifyItems } from './ai/classify.js';
import { summarizeItems } from './ai/summarize.js';
import { assembleDigest } from './pipeline/assemble.js';
import { generateMarkdown } from './pipeline/template.js';
import { validateMarkdown, checkDuplicateUrls } from './pipeline/validate.js';
import { printStats } from './pipeline/assemble.js';

async function main() {
  console.log('🚀 DevOps Daily Digest Generator\n');

  // Check for --skip-ai flag
  const skipAI = process.argv.includes('--skip-ai');
  if (skipAI) {
    console.log('ℹ️  Running with --skip-ai flag (using keyword-based classification)\n');
  }

  try {
    // 1. Load sources
    console.log('📋 Loading sources...');
    const sourcesPath = path.join(process.cwd(), 'scripts/devops-daily/data/sources.yaml');
    const sourcesContent = await fs.readFile(sourcesPath, 'utf-8');
    const sourcesConfig = yaml.load(sourcesContent) as SourcesConfig;
    console.log(`  ✓ Loaded ${sourcesConfig.sources.length} sources\n`);

    // 2. Crawl RSS feeds
    console.log('🔍 Crawling RSS feeds...');
    const rssItems = await crawlRssFeeds(sourcesConfig.sources, 5);
    console.log(`  ✓ Found ${rssItems.length} items from RSS feeds\n`);

    // 3. Crawl web sources
    console.log('🌐 Crawling web sources...');
    const webItems = await crawlWebSources(sourcesConfig.sources, 3);
    console.log(`  ✓ Found ${webItems.length} items from web sources\n`);

    // 4. Combine and normalize
    console.log('🔧 Normalizing items...');
    let allItems = [...rssItems, ...webItems];
    allItems = normalizeItems(allItems);
    console.log(`  ✓ Normalized ${allItems.length} items\n`);

    // 5. Remove duplicates
    console.log('🗑️  Removing duplicates...');
    allItems = deduplicate(allItems);
    console.log(`  ✓ ${allItems.length} unique items\n`);

    // 6. Filter by date (last 7 days)
    console.log('📅 Filtering by date (last 7 days)...');
    allItems = allItems.filter((item) => isWithinLastDays(item.publishedAt, 7));
    console.log(`  ✓ ${allItems.length} items from last 7 days\n`);

    if (allItems.length === 0) {
      console.log('⚠️  No items found from the last 7 days. Exiting...');
      return;
    }

    // 7. Classify items
    console.log(
      skipAI ? '🔤 Classifying items with keywords...' : '🤖 Classifying items with AI...'
    );
    allItems = await classifyItems(allItems, 10, skipAI);
    console.log(`  ✓ Classified ${allItems.length} items\n`);

    // 8. Apply limits
    console.log('📊 Applying limits...');
    allItems = applyLimits(allItems, 4, 12);
    console.log(`  ✓ ${allItems.length} items after limits\n`);

    // 9. Summarize items
    if (skipAI) {
      console.log('✍️  Using excerpts (skipping AI summarization)...');
      console.log(`  ✓ ${allItems.length} items ready\n`);
    } else {
      console.log('✍️  Summarizing items with AI...');
      allItems = await summarizeItems(allItems, 10);
      console.log(`  ✓ Summarized ${allItems.length} items\n`);
    }

    // 10. Assemble digest
    console.log('📝 Assembling digest...');
    const week = getCurrentWeek();
    const year = getCurrentYear();
    const digest = assembleDigest(allItems, week, year);
    printStats(digest);

    // 11. Generate markdown
    console.log('\n📄 Generating markdown...');
    const markdown = generateMarkdown(digest);

    // Check for duplicate URLs
    const duplicateUrls = checkDuplicateUrls(markdown);
    if (duplicateUrls.length > 0) {
      console.warn(`⚠️  Found ${duplicateUrls.length} duplicate URLs:`, duplicateUrls);
    }

    // 12. Write file
    console.log('\n💾 Writing file...');
    const newsDir = path.join(process.cwd(), 'content', 'news', year.toString());
    await fs.mkdir(newsDir, { recursive: true });
    const filePath = path.join(newsDir, `week-${week}.md`);
    await fs.writeFile(filePath, markdown, 'utf-8');
    console.log(`  ✓ Written to: ${filePath}\n`);

    // 13. Validate markdown
    console.log('✅ Validating markdown...');
    const isValid = await validateMarkdown(filePath);
    if (!isValid) {
      console.error('❌ Markdown validation failed');
      process.exit(1);
    }

    console.log(`\n✨ Success! Generated digest for Week ${week}, ${year}`);
    console.log(`📄 File: ${filePath}`);
    console.log(
      `\n💡 Tip: Commit and push the file, then create a PR via GitHub Action or manually.`
    );

    // Force exit to prevent hanging on open connections
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Execute
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
