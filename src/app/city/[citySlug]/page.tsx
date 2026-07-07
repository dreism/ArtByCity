import { readCache, isCacheValid, TTL } from '@/lib/cache/fileCache';
import { Gallery } from '@/types/gallery';
import { CityClientWrapper } from '@/components/layout/CityClientWrapper';
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

      <CityClientWrapper
        initialGalleries={galleries}
        needsDiscovery={needsDiscovery}
        city={city}
        country={country}
        countryCode={countryCode}
      />
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
