import { NextRequest, NextResponse } from 'next/server';
import { discoverGalleries } from '@/lib/scraper/discoverer';

export const maxDuration = 60;

// GET so Vercel's CDN can cache the response per city (POST is never cached).
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const city = params.get('city');
  const country = params.get('country') || '';

  if (!city) {
    return NextResponse.json({ error: 'city is required' }, { status: 400 });
  }

  try {
    const galleries = await discoverGalleries(city, country);
    return NextResponse.json(
      { city, country, galleries },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (err) {
    console.error('[api/galleries] failed for', city, err);
    return NextResponse.json(
      { error: (err as Error).message, city, country, galleries: [] },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
