'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const router = useRouter();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 backdrop-blur-sm bg-white/90 border-b border-zinc-200">
      <nav className="max-w-6xl mx-auto h-full flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">A</span>
          </div>
          <span className="font-semibold text-zinc-900 text-lg">ArtByCity</span>
        </Link>

        <button
          onClick={() => router.push('/')}
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Explore cities
        </button>
      </nav>
    </header>
  );
}
