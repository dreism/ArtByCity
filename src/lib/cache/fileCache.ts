import fs from 'fs';
import path from 'path';

const CACHE_DIR = process.env.CACHE_DIR || '/tmp/artbycity-cache';

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cachePath(key: string): string {
  // key like "cities/us-new-york/galleries" → "cities/us-new-york/galleries.json"
  return path.join(CACHE_DIR, `${key}.json`);
}

export function readCache<T>(key: string): T | null {
  try {
    const p = cachePath(key);
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  try {
    const p = cachePath(key);
    ensureDir(path.dirname(p));
    fs.writeFileSync(p, JSON.stringify(data), 'utf-8');
  } catch (err) {
    console.error('[cache] write error', key, err);
  }
}

export function isCacheValid(key: string, ttlMs: number): boolean {
  try {
    const p = cachePath(key);
    if (!fs.existsSync(p)) return false;
    const stat = fs.statSync(p);
    return Date.now() - stat.mtimeMs < ttlMs;
  } catch {
    return false;
  }
}

export function deleteCache(key: string): void {
  try {
    const p = cachePath(key);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch { /* ignore */ }
}

export const TTL = {
  GALLERIES: 24 * 60 * 60 * 1000,       // 24h
  EXHIBITIONS: 6 * 60 * 60 * 1000,       // 6h
  IMAGES: 7 * 24 * 60 * 60 * 1000,      // 7d
  JOBS: 60 * 60 * 1000,                   // 1h
};
