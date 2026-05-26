'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import algoliasearch from 'algoliasearch';
import type { SearchIndex } from 'algoliasearch';
import type { RecipeMeta } from '@/lib/recipes';
import TagFilter from './TagFilter';

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID ?? '';
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY ?? '';
const INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX ?? 'recipes';

let _index: SearchIndex | null = null;
function getIndex(): SearchIndex | null {
  if (!_index && APP_ID && SEARCH_KEY) {
    _index = algoliasearch(APP_ID, SEARCH_KEY).initIndex(INDEX_NAME);
  }
  return _index;
}

interface AlgoliaHit {
  title: string;
  tags: string[];
  servings: string;
}

interface Props {
  recipes: RecipeMeta[];
}

export default function RecipeList({ recipes }: Props) {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<RecipeMeta[] | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      const index = getIndex();
      if (index) {
        try {
          const { hits } = await index.search<AlgoliaHit>(query.trim(), {
            attributesToRetrieve: ['objectID', 'title', 'tags', 'servings'],
            hitsPerPage: 100,
          });
          setSearchResults(hits.map(h => ({
            slug: h.objectID,
            title: h.title,
            tags: h.tags ?? [],
            servings: h.servings ?? '',
          })));
          return;
        } catch {
          // fall through to title filter
        }
      }
      // Algolia not configured or unavailable — filter by title
      const q = query.trim().toLowerCase();
      setSearchResults(recipes.filter(r =>
        r.title.toLowerCase().includes(q)
      ));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, recipes]);

  const results = useMemo(() => {
    const list = searchResults ?? recipes;
    if (selectedTags.length === 0) return list;
    return list.filter(r => selectedTags.every(t => r.tags.includes(t)));
  }, [searchResults, recipes, selectedTags]);

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Filter by tag
          </h2>
          <TagFilter selected={selectedTags} onChange={setSelectedTags} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 mb-4">
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search recipes…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <Link
            href="/recipes/new"
            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap"
          >
            + New recipe
          </Link>
        </div>

        {/* Mobile tag filter */}
        <details className="md:hidden mb-4 border border-gray-200 rounded-lg">
          <summary className="px-3 py-2 text-sm font-medium cursor-pointer">
            Filter by tag {selectedTags.length > 0 && `(${selectedTags.length} active)`}
          </summary>
          <div className="px-3 pb-3">
            <TagFilter selected={selectedTags} onChange={setSelectedTags} />
          </div>
        </details>

        <p className="text-xs text-gray-400 mb-3">
          {results.length} recipe{results.length !== 1 ? 's' : ''}
          {selectedTags.length > 0 && (
            <> · filtered by: {selectedTags.join(', ')}</>
          )}
        </p>

        <ul className="space-y-1">
          {results.map(recipe => (
            <li key={recipe.slug} className="flex items-center gap-2 group">
              <Link
                href={`/recipes/${recipe.slug}`}
                className="flex-1 flex items-baseline gap-2 rounded-lg px-2 py-1.5 hover:bg-amber-50 transition-colors min-w-0"
              >
                <span className="text-sm font-medium text-gray-800 group-hover:text-amber-800">
                  {recipe.title}
                </span>
                {recipe.tags.length > 0 && (
                  <span className="text-xs text-gray-400 truncate">
                    {recipe.tags.join(' · ')}
                  </span>
                )}
              </Link>
              <Link
                href={`/recipes/${recipe.slug}/edit`}
                className="shrink-0 text-xs text-gray-400 hover:text-amber-700 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
