import axios from 'axios';
import { Exhibition } from '@/types/gallery';
import { extractJsonLd } from './jsonLdParser';
import { parseExhibitionsFromHtml } from './cheerioScraper';
import { rateLimitedFetch, getDomain } from '@/lib/utils/rateLimiter';
import { EXHIBITION_PAGE_PATHS } from './heuristics';

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function scrapeGalleryExhibitions(galleryUrl: string): Promise<Exhibition[]> {
  if (!galleryUrl) return [];

  // Try main page first
  const mainHtml = await fetchHtml(galleryUrl);
  if (!mainHtml) return [];

  // Tier 1: JSON-LD
  const jsonLdExhibitions = extractJsonLd(mainHtml);
  if (jsonLdExhibitions.length > 0) {
    return jsonLdExhibitions;
  }

  // Tier 2: Cheerio heuristic on main page
  const cheerioExhibitions = parseExhibitionsFromHtml(mainHtml, galleryUrl);
  if (hasRealExhibitions(cheerioExhibitions)) {
    return cheerioExhibitions;
  }

  // Tier 3: Try exhibition subpages
  const subpageExhibitions = await tryExhibitionSubpages(galleryUrl, mainHtml);
  if (hasRealExhibitions(subpageExhibitions)) {
    return subpageExhibitions;
  }

  // Tier 4: Return whatever we got from Cheerio (even if sparse)
  return cheerioExhibitions;
}

async function tryExhibitionSubpages(baseUrl: string, mainHtml: string): Promise<Exhibition[]> {
  // Find links to exhibition pages in the main page HTML
  const exhibitionUrls = findExhibitionLinks(mainHtml, baseUrl);

  for (const url of exhibitionUrls.slice(0, 2)) {
    try {
      const html = await fetchHtml(url);
      if (!html) continue;

      const jsonLd = extractJsonLd(html);
      if (jsonLd.length > 0) return jsonLd;

      const cheerio = parseExhibitionsFromHtml(html, url);
      if (hasRealExhibitions(cheerio)) return cheerio;
    } catch {
      // continue to next URL
    }
  }
  return [];
}

function findExhibitionLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const base = new URL(baseUrl);

  // Find href patterns matching exhibition paths
  const hrefPattern = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefPattern.exec(html)) !== null) {
    const href = match[1];
    const lowerHref = href.toLowerCase();

    if (EXHIBITION_PAGE_PATHS.some(p => lowerHref.includes(p))) {
      try {
        const url = href.startsWith('http') ? href : href.startsWith('//') ? `https:${href}` : `${base.origin}${href.startsWith('/') ? href : '/' + href}`;
        if (!links.includes(url)) links.push(url);
      } catch { /* skip */ }
    }
  }

  return links;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    await rateLimitedFetch(getDomain(url));
    const response = await axios.get(url, {
      headers: FETCH_HEADERS,
      timeout: 8000,
      maxRedirects: 3,
    });
    return response.data as string;
  } catch (err) {
    console.error('[exhibitionScraper] fetch failed', url, (err as Error).message);
    return null;
  }
}

function hasRealExhibitions(exhibitions: Exhibition[]): boolean {
  if (exhibitions.length === 0) return false;
  // Consider "real" if at least one has artists OR artworks (not just bare title)
  return exhibitions.some(e => e.artists.length > 0 || e.artworks.length > 0);
}
