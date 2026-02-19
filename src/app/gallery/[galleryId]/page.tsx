import { readCache, isCacheValid, TTL } from '@/lib/cache/fileCache';
import { Gallery } from '@/types/gallery';
import { GalleryProfile } from '@/components/gallery/GalleryProfile';
import { ExhibitionList } from '@/components/gallery/ExhibitionList';
import { ArtworkMasonry } from '@/components/gallery/ArtworkMasonry';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';

interface Props {
  params: { galleryId: string };
}

async function getGallery(galleryId: string): Promise<Gallery | null> {
  // Check gallery-specific cache
  const cacheKey = `galleries/${galleryId}`;
  if (isCacheValid(cacheKey, TTL.EXHIBITIONS)) {
    const cached = readCache<Gallery>(cacheKey);
    if (cached) return cached;
  }

  // Trigger server-side scrape by calling our own API
  const apiBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiBase}/api/gallery/${galleryId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json() as Gallery;
  } catch {
    // Fallback: search in city caches
    return findGalleryInCityCache(galleryId);
  }
}

function findGalleryInCityCache(galleryId: string): Gallery | null {
  const cacheDir = process.env.CACHE_DIR || '/tmp/artbycity-cache';
  const citiesDir = path.join(cacheDir, 'cities');
  if (!fs.existsSync(citiesDir)) return null;

  for (const dir of fs.readdirSync(citiesDir)) {
    const file = path.join(citiesDir, dir, 'galleries.json');
    if (!fs.existsSync(file)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      const found = (data.galleries as Gallery[])?.find(g => g.id === galleryId);
      if (found) return found;
    } catch { /* skip */ }
  }
  return null;
}

export default async function GalleryPage({ params }: Props) {
  const gallery = await getGallery(params.galleryId);
  if (!gallery) notFound();

  const allArtworks = gallery.exhibitions.flatMap(e => e.artworks);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
        <Link href="/" className="hover:text-zinc-700 transition-colors">Home</Link>
        <span>/</span>
        <Link
          href={`/city/${gallery.city.toLowerCase().replace(/\s+/g, '-')}?city=${encodeURIComponent(gallery.city)}&country=${encodeURIComponent(gallery.country)}`}
          className="hover:text-zinc-700 transition-colors"
        >
          {gallery.city}
        </Link>
        <span>/</span>
        <span className="text-zinc-700 truncate max-w-[200px]">{gallery.name}</span>
      </div>

      {/* Gallery profile header */}
      <GalleryProfile gallery={gallery} />

      {/* All artworks masonry */}
      {allArtworks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3">Artworks</h2>
          <ArtworkMasonry artworks={allArtworks} />
        </section>
      )}

      {/* Exhibitions */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4">Exhibitions</h2>
        {gallery.exhibitions.length > 0 ? (
          <ExhibitionList exhibitions={gallery.exhibitions} />
        ) : (
          <div className="text-center py-12 border border-zinc-100 rounded-xl">
            <p className="text-zinc-400 text-sm">Exhibition data is being loaded...</p>
            {gallery.website && (
              <a
                href={gallery.website}
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

export function generateMetadata({ params }: Props) {
  return {
    title: `Gallery — ArtByCity`,
  };
}
