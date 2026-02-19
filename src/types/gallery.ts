export interface Artwork {
  id: string;
  title?: string;
  artistName?: string;
  imageUrl: string;
  medium?: string;
  year?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  nationality?: string;
  avatarUrl?: string;
}

export interface Exhibition {
  id: string;
  title: string;
  status: 'current' | 'upcoming' | 'past';
  startDate?: string;
  endDate?: string;
  description?: string;
  artists: Artist[];
  artworks: Artwork[];
  coverImageUrl?: string;
}

export interface Gallery {
  id: string;
  name: string;
  city: string;
  country: string;
  website: string;
  description?: string;
  coverImageUrl?: string;
  address?: string;
  source: 'wikidata' | 'galleriesnow' | 'bing' | 'web';
  exhibitions: Exhibition[];
  scrapedAt: string;
}

export interface CachedCityData {
  galleries: Gallery[];
  fetchedAt: string;
  city: string;
  country: string;
}
