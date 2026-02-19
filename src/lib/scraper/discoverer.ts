import { Gallery } from '@/types/gallery';
import { searchGalleriesByCity } from '@/lib/wikidata/galleries';
import { scrapeGalleriesNow } from './galleriesNow';
import { bingSearchGalleries } from './bingSearch';

export interface DiscoveryProgress {
  galleries: Gallery[];
  progress: number;
  total: number;
  message: string;
}

export async function discoverGalleries(
  city: string,
  country: string,
  onProgress?: (p: DiscoveryProgress) => void
): Promise<Gallery[]> {
  const allGalleries: Gallery[] = [];
  const seenDomains = new Set<string>();
  const seenNames = new Set<string>();

  function addGalleries(incoming: Gallery[]) {
    for (const g of incoming) {
      const nameKey = g.name.toLowerCase().trim();
      const domainKey = g.website ? extractDomain(g.website) : null;

      if (seenNames.has(nameKey)) continue;
      if (domainKey && seenDomains.has(domainKey)) continue;

      seenNames.add(nameKey);
      if (domainKey) seenDomains.add(domainKey);
      allGalleries.push(g);
    }
  }

  // Tier 1: Wikidata SPARQL
  onProgress?.({ galleries: [], progress: 0, total: 3, message: `Searching Wikidata for galleries in ${city}...` });
  try {
    const wikidataGalleries = await searchGalleriesByCity(city, country);
    addGalleries(wikidataGalleries);
    onProgress?.({ galleries: allGalleries, progress: 1, total: 3, message: `Found ${allGalleries.length} galleries via Wikidata...` });
  } catch (err) {
    console.error('[discoverer] Wikidata failed', err);
  }

  // Tier 2: GalleriesNow.net
  onProgress?.({ galleries: allGalleries, progress: 1, total: 3, message: `Scraping GalleriesNow for ${city} exhibitions...` });
  try {
    const gnGalleries = await scrapeGalleriesNow(city, country);
    addGalleries(gnGalleries);
    onProgress?.({ galleries: allGalleries, progress: 2, total: 3, message: `Found ${allGalleries.length} galleries total...` });
  } catch (err) {
    console.error('[discoverer] GalleriesNow failed', err);
  }

  // Tier 3: Bing fallback if we don't have enough
  if (allGalleries.length < 8) {
    onProgress?.({ galleries: allGalleries, progress: 2, total: 3, message: `Searching web for more ${city} galleries...` });
    try {
      const bingGalleries = await bingSearchGalleries(city, country);
      addGalleries(bingGalleries);
    } catch (err) {
      console.error('[discoverer] Bing search failed', err);
    }
  }

  const final = allGalleries.slice(0, 20);
  onProgress?.({ galleries: final, progress: 3, total: 3, message: `Discovery complete: ${final.length} galleries found` });

  return final;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
