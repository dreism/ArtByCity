import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import { Exhibition, Artist, Artwork } from '@/types/gallery';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '@/lib/utils/slugify';
import {
  EXHIBITION_SELECTORS, ARTIST_SELECTORS, TITLE_SELECTORS,
  IMAGE_SELECTORS, ARTIST_TEXT_PATTERNS, isLikelyArtworkImage
} from './heuristics';
import { parseDateRange, parseArtistNames } from './galleriesNow';

export function parseExhibitionsFromHtml(html: string, baseUrl: string): Exhibition[] {
  const $ = cheerio.load(html);
  removeBoilerplate($);

  const exhibitions: Exhibition[] = [];

  // Find exhibition containers
  let containers = $();
  for (const sel of EXHIBITION_SELECTORS) {
    containers = $(sel);
    if (containers.length > 0 && containers.length < 50) break;
  }

  if (containers.length === 0) {
    // Fallback: treat the whole page as one exhibition
    const fallback = extractFromWholePage($, baseUrl);
    if (fallback) exhibitions.push(fallback);
    return exhibitions;
  }

  containers.each((i, el) => {
    if (i >= 10) return false; // max 10 exhibitions per gallery
    const exhibition = extractExhibitionFromElement($, el as Element, baseUrl);
    if (exhibition) exhibitions.push(exhibition);
  });

  // Deduplicate by title
  const seen = new Set<string>();
  return exhibitions.filter(e => {
    if (seen.has(e.title.toLowerCase())) return false;
    seen.add(e.title.toLowerCase());
    return true;
  });
}

function extractExhibitionFromElement(
  $: cheerio.CheerioAPI,
  el: Element,
  baseUrl: string
): Exhibition | null {
  const $el = $(el);

  // Get title
  let title = '';
  for (const sel of TITLE_SELECTORS) {
    title = $el.find(sel).first().text().trim();
    if (title && title.length > 2 && title.length < 200) break;
  }
  if (!title) title = 'Current Exhibition';

  // Get dates
  const dateText = $el.find('time, [class*="date"], [class*="dates"], [datetime]').text().trim();
  const { startDate, endDate, status } = parseDateRange(dateText);

  // Get description
  const description = $el.find('p').first().text().trim().slice(0, 500);

  // Get artists
  const artists = extractArtists($el, $);

  // Get artworks (images)
  const artworks = extractArtworks($el, $, baseUrl, artists[0]?.name);

  return {
    id: uuidv4(),
    title,
    status,
    startDate,
    endDate,
    description: description || undefined,
    artists,
    artworks,
  };
}

function extractArtists($el: cheerio.Cheerio<Element>, $: cheerio.CheerioAPI): Artist[] {
  const artists: Artist[] = [];
  const seen = new Set<string>();

  // Try dedicated artist elements
  for (const sel of ARTIST_SELECTORS) {
    $el.find(sel).each((_, el) => {
      const name = $(el).text().trim();
      if (isValidArtistName(name) && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        artists.push({ id: slugify(name), name });
      }
    });
    if (artists.length > 0) break;
  }

  // Try regex patterns on text content
  if (artists.length === 0) {
    const text = $el.text();
    for (const pattern of ARTIST_TEXT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const names = parseArtistNames(match[1]);
        for (const a of names) {
          if (!seen.has(a.name.toLowerCase())) {
            seen.add(a.name.toLowerCase());
            artists.push(a);
          }
        }
        if (artists.length > 0) break;
      }
    }
  }

  return artists.slice(0, 10);
}

function extractArtworks(
  $el: cheerio.Cheerio<Element>,
  $: cheerio.CheerioAPI,
  baseUrl: string,
  artistName?: string
): Artwork[] {
  const artworks: Artwork[] = [];
  const seen = new Set<string>();

  for (const sel of IMAGE_SELECTORS) {
    $el.find(sel).each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy') || $(img).attr('data-lazy-src') || '';
      const alt = $(img).attr('alt') || '';

      if (!src || !isLikelyArtworkImage(src, alt)) return;

      const fullUrl = resolveUrl(src, baseUrl);
      if (!fullUrl || seen.has(fullUrl)) return;
      seen.add(fullUrl);

      artworks.push({
        id: uuidv4(),
        imageUrl: fullUrl,
        title: alt || undefined,
        artistName,
      });
    });
    if (artworks.length >= 12) break;
  }

  return artworks.slice(0, 12);
}

function extractFromWholePage($: cheerio.CheerioAPI, baseUrl: string): Exhibition | null {
  // OpenGraph + meta fallback
  const title = $('meta[property="og:title"]').attr('content') || $('title').text() || 'Gallery';
  const description = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';

  const artworks: Artwork[] = ogImage ? [{ id: uuidv4(), imageUrl: resolveUrl(ogImage, baseUrl) || ogImage }] : [];

  // Grab images from the page
  $('img').each((_, img) => {
    if (artworks.length >= 6) return false;
    const src = $(img).attr('src') || $(img).attr('data-src') || '';
    const alt = $(img).attr('alt') || '';
    if (src && isLikelyArtworkImage(src, alt)) {
      const fullUrl = resolveUrl(src, baseUrl);
      if (fullUrl && !artworks.some(a => a.imageUrl === fullUrl)) {
        artworks.push({ id: uuidv4(), imageUrl: fullUrl, title: alt || undefined });
      }
    }
  });

  // Extract artist names from page text
  const bodyText = $('body').text().slice(0, 2000);
  let artists: Artist[] = [];
  for (const pattern of ARTIST_TEXT_PATTERNS) {
    const match = bodyText.match(pattern);
    if (match) {
      artists = parseArtistNames(match[1]);
      break;
    }
  }

  return {
    id: uuidv4(),
    title: title.slice(0, 200),
    status: 'current',
    description: description || undefined,
    artists,
    artworks,
  };
}

function isValidArtistName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 80) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(name)) return false;
  if (/^\d+$/.test(name)) return false;
  // Skip common non-name elements
  const lower = name.toLowerCase();
  const skip = ['exhibition', 'gallery', 'museum', 'current', 'upcoming', 'past', 'show', 'art', 'opening', 'more', 'view', 'read', 'learn', 'click'];
  return !skip.some(s => lower === s || lower === `${s}s`);
}

function resolveUrl(src: string, baseUrl: string): string {
  if (!src) return '';
  try {
    if (src.startsWith('http')) return src;
    if (src.startsWith('//')) return `https:${src}`;
    const base = new URL(baseUrl);
    if (src.startsWith('/')) return `${base.origin}${src}`;
    return `${base.origin}/${src}`;
  } catch {
    return src;
  }
}

function removeBoilerplate($: cheerio.CheerioAPI) {
  $('header, footer, nav, script, style, noscript, iframe, [class*="cookie"], [class*="popup"], [id*="cookie"]').remove();
}
