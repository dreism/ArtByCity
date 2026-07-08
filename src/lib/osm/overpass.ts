import axios from 'axios';
import { Gallery } from '@/types/gallery';
import { slugify } from '@/lib/utils/slugify';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const HEADERS = {
  'User-Agent': 'ArtByCity/2.0 (art gallery discovery app; contact via github)',
  'Accept': 'application/json',
};

export interface GeocodedCity {
  displayName: string;
  areaId?: number;
  bbox?: [number, number, number, number]; // south, west, north, east
}

/** Resolve a city to an Overpass area id (or bounding box fallback) via Nominatim. */
export async function geocodeCity(city: string, country: string): Promise<GeocodedCity | null> {
  const q = country ? `${city}, ${country}` : city;
  const res = await axios.get(NOMINATIM_URL, {
    params: { q, format: 'jsonv2', limit: 1 },
    headers: HEADERS,
    timeout: 8000,
  });

  const hit = Array.isArray(res.data) ? res.data[0] : null;
  if (!hit) return null;

  const result: GeocodedCity = { displayName: hit.display_name || q };

  // Overpass area ids are derived from the OSM element id
  if (hit.osm_type === 'relation') result.areaId = 3600000000 + Number(hit.osm_id);
  else if (hit.osm_type === 'way') result.areaId = 2400000000 + Number(hit.osm_id);

  if (Array.isArray(hit.boundingbox) && hit.boundingbox.length === 4) {
    // Nominatim order: [min lat, max lat, min lon, max lon]
    const [s, n, w, e] = hit.boundingbox.map(Number);
    result.bbox = [s, w, n, e];
  }

  return result;
}

/** Find art galleries in a city via OpenStreetMap's Overpass API. */
export async function searchGalleriesOSM(city: string, country: string): Promise<Gallery[]> {
  const geo = await geocodeCity(city, country);
  if (!geo || (!geo.areaId && !geo.bbox)) {
    console.log('[osm] geocoding failed for', city, country);
    return [];
  }

  const filter = geo.areaId
    ? `(area:${geo.areaId})`
    : `(${geo.bbox!.join(',')})`;

  const query = `
[out:json][timeout:20];
(
  nwr["tourism"="gallery"]${filter};
  nwr["shop"="art"]${filter};
);
out center tags 80;
  `.trim();

  const elements = await runOverpass(query);
  console.log('[osm]', city, '→', elements.length, 'raw elements');
  return mapElements(elements, city, country);
}

async function runOverpass(query: string): Promise<OsmElement[]> {
  let lastError: Error | null = null;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await axios.post(endpoint, `data=${encodeURIComponent(query)}`, {
        headers: { ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 25000,
      });
      return res.data?.elements || [];
    } catch (err) {
      lastError = err as Error;
      console.error('[osm] endpoint failed', endpoint, (err as Error).message);
    }
  }
  throw lastError || new Error('All Overpass endpoints failed');
}

interface OsmElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

// shop=art includes framers and art-supply shops — filter those out
const NON_GALLERY_NAME = /supplies|supply|framing|framer|frames|tattoo|print shop|copy/i;

function mapElements(elements: OsmElement[], city: string, country: string): Gallery[] {
  const galleries: Gallery[] = [];
  const seen = new Set<string>();

  for (const el of elements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:en'];
    if (!name || NON_GALLERY_NAME.test(name)) continue;

    const nameKey = name.toLowerCase().trim();
    if (seen.has(nameKey)) continue;
    seen.add(nameKey);

    const website = normalizeWebsite(
      tags.website || tags['contact:website'] || tags.url || ''
    );

    const addressParts = [
      [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
      tags['addr:suburb'] || tags['addr:city'],
    ].filter(Boolean);

    galleries.push({
      id: slugify(city, name),
      name,
      city,
      country,
      website,
      description: tags.description,
      address: addressParts.join(', ') || undefined,
      source: 'osm',
      exhibitions: [],
      scrapedAt: new Date().toISOString(),
    });
  }

  return galleries;
}

function normalizeWebsite(url: string): string {
  if (!url) return '';
  const trimmed = url.trim().split(/[;\s]/)[0];
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
