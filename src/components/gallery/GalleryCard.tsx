import Link from 'next/link';
import Image from 'next/image';
import { Gallery } from '@/types/gallery';

interface Props {
  gallery: Gallery;
  enriching?: boolean;
}

export function GalleryCard({ gallery, enriching }: Props) {
  const show =
    gallery.exhibitions.find(e => e.status === 'current') ||
    gallery.exhibitions.find(e => e.status === 'upcoming') ||
    gallery.exhibitions[0];

  const coverImage =
    gallery.coverImageUrl || show?.coverImageUrl || show?.artworks[0]?.imageUrl;
  const proxyUrl = coverImage
    ? `/api/image-proxy?url=${encodeURIComponent(coverImage)}&w=600`
    : null;

  const artistNames = show?.artists.map(a => a.name).join(', ');

  const initials = gallery.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  // The detail page is stateless on serverless — everything it needs travels
  // in the link
  const detailParams = new URLSearchParams({
    name: gallery.name,
    city: gallery.city,
    country: gallery.country,
  });
  if (gallery.website) detailParams.set('website', gallery.website);
  if (gallery.coverImageUrl) detailParams.set('img', gallery.coverImageUrl);
  if (gallery.description) detailParams.set('desc', gallery.description.slice(0, 300));

  return (
    <Link href={`/gallery/${gallery.id}?${detailParams}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-zinc-100 hover:shadow-md transition-shadow duration-200">
        {/* Cover image */}
        <div className="aspect-square relative bg-zinc-100 overflow-hidden">
          {proxyUrl ? (
            <Image
              src={proxyUrl}
              alt={gallery.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100">
              <span className="text-3xl font-light text-zinc-400">{initials}</span>
            </div>
          )}

          {gallery.exhibitions.some(e => e.status === 'current') && (
            <div className="absolute top-2 left-2">
              <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                On now
              </span>
            </div>
          )}

          {enriching && (
            <div className="absolute top-2 right-2">
              <span className="block w-2 h-2 rounded-full bg-zinc-900/60 animate-pulse" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-zinc-900 text-sm truncate leading-tight">{gallery.name}</h3>
          <p className="text-zinc-500 text-xs mt-0.5 truncate">
            {gallery.address || gallery.city}
          </p>

          {show ? (
            <div className="mt-2">
              <p className="text-xs text-zinc-700 truncate italic">{show.title}</p>
              {artistNames && (
                <p className="text-xs text-zinc-400 truncate mt-0.5">{artistNames}</p>
              )}
            </div>
          ) : enriching ? (
            <div className="mt-2 space-y-1">
              <div className="h-2.5 bg-zinc-100 rounded animate-pulse w-2/3" />
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
