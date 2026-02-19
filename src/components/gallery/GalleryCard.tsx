import Link from 'next/link';
import Image from 'next/image';
import { Gallery } from '@/types/gallery';

interface Props {
  gallery: Gallery;
}

export function GalleryCard({ gallery }: Props) {
  const proxyUrl = gallery.coverImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(gallery.coverImageUrl)}&w=600`
    : null;

  const exhibitionCount = gallery.exhibitions.length;
  const artistCount = gallery.exhibitions.reduce((acc, e) => acc + e.artists.length, 0);

  const initials = gallery.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <Link href={`/gallery/${gallery.id}`} className="group block">
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
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100">
              <span className="text-3xl font-light text-zinc-400">{initials}</span>
            </div>
          )}

          {/* Source badge */}
          {gallery.exhibitions.some(e => e.status === 'current') && (
            <div className="absolute top-2 left-2">
              <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                On now
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-zinc-900 text-sm truncate leading-tight">{gallery.name}</h3>
          <p className="text-zinc-500 text-xs mt-0.5 truncate">{gallery.city}</p>

          {exhibitionCount > 0 && (
            <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
              <span>{exhibitionCount} show{exhibitionCount !== 1 ? 's' : ''}</span>
              {artistCount > 0 && <span>{artistCount} artist{artistCount !== 1 ? 's' : ''}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
