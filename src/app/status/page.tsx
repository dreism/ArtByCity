import { geocodeCity, searchGalleriesOSM } from '@/lib/osm/overpass';
import { resolveCityQid, searchGalleriesByCity } from '@/lib/wikidata/galleries';
import { scrapeGalleriesNow } from '@/lib/scraper/galleriesNow';
import { scrapeGalleryExhibitions } from '@/lib/scraper/exhibitionScraper';
import { fetchImageBuffer } from '@/lib/cache/imageCache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface CheckResult {
  name: string;
  ok: boolean;
  ms: number;
  detail: string;
}

async function runCheck(name: string, fn: () => Promise<string>): Promise<CheckResult> {
  const start = Date.now();
  try {
    const detail = await fn();
    return { name, ok: true, ms: Date.now() - start, detail };
  } catch (err) {
    return { name, ok: false, ms: Date.now() - start, detail: (err as Error).message };
  }
}

export default async function StatusPage() {
  const checks = await Promise.all([
    runCheck('Nominatim geocoding (Sydney)', async () => {
      const geo = await geocodeCity('Sydney', 'Australia');
      if (!geo) throw new Error('no result');
      return `${geo.displayName.slice(0, 60)} — areaId: ${geo.areaId ?? 'none (bbox fallback)'}`;
    }),

    runCheck('OSM Overpass galleries (Sydney)', async () => {
      const galleries = await searchGalleriesOSM('Sydney', 'Australia');
      if (galleries.length === 0) throw new Error('0 galleries returned');
      const stanley = galleries.find(g => /stanley/i.test(g.name));
      const sample = galleries.slice(0, 6).map(g => g.name).join(' · ');
      return `${galleries.length} galleries. Stanley Street Gallery: ${stanley ? 'FOUND ✓' : 'not found'}. Sample: ${sample}`;
    }),

    runCheck('Wikidata city resolution (Berlin)', async () => {
      const qid = await resolveCityQid('Berlin', 'Germany');
      if (!qid) throw new Error('no QID');
      return `Berlin → ${qid} (expected Q64)`;
    }),

    runCheck('Wikidata SPARQL galleries (Berlin)', async () => {
      const galleries = await searchGalleriesByCity('Berlin', 'Germany');
      if (galleries.length === 0) throw new Error('0 galleries returned');
      const withImages = galleries.filter(g => g.coverImageUrl).length;
      return `${galleries.length} galleries (${withImages} with images). Top: ${galleries.slice(0, 4).map(g => g.name).join(' · ')}`;
    }),

    runCheck('GalleriesNow scrape (London)', async () => {
      const galleries = await scrapeGalleriesNow('London', 'United Kingdom');
      return `${galleries.length} galleries${galleries[0] ? `. First: ${galleries[0].name}` : ' (0 is tolerable — supplemental source)'}`;
    }),

    runCheck('Sample gallery site scrape (David Zwirner)', async () => {
      const exhibitions = await scrapeGalleryExhibitions('https://www.davidzwirner.com');
      const artists = exhibitions.reduce((n, e) => n + e.artists.length, 0);
      const artworks = exhibitions.reduce((n, e) => n + e.artworks.length, 0);
      return `${exhibitions.length} exhibitions, ${artists} artists, ${artworks} artwork images`;
    }),

    runCheck('Wikimedia Commons image fetch', async () => {
      const buf = await fetchImageBuffer(
        'https://commons.wikimedia.org/wiki/Special:FilePath/Museum_Island_Berlin_July_2009.jpg?width=200'
      );
      if (!buf || buf.length < 1000) throw new Error(`only ${buf?.length ?? 0} bytes`);
      return `${(buf.length / 1024).toFixed(0)} KB fetched`;
    }),
  ]);

  const passed = checks.filter(c => c.ok).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">System status</h1>
      <p className="text-zinc-500 text-sm mt-1">
        Live checks run from the server against every data source. {passed}/{checks.length} passing
        · {new Date().toISOString()}
      </p>

      <div className="mt-6 space-y-3">
        {checks.map(check => (
          <div
            key={check.name}
            className={`border rounded-xl p-4 ${check.ok ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-sm text-zinc-900">
                {check.ok ? '✅' : '❌'} {check.name}
              </span>
              <span className="text-xs text-zinc-400 flex-shrink-0">{check.ms}ms</span>
            </div>
            <p className="text-xs text-zinc-600 mt-1.5 break-words">{check.detail}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-400 mt-6">
        Refresh to re-run. GalleriesNow and the sample scrape are best-effort — the app degrades
        gracefully when they fail. The first four checks must pass.
      </p>
    </div>
  );
}
