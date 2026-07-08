import { Gallery } from '@/types/gallery';
import { searchGalleriesByCity } from '@/lib/wikidata/galleries';
import { searchGalleriesOSM } from '@/lib/osm/overpass';
import { scrapeGalleriesNow } from './galleriesNow';
import { duckduckgoSearchGalleries } from './duckduckgo';

/**
 * Discover the top ~20 galleries in a city. All sources run in parallel and
 * every source is allowed to fail — wall time is bounded by the slowest
 * individual source timeout (~25s), well inside the 60s function limit.
 *
 * Sources: OSM Overpass (coverage incl. small commercial galleries),
 * Wikidata (notability ranking + photos), GalleriesNow (exhibitions for major
 * art cities), DuckDuckGo (last resort when a city comes back nearly empty).
 */
export async function discoverGalleries(city: string, country: string): Promise<Gallery[]> {
  const [osm, wikidata, galleriesNow, ddg] = await Promise.allSettled([
    searchGalleriesOSM(city, country),
    searchGalleriesByCity(city, country),
    scrapeGalleriesNow(city, country),
    duckduckgoSearchGalleries(city, country),
  ]);

  const merged = new Merger();
  // Order matters: earlier sources win field conflicts. Wikidata first for
  // clean names/photos, GalleriesNow next for exhibitions, OSM for bulk
  // coverage, DuckDuckGo last — it catches live-web galleries missing from
  // all structured sources.
  merged.add(settled(wikidata, 'wikidata'));
  merged.add(settled(galleriesNow, 'galleriesnow'));
  merged.add(settled(osm, 'osm'));
  merged.add(settled(ddg, 'duckduckgo'));

  const ranked = merged.list().sort((a, b) => score(b) - score(a)).slice(0, 20);
  console.log('[discoverer]', city, '→', ranked.length, 'galleries',
    `(wikidata:${count(wikidata)} gn:${count(galleriesNow)} osm:${count(osm)} ddg:${count(ddg)})`);
  return ranked;
}

function score(g: Gallery): number {
  return (
    (g.sitelinks ?? 0) * 10 +
    (g.website ? 5 : 0) +
    (g.exhibitions.length > 0 ? 8 : 0) +
    (g.coverImageUrl ? 2 : 0)
  );
}

function settled(result: PromiseSettledResult<Gallery[]>, label: string): Gallery[] {
  if (result.status === 'fulfilled') return result.value;
  console.error(`[discoverer] ${label} failed:`, result.reason?.message || result.reason);
  return [];
}

function count(result: PromiseSettledResult<Gallery[]>): number {
  return result.status === 'fulfilled' ? result.value.length : -1;
}

/** Dedupes by normalized name and website domain, merging fields on match. */
class Merger {
  private galleries: Gallery[] = [];
  private byName = new Map<string, Gallery>();
  private byDomain = new Map<string, Gallery>();

  get size() {
    return this.galleries.length;
  }

  list(): Gallery[] {
    return this.galleries;
  }

  add(incoming: Gallery[]) {
    for (const g of incoming) {
      const nameKey = normalizeName(g.name);
      const domainKey = extractDomain(g.website);

      const existing = this.byName.get(nameKey) || (domainKey ? this.byDomain.get(domainKey) : undefined);
      if (existing) {
        mergeInto(existing, g);
        if (domainKey && !this.byDomain.has(domainKey)) this.byDomain.set(domainKey, existing);
        this.byName.set(nameKey, existing);
        continue;
      }

      this.galleries.push(g);
      this.byName.set(nameKey, g);
      if (domainKey) this.byDomain.set(domainKey, g);
    }
  }
}

function mergeInto(target: Gallery, extra: Gallery) {
  if (!target.website && extra.website) target.website = extra.website;
  if (!target.coverImageUrl && extra.coverImageUrl) target.coverImageUrl = extra.coverImageUrl;
  if (!target.description && extra.description) target.description = extra.description;
  if (!target.address && extra.address) target.address = extra.address;
  if ((target.sitelinks ?? 0) < (extra.sitelinks ?? 0)) target.sitelinks = extra.sitelinks;
  if (target.exhibitions.length === 0 && extra.exhibitions.length > 0) {
    target.exhibitions = extra.exhibitions;
  }
}

function normalizeName(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const stripped = base
    .replace(/\b(the|art|gallery|galerie|museum)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
  // Names made up entirely of stopwords ("The Art Gallery") would all collapse
  // to the same empty key \u2014 fall back to the unstripped form
  return stripped || base.replace(/[^a-z0-9]/g, '');
}

function extractDomain(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
