import axios from 'axios';
import { sparqlQuery } from './client';
import { Gallery } from '@/types/gallery';
import { slugify } from '@/lib/utils/slugify';

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

const HEADERS = {
  'User-Agent': 'ArtByCity/2.0 (art gallery discovery app)',
};

/** Resolve a city name to its Wikidata QID via the fast entity-search API. */
export async function resolveCityQid(city: string, country: string): Promise<string | null> {
  const res = await axios.get(WIKIDATA_API, {
    params: {
      action: 'wbsearchentities',
      search: city,
      language: 'en',
      type: 'item',
      limit: 8,
      format: 'json',
    },
    headers: HEADERS,
    timeout: 8000,
  });

  const results: { id: string; description?: string }[] = res.data?.search || [];
  if (results.length === 0) return null;

  // Prefer a hit whose description mentions the country, then one that looks like a city
  const countryLower = country.toLowerCase();
  const byCountry = countryLower
    ? results.find(r => r.description?.toLowerCase().includes(countryLower))
    : undefined;
  const byCityDesc = results.find(r => /\b(city|capital|municipality|metropolis)\b/i.test(r.description || ''));

  return (byCountry || byCityDesc || results[0]).id;
}

/**
 * Notable galleries/museums located in the city, ranked by Wikipedia sitelink
 * count. The query is anchored on the city QID so it runs in 1-3s (unanchored
 * label-match variants get killed at WDQS's 60s limit).
 */
export async function searchGalleriesByCity(city: string, country: string): Promise<Gallery[]> {
  const qid = await resolveCityQid(city, country);
  if (!qid) {
    console.log('[wikidata] could not resolve city QID for', city, country);
    return [];
  }
  console.log('[wikidata]', city, '→', qid);

  // Bounded 1-or-2-hop location match. An unbounded wdt:P131* path forces the
  // engine to path-check every gallery on Earth and times out at ~30s; with a
  // bound city on the object side these UNION branches evaluate backwards
  // from the city and return in 1-3s.
  const query = `
SELECT DISTINCT ?item ?itemLabel ?desc ?website ?image ?sitelinks WHERE {
  VALUES ?type { wd:Q1007870 wd:Q207694 }
  ?item wdt:P31 ?type .
  { ?item wdt:P131 wd:${qid} . }
  UNION
  { ?item wdt:P131 ?district . ?district wdt:P131 wd:${qid} . }
  ?item wikibase:sitelinks ?sitelinks .
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
ORDER BY DESC(?sitelinks)
LIMIT 30
  `.trim();

  const rows = await sparqlQuery(query);
  return mapRowsToGalleries(rows, city, country);
}

function mapRowsToGalleries(rows: Record<string, { value: string }>[], city: string, country: string): Gallery[] {
  const seen = new Set<string>();
  const galleries: Gallery[] = [];

  for (const row of rows) {
    const name = row.itemLabel?.value;
    // Skip unnamed items (label service falls back to the bare QID)
    if (!name || /^Q\d+$/.test(name) || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const imageUrl = row.image?.value || '';
    let coverImageUrl: string | undefined;
    if (imageUrl) {
      const filename = imageUrl.split('/').pop()!;
      const encoded = encodeURIComponent(decodeURIComponent(filename).replace(/ /g, '_'));
      coverImageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=800`;
    }

    galleries.push({
      id: slugify(city, name),
      name,
      city,
      country,
      website: row.website?.value || '',
      description: row.desc?.value || '',
      coverImageUrl,
      source: 'wikidata',
      sitelinks: row.sitelinks ? Number(row.sitelinks.value) : 0,
      exhibitions: [],
      scrapedAt: new Date().toISOString(),
    });
  }

  return galleries;
}
