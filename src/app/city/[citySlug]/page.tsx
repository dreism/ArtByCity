import { readCache, isCacheValid, TTL } from '@/lib/cache/fileCache';
import { Gallery } from '@/types/gallery';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { DiscoveryStatus } from '@/components/layout/DiscoveryStatus';
import Link from 'next/link';

interface Props {
  params: { citySlug: string };
  searchParams: { city?: string; country?: string; code?: string };
}

export default function CityPage({ params, searchParams }: Props) {
  const { citySlug } = params;
  const city = searchParams.city || citySlug.split('-').slice(1).join(' ');
  const country = searchParams.country || '';
  const countryCode = searchParams.code || '';

  const cacheKey = `cities/${citySlug}/galleries`;
  const isValid = isCacheValid(cacheKey, TTL.GALLERIES);
  const cached = isValid ? readCache<{ galleries: Gallery[] }>(cacheKey) : null;
  const galleries = cached?.galleries || [];
  const needsDiscovery = !isValid || galleries.length === 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
          <Link href="/" className="hover:text-zinc-700 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-zinc-700">{city}</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">
          Art galleries in {city}
        </h1>
        {country && (
          <p className="text-zinc-500 mt-1">{country}</p>
        )}
        {galleries.length > 0 && (
          <p className="text-zinc-400 text-sm mt-2">{galleries.length} galleries found</p>
        )}
      </div>

      {/* Discovery status — shown when cache is cold */}
      {needsDiscovery && (
        <DiscoveryStatus city={city} country={country} countryCode={countryCode} />
      )}

      {/* Gallery grid */}
      <GalleryGrid galleries={galleries} />

      {/* Empty state when discovery is running */}
      {galleries.length === 0 && !needsDiscovery && (
        <div className="text-center py-20">
          <p className="text-zinc-400">No galleries found for {city}.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-600 underline">
            Try another city
          </Link>
        </div>
      )}
    </div>
  );
}

export function generateMetadata({ params, searchParams }: Props) {
  const city = searchParams.city || params.citySlug;
  return {
    title: `Art Galleries in ${city} — ArtByCity`,
    description: `Discover the top art galleries and current exhibitions in ${city}.`,
  };
}
