// CSS selectors tried in priority order for exhibition sections
export const EXHIBITION_SELECTORS = [
  '[class*="exhibition"]',
  '[class*="current-show"]',
  '[class*="current_show"]',
  '[id*="exhibition"]',
  '[id*="current"]',
  '[class*="upcoming"]',
  '[class*="show"]',
  '[class*="event"]',
  '[class*="program"]',
  'article',
  '.entry',
  '.post',
];

// Selectors for artist names within exhibition blocks
export const ARTIST_SELECTORS = [
  '[class*="artist"]',
  '[class*="artist-name"]',
  '[class*="artistname"]',
  '[class*="performer"]',
  'em',
  'strong',
  'b',
  '[itemprop="name"]',
  'h3',
  'h4',
];

// Selectors for exhibition title
export const TITLE_SELECTORS = [
  '[class*="title"]',
  '[class*="heading"]',
  '[class*="exhibition-name"]',
  '[class*="show-name"]',
  'h1',
  'h2',
  'h3',
];

// Selectors for images within exhibition blocks
export const IMAGE_SELECTORS = [
  'img[src*="upload"]',
  'img[src*="artwork"]',
  'img[src*="exhibition"]',
  'img[src*="gallery"]',
  'img[src*="image"]',
  'figure img',
  '.artwork img',
  '.image img',
  'img:not([src*="logo"]):not([src*="icon"]):not([src*="avatar"]):not([src*="sprite"])',
];

// Regex patterns to extract artist names from text blocks
export const ARTIST_TEXT_PATTERNS = [
  /artists?\s*:\s*([^\n\r\.]{3,200})/i,
  /featuring\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:,\s*(?:and\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)*)/i,
  /with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+(?:,\s*(?:and\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)*)/i,
  /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
];

// Gallery website paths likely to contain exhibition info
export const EXHIBITION_PAGE_PATHS = [
  '/exhibitions',
  '/shows',
  '/current',
  '/programme',
  '/program',
  '/events',
  '/ausstellungen', // German
  '/expositions',   // French
  '/mostre',        // Italian
  '/exposiciones',  // Spanish
];

// Domains to skip when proxying images
export const BLOCKED_IMAGE_DOMAINS = new Set([
  'google.com', 'googleapis.com', 'googletagmanager.com',
  'facebook.com', 'fbcdn.net',
  'twitter.com', 'twimg.com',
  'instagram.com',
  'doubleclick.net', 'adservice.google.com',
]);

export function isLikelyArtworkImage(src: string, alt: string = ''): boolean {
  const lower = src.toLowerCase();
  const altLower = alt.toLowerCase();

  // Skip tiny images, icons, logos
  if (lower.includes('logo') || lower.includes('icon') || lower.includes('avatar')) return false;
  if (lower.includes('sprite') || lower.includes('favicon')) return false;
  if (lower.endsWith('.svg')) return false;

  // Skip tracking pixels
  if (lower.includes('pixel') || lower.includes('track') || lower.includes('beacon')) return false;

  return true;
}
