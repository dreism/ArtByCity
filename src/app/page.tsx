import { CitySelector } from '@/components/city/CitySelector';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-900 rounded-2xl mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 tracking-tight">
          Discover local art
        </h1>
        <p className="mt-3 text-zinc-500 text-lg max-w-sm mx-auto">
          Find the top galleries and artists showing in any city, right now.
        </p>
      </div>

      <CitySelector />

      {/* Popular cities */}
      <div className="mt-12 text-center">
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-4">Popular cities</p>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_CITIES.map(({ city, country, code, slug }) => (
            <a
              key={slug}
              href={`/city/${slug}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&code=${code}`}
              className="px-3 py-1.5 text-sm bg-white border border-zinc-200 rounded-full text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors"
            >
              {city}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const POPULAR_CITIES = [
  { city: 'New York', country: 'United States', code: 'US', slug: 'us-new-york' },
  { city: 'London', country: 'United Kingdom', code: 'GB', slug: 'gb-london' },
  { city: 'Paris', country: 'France', code: 'FR', slug: 'fr-paris' },
  { city: 'Berlin', country: 'Germany', code: 'DE', slug: 'de-berlin' },
  { city: 'Tokyo', country: 'Japan', code: 'JP', slug: 'jp-tokyo' },
  { city: 'Los Angeles', country: 'United States', code: 'US', slug: 'us-los-angeles' },
  { city: 'Amsterdam', country: 'Netherlands', code: 'NL', slug: 'nl-amsterdam' },
  { city: 'Milan', country: 'Italy', code: 'IT', slug: 'it-milan' },
];
