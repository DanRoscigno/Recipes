#!/usr/bin/env node
/**
 * Migrates recipe .md files from inline backtick tags to YAML frontmatter.
 *
 * Before:
 *   # Recipe Title
 *
 *   `Tag1` `Tag2`
 *
 *   Makes 4 servings
 *
 *   ## Ingredients
 *   ...
 *
 * After:
 *   ---
 *   title: "Recipe Title"
 *   tags: ["Tag1", "Tag2"]
 *   servings: "Makes 4 servings"
 *   ---
 *
 *   ## Ingredients
 *   ...
 *
 * Usage:
 *   node scripts/migrate.js [--dry-run]
 *
 * Always review `git diff website/recipes/` before committing.
 */

const fs = require('fs');
const path = require('path');

const RECIPES_DIR = path.join(__dirname, '..', 'website', 'recipes');
const DRY_RUN = process.argv.includes('--dry-run');

const SERVINGS_PATTERN = /^(Serves?|Makes?|Servings?:|Yield:|Single serving|Approximately)\s*.+/i;

function extractTags(line) {
  return [...line.matchAll(/`([^`]+)`/g)].map(m => m[1]);
}

function escapeYamlString(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function migrateFile(filepath) {
  const raw = fs.readFileSync(filepath, 'utf8');
  const lines = raw.split('\n');

  // Already has YAML frontmatter — skip
  if (lines[0] === '---') {
    return { status: 'skipped', reason: 'already has frontmatter' };
  }

  // Must start with an H1 title
  const titleMatch = lines[0] && lines[0].match(/^#\s+(.+)/);
  if (!titleMatch) {
    return { status: 'skipped', reason: 'no H1 on line 1' };
  }
  const title = titleMatch[1].trim();

  // Tags are on line index 2 if that line contains backticks
  let tags = [];
  let hasTags = false;
  if (lines[2] && lines[2].includes('`')) {
    tags = extractTags(lines[2]);
    hasTags = tags.length > 0;
  }

  // Servings are on line index 4 if tags were found and it matches the pattern
  let servings = '';
  let hasServings = false;
  if (hasTags && lines[4] && SERVINGS_PATTERN.test(lines[4].trim())) {
    servings = lines[4].trim();
    hasServings = true;
  }

  // Body starts after the lines we consumed for frontmatter
  let bodyStart;
  if (hasTags && hasServings) {
    bodyStart = 5;
  } else if (hasTags) {
    bodyStart = 4;
  } else {
    // No tags found — keep everything after the title line
    bodyStart = 1;
  }

  // Drop leading blank lines from body
  let bodyLines = lines.slice(bodyStart);
  while (bodyLines.length > 0 && bodyLines[0].trim() === '') {
    bodyLines.shift();
  }

  const tagsYaml = tags.length > 0
    ? `[${tags.map(t => `"${escapeYamlString(t)}"`).join(', ')}]`
    : '[]';

  const frontmatter = [
    '---',
    `title: "${escapeYamlString(title)}"`,
    `tags: ${tagsYaml}`,
    `servings: "${escapeYamlString(servings)}"`,
    '---',
    '',
  ].join('\n');

  const newContent = frontmatter + bodyLines.join('\n');

  if (!DRY_RUN) {
    fs.writeFileSync(filepath, newContent, 'utf8');
  }

  return { status: 'migrated', title, tags, servings };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const files = fs.readdirSync(RECIPES_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();

let migrated = 0;
let skipped = 0;
const skipLog = [];

for (const file of files) {
  const filepath = path.join(RECIPES_DIR, file);
  const result = migrateFile(filepath);

  if (result.status === 'skipped') {
    skipLog.push(`  SKIP  ${file}  (${result.reason})`);
    skipped++;
  } else {
    const tagStr = result.tags.length ? result.tags.join(', ') : '(no tags)';
    const servStr = result.servings || '(no servings)';
    console.log(`  OK    ${file}`);
    console.log(`        tags: ${tagStr}`);
    console.log(`        servings: ${servStr}`);
    migrated++;
  }
}

console.log('\n── Skipped ──────────────────────────────────────────────────────────────');
skipLog.forEach(l => console.log(l));

console.log(`\n── Summary ${ DRY_RUN ? '(DRY RUN — no files written)' : '' } ──`);
console.log(`  Migrated : ${migrated}`);
console.log(`  Skipped  : ${skipped}`);
console.log(`  Total    : ${files.length}`);

if (DRY_RUN) {
  console.log('\nRun without --dry-run to apply changes.');
} else {
  console.log('\nReview changes with: git diff website/recipes/');
}
