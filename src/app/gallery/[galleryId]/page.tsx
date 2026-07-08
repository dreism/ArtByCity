'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Gallery, Exhibition } from '@/types/gallery';
import { ExhibitionsResponse } from '@/types/api';
import { GalleryProfile } from '@/components/gallery/GalleryProfile';
import { ExhibitionList } from '@/components/gallery/ExhibitionList';
import { ArtworkMasonry } from '@/components/gallery/ArtworkMasonry';

// Stateless on serverless: gallery info arrives via query params from the
// card link; exhibitions are fetched client-side from the CDN-cached endpoint.
export default function GalleryPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GalleryPageInner />
    </Suspense>
  );
}

function GalleryPageInner() {
  const { galleryId } = useParams<{ galleryId: string }>();
  const sp = useSearchParams();

  const name = sp.get('name') || '';
  const website = sp.get('website') || '';
  const city = sp.get('city') || '';
  const country = sp.get('country') || '';
  const img = sp.get('img') || '';
  const desc = sp.get('desc') || '';

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(Boolean(website));

  useEffect(() => {
    if (!website) return;
    let cancelled = false;

    (async () => {
      try {
        const qs = new URLSearchParams({ website, galleryId: galleryId || '' });
        const res = await fetch(`/api/exhibitions?${qs}`);
        const data: ExhibitionsResponse = await res.json();
        if (!cancelled) setExhibitions(data.exhibitions || []);
      } catch {
        // leave empty — website link is still shown
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [website, galleryId]);

  if (!name) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-400">Gallery not found.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-zinc-600 underline">
          Back to search
        </Link>
      </div>
    );
  }

  const gallery: Gallery = {
    id: galleryId || '',
    name,
    city,
    country,
    website,
    description: desc || undefined,
    coverImageUrl: img || exhibitions[0]?.coverImageUrl || exhibitions[0]?.artworks[0]?.imageUrl,
    source: 'web',
    exhibitions,
    scrapedAt: '',
  };

  const allArtworks = exhibitions.flatMap(e => e.artworks);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/" className="hover:text-zinc-700 transition-colors">Home</Link>
        {city && (
          <>
            <span>/</span>
            <Link
              href={`/city/${city.toLowerCase().replace(/\s+/g, '-')}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`}
              className="hover:text-zinc-700 transition-colors"
            >
              {city}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-700 truncate max-w-[200px]">{name}</span>
      </div>

      <GalleryProfile gallery={gallery} />

      {allArtworks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Artworks</h2>
          <ArtworkMasonry artworks={allArtworks} />
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Exhibitions</h2>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border border-zinc-100 rounded-xl p-4 space-y-2">
                <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/4" />
                <div className="h-4 bg-zinc-100 rounded animate-pulse w-2/3" />
                <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : exhibitions.length > 0 ? (
          <ExhibitionList exhibitions={exhibitions} />
        ) : (
          <div className="text-center py-12 border border-zinc-100 rounded-xl">
            <p className="text-zinc-400 text-sm">No exhibition details found on the gallery&apos;s site.</p>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-zinc-600 underline"
              >
                Visit gallery website
              </a>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-4 bg-zinc-100 rounded animate-pulse w-48 mb-6" />
      <div className="flex items-center gap-6 pb-6">
        <div className="w-20 h-20 rounded-full bg-zinc-100 animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 bg-zinc-100 rounded animate-pulse w-52" />
          <div className="h-3.5 bg-zinc-100 rounded animate-pulse w-32" />
        </div>
      </div>
    </div>
  );
}
