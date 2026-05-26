#!/usr/bin/env node
/**
 * Bulk-indexes all recipe markdown files into Algolia.
 * Run once after setting up your Algolia index, then again any time you
 * make bulk changes to the recipe files outside of the web editor.
 *
 * Usage (run from the repo root):
 *   ALGOLIA_APP_ID=... ALGOLIA_ADMIN_KEY=... node scripts/index-algolia.js
 *
 * Or set the vars in app/.env.local and run from the app/ directory:
 *   cd app && node ../scripts/index-algolia.js
 *
 * Optional env vars:
 *   ALGOLIA_INDEX_NAME  (default: recipes)
 */

const fs = require('fs');
const path = require('path');

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || process.env.ALGOLIA_APP_ID;
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME ?? 'recipes';
const RECIPES_DIR = path.join(__dirname, '..', 'recipes');

if (!APP_ID || !ADMIN_KEY) {
  console.error('Required: ALGOLIA_APP_ID (or NEXT_PUBLIC_ALGOLIA_APP_ID) and ALGOLIA_ADMIN_KEY');
  process.exit(1);
}

// gray-matter and algoliasearch must be installed in app/
// Run this script from app/ or ensure node_modules is on the path.
let matter, algoliasearch;
try {
  matter = require('gray-matter');
  algoliasearch = require('algoliasearch');
} catch {
  console.error('Dependencies not found. Run from the app/ directory:');
  console.error('  cd app && node ../scripts/index-algolia.js');
  process.exit(1);
}

async function main() {
  const client = algoliasearch(APP_ID, ADMIN_KEY);
  const index = client.initIndex(INDEX_NAME);

  // Configure which fields Algolia searches, title ranked above content
  await index.setSettings({
    searchableAttributes: ['title', 'tags', 'servings', 'content'],
    attributesForFaceting: ['tags'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
  });
  console.log('Index settings updated.');

  const files = fs.readdirSync(RECIPES_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  const objects = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(RECIPES_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const slug = file.replace(/\.md$/, '');
    objects.push({
      objectID: slug,
      title: data.title ?? slug,
      tags: Array.isArray(data.tags) ? data.tags : [],
      servings: data.servings ?? '',
      content: content.trim(),
    });
  }

  console.log(`Indexing ${objects.length} recipes into "${INDEX_NAME}"...`);

  // saveObjects in batches of 1000 (Algolia's recommended batch size)
  const BATCH = 1000;
  for (let i = 0; i < objects.length; i += BATCH) {
    const batch = objects.slice(i, i + BATCH);
    await index.saveObjects(batch);
    console.log(`  ${Math.min(i + BATCH, objects.length)} / ${objects.length}`);
  }

  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
