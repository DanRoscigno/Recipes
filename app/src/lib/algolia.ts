import algoliasearch from 'algoliasearch';

const INDEX_NAME = process.env.ALGOLIA_INDEX_NAME ?? 'recipes';

function getIndex() {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const adminKey = process.env.ALGOLIA_ADMIN_KEY;
  if (!appId || !adminKey) return null;
  return algoliasearch(appId, adminKey).initIndex(INDEX_NAME);
}

export async function indexRecipe(
  slug: string,
  title: string,
  tags: string[],
  servings: string,
  content: string,
) {
  const index = getIndex();
  if (!index) return;
  await index.saveObject({ objectID: slug, title, tags, servings, content });
}
