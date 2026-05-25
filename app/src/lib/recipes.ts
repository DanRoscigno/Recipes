import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Recipes live at repo-root/recipes/ — one level up from app/
const RECIPES_DIR = path.join(process.cwd(), '..', 'recipes');

export interface RecipeMeta {
  slug: string;
  title: string;
  tags: string[];
  servings: string;
}

export interface Recipe extends RecipeMeta {
  content: string;
}

function parseRecipeFile(filename: string, raw: string): RecipeMeta | null {
  try {
    const { data } = matter(raw);
    const slug = filename.replace(/\.md$/, '');
    return {
      slug,
      title: String(data.title ?? slug),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      servings: String(data.servings ?? ''),
    };
  } catch {
    return null;
  }
}

/** Read all recipe metadata from the filesystem (used at build time). */
export function getAllRecipeMeta(): RecipeMeta[] {
  const files = fs.readdirSync(RECIPES_DIR).filter(f => f.endsWith('.md') && f !== 'index.md');
  const recipes: RecipeMeta[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(RECIPES_DIR, file), 'utf8');
    const meta = parseRecipeFile(file, raw);
    if (meta && meta.title !== 'Recipes') recipes.push(meta);
  }
  return recipes.sort((a, b) => a.title.localeCompare(b.title));
}

/** Read a single recipe (meta + content) from the filesystem. */
export function getRecipe(slug: string): Recipe | null {
  const filepath = path.join(RECIPES_DIR, `${slug}.md`);
  if (!fs.existsSync(filepath)) return null;
  const raw = fs.readFileSync(filepath, 'utf8');
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    servings: String(data.servings ?? ''),
    content,
  };
}

/** Return all slugs (used for generateStaticParams). */
export function getAllSlugs(): string[] {
  return fs
    .readdirSync(RECIPES_DIR)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .map(f => f.replace(/\.md$/, ''));
}

/** Build the YAML frontmatter + body string for saving a recipe. */
export function buildRecipeMarkdown(
  title: string,
  tags: string[],
  servings: string,
  body: string
): string {
  const tagsYaml = `[${tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ')}]`;
  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `tags: ${tagsYaml}`,
    `servings: "${servings.replace(/"/g, '\\"')}"`,
    '---',
    '',
  ].join('\n');
  return frontmatter + body.trimStart();
}
