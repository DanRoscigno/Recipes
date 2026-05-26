'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { TAG_GROUPS } from '@/lib/tags';
import 'easymde/dist/easymde.min.css';

// SimpleMDE requires the browser; load it client-only
const SimpleMDEEditor = dynamic(() => import('react-simplemde-editor'), { ssr: false });

interface Props {
  slug?: string;
  initialTitle?: string;
  initialServings?: string;
  initialTags?: string[];
  initialBody?: string;
}

export default function RecipeEditor({
  slug,
  initialTitle = '',
  initialServings = '',
  initialTags = [],
  initialBody = '',
}: Props) {
  const router = useRouter();
  const isNew = !slug;

  const [title, setTitle] = useState(initialTitle);
  const [servings, setServings] = useState(initialServings);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Stable options object — initialValue seeds EasyMDE's CodeMirror instance on first mount
  const editorOptions = useMemo(() => ({ initialValue: initialBody }), []);

  function toggleTag(tag: string) {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function toggleGroup(label: string) {
    setOpenGroups(o => ({ ...o, [label]: !o[label] }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    setError('');

    const payload = { title, tags, servings, body };
    const res = await fetch(
      isNew ? '/api/recipes' : `/api/recipes/${slug}`,
      {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? 'Save failed');
    } else {
      setPrUrl(data.prUrl);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Servings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Servings</label>
        <input
          type="text"
          value={servings}
          onChange={e => setServings(e.target.value)}
          placeholder="e.g. Serves 4-6"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Tags */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Tags</p>
        <div className="space-y-2 border border-gray-200 rounded-lg p-3">
          {TAG_GROUPS.map(group => (
            <div key={group.label}>
              <button
                type="button"
                onClick={() => toggleGroup(group.label)}
                className="flex justify-between items-center w-full text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1 hover:text-gray-700"
              >
                <span>{group.label}</span>
                <span>{openGroups[group.label] ? '▲' : '▼'}</span>
              </button>
              {openGroups[group.label] && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 pl-1">
                  {group.tags.map(tag => (
                    <label key={tag} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                        className="accent-amber-600"
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map(t => (
              <span
                key={t}
                className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full cursor-pointer"
                onClick={() => toggleTag(t)}
              >
                {t} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recipe</label>
        <SimpleMDEEditor
          value={body}
          onChange={setBody}
          options={editorOptions}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {prUrl && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Recipe saved.{' '}
          <a href={prUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">
            View pull request on GitHub
          </a>
          {' '}— merge it to publish the changes to the live site.
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg px-5 py-2 text-sm font-medium transition-colors"
        >
          {saving ? 'Saving…' : 'Save recipe'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
