'use client';

import { useState } from 'react';
import { TAG_GROUPS } from '@/lib/tags';

interface Props {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function TagFilter({ selected, onChange }: Props) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(tag: string) {
    onChange(
      selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]
    );
  }

  function toggleGroup(label: string) {
    setOpen(o => ({ ...o, [label]: !o[label] }));
  }

  return (
    <div className="space-y-2">
      {TAG_GROUPS.map(group => (
        <div key={group.label} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleGroup(group.label)}
            className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span>{group.label}</span>
            <span className="text-gray-400">{open[group.label] ? '▲' : '▼'}</span>
          </button>
          {open[group.label] && (
            <div className="px-3 py-2 grid grid-cols-1 gap-1">
              {group.tags.map(tag => (
                <label key={tag} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(tag)}
                    onChange={() => toggle(tag)}
                    className="accent-amber-600"
                  />
                  {tag}
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs text-amber-700 hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
