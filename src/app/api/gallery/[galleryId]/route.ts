import { NextRequest, NextResponse } from 'next/server';
import { readCache, writeCache, isCacheValid, TTL } from '@/lib/cache/fileCache';
import { scrapeGalleryExhibitions } from '@/lib/scraper/exhibitionScraper';
import { Gallery } from '@/types/gallery';

export async function GET(
  _req: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  const { galleryId } = params;
  const cacheKey = `galleries/${galleryId}`;

  // Try cache first
  if (isCacheValid(cacheKey, TTL.EXHIBITIONS)) {
    const cached = readCache<Gallery>(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  // Find gallery in any cached city data (search through files)
  const gallery = await findGalleryInCache(galleryId);
  if (!gallery) {
    return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
  }

  // Scrape exhibitions if gallery has a website
  if (gallery.website) {
    try {
      const exhibitions = await scrapeGalleryExhibitions(gallery.website);
      if (exhibitions.length > 0) {
        gallery.exhibitions = exhibitions;
        // Set cover image from first exhibition's first artwork
        if (!gallery.coverImageUrl) {
          gallery.coverImageUrl = exhibitions[0]?.artworks[0]?.imageUrl ||
            exhibitions[0]?.coverImageUrl;
        }
      }
    } catch (err) {
      console.error('[gallery API] scrape failed for', gallery.website, err);
    }
  }

  gallery.scrapedAt = new Date().toISOString();
  writeCache(cacheKey, gallery);
  return NextResponse.json(gallery);
}

async function findGalleryInCache(galleryId: string): Promise<Gallery | null> {
  const fs = await import('fs');
  const path = await import('path');
  const cacheDir = process.env.CACHE_DIR || '/tmp/artbycity-cache';
  const citiesDir = path.join(cacheDir, 'cities');

  if (!fs.existsSync(citiesDir)) return null;

  const cityDirs = fs.readdirSync(citiesDir);
  for (const dir of cityDirs) {
    const galleriesFile = path.join(citiesDir, dir, 'galleries.json');
    if (!fs.existsSync(galleriesFile)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(galleriesFile, 'utf-8'));
      const galleries: Gallery[] = data.galleries || [];
      const found = galleries.find(g => g.id === galleryId);
      if (found) return { ...found };
    } catch { /* skip */ }
  }
  return null;
}
