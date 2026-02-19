import * as cheerio from 'cheerio';
import { Exhibition, Artist, Artwork } from '@/types/gallery';
import { v4 as uuidv4 } from 'uuid';
import { slugify } from '@/lib/utils/slugify';
import { parseDateRange, parseArtistNames } from './galleriesNow';

export function extractJsonLd(html: string): Exhibition[] {
  const $ = cheerio.load(html);
  const exhibitions: Exhibition[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html() || '';
      const data = JSON.parse(raw);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const type = item['@type'] || '';
        if (
          type === 'ExhibitionEvent' ||
          type === 'Event' ||
          type === 'VisualArtsEvent' ||
          (Array.isArray(type) && type.some((t: string) => ['Event', 'ExhibitionEvent'].includes(t)))
        ) {
          const exhibition = parseJsonLdEvent(item);
          if (exhibition) exhibitions.push(exhibition);
        }

        // Also handle arrays of events in @graph
        const graph = item['@graph'];
        if (Array.isArray(graph)) {
          for (const node of graph) {
            const nodeType = node['@type'] || '';
            if (nodeType === 'Event' || nodeType === 'ExhibitionEvent') {
              const exhibition = parseJsonLdEvent(node);
              if (exhibition) exhibitions.push(exhibition);
            }
          }
        }
      }
    } catch {
      // malformed JSON-LD, skip
    }
  });

  return exhibitions;
}

function parseJsonLdEvent(item: Record<string, unknown>): Exhibition | null {
  const title = (item.name as string) || (item.headline as string) || '';
  if (!title) return null;

  const startDate = item.startDate as string | undefined;
  const endDate = item.endDate as string | undefined;
  const description = (item.description as string) || '';

  const { status } = parseDateRange(`${startDate || ''} – ${endDate || ''}`);

  // Extract artists from performer, contributor, or artist fields
  const performers = item.performer || item.contributor || item.artist || [];
  const performerList = Array.isArray(performers) ? performers : [performers];
  const artists: Artist[] = performerList
    .filter((p: unknown) => p && typeof p === 'object')
    .map((p: Record<string, unknown>) => ({
      id: slugify((p.name as string) || 'unknown'),
      name: (p.name as string) || '',
      bio: (p.description as string) || undefined,
    }))
    .filter(a => a.name);

  // Extract images
  const imageData = item.image || item.thumbnail || item.photo;
  const imageList = Array.isArray(imageData) ? imageData : imageData ? [imageData] : [];
  const artworks: Artwork[] = imageList
    .map((img: unknown) => {
      const url = typeof img === 'string' ? img : (img as Record<string, unknown>)?.url as string;
      if (!url) return null;
      return { id: uuidv4(), imageUrl: url, title };
    })
    .filter(Boolean) as Artwork[];

  return {
    id: uuidv4(),
    title,
    status,
    startDate,
    endDate,
    description,
    artists,
    artworks,
  };
}
