import { Artist } from '@/types/gallery';
import Image from 'next/image';

interface Props {
  artist: Artist;
}

export function ArtistCard({ artist }: Props) {
  const initials = artist.name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  const avatarUrl = artist.avatarUrl
    ? `/api/image-proxy?url=${encodeURIComponent(artist.avatarUrl)}&w=200`
    : null;

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[72px]">
      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0 ring-2 ring-zinc-200">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={artist.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-base font-light text-zinc-400">{initials}</span>
          </div>
        )}
      </div>
      <span className="text-xs text-zinc-700 text-center leading-tight max-w-[80px] line-clamp-2">
        {artist.name}
      </span>
    </div>
  );
}
