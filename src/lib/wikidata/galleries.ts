import { sparqlQuery } from './client';
import { Gallery } from '@/types/gallery';
import { slugify } from '@/lib/utils/slugify';
import { v4 as uuidv4 } from 'uuid';

// Wikidata class IDs for gallery types
const GALLERY_CLASSES = [
  'wd:Q1007870', // art gallery
  'wd:Q207694',  // art museum
  'wd:Q33506',   // museum (broader fallback)
].join(' wd:');

export async function searchGalleriesByCity(city: string, country: string): Promise<Gallery[]> {
  // Try multiple query strategies for better city matching
  const results = await trySearchStrategies(city, country);
  return results.slice(0, 20);
}

async function trySearchStrategies(city: string, country: string): Promise<Gallery[]> {
  // Strategy 1: Search by city label
  const strategy1 = buildCityLabelQuery(city);
  try {
    const rows = await sparqlQuery(strategy1);
    const galleries = mapRowsToGalleries(rows, city, country);
    if (galleries.length >= 3) return galleries;
  } catch (err) {
    console.error('[wikidata] strategy 1 failed', err);
  }

  // Strategy 2: Broader search with country fallback
  try {
    const strategy2 = buildCountryQuery(city, country);
    const rows = await sparqlQuery(strategy2);
    return mapRowsToGalleries(rows, city, country);
  } catch (err) {
    console.error('[wikidata] strategy 2 failed', err);
    return [];
  }
}

function buildCityLabelQuery(city: string): string {
  return `
SELECT DISTINCT ?item ?itemLabel ?website ?description ?image WHERE {
  VALUES ?galleryType { wd:Q1007870 wd:Q207694 }
  ?item wdt:P31 ?galleryType .
  ?item wdt:P131*/wdt:P131* ?loc .
  ?loc rdfs:label "${city}"@en .
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item schema:description ?description . FILTER(LANG(?description) = "en") }
  OPTIONAL { ?item wdt:P18 ?image . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,fr,de,es,it" . }
}
LIMIT 25
  `.trim();
}

function buildCountryQuery(city: string, country: string): string {
  // Broader query matching by city name in label
  return `
SELECT DISTINCT ?item ?itemLabel ?website ?description ?image WHERE {
  VALUES ?galleryType { wd:Q1007870 wd:Q207694 }
  ?item wdt:P31 ?galleryType .
  ?item rdfs:label ?label .
  FILTER(CONTAINS(LCASE(STR(?label)), "${city.toLowerCase()}"))
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item schema:description ?description . FILTER(LANG(?description) = "en") }
  OPTIONAL { ?item wdt:P18 ?image . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT 20
  `.trim();
}

function mapRowsToGalleries(rows: Record<string, { value: string }>[], city: string, country: string): Gallery[] {
  const seen = new Set<string>();
  const galleries: Gallery[] = [];

  for (const row of rows) {
    const name = row.itemLabel?.value;
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const website = row.website?.value || '';
    const imageUrl = row.image?.value || '';
    const description = row.description?.value || '';

    // Convert Wikidata image URLs to usable URLs (Commons API)
    let coverImageUrl: string | undefined;
    if (imageUrl) {
      const filename = imageUrl.split('/').pop()!;
      const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
      coverImageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=800`;
    }

    galleries.push({
      id: slugify(city, name),
      name,
      city,
      country,
      website,
      description,
      coverImageUrl,
      source: 'wikidata',
      exhibitions: [],
      scrapedAt: new Date().toISOString(),
    });
  }

  return galleries;
}
