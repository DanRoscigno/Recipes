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

function slugToBranch(slug: string): string {
  return `recipe-edit/${slug.toLowerCase().replace(/_/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

/**
 * Save a recipe by committing to a per-recipe branch and opening (or updating)
 * a pull request. Returns the PR URL so the caller can show it to the user.
 * Direct pushes to main are blocked by branch protection rules.
 */
export async function saveRecipeFile(
  slug: string,
  content: string,
  message: string
): Promise<{ prUrl: string }> {
  const octokit = client();
  const branch = slugToBranch(slug);
  const filePath = `${RECIPES_PATH}/${slugToFilename(slug)}`;
  const encoded = Buffer.from(content, 'utf8').toString('base64');

  // Get the current SHA of main so we can branch from it
  const mainRef = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: 'heads/main' });
  const mainSha = mainRef.data.object.sha;

  // Create the edit branch if it doesn't already exist
  try {
    await octokit.git.createRef({
      owner: OWNER, repo: REPO,
      ref: `refs/heads/${branch}`,
      sha: mainSha,
    });
  } catch (err: any) {
    if (err.status !== 422) throw err; // 422 = branch already exists, that's fine
  }

  // Get the current file SHA on the branch (needed for updates)
  let fileSha: string | undefined;
  try {
    const existing = await octokit.repos.getContent({
      owner: OWNER, repo: REPO,
      path: filePath,
      ref: branch,
    });
    fileSha = (existing.data as { sha: string }).sha;
  } catch {
    // File doesn't exist on branch yet (new recipe)
  }

  // Commit the file to the branch
  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO,
    path: filePath,
    message,
    content: encoded,
    branch,
    ...(fileSha ? { sha: fileSha } : {}),
  });

  // Open a PR if none exists for this branch, otherwise return the existing one
  const openPrs = await octokit.pulls.list({
    owner: OWNER, repo: REPO,
    head: `${OWNER}:${branch}`,
    state: 'open',
  });

  if (openPrs.data.length > 0) {
    return { prUrl: openPrs.data[0].html_url };
  }

  const pr = await octokit.pulls.create({
    owner: OWNER, repo: REPO,
    title: message,
    head: branch,
    base: 'main',
    body: 'Recipe edit submitted via the recipe app. Merge to publish.',
  });

  return { prUrl: pr.data.html_url };
}
