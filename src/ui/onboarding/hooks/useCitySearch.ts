import { useState, useEffect, useMemo } from 'react';
import citiesData from '../../../data/samples/cities.json';
import { searchCities, type GeocodeResult } from '../../../data/providers/geocodeClient';
import { announce } from '../../components/liveRegionAnnouncer';

export function useCitySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(q, 5);
        setSearchResults(results);
        if (results.length > 0) {
          announce(`${results.length} cities found for "${q}".`);
        } else {
          announce(`No cities found for "${q}".`);
        }
      } catch {
        // Offline fallback to bundled cities
        const localMatches = citiesData
          .filter(
            (c) =>
              c.name.toLowerCase().includes(q.toLowerCase()) ||
              c.country.toLowerCase().includes(q.toLowerCase()),
          )
          .slice(0, 5)
          .map((c) => ({
            name: c.name,
            adminRegion: '',
            countryCode: c.country,
            lat: c.lat,
            lon: c.lon,
          }));
        setSearchResults(localMatches);
        if (localMatches.length > 0) {
          announce(`${localMatches.length} cities found offline for "${q}".`);
        } else {
          announce(`No cities found offline for "${q}".`);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      searchResults,
      setSearchResults,
      isSearching,
    }),
    [searchQuery, searchResults, isSearching],
  );
}
