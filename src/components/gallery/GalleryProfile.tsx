import { Gallery } from '@/types/gallery';
import Image from 'next/image';

interface Props {
  gallery: Gallery;
}

export function GalleryProfile({ gallery }: Props) {
  const initials = gallery.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  const totalArtists = gallery.exhibitions.reduce((acc, e) => acc + e.artists.length, 0);
  const totalArtworks = gallery.exhibitions.reduce((acc, e) => acc + e.artworks.length, 0);

  const proxyUrl = gallery.coverImageUrl
    ? `/api/image-proxy?url=${encodeURIComponent(gallery.coverImageUrl)}&w=400`
    : null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-zinc-100">
      {/* Avatar */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-full overflow-hidden bg-zinc-100">
        {proxyUrl ? (
          <Image src={proxyUrl} alt={gallery.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl font-light text-zinc-400">{initials}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 leading-tight">{gallery.name}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{gallery.city}, {gallery.country}</p>
          </div>

          {gallery.website && (
            <a
              href={gallery.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-sm text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
            >
              Visit website
            </a>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-6 mt-3">
          <div className="text-center">
            <span className="block text-base font-semibold text-zinc-900">{gallery.exhibitions.length}</span>
            <span className="text-xs text-zinc-500">exhibitions</span>
          </div>
          {totalArtists > 0 && (
            <div className="text-center">
              <span className="block text-base font-semibold text-zinc-900">{totalArtists}</span>
              <span className="text-xs text-zinc-500">artists</span>
            </div>
          )}
          {totalArtworks > 0 && (
            <div className="text-center">
              <span className="block text-base font-semibold text-zinc-900">{totalArtworks}</span>
              <span className="text-xs text-zinc-500">artworks</span>
            </div>
          )}
        </div>

        {gallery.description && (
          <p className="mt-3 text-sm text-zinc-600 leading-relaxed line-clamp-3">
            {gallery.description}
          </p>
        )}
      </div>
    </div>
  );
}
