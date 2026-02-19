import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import axios from 'axios';

const CACHE_DIR = process.env.CACHE_DIR || '/tmp/artbycity-cache';
const IMAGE_DIR = path.join(CACHE_DIR, 'images');

function ensureImageDir() {
  if (!fs.existsSync(IMAGE_DIR)) {
    fs.mkdirSync(IMAGE_DIR, { recursive: true });
  }
}

export function imageHash(url: string, width = 800): string {
  return crypto.createHash('sha256').update(`${url}:${width}`).digest('hex').slice(0, 32);
}

export function imageCachePath(hash: string): string {
  return path.join(IMAGE_DIR, `${hash}.webp`);
}

export function imageExists(hash: string): boolean {
  return fs.existsSync(imageCachePath(hash));
}

export function readCachedImage(hash: string): Buffer | null {
  try {
    return fs.readFileSync(imageCachePath(hash));
  } catch {
    return null;
  }
}

export function writeCachedImage(hash: string, buffer: Buffer): void {
  ensureImageDir();
  fs.writeFileSync(imageCachePath(hash), buffer);
}

export async function fetchImageBuffer(url: string, referer?: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': referer || new URL(url).origin,
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      maxRedirects: 3,
    });
    return Buffer.from(response.data);
  } catch {
    return null;
  }
}
