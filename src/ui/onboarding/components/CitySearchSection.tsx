import { PRESET_CITIES } from '../options';
import { useCitySearch } from '../hooks/useCitySearch';
import { Field } from '../../primitives/Field';
import { announce } from '../../components/liveRegionAnnouncer';

export interface CitySearchSectionProps {
  onSelectCity: (label: string, lat: number, lon: number, country: string) => void;
}

export function CitySearchSection({ onSelectCity }: CitySearchSectionProps) {
  const { searchQuery, setSearchQuery, searchResults, setSearchResults, isSearching } = useCitySearch();

  return (
    <div className="mb-4">
      <Field
        id="city-search-input"
        label="Search city or town"
        helperText="Search for any city worldwide, or pick from common presets below"
      >
        <input
          type="text"
          className="form-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="e.g. Hyderabad, Delhi, London..."
          autoComplete="off"
        />
      </Field>

      {isSearching && (
        <p className="text-xs text-muted mt-1" role="status">
          Searching cities...
        </p>
      )}

      {searchResults.length > 0 && (
        <div className="aw-city-results-list mt-2 mb-3" role="region" aria-label="City search results">
          {searchResults.map((r, i) => (
            <button
              key={`${r.name}-${r.lat}-${i}`}
              type="button"
              className="aw-city-result-btn"
              onClick={() => {
                onSelectCity(`${r.name}, ${r.countryCode}`, Math.round(r.lat * 100) / 100, Math.round(r.lon * 100) / 100, r.countryCode);
                setSearchResults([]);
                setSearchQuery('');
                announce(`Selected ${r.name}, ${r.countryCode}`);
              }}
            >
              <span className="font-semibold">{r.name}</span>
              {r.adminRegion && <span className="text-muted text-xs">, {r.adminRegion}</span>}
              <span className="text-muted text-xs"> ({r.countryCode})</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-3">
        <span className="text-xs text-muted block mb-1">Common cities:</span>
        <div className="city-presets-row flex-wrap gap-2">
          {PRESET_CITIES.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => onSelectCity(`${city.name}, ${city.country}`, city.lat, city.lon, city.country)}
              className="tag tag-cost cursor-pointer"
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
