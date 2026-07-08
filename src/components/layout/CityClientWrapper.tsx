'use client';

import { useEffect, useRef, useState } from 'react';
import { Gallery } from '@/types/gallery';
import { GalleriesResponse, ExhibitionsResponse } from '@/types/api';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import Link from 'next/link';

interface Props {
  city: string;
  country: string;
  countryCode: string;
}

const ENRICH_CONCURRENCY = 4;

export function CityClientWrapper({ city, country, countryCode }: Props) {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setPhase('loading');
    setGalleries([]);

    (async () => {
      try {
        const qs = new URLSearchParams({ city, country, code: countryCode });
        const res = await fetch(`/api/galleries?${qs}`);
        if (!res.ok) throw new Error(`Discovery failed (HTTP ${res.status})`);
        const data: GalleriesResponse = await res.json();
        if (cancelledRef.current) return;

        const found = data.galleries || [];
        setGalleries(found);
        setPhase('ready');
        enrichGalleries(found);
      } catch (err) {
        if (cancelledRef.current) return;
        setErrorMsg((err as Error).message || 'Could not load galleries');
        setPhase('error');
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, country, countryCode]);

  async function enrichGalleries(found: Gallery[]) {
    const targets = found.filter(g => g.website && g.exhibitions.length === 0);
    if (targets.length === 0) return;

    setEnrichingIds(new Set(targets.map(g => g.id)));
    const queue = [...targets];

    const worker = async () => {
      while (queue.length > 0 && !cancelledRef.current) {
        const gallery = queue.shift()!;
        try {
          const qs = new URLSearchParams({ website: gallery.website, galleryId: gallery.id });
          const res = await fetch(`/api/exhibitions?${qs}`);
          const data: ExhibitionsResponse = await res.json();

          if (!cancelledRef.current && data.exhibitions?.length > 0) {
            setGalleries(prev =>
              prev.map(g =>
                g.id === gallery.id
                  ? {
                      ...g,
                      exhibitions: data.exhibitions,
                      coverImageUrl: g.coverImageUrl || data.coverImageUrl,
                    }
                  : g
              )
            );
          }
        } catch {
          // one hostile gallery site shouldn't affect the rest
        }
        if (!cancelledRef.current) {
          setEnrichingIds(prev => {
            const next = new Set(prev);
            next.delete(gallery.id);
            return next;
          });
        }
      }
    };

    await Promise.all(Array.from({ length: ENRICH_CONCURRENCY }, worker));
  }

  if (phase === 'loading') {
    return (
      <div>
        <p className="text-sm text-zinc-400 mb-4 animate-pulse">
          Finding the top galleries in {city}…
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden border border-zinc-100">
              <div className="aspect-square bg-zinc-100 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-zinc-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-zinc-100 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500">{errorMsg}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (galleries.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-400">No galleries found for {city}.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-zinc-600 underline">
          Try another city
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-zinc-400 mb-4">
        {galleries.length} galleries
        {enrichingIds.size > 0 && (
          <span className="ml-2 text-zinc-300">· loading exhibitions ({enrichingIds.size} left)…</span>
        )}
      </p>
      <GalleryGrid galleries={galleries} enrichingIds={enrichingIds} />
    </div>
  );
}
