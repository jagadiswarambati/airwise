import React, { useEffect } from 'react';
import { Icon } from '../../icons';
import { useGeolocation } from '../hooks/useGeolocation';
import { PrivacyDisclosure } from '../components/PrivacyDisclosure';
import { CitySearchSection } from '../components/CitySearchSection';
import { LocationDetailsSection } from '../components/LocationDetailsSection';

export interface WhereStepProps {
  h1Ref: React.RefObject<HTMLHeadingElement>;
  cityLabel: string;
  setCityLabel: (val: string) => void;
  lat: number;
  setLat: (val: number) => void;
  lon: number;
  setLon: (val: number) => void;
  setCountry: (val: string) => void;
  onLoadPriya: () => void;
  onCancel?: () => void;
  getFieldError: (id: string) => string | undefined;
}

function DemoHouseholdCallout({ onLoadPriya }: { onLoadPriya: () => void }) {
  return (
    <div className="aw-callout aw-callout-primary mb-4">
      <div className="flex-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-bold">Try a demo household</h2>
          <p className="text-xs text-muted">
            Explore AirWise immediately using a pre-configured multi-generational household facing severe smog.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadPriya}
          className="aw-btn aw-btn-secondary"
          aria-label="Try a demo household: pre-configured 3-member family"
        >
          Try a demo household
        </button>
      </div>
    </div>
  );
}

function LocationButtonSection({
  handleUseLocation,
  locationMessage,
  locationStatus,
}: {
  handleUseLocation: () => void;
  locationMessage: string | null;
  locationStatus: string;
}) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={handleUseLocation}
        className="aw-btn aw-btn-secondary flex-row-center gap-1"
      >
        <Icon name="protect" size={16} aria-hidden="true" />
        <span>Use my location</span>
      </button>
      <p className="text-xs text-muted mt-1">
        Your browser will ask for location permission. Coordinates are rounded to 2 decimal places (~1.1 km) on this device and raw values are never transmitted.
      </p>

      {locationMessage && (
        <p
          role="status"
          className={`text-xs mt-2 ${locationStatus === 'denied' ? 'text-warning' : 'text-emissions font-semibold'}`}
        >
          {locationMessage}
        </p>
      )}
    </div>
  );
}

function PrivacyNoticeAndButtons({ onCancel }: { onCancel?: () => void }) {
  return (
    <>
      <p className="aw-onboarding-privacy-notice text-xs text-muted mb-4">
        Your details stay on this device. By continuing, you agree to our{' '}
        <a href="#/terms" className="aw-inline-link">
          Terms of Use
        </a>{' '}
        and have read our{' '}
        <a href="#/privacy" className="aw-inline-link">
          Privacy Policy
        </a>
        . Learn more{' '}
        <a href="#/about" className="aw-inline-link">
          About AirWise
        </a>
        .
      </p>

      <div className="aw-btn-row">
        {onCancel && (
          <button type="button" onClick={onCancel} className="aw-btn aw-btn-secondary">
            Cancel
          </button>
        )}
        <button type="submit" className="aw-btn aw-btn-primary">
          Continue
        </button>
      </div>
    </>
  );
}

export const WhereStep: React.FC<WhereStepProps> = ({
  h1Ref,
  cityLabel,
  setCityLabel,
  lat,
  setLat,
  lon,
  setLon,
  setCountry,
  onLoadPriya,
  onCancel,
  getFieldError,
}) => {
  const { handleUseLocation, locationMessage, locationStatus } = useGeolocation({
    onLocationSuccess: (newLat, newLon, newLabel) => {
      setLat(newLat);
      setLon(newLon);
      setCityLabel(newLabel);
    },
  });

  // Automatically fetch and populate coordinates if user has already granted geolocation permission
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          if (perm.state === 'granted') {
            handleUseLocation();
          }
        })
        .catch(() => {});
    }
  }, [handleUseLocation]);

  return (
    <div className="card">
      <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
        Where you live
      </h1>
      <p className="text-sm text-muted mb-4">
        Choose your city or enter coordinates. Location coordinates are rounded to ~1.1 km for privacy.
      </p>

      <DemoHouseholdCallout onLoadPriya={onLoadPriya} />

      <CitySearchSection
        onSelectCity={(label, cityLat, cityLon, countryCode) => {
          setCityLabel(label);
          setLat(cityLat);
          setLon(cityLon);
          setCountry(countryCode);
        }}
      />

      <LocationButtonSection
        handleUseLocation={handleUseLocation}
        locationMessage={locationMessage}
        locationStatus={locationStatus}
      />

      <LocationDetailsSection
        cityLabel={cityLabel}
        setCityLabel={setCityLabel}
        lat={lat}
        setLat={setLat}
        lon={lon}
        setLon={setLon}
        getFieldError={getFieldError}
      />

      <PrivacyDisclosure />
      <PrivacyNoticeAndButtons onCancel={onCancel} />
    </div>
  );
};
