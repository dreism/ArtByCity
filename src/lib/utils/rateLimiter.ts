const lastRequestTime: Map<string, number> = new Map();
const MIN_DELAY_MS = 1500;

export async function rateLimitedFetch(domain: string): Promise<void> {
  const last = lastRequestTime.get(domain) || 0;
  const elapsed = Date.now() - last;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(r => setTimeout(r, MIN_DELAY_MS - elapsed + Math.random() * 500));
  }
  lastRequestTime.set(domain, Date.now());
}

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
