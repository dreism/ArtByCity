import axios from 'axios';
import * as cheerio from 'cheerio';
import { Gallery, Exhibition, Artist, Artwork } from '@/types/gallery';
import { slugify } from '@/lib/utils/slugify';
import { rateLimitedFetch, getDomain } from '@/lib/utils/rateLimiter';
import { v4 as uuidv4 } from 'uuid';

const BASE_URL = 'https://www.galleriesnow.net';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function scrapeGalleriesNow(city: string, country: string): Promise<Gallery[]> {
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const galleries: Gallery[] = [];

  // Try multiple URL patterns for GalleriesNow
  const urlsToTry = [
    `${BASE_URL}/exhibitions/${citySlug}/`,
    `${BASE_URL}/galleries/${citySlug}/`,
    `${BASE_URL}/exhibitions/?city=${encodeURIComponent(city)}`,
  ];

  for (const url of urlsToTry) {
    try {
      await rateLimitedFetch(getDomain(url));
      const response = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(response.data);

      const parsed = parseGalleriesNowPage($, city, country);
      if (parsed.length > 0) {
        galleries.push(...parsed);
        break;
      }
    } catch (err) {
      // try next URL
    }
  }

  return galleries.slice(0, 20);
}

function parseGalleriesNowPage($: cheerio.CheerioAPI, city: string, country: string): Gallery[] {
  const galleries: Gallery[] = [];
  const seen = new Set<string>();

  // GalleriesNow listing page selectors (they use various structures)
  const exhibitionSelectors = [
    '.exhibition-item',
    '.listing-item',
    'article',
    '.exhibition',
    '.gallery-item',
    '[class*="exhibition"]',
    '[class*="gallery"]',
  ];

  let items = $();
  for (const sel of exhibitionSelectors) {
    items = $(sel);
    if (items.length > 0) break;
  }

  if (items.length === 0) {
    // Fallback: parse any links that look like gallery/exhibition pages
    $('a[href*="/gallery/"], a[href*="/exhibition/"]').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (text && href && !seen.has(text.toLowerCase())) {
        seen.add(text.toLowerCase());
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        galleries.push(makeBasicGallery(text, fullUrl, city, country));
      }
    });
    return galleries;
  }

  items.each((_, el) => {
    const $el = $(el);

    // Extract gallery name
    const nameEl = $el.find('h2, h3, h4, .gallery-name, [class*="gallery-name"], [class*="title"]').first();
    const name = nameEl.text().trim() || $el.find('a').first().text().trim();
    if (!name || seen.has(name.toLowerCase())) return;
    seen.add(name.toLowerCase());

    // Extract exhibition info
    const exhibitionTitle = $el.find('[class*="exhibition"], .show-title, h1, h2').not(nameEl).first().text().trim();

    // Extract artists
    const artistText = $el.find('[class*="artist"], .artist-name, em, strong').text().trim();
    const artists: Artist[] = parseArtistNames(artistText);

    // Extract dates
    const dateText = $el.find('[class*="date"], time, .dates').text().trim();
    const { startDate, endDate, status } = parseDateRange(dateText);

    // Extract image
    const imgEl = $el.find('img').first();
    const imgSrc = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src') || '';
    const imageUrl = imgSrc.startsWith('http') ? imgSrc : imgSrc ? `${BASE_URL}${imgSrc}` : '';

    // Extract link to gallery page
    const link = $el.find('a').first().attr('href') || '';
    const galleryUrl = link.startsWith('http') ? link : link ? `${BASE_URL}${link}` : '';

    const exhibition: Exhibition = {
      id: uuidv4(),
      title: exhibitionTitle || 'Current Exhibition',
      status,
      startDate,
      endDate,
      artists,
      artworks: imageUrl ? [{ id: uuidv4(), imageUrl, artistName: artists[0]?.name }] : [],
      coverImageUrl: imageUrl || undefined,
    };

    galleries.push({
      id: slugify(city, name),
      name,
      city,
      country,
      website: galleryUrl,
      source: 'galleriesnow',
      exhibitions: [exhibition],
      coverImageUrl: imageUrl || undefined,
      scrapedAt: new Date().toISOString(),
    });
  });

  return galleries;
}

function makeBasicGallery(name: string, url: string, city: string, country: string): Gallery {
  return {
    id: slugify(city, name),
    name,
    city,
    country,
    website: url,
    source: 'galleriesnow',
    exhibitions: [],
    scrapedAt: new Date().toISOString(),
  };
}

export function parseArtistNames(text: string): Artist[] {
  if (!text) return [];
  // Split by common delimiters
  const names = text
    .split(/[,;&\/\n]/)
    .map(n => n.trim())
    .filter(n => n.length > 2 && n.length < 60 && /[A-Za-zÀ-ÿ]/.test(n));

  return names.slice(0, 10).map(name => ({
    id: slugify(name),
    name,
  }));
}

export function parseDateRange(text: string): { startDate?: string; endDate?: string; status: 'current' | 'upcoming' | 'past' } {
  if (!text) return { status: 'current' };

  const now = new Date();

  // Match patterns like "Jan 15 – Mar 30, 2024" or "15.01.2024 – 30.03.2024"
  const patterns = [
    /(\w+\.?\s+\d{1,2}[,.]?\s*\d{0,4})\s*[–—\-]+\s*(\w+\.?\s+\d{1,2}[,.]?\s*\d{4})/i,
    /(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})\s*[–—\-]+\s*(\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const start = new Date(match[1]);
      const end = new Date(match[2]);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const status: 'current' | 'upcoming' | 'past' =
          now < start ? 'upcoming' : now > end ? 'past' : 'current';
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          status,
        };
      }
    }
  }

  // Look for keywords
  const lower = text.toLowerCase();
  if (lower.includes('upcoming') || lower.includes('opens')) return { status: 'upcoming' };
  if (lower.includes('closed') || lower.includes('ended') || lower.includes('past')) return { status: 'past' };
  return { status: 'current' };
}
