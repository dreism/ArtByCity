import { Gallery, Exhibition } from './gallery';

export interface GalleriesResponse {
  city: string;
  country: string;
  galleries: Gallery[];
}

export interface ExhibitionsResponse {
  galleryId: string;
  exhibitions: Exhibition[];
  coverImageUrl?: string;
}
