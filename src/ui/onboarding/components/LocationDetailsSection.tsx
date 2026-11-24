import { Field } from '../../primitives/Field';
import { Fieldset } from '../../primitives/Fieldset';

export interface LocationDetailsProps {
  cityLabel: string;
  setCityLabel: (val: string) => void;
  lat: number;
  setLat: (val: number) => void;
  lon: number;
  setLon: (val: number) => void;
  getFieldError: (id: string) => string | undefined;
}

export function LocationDetailsSection({
  cityLabel,
  setCityLabel,
  lat,
  setLat,
  lon,
  setLon,
  getFieldError,
}: LocationDetailsProps) {
  return (
    <Fieldset legend="Selected location details" className="mb-4">
      <Field id="location-label" label="Location name" error={getFieldError('location-label')} required>
        <input
          type="text"
          className="form-input"
          value={cityLabel}
          onChange={(e) => setCityLabel(e.target.value)}
          placeholder="e.g. Hyderabad, India"
          required
        />
      </Field>

      <div className="grid-2-col mt-3">
        <Field id="location-lat" label="Latitude" helperText="-90 to 90" error={getFieldError('location-lat')} required>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            className="form-input"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value))}
            required
          />
        </Field>

        <Field id="location-lon" label="Longitude" helperText="-180 to 180" error={getFieldError('location-lon')} required>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            className="form-input"
            value={lon}
            onChange={(e) => setLon(parseFloat(e.target.value))}
            required
          />
        </Field>
      </div>
    </Fieldset>
  );
}
