'use client';

import { useState } from 'react';
import { Exhibition } from '@/types/gallery';
import { Badge } from '@/components/ui/Badge';
import { ArtistStrip } from '@/components/artist/ArtistStrip';

interface Props {
  exhibitions: Exhibition[];
}

type Tab = 'current' | 'upcoming' | 'past';

export function ExhibitionList({ exhibitions }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('current');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tabs: { key: Tab; label: string }[] = [
    { key: 'current', label: 'Current' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
  ];

  const filtered = exhibitions.filter(e => e.status === activeTab);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-100 mb-4">
        {tabs.map(({ key, label }) => {
          const count = exhibitions.filter(e => e.status === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === key
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {label}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-zinc-400 text-sm py-6 text-center">No {activeTab} exhibitions found.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(exhibition => (
            <div key={exhibition.id} className="border border-zinc-100 rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant={exhibition.status}>{exhibition.status}</Badge>
                      {exhibition.startDate && exhibition.endDate && (
                        <span className="text-xs text-zinc-400">
                          {formatDate(exhibition.startDate)} – {formatDate(exhibition.endDate)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-zinc-900 leading-tight">{exhibition.title}</h3>
                    {exhibition.description && (
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{exhibition.description}</p>
                    )}
                  </div>
                  {(exhibition.artists.length > 0 || exhibition.artworks.length > 0) && (
                    <button
                      onClick={() => toggleExpand(exhibition.id)}
                      className="flex-shrink-0 text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
                    >
                      {expanded.has(exhibition.id) ? 'Collapse' : 'View'}
                    </button>
                  )}
                </div>

                {/* Artists always shown */}
                {exhibition.artists.length > 0 && (
                  <div className="mt-3">
                    <ArtistStrip artists={exhibition.artists} />
                  </div>
                )}
              </div>

              {/* Expanded artworks */}
              {expanded.has(exhibition.id) && exhibition.artworks.length > 0 && (
                <div className="border-t border-zinc-100">
                  <div
                    className="grid gap-0.5 p-0.5"
                    style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}
                  >
                    {exhibition.artworks.slice(0, 12).map((artwork) => (
                      <div key={artwork.id} className="relative aspect-square bg-zinc-100 overflow-hidden">
                        <img
                          src={`/api/image-proxy?url=${encodeURIComponent(artwork.imageUrl)}&w=300`}
                          alt={artwork.title || artwork.artistName || 'Artwork'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
