'use client';

import { useState } from 'react';
import { Artwork } from '@/types/gallery';

interface Props {
  artworks: Artwork[];
}

export function ArtworkMasonry({ artworks }: Props) {
  const [lightbox, setLightbox] = useState<Artwork | null>(null);

  if (artworks.length === 0) return null;

  return (
    <>
      <div
        style={{
          columns: 'auto 160px',
          columnGap: '4px',
        }}
      >
        {artworks.map((artwork) => (
          <div
            key={artwork.id}
            className="break-inside-avoid mb-1 cursor-pointer overflow-hidden"
            onClick={() => setLightbox(artwork)}
          >
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(artwork.imageUrl)}&w=400`}
              alt={artwork.title || artwork.artistName || 'Artwork'}
              className="w-full object-cover hover:opacity-90 transition-opacity"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <img
              src={`/api/image-proxy?url=${encodeURIComponent(lightbox.imageUrl)}&w=1200`}
              alt={lightbox.title || ''}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {(lightbox.title || lightbox.artistName) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
                {lightbox.title && <p className="text-white font-medium text-sm">{lightbox.title}</p>}
                {lightbox.artistName && <p className="text-white/70 text-xs mt-0.5">{lightbox.artistName}</p>}
              </div>
            )}
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/30 rounded-full w-8 h-8 flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
