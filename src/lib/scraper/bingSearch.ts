import axios from 'axios';
import * as cheerio from 'cheerio';
import { Gallery } from '@/types/gallery';
import { slugify } from '@/lib/utils/slugify';
import { rateLimitedFetch, getDomain } from '@/lib/utils/rateLimiter';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Domains to exclude from gallery discovery
const EXCLUDED_DOMAINS = new Set([
  'wikipedia.org', 'wikimedia.org', 'wikidata.org',
  'yelp.com', 'tripadvisor.com', 'google.com', 'bing.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'youtube.com',
  'timeout.com', 'theguardian.com', 'nytimes.com', 'artsy.net',
  'artforum.com', 'artnet.com', 'dezeen.com',
]);

export async function bingSearchGalleries(city: string, country: string): Promise<Gallery[]> {
  const query = encodeURIComponent(`art galleries in "${city}" "${country}" exhibitions`);
  const url = `https://www.bing.com/search?q=${query}&count=30`;

  try {
    await rateLimitedFetch('www.bing.com');
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    return parseBingResults($, city, country);
  } catch (err) {
    console.error('[bing] search failed', err);
    return [];
  }
}

function parseBingResults($: cheerio.CheerioAPI, city: string, country: string): Gallery[] {
  const galleries: Gallery[] = [];
  const seen = new Set<string>();

  // Bing result selectors
  $('li.b_algo, .b_algo, li[data-bm]').each((_, el) => {
    const $el = $(el);

    // Get the main link
    const linkEl = $el.find('h2 a, .b_title a').first();
    const title = linkEl.text().trim();
    const href = linkEl.attr('href') || '';

    if (!href || !title) return;

    try {
      const url = new URL(href);
      const domain = url.hostname.replace(/^www\./, '');

      if (EXCLUDED_DOMAINS.has(domain)) return;
      if (seen.has(domain)) return;
      seen.add(domain);

      // Filter: must look like an art gallery
      const snippet = $el.find('.b_caption p, p').text().toLowerCase();
      const titleLower = title.toLowerCase();
      const isGallery = ['gallery', 'galleries', 'art', 'museum', 'exhibition', 'kunst', 'galerie'].some(
        kw => titleLower.includes(kw) || snippet.includes(kw)
      );

      if (!isGallery) return;

      galleries.push({
        id: slugify(city, title),
        name: title.replace(/\s*[-|–]\s*.*/i, '').trim(), // Remove " - City name" suffixes
        city,
        country,
        website: url.origin,
        source: 'bing',
        exhibitions: [],
        scrapedAt: new Date().toISOString(),
      });
    } catch {
      // Invalid URL, skip
    }
  });

  return galleries.slice(0, 15);
}
