import { NextRequest, NextResponse } from 'next/server';
import { readCache, writeCache, isCacheValid, TTL } from '@/lib/cache/fileCache';
import { discoverGalleries } from '@/lib/scraper/discoverer';
import { cityKey } from '@/lib/utils/slugify';
import { Gallery } from '@/types/gallery';

export async function POST(req: NextRequest) {
  const { city, country, countryCode } = await req.json();

  if (!city || !country) {
    return NextResponse.json({ error: 'city and country are required' }, { status: 400 });
  }

  const cacheKey = `cities/${cityKey(countryCode || country, city)}/galleries`;

  // Return from cache if valid
  if (isCacheValid(cacheKey, TTL.GALLERIES)) {
    const cached = readCache<{ galleries: Gallery[] }>(cacheKey);
    if (cached?.galleries?.length) {
      return NextResponse.json({ status: 'cached', galleries: cached.galleries });
    }
  }

  try {
    const galleries = await discoverGalleries(city, country);
    writeCache(cacheKey, { galleries, fetchedAt: new Date().toISOString(), city, country });
    return NextResponse.json({ status: 'cached', galleries });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', error: (err as Error).message },
      { status: 500 }
    );
  }
}
