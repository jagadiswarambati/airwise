import React, { useState, useEffect, useRef } from 'react';
import {
  AgeGroup,
  BudgetTier,
  CookingFuel,
  Flag,
  HomeHeating,
  HouseholdProfile,
  HouseholdProfileSchema,
  HousingType,
  Member,
  Mode,
  Tenure,
  roleLabelFor,
} from '../../domain/types';
import citiesData from '../../data/samples/cities.json';
import { searchCities, GeocodeResult } from '../../data/providers/geocodeClient';
import { announce } from '../components/liveRegionAnnouncer';
import { Field } from '../primitives/Field';
import { Fieldset } from '../primitives/Fieldset';
import { ErrorSummary, ErrorItem } from '../primitives/ErrorSummary';
import { Stepper } from '../primitives/Stepper';
import { Disclosure } from '../primitives/Disclosure';
import { Icon } from '../icons';

export interface OnboardingFlowProps {
  initialProfile?: HouseholdProfile | null;
  onComplete: (profile: HouseholdProfile) => void;
  onLoadPriya: () => void;
  onCancel?: () => void;
}

const STEP_TITLES = [
  'Where you live',
  'Who lives here',
  'Home & equipment',
  'Commute & travel',
  'Daily routine',
];

const PRESET_CITIES = [
  { name: 'Hyderabad', country: 'IN', lat: 17.38, lon: 78.48 },
  { name: 'Delhi', country: 'IN', lat: 28.61, lon: 77.23 },
  { name: 'Mumbai', country: 'IN', lat: 19.07, lon: 72.87 },
  { name: 'Bengaluru', country: 'IN', lat: 12.97, lon: 77.59 },
  { name: 'Kolkata', country: 'IN', lat: 22.57, lon: 88.36 },
  { name: 'Chennai', country: 'IN', lat: 13.08, lon: 80.27 },
];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialProfile,
  onComplete,
  onLoadPriya,
  onCancel,
}) => {
  const [step, setStep] = useState<number>(1);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const h1Ref = useRef<HTMLHeadingElement>(null);

  // Focus h1 and announce on step change
  useEffect(() => {
    h1Ref.current?.focus();
    announce(`Step ${step} of 5: ${STEP_TITLES[step - 1]}`);
    setErrors([]);
  }, [step]);

  // Step 1: Location & Geocoding
  const [cityLabel, setCityLabel] = useState(initialProfile?.location.label || 'Hyderabad, India');
  const [lat, setLat] = useState<number>(initialProfile?.location.lat || 17.38);
  const [lon, setLon] = useState<number>(initialProfile?.location.lon || 78.48);
  const [country, setCountry] = useState<string>(initialProfile?.location.country || 'IN');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'denied'>('idle');

  // Debounced geocoding search (300ms)
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

  // One-shot location rounded to 2 decimal places (~1.1 km)
  const handleUseLocation = () => {
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
        setLat(roundedLat);
        setLon(roundedLon);
        setCityLabel('My location');
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
  };

  // Step 2: Household Members
  const [members, setMembers] = useState<Member[]>(
    initialProfile?.members || [
      {
        id: '1',
        roleLabel: roleLabelFor({ ageGroup: '18-64' }),
        ageGroup: '18-64',
        flags: [],
      },
    ],
  );

  const addMember = () => {
    const nextId = (members.length + 1).toString();
    const newMember: Member = {
      id: nextId,
      roleLabel: roleLabelFor({ ageGroup: '18-64' }),
      ageGroup: '18-64',
      flags: [],
    };
    setMembers([...members, newMember]);
    announce(`Added family member ${members.length + 1}.`);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates };
        if (updates.ageGroup) {
          updated.roleLabel = roleLabelFor({ ageGroup: updates.ageGroup });
        }
        return updated;
      }),
    );
  };

  const removeMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter((m) => m.id !== id));
    announce('Removed member.');
  };

  const toggleFlag = (memberId: string, flag: Flag) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const newFlags = target.flags.includes(flag)
      ? target.flags.filter((f) => f !== flag)
      : [...target.flags, flag];
    updateMember(memberId, { flags: newFlags });
  };

  // Step 3: Home & Equipment
  const [tenure, setTenure] = useState<Tenure>(initialProfile?.housing.tenure || 'rent');
  const [housingType, setHousingType] = useState<HousingType>(
    initialProfile?.housing.type || 'apartment',
  );
  const [fuel, setFuel] = useState<CookingFuel>(initialProfile?.cooking.fuel || 'lpg');
  const [hasExhaust, setHasExhaust] = useState<boolean>(
    initialProfile?.cooking.hasExhaust ?? false,
  );
  const [homeHeating, setHomeHeating] = useState<HomeHeating>(
    initialProfile?.homeHeating || 'none',
  );
  const [hasPurifier, setHasPurifier] = useState<boolean>(
    initialProfile?.equipment.purifier ?? false,
  );
  const [hasWindowAC, setHasWindowAC] = useState<boolean>(
    initialProfile?.equipment.windowAC ?? true,
  );
  const [hasHvac, setHasHvac] = useState<boolean>(initialProfile?.equipment.hvac ?? false);
  const [budget, setBudget] = useState<BudgetTier>(initialProfile?.budget || 'low');

  // Step 4: Travel & Commute
  const [modes, setModes] = useState<Mode[]>(initialProfile?.travel.modes || ['two_wheeler']);
  const [oneWayKm, setOneWayKm] = useState<number>(initialProfile?.travel.oneWayKm || 12);
  const [tripsPerWeek, setTripsPerWeek] = useState<number>(
    initialProfile?.travel.tripsPerWeek || 5,
  );
  const [transitAvailable, setTransitAvailable] = useState<boolean | 'unknown'>(
    initialProfile?.travel.transitAvailable ?? true,
  );
  const [canShiftTime, setCanShiftTime] = useState<boolean>(
    initialProfile?.travel.canShiftTime ?? false,
  );
  const [canWorkRemotely, setCanWorkRemotely] = useState<boolean>(
    initialProfile?.travel.canWorkRemotely ?? false,
  );
  const [outdoorWorker, setOutdoorWorker] = useState<boolean>(
    initialProfile?.travel.outdoorWorker ?? false,
  );

  const toggleMode = (mode: Mode) => {
    setModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  };

  // Step 5: Routine
  const [wake, setWake] = useState(initialProfile?.routine.wake || '06:00');
  const [leave, setLeave] = useState(initialProfile?.routine.leave || '07:30');
  const [returnHome, setReturnHome] = useState(initialProfile?.routine.returnHome || '17:30');
  const [bed, setBed] = useState(initialProfile?.routine.bed || '22:00');

  // Step validation handlers
  const validateStep1 = (): boolean => {
    const errs: ErrorItem[] = [];
    if (!cityLabel.trim()) {
      errs.push({ fieldId: 'location-label', message: 'Please enter a location name or select a city.' });
    }
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errs.push({ fieldId: 'location-lat', message: 'Latitude must be a valid number between -90 and 90.' });
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errs.push({ fieldId: 'location-lon', message: 'Longitude must be a valid number between -180 and 180.' });
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: ErrorItem[] = [];
    if (members.length === 0) {
      errs.push({ fieldId: 'members-list', message: 'At least one household member is required.' });
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const validateStep3 = (): boolean => {
    setErrors([]);
    return true;
  };

  const validateStep4 = (): boolean => {
    const errs: ErrorItem[] = [];
    if (modes.length === 0) {
      errs.push({ fieldId: 'commute-modes', message: 'Please select at least one commute mode.' });
    }
    if (isNaN(oneWayKm) || oneWayKm < 0) {
      errs.push({ fieldId: 'travel-distance', message: 'Commute distance must be 0 km or greater.' });
    }
    if (isNaN(tripsPerWeek) || tripsPerWeek < 0) {
      errs.push({ fieldId: 'travel-trips', message: 'Trips per week must be 0 or greater.' });
    }
    setErrors(errs);
    return errs.length === 0;
  };

  const validateStep5 = (): boolean => {
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
    const errs: ErrorItem[] = [];

    if (!timeRegex.test(wake)) {
      errs.push({ fieldId: 'routine-wake', message: 'Wake time must be in HH:MM 24-hour format.' });
    }
    if (!timeRegex.test(leave)) {
      errs.push({ fieldId: 'routine-leave', message: 'Departure time must be in HH:MM 24-hour format.' });
    }
    if (!timeRegex.test(returnHome)) {
      errs.push({ fieldId: 'routine-return', message: 'Return time must be in HH:MM 24-hour format.' });
    }
    if (!timeRegex.test(bed)) {
      errs.push({ fieldId: 'routine-bed', message: 'Bedtime must be in HH:MM 24-hour format.' });
    }

    setErrors(errs);
    return errs.length === 0;
  };

  const handleStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      if (validateStep2()) setStep(3);
    } else if (step === 3) {
      if (validateStep3()) setStep(4);
    } else if (step === 4) {
      if (validateStep4()) setStep(5);
    } else if (step === 5) {
      if (!validateStep5()) return;

      const rawProfile: HouseholdProfile = {
        schemaVersion: 1,
        location: {
          lat: Math.round(lat * 100) / 100,
          lon: Math.round(lon * 100) / 100,
          label: cityLabel.trim(),
          country: country || (cityLabel.includes('India') ? 'IN' : 'US'),
        },
        members,
        housing: { tenure, type: housingType },
        cooking: { fuel, hasExhaust },
        homeHeating,
        equipment: { purifier: hasPurifier, windowAC: hasWindowAC, hvac: hasHvac },
        budget,
        travel: {
          modes,
          oneWayKm,
          tripsPerWeek,
          transitAvailable,
          canShiftTime,
          canWorkRemotely,
          outdoorWorker,
        },
        routine: {
          wake,
          leave,
          returnHome,
          cooking: ['07:00', '19:30'],
          bed,
        },
      };

      const parsed = HouseholdProfileSchema.safeParse(rawProfile);
      if (!parsed.success) {
        const schemaErrors = parsed.error.issues.map((issue) => ({
          fieldId: issue.path.join('-') || 'form',
          message: issue.message,
        }));
        setErrors(schemaErrors);
        return;
      }

      onComplete(parsed.data);
    }
  };

  const getFieldError = (id: string): string | undefined => {
    return errors.find((e) => e.fieldId === id)?.message;
  };

  return (
    <div className="aw-onboarding-wrapper">
      <div className="aw-onboarding-container">
        {/* Stepper Header */}
        <Stepper
          currentStep={step}
          totalSteps={5}
          stepTitle={STEP_TITLES[step - 1]}
          className="mb-4"
        />

        <form onSubmit={handleStepSubmit} noValidate className="aw-onboarding-form">
          {/* Error Summary takes focus on submit errors */}
          <ErrorSummary errors={errors} />

          {/* STEP 1: Where you live & Privacy */}
          {step === 1 && (
            <div className="card">
              <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
                Where you live
              </h1>
              <p className="text-sm text-muted mb-4">
                Choose your city or enter coordinates. Location coordinates are rounded to ~1.1 km
                for privacy.
              </p>

              {/* Demo Household Shortcut Button */}
              <div className="card card-callout-primary mb-4">
                <div className="flex-between flex-wrap gap-2">
                  <div>
                    <h2 className="text-sm font-bold">Try a demo household</h2>
                    <p className="text-xs text-muted">
                      Explore AirWise immediately using a pre-configured multi-generational
                      household facing severe smog.
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

              {/* City Search via R1 Geocode Client */}
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

                {/* Search Results List */}
                {searchResults.length > 0 && (
                  <div
                    className="aw-city-results-list mt-2 mb-3"
                    role="region"
                    aria-label="City search results"
                  >
                    {searchResults.map((r, i) => (
                      <button
                        key={`${r.name}-${r.lat}-${i}`}
                        type="button"
                        className="aw-city-result-btn"
                        onClick={() => {
                          setCityLabel(`${r.name}, ${r.countryCode}`);
                          setLat(Math.round(r.lat * 100) / 100);
                          setLon(Math.round(r.lon * 100) / 100);
                          setCountry(r.countryCode);
                          setSearchResults([]);
                          setSearchQuery('');
                          announce(`Selected ${r.name}, ${r.countryCode}`);
                        }}
                      >
                        <span className="font-semibold">{r.name}</span>
                        {r.adminRegion && (
                          <span className="text-muted text-xs">, {r.adminRegion}</span>
                        )}
                        <span className="text-muted text-xs"> ({r.countryCode})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Common Presets Row */}
                <div className="mt-3">
                  <span className="text-xs text-muted block mb-1">Common cities:</span>
                  <div className="city-presets-row flex-wrap gap-2">
                    {PRESET_CITIES.map((city) => (
                      <button
                        key={city.name}
                        type="button"
                        onClick={() => {
                          setCityLabel(`${city.name}, ${city.country}`);
                          setLat(city.lat);
                          setLon(city.lon);
                          setCountry(city.country);
                        }}
                        className="tag tag-cost cursor-pointer"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Use My Location One-Shot */}
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
                  Your browser will ask for location permission. Coordinates are rounded to 2
                  decimal places (~1.1 km) on this device and raw values are never transmitted.
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

              {/* Selected Location / Manual Entry */}
              <Fieldset legend="Selected location details" className="mb-4">
                <Field
                  id="location-label"
                  label="Location name"
                  error={getFieldError('location-label')}
                  required
                >
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
                  <Field
                    id="location-lat"
                    label="Latitude"
                    helperText="-90 to 90"
                    error={getFieldError('location-lat')}
                    required
                  >
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

                  <Field
                    id="location-lon"
                    label="Longitude"
                    helperText="-180 to 180"
                    error={getFieldError('location-lon')}
                    required
                  >
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

              {/* Privacy Disclosure & Consent Line */}
              <Disclosure title="Privacy & data protection" className="mb-4">
                <div className="text-xs text-muted">
                  <p className="mb-2">
                    <strong>Stays on this device: </strong>
                    Your household profile is stored strictly in your browser's local storage.
                    AirWise has no accounts, no cloud database, and no tracking scripts.
                  </p>
                  <p className="mb-2">
                    <strong>What is sent: </strong>
                    Coarse coordinates (~1 km resolution) are sent to Open-Meteo to retrieve hourly
                    air quality forecasts. City search queries are sent to <code>/api/geocode</code>.
                  </p>
                  <p className="mb-2">
                    <strong>AI advice generation: </strong>
                    Optional AI plan personalization only sends non-identifying household
                    attributes (such as age bands and heating fuel); no personal names or exact
                    dates are ever sent.
                  </p>
                  <p className="mb-2">
                    <strong>How to delete: </strong>
                    You can permanently remove all stored profile data at any time from Settings or
                    by clearing your browser site data.
                  </p>
                  <div className="flex-row-center gap-3 mt-2 font-semibold">
                    <a href="#/privacy" className="aw-inline-link">
                      Privacy Policy
                    </a>
                    <span>·</span>
                    <a href="#/terms" className="aw-inline-link">
                      Terms of Use
                    </a>
                    <span>·</span>
                    <a href="#/about" className="aw-inline-link">
                      About AirWise
                    </a>
                  </div>
                </div>
              </Disclosure>

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

              {/* Button Row */}
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
            </div>
          )}

          {/* STEP 2: Who lives here */}
          {step === 2 && (
            <div className="card">
              <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
                Who lives here
              </h1>
              <p className="text-sm text-muted mb-4">
                We ask for age groups and respiratory sensitivities only. No personal names or exact
                dates of birth are ever recorded.
              </p>

              <div id="members-list" className="members-stack mb-4">
                {members.map((m, idx) => (
                  <Fieldset
                    key={m.id}
                    legend={`Member ${idx + 1}: ${m.roleLabel}`}
                    className="card mb-3"
                  >
                    <div className="flex-between mb-3">
                      <span className="text-sm font-semibold text-accent">{m.roleLabel}</span>
                      {members.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          className="member-remove-btn"
                          aria-label={`Remove Member ${idx + 1}`}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <Field
                      id={`member-${m.id}-age`}
                      label="Age group"
                      helperText="Used to evaluate sensitivity guidelines"
                    >
                      <select
                        value={m.ageGroup}
                        onChange={(e) =>
                          updateMember(m.id, { ageGroup: e.target.value as AgeGroup })
                        }
                        className="form-select"
                      >
                        <option value="u5">Under 5 years (Infant / toddler)</option>
                        <option value="5-12">5–12 years (Child)</option>
                        <option value="13-17">13–17 years (Teen)</option>
                        <option value="18-64">18–64 years (Adult)</option>
                        <option value="65+">65+ years (Senior)</option>
                      </select>
                    </Field>

                    <Fieldset legend="Health sensitivities" className="mt-3">
                      <div className="flags-wrap">
                        {(
                          [
                            'asthma_copd',
                            'heart',
                            'pregnancy',
                            'other_sensitivity',
                          ] as Flag[]
                        ).map((flag) => {
                          const active = m.flags.includes(flag);
                          const inputId = `member-${m.id}-flag-${flag}`;
                          const label =
                            flag === 'asthma_copd'
                              ? 'Asthma or breathing sensitivity'
                              : flag === 'heart'
                                ? 'Heart condition'
                                : flag === 'pregnancy'
                                  ? 'Pregnancy'
                                  : 'Other sensitivity';

                          return (
                            <label key={flag} htmlFor={inputId} className="aw-choice-label">
                              <input
                                id={inputId}
                                type="checkbox"
                                checked={active}
                                onChange={() => toggleFlag(m.id, flag)}
                                className="aw-choice-input"
                              />
                              <span className="aw-choice-title">{label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </Fieldset>
                  </Fieldset>
                ))}
              </div>

              <button
                type="button"
                className="aw-btn aw-btn-secondary mb-4"
                onClick={addMember}
              >
                + Add family member
              </button>

              <div className="aw-btn-row">
                <button
                  type="button"
                  className="aw-btn aw-btn-secondary"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button type="submit" className="aw-btn aw-btn-primary">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Home & equipment */}
          {step === 3 && (
            <div className="card">
              <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
                Home &amp; equipment
              </h1>
              <p className="text-sm text-muted mb-4">
                Understanding your home layout helps tailor ventilation and indoor air advice.
              </p>

              <Fieldset legend="Housing structure" className="mb-4">
                <div className="grid-2-col">
                  <Field id="housing-tenure" label="Housing tenure">
                    <select
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value as Tenure)}
                      className="form-select"
                    >
                      <option value="rent">Rented</option>
                      <option value="own">Owned</option>
                    </select>
                  </Field>

                  <Field id="housing-type" label="Home type">
                    <select
                      value={housingType}
                      onChange={(e) => setHousingType(e.target.value as HousingType)}
                      className="form-select"
                    >
                      <option value="apartment">Apartment</option>
                      <option value="house">Independent house</option>
                    </select>
                  </Field>
                </div>
              </Fieldset>

              <Fieldset legend="Cooking and heating setup" className="mb-4">
                <div className="grid-2-col">
                  <Field id="cooking-fuel" label="Primary cooking fuel">
                    <select
                      value={fuel}
                      onChange={(e) => setFuel(e.target.value as CookingFuel)}
                      className="form-select"
                    >
                      <option value="lpg">LPG / piped gas</option>
                      <option value="electric">Electric / induction</option>
                      <option value="biomass">Biomass / firewood</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>

                  <Field id="cooking-exhaust" label="Kitchen ventilation">
                    <select
                      value={hasExhaust ? 'yes' : 'no'}
                      onChange={(e) => setHasExhaust(e.target.value === 'yes')}
                      className="form-select"
                    >
                      <option value="yes">Chimney or exhaust fan</option>
                      <option value="no">No mechanical exhaust</option>
                    </select>
                  </Field>
                </div>

                <div className="mt-3">
                  <Field
                    id="home-heating"
                    label="Home heating (combustion safety)"
                    helperText="Unvented biomass or gas heaters require carbon monoxide precautions"
                  >
                    <select
                      value={homeHeating}
                      onChange={(e) => setHomeHeating(e.target.value as HomeHeating)}
                      className="form-select"
                    >
                      <option value="none">No heating or warm climate</option>
                      <option value="electric">Electric heating or heat pump</option>
                      <option value="combustion">Combustion (Angithi / unvented gas / coal)</option>
                    </select>
                  </Field>
                </div>
              </Fieldset>

              <Fieldset legend="Air quality equipment" className="mb-4">
                <div className="checkbox-group">
                  <label htmlFor="eq-purifier" className="aw-choice-label">
                    <input
                      id="eq-purifier"
                      type="checkbox"
                      checked={hasPurifier}
                      onChange={(e) => setHasPurifier(e.target.checked)}
                      className="aw-choice-input"
                    />
                    <span className="aw-choice-title">HEPA air purifier</span>
                  </label>

                  <label htmlFor="eq-window-ac" className="aw-choice-label">
                    <input
                      id="eq-window-ac"
                      type="checkbox"
                      checked={hasWindowAC}
                      onChange={(e) => setHasWindowAC(e.target.checked)}
                      className="aw-choice-input"
                    />
                    <span className="aw-choice-title">Window or split AC</span>
                  </label>

                  <label htmlFor="eq-hvac" className="aw-choice-label">
                    <input
                      id="eq-hvac"
                      type="checkbox"
                      checked={hasHvac}
                      onChange={(e) => setHasHvac(e.target.checked)}
                      className="aw-choice-input"
                    />
                    <span className="aw-choice-title">Central HVAC</span>
                  </label>
                </div>
              </Fieldset>

              <Field
                id="budget-tier"
                label="Action budget preference"
                helperText="Filters recommendations to fit your household budget"
                className="mb-4"
              >
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as BudgetTier)}
                  className="form-select"
                >
                  <option value="free">Free only (no purchases)</option>
                  <option value="low">Low cost (masks, basic weather strips)</option>
                  <option value="flexible">Flexible</option>
                </select>
              </Field>

              <div className="aw-btn-row">
                <button
                  type="button"
                  className="aw-btn aw-btn-secondary"
                  onClick={() => setStep(2)}
                >
                  Back
                </button>
                <button type="submit" className="aw-btn aw-btn-primary">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Commute & travel */}
          {step === 4 && (
            <div className="card">
              <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
                Commute &amp; travel
              </h1>
              <p className="text-sm text-muted mb-4">
                Helps calculate avoided vehicle-kilometers and recommend safe transit windows.
              </p>

              <Fieldset
                id="commute-modes"
                legend="Primary commute modes"
                helperText="Select all modes used regularly by household commuters"
                error={getFieldError('commute-modes')}
                className="mb-4"
              >
                <div className="flags-wrap">
                  {(
                    [
                      'two_wheeler',
                      'car',
                      'auto_rickshaw',
                      'bus',
                      'metro_rail',
                      'walk',
                      'cycle',
                    ] as Mode[]
                  ).map((mode) => {
                    const active = modes.includes(mode);
                    const inputId = `mode-${mode}`;
                    const label =
                      mode === 'two_wheeler'
                        ? 'Motorcycle / scooter'
                        : mode === 'auto_rickshaw'
                          ? 'Auto-rickshaw'
                          : mode === 'metro_rail'
                            ? 'Metro / suburban rail'
                            : mode.charAt(0).toUpperCase() + mode.slice(1);

                    return (
                      <label key={mode} htmlFor={inputId} className="aw-choice-label">
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleMode(mode)}
                          className="aw-choice-input"
                        />
                        <span className="aw-choice-title">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </Fieldset>

              <div className="grid-2-col mb-4">
                <Field
                  id="travel-distance"
                  label="One-way commute distance (km)"
                  error={getFieldError('travel-distance')}
                >
                  <input
                    type="number"
                    step="1"
                    min="0"
                    inputMode="numeric"
                    className="form-input"
                    value={oneWayKm}
                    onChange={(e) => setOneWayKm(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </Field>

                <Field
                  id="travel-trips"
                  label="Commute trips per week"
                  error={getFieldError('travel-trips')}
                >
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="14"
                    inputMode="numeric"
                    className="form-input"
                    value={tripsPerWeek}
                    onChange={(e) => setTripsPerWeek(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </Field>
              </div>

              <Field
                id="travel-transit"
                label="Public transit accessibility"
                helperText="Whether bus or rail is practical for regular trips"
                className="mb-4"
              >
                <select
                  value={
                    transitAvailable === true ? 'yes' : transitAvailable === false ? 'no' : 'unknown'
                  }
                  onChange={(e) =>
                    setTransitAvailable(
                      e.target.value === 'yes' ? true : e.target.value === 'no' ? false : 'unknown',
                    )
                  }
                  className="form-select"
                >
                  <option value="yes">Accessible near home and work</option>
                  <option value="no">Not available or impractical</option>
                  <option value="unknown">Unknown</option>
                </select>
              </Field>

              <Fieldset legend="Schedule flexibility and outdoor exposure" className="mb-4">
                <div className="checkbox-group">
                  <label htmlFor="flex-shift" className="aw-choice-label">
                    <input
                      id="flex-shift"
                      type="checkbox"
                      checked={canShiftTime}
                      onChange={(e) => setCanShiftTime(e.target.checked)}
                      className="aw-choice-input"
                    />
                    <span className="aw-choice-title">
                      Can shift commute departure by 30–60 minutes
                    </span>
                  </label>

                  <label htmlFor="flex-remote" className="aw-choice-label">
                    <input
                      id="flex-remote"
                      type="checkbox"
                      checked={canWorkRemotely}
                      onChange={(e) => setCanWorkRemotely(e.target.checked)}
                      className="aw-choice-input"
                    />
                    <span className="aw-choice-title">
                      Can work remotely on bad pollution days
                    </span>
                  </label>

                  <label htmlFor="flex-worker" className="aw-choice-label">
                    <input
                      id="flex-worker"
                      type="checkbox"
                      checked={outdoorWorker}
                      onChange={(e) => setOutdoorWorker(e.target.checked)}
                      className="aw-choice-input"
                    />
                    <span className="aw-choice-title">
                      Household member is an outdoor worker
                    </span>
                  </label>
                </div>
              </Fieldset>

              <div className="aw-btn-row">
                <button
                  type="button"
                  className="aw-btn aw-btn-secondary"
                  onClick={() => setStep(3)}
                >
                  Back
                </button>
                <button type="submit" className="aw-btn aw-btn-primary">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Daily routine */}
          {step === 5 && (
            <div className="card">
              <h1 ref={h1Ref} tabIndex={-1} className="aw-onboarding-heading mb-2">
                Daily routine
              </h1>
              <p className="text-sm text-muted mb-4">
                Aligns daily clean-air advice with your family's waking and transit hours.
              </p>

              <div className="grid-2-col mb-4">
                <Field
                  id="routine-wake"
                  label="Wake up time"
                  helperText="Typical morning waking hour"
                  error={getFieldError('routine-wake')}
                  required
                >
                  <input
                    type="time"
                    className="form-input"
                    value={wake}
                    onChange={(e) => setWake(e.target.value)}
                    required
                  />
                </Field>

                <Field
                  id="routine-leave"
                  label="Leave home"
                  helperText="Morning commute departure"
                  error={getFieldError('routine-leave')}
                  required
                >
                  <input
                    type="time"
                    className="form-input"
                    value={leave}
                    onChange={(e) => setLeave(e.target.value)}
                    required
                  />
                </Field>

                <Field
                  id="routine-return"
                  label="Return home"
                  helperText="Evening commute arrival"
                  error={getFieldError('routine-return')}
                  required
                >
                  <input
                    type="time"
                    className="form-input"
                    value={returnHome}
                    onChange={(e) => setReturnHome(e.target.value)}
                    required
                  />
                </Field>

                <Field
                  id="routine-bed"
                  label="Bedtime"
                  helperText="Nighttime sleeping hour"
                  error={getFieldError('routine-bed')}
                  required
                >
                  <input
                    type="time"
                    className="form-input"
                    value={bed}
                    onChange={(e) => setBed(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="aw-btn-row mt-4">
                <button
                  type="button"
                  className="aw-btn aw-btn-secondary"
                  onClick={() => setStep(4)}
                >
                  Back
                </button>
                <button type="submit" className="aw-btn aw-btn-primary">
                  Save &amp; generate plan
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default OnboardingFlow;
