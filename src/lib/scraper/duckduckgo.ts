import axios from 'axios';
import * as cheerio from 'cheerio';
import { Gallery } from '@/types/gallery';
import { slugify } from '@/lib/utils/slugify';

// Last-resort discovery tier. DuckDuckGo's HTML endpoint is more tolerant of
// datacenter IPs than Google/Bing (which CAPTCHA all Vercel egress), but this
// is still best-effort only.
const SEARCH_URL = 'https://html.duckduckgo.com/html/';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const EXCLUDED_DOMAINS = new Set([
  'wikipedia.org', 'wikimedia.org', 'wikidata.org',
  'yelp.com', 'tripadvisor.com', 'google.com', 'bing.com', 'duckduckgo.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'youtube.com',
  'timeout.com', 'theguardian.com', 'nytimes.com', 'artsy.net',
  'artforum.com', 'artnet.com', 'dezeen.com', 'galleriesnow.net',
  'theculturetrip.com', 'lonelyplanet.com', 'reddit.com', 'pinterest.com',
  'eventbrite.com', 'cntraveler.com', '10best.com',
]);

export async function duckduckgoSearchGalleries(city: string, country: string): Promise<Gallery[]> {
  const q = `art galleries in "${city}" ${country} current exhibitions`;

  try {
    const response = await axios.get(SEARCH_URL, {
      params: { q },
      headers: HEADERS,
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const galleries: Gallery[] = [];
    const seen = new Set<string>();

    $('a.result__a').each((_, el) => {
      const $el = $(el);
      const title = $el.text().trim();
      const href = resolveResultUrl($el.attr('href') || '');
      if (!href || !title) return;

      try {
        const url = new URL(href);
        const domain = url.hostname.replace(/^www\./, '');
        if (EXCLUDED_DOMAINS.has(domain) || seen.has(domain)) return;

        const titleLower = title.toLowerCase();
        const isGallery = ['gallery', 'galleries', 'art', 'museum', 'exhibition', 'kunst', 'galerie'].some(
          kw => titleLower.includes(kw)
        );
        if (!isGallery) return;

        seen.add(domain);
        const name = title.replace(/\s*[-|–—:]\s.*$/, '').trim();
        galleries.push({
          id: slugify(city, name),
          name,
          city,
          country,
          website: url.origin,
          source: 'duckduckgo',
          exhibitions: [],
          scrapedAt: new Date().toISOString(),
        });
      } catch {
        // invalid URL, skip
      }
    });

    console.log('[duckduckgo]', city, '→', galleries.length, 'results');
    return galleries.slice(0, 15);
  } catch (err) {
    console.error('[duckduckgo] search failed', (err as Error).message);
    return [];
  }
}

// DDG links results through a redirect: //duckduckgo.com/l/?uddg=<encoded target>
function resolveResultUrl(href: string): string {
  if (!href) return '';
  try {
    const url = new URL(href.startsWith('//') ? `https:${href}` : href, 'https://duckduckgo.com');
    const uddg = url.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);
    return url.href;
  } catch {
    return '';
  }
}
