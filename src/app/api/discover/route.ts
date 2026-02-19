import { NextRequest, NextResponse } from 'next/server';
import { readCache, writeCache, isCacheValid, TTL } from '@/lib/cache/fileCache';
import { discoverGalleries } from '@/lib/scraper/discoverer';
import { cityKey } from '@/lib/utils/slugify';
import { Gallery } from '@/types/gallery';
import { JobStatus } from '@/types/api';
import { v4 as uuidv4 } from 'uuid';

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

  // Start background job
  const jobId = uuidv4();
  const jobKey = `jobs/${jobId}`;

  const initialStatus: JobStatus = {
    status: 'running',
    progress: 0,
    total: 3,
    message: `Starting gallery discovery for ${city}...`,
  };
  writeCache(jobKey, initialStatus);

  // Fire-and-forget
  (async () => {
    try {
      const galleries = await discoverGalleries(city, country, (p) => {
        writeCache<JobStatus>(jobKey, {
          status: 'running',
          progress: p.progress,
          total: p.total,
          message: p.message,
          galleries: p.galleries,
        });
      });

      writeCache(cacheKey, { galleries, fetchedAt: new Date().toISOString(), city, country });
      writeCache<JobStatus>(jobKey, {
        status: 'done',
        progress: 3,
        total: 3,
        message: `Found ${galleries.length} galleries in ${city}`,
        galleries,
      });
    } catch (err) {
      writeCache<JobStatus>(jobKey, {
        status: 'error',
        progress: 0,
        total: 3,
        message: `Discovery failed: ${(err as Error).message}`,
        error: (err as Error).message,
      });
    }
  })();

  return NextResponse.json({ status: 'running', jobId }, { status: 202 });
}
