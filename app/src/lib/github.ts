import { Octokit } from '@octokit/rest';

const OWNER = process.env.GITHUB_OWNER ?? 'DanRoscigno';
const REPO = process.env.GITHUB_REPO ?? 'Recipes';
const RECIPES_PATH = process.env.GITHUB_RECIPES_PATH ?? 'recipes';

function client() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

export function slugToFilename(slug: string): string {
  return `${slug}.md`;
}

export function filenameToSlug(filename: string): string {
  return filename.replace(/\.md$/, '');
}

export function titleToSlug(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '');
}

/** Fetch the raw content + SHA of a single recipe file. */
export async function getRecipeFile(
  slug: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const response = await client().repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: `${RECIPES_PATH}/${slugToFilename(slug)}`,
    });
    const data = response.data as { content: string; sha: string };
    const content = Buffer.from(data.content, 'base64').toString('utf8');
    return { content, sha: data.sha };
  } catch {
    return null;
  }
}

/** Create or update a recipe file via a GitHub commit. */
export async function saveRecipeFile(
  slug: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  await client().repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: `${RECIPES_PATH}/${slugToFilename(slug)}`,
    message,
    content: encoded,
    ...(sha ? { sha } : {}),
  });
}
