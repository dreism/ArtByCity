import { NextRequest, NextResponse } from 'next/server';
import { imageHash, imageExists, readCachedImage, writeCachedImage, fetchImageBuffer } from '@/lib/cache/imageCache';

// Placeholder SVG for failed image loads
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#e4e4e7"/>
  <text x="400" y="310" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#a1a1aa">Image unavailable</text>
</svg>`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  const width = parseInt(searchParams.get('w') || '800', 10);

  if (!url) {
    return new NextResponse(PLACEHOLDER_SVG, {
      status: 400,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol');
  } catch {
    return new NextResponse(PLACEHOLDER_SVG, {
      status: 400,
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }

  const hash = imageHash(url, width);

  // Serve from disk cache
  if (imageExists(hash)) {
    const cached = readCachedImage(hash);
    if (cached) {
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  }

  // Fetch from origin
  const rawBuffer = await fetchImageBuffer(url, parsedUrl.origin);
  if (!rawBuffer) {
    return new NextResponse(PLACEHOLDER_SVG, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=300' },
    });
  }

  // Optimize with Sharp
  try {
    const sharp = (await import('sharp')).default;
    const optimized = await sharp(rawBuffer)
      .resize(width, Math.round(width * 0.75), { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    writeCachedImage(hash, optimized);

    return new NextResponse(new Uint8Array(optimized), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    // Sharp failed (e.g. not an image), return raw buffer
    return new NextResponse(new Uint8Array(rawBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
