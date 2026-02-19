'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES, Country } from '@/lib/utils/countries';
import { cityKey } from '@/lib/utils/slugify';

export function CitySelector() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredCities = useMemo(() => {
    if (!selectedCountry) return [];
    if (!citySearch) return selectedCountry.cities;
    return selectedCountry.cities.filter(c =>
      c.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [selectedCountry, citySearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCountry || !selectedCity) return;
    setLoading(true);
    const slug = cityKey(selectedCountry.code, selectedCity);
    router.push(`/city/${slug}?city=${encodeURIComponent(selectedCity)}&country=${encodeURIComponent(selectedCountry.name)}&code=${selectedCountry.code}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-3">
      {/* Country selector */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Country</label>
        <select
          className="w-full px-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          value={selectedCountry?.code || ''}
          onChange={(e) => {
            const country = COUNTRIES.find(c => c.code === e.target.value) || null;
            setSelectedCountry(country);
            setSelectedCity('');
            setCitySearch('');
          }}
        >
          <option value="">Select a country...</option>
          {COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* City selector */}
      {selectedCountry && (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">City</label>
          <input
            type="text"
            placeholder="Search cities..."
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setSelectedCity('');
            }}
            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 mb-2 text-sm"
          />
          <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
            {filteredCities.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setSelectedCity(city);
                  setCitySearch(city);
                }}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors ${selectedCity === city ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'text-zinc-900'}`}
              >
                {city}
              </button>
            ))}
            {filteredCities.length === 0 && (
              <div className="px-3 py-2.5 text-sm text-zinc-400">No cities found</div>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedCountry || !selectedCity || loading}
        className="w-full py-3 bg-zinc-900 text-white font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Loading...' : 'Discover galleries'}
      </button>
    </form>
  );
}
