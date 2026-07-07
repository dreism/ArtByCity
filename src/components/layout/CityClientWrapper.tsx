'use client';

import { useState, useCallback } from 'react';
import { Gallery } from '@/types/gallery';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { DiscoveryStatus } from '@/components/layout/DiscoveryStatus';
import Link from 'next/link';

interface Props {
  initialGalleries: Gallery[];
  needsDiscovery: boolean;
  city: string;
  country: string;
  countryCode: string;
}

export function CityClientWrapper({ initialGalleries, needsDiscovery, city, country, countryCode }: Props) {
  const [galleries, setGalleries] = useState<Gallery[]>(initialGalleries);
  const [discovered, setDiscovered] = useState(false);

  const handleGalleries = useCallback((found: Gallery[]) => {
    setGalleries(found);
    setDiscovered(true);
  }, []);

  const showDiscovery = needsDiscovery && galleries.length === 0 && !discovered;
  const showEmpty = galleries.length === 0 && !needsDiscovery && !showDiscovery;

  return (
    <>
      {showDiscovery && (
        <DiscoveryStatus
          city={city}
          country={country}
          countryCode={countryCode}
          onGalleries={handleGalleries}
        />
      )}

      <GalleryGrid galleries={galleries} />

      {showEmpty && (
        <div className="text-center py-20">
          <p className="text-zinc-400">No galleries found for {city}.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-zinc-600 underline">
            Try another city
          </Link>
        </div>
      )}
    </>
  );
}
