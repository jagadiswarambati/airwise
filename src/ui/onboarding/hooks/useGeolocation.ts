import { useState, useCallback, useMemo, useRef } from 'react';
import { announce } from '../../components/liveRegionAnnouncer';

interface UseGeolocationOptions {
  onLocationSuccess: (lat: number, lon: number, label: string) => void;
}

export function useGeolocation({ onLocationSuccess }: UseGeolocationOptions) {
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'denied'>('idle');
  const onLocationSuccessRef = useRef(onLocationSuccess);
  onLocationSuccessRef.current = onLocationSuccess;

  const handleUseLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationStatus('denied');
      setLocationMessage('Geolocation is not supported by your browser.');
      announce('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('idle');
    setLocationMessage('Requesting location permission...');
    announce('Requesting browser location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const roundedLat = Math.round(pos.coords.latitude * 100) / 100;
        const roundedLon = Math.round(pos.coords.longitude * 100) / 100;
        onLocationSuccessRef.current(roundedLat, roundedLon, 'My location');
        setLocationStatus('success');
        setLocationMessage(`Location set to ${roundedLat}, ${roundedLon} (~1.1 km precision).`);
        announce(`Location set to latitude ${roundedLat}, longitude ${roundedLon}.`);
      },
      (err) => {
        setLocationStatus('denied');
        const msg =
          err.code === 1
            ? 'Location access was denied. You can search for your city or enter coordinates manually below.'
            : 'Unable to retrieve location. Please search for your city or enter coordinates manually below.';
        setLocationMessage(msg);
        announce(msg);
      },
      { timeout: 8000 },
    );
  }, []);

  return useMemo(
    () => ({
      handleUseLocation,
      locationMessage,
      locationStatus,
    }),
    [handleUseLocation, locationMessage, locationStatus],
  );
}
