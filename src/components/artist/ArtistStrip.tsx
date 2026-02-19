import { Artist } from '@/types/gallery';
import { ArtistCard } from './ArtistCard';

interface Props {
  artists: Artist[];
}

export function ArtistStrip({ artists }: Props) {
  if (artists.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
      {artists.map(artist => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}
