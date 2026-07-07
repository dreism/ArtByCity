'use client';

import { useEffect, useState, useCallback } from 'react';
import { Gallery } from '@/types/gallery';

interface Props {
  city: string;
  country: string;
  countryCode: string;
  onGalleries: (galleries: Gallery[]) => void;
}

export function DiscoveryStatus({ city, country, countryCode, onGalleries }: Props) {
  const [discovering, setDiscovering] = useState(true);
  const [message, setMessage] = useState(`Searching for galleries in ${city}...`);
  const [error, setError] = useState<string | null>(null);

  const startDiscovery = useCallback(async () => {
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, country, countryCode }),
      });
      const data = await res.json();

      if (data.status === 'cached' && data.galleries) {
        onGalleries(data.galleries);
      } else if (data.error) {
        setError(data.error);
      } else {
        setError('Discovery failed');
      }
    } catch {
      setError('Failed to start gallery discovery');
    } finally {
      setDiscovering(false);
    }
  }, [city, country, countryCode, onGalleries]);

  useEffect(() => {
    startDiscovery();
  }, [startDiscovery]);

  if (error) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 max-w-sm">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!discovering) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-zinc-200 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 max-w-sm w-full">
      <div className="relative w-5 h-5 flex-shrink-0">
        <svg className="animate-spin w-5 h-5 text-zinc-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-700 truncate">{message}</p>
        <div className="mt-1 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div className="h-full bg-zinc-900 rounded-full animate-pulse" style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  );
}
