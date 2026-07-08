import { NextRequest, NextResponse } from 'next/server';
import { scrapeGalleryExhibitions } from '@/lib/scraper/exhibitionScraper';

export const maxDuration = 60;

// Scrapes ONE gallery website per invocation. GET so the CDN caches per URL.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const website = params.get('website');
  const galleryId = params.get('galleryId') || '';

  if (!website || !isSafeExternalUrl(website)) {
    return NextResponse.json({ error: 'valid website is required' }, { status: 400 });
  }

  try {
    const exhibitions = await scrapeGalleryExhibitions(website);
    const coverImageUrl =
      exhibitions[0]?.artworks[0]?.imageUrl || exhibitions[0]?.coverImageUrl;

    console.log('[api/exhibitions]', website, '→', exhibitions.length, 'exhibitions');
    return NextResponse.json(
      { galleryId, exhibitions, coverImageUrl },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    console.error('[api/exhibitions] failed for', website, (err as Error).message);
    // 200 with empty result: a hostile/slow gallery site is expected, and a
    // short CDN cache stops repeat visitors re-hammering it
    return NextResponse.json(
      { galleryId, exhibitions: [] },
      { headers: { 'Cache-Control': 'public, s-maxage=600' } }
    );
  }
}

function isSafeExternalUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || !host.includes('.')) return false;
    // Block raw private/loopback IPs
    if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
    if (host === '[::1]' || host.startsWith('[fc') || host.startsWith('[fd') || host.startsWith('[fe80')) return false;
    return true;
  } catch {
    return false;
  }
}
