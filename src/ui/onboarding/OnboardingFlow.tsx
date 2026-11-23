import React, { useState } from 'react';
import {
  AgeGroup,
  BudgetTier,
  CookingFuel,
  Flag,
  HomeHeating,
  HouseholdProfile,
  HousingType,
  Member,
  Mode,
  Tenure,
  roleLabelFor,
} from '../../domain/types';
import citiesData from '../../data/samples/cities.json';
import { Icon } from '../icons';

interface OnboardingFlowProps {
  initialProfile?: HouseholdProfile | null;
  onComplete: (profile: HouseholdProfile) => void;
  onLoadPriya: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  initialProfile,
  onComplete,
  onLoadPriya,
}) => {
  const [step, setStep] = useState<number>(1);

  // Step 1: Location
  const [cityLabel, setCityLabel] = useState(initialProfile?.location.label || 'Hyderabad, India');
  const [lat, setLat] = useState<number>(initialProfile?.location.lat || 17.38);
  const [lon, setLon] = useState<number>(initialProfile?.location.lon || 78.48);
  const [country, setCountry] = useState<string>(initialProfile?.location.country || 'IN');

  // Step 2: Household Members
  const [members, setMembers] = useState<Member[]>(
    initialProfile?.members || [
      { id: '1', roleLabel: 'Adult 18-64', ageGroup: '18-64', flags: [] },
    ],
  );

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

  // Step 5: Routine
  const [wake, setWake] = useState(initialProfile?.routine.wake || '06:00');
  const [leave, setLeave] = useState(initialProfile?.routine.leave || '07:30');
  const [returnHome, setReturnHome] = useState(initialProfile?.routine.returnHome || '17:30');
  const [bed, setBed] = useState(initialProfile?.routine.bed || '22:00');

  const addMember = () => {
    const nextId = (members.length + 1).toString();
    setMembers((prev) => [
      ...prev,
      {
        id: nextId,
        roleLabel: roleLabelFor({ ageGroup: '18-64' }),
        ageGroup: '18-64',
        flags: [],
      },
    ]);
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
  };

  const toggleFlag = (memberId: string, flag: Flag) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    const newFlags = target.flags.includes(flag)
      ? target.flags.filter((f) => f !== flag)
      : [...target.flags, flag];
    updateMember(memberId, { flags: newFlags });
  };

  const selectCity = (city: { name: string; lat: number; lon: number; country: string }) => {
    setCityLabel(`${city.name}, ${city.country}`);
    setLat(city.lat);
    setLon(city.lon);
    setCountry(city.country);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalProfile: HouseholdProfile = {
      schemaVersion: 1,
      location: {
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        label: cityLabel,
        country: country || (cityLabel.includes('India') ? 'IN' : 'US'),
      },
      members,
      housing: {
        tenure,
        type: housingType,
      },
      cooking: {
        fuel,
        hasExhaust,
      },
      homeHeating,
      equipment: {
        purifier: hasPurifier,
        windowAC: hasWindowAC,
        hvac: hasHvac,
      },
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

    onComplete(finalProfile);
  };

  return (
    <div className="onboarding-container">
      {/* Shortcut Preset Banner */}
      <div className="onboarding-preset-banner">
        <div>
          <div className="onboarding-preset-title">
            Quick 1-Tap Evaluation
          </div>
          <div className="onboarding-preset-desc">
            Load Priya's preset (asthmatic child, elder, low budget).
          </div>
        </div>
        <button
          type="button"
          onClick={onLoadPriya}
          className="btn-primary onboarding-preset-btn"
        >
          Try Priya's Household
        </button>
      </div>

      {/* Progress Bars */}
      <div className="step-indicator" aria-label={`Onboarding step ${step} of 5`}>
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className={`step-bar ${s <= step ? 'active' : ''}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="onboarding-form">
        {/* STEP 1: Location */}
        {step === 1 && (
          <div className="card">
            <h2 className="card-title">Step 1: Location</h2>
            <p className="text-sm text-muted">
              Choose your city or enter approximate coordinates. Location is rounded to ~1 km for privacy.
            </p>

            <div className="form-group">
              <label className="form-label">City Search / Preset</label>
              <div className="city-presets-row">
                {citiesData.slice(0, 8).map((city) => (
                  <button
                    key={city.name}
                    type="button"
                    onClick={() => selectCity(city)}
                    className="tag tag-cost cursor-pointer"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="form-input"
                value={cityLabel}
                onChange={(e) => setCityLabel(e.target.value)}
                placeholder="City Name"
                required
              />
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={lon}
                  onChange={(e) => setLon(parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>

            <button type="button" className="btn-primary" onClick={() => setStep(2)}>
              Next: Household Members →
            </button>
          </div>
        )}

        {/* STEP 2: Members */}
        {step === 2 && (
          <div className="card">
            <h2 className="card-title">Step 2: Who lives in your home?</h2>
            <p className="text-sm text-muted">
              We ask for age groups and respiratory flags only. No personal names are ever recorded.
            </p>

            {members.map((m, idx) => (
              <div
                key={m.id}
                className="member-card"
              >
                <div className="member-card-header">
                  <span className="member-card-title">Member {idx + 1}</span>
                  {members.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      className="member-remove-btn"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Age Group</label>
                  <select
                    value={m.ageGroup}
                    onChange={(e) => updateMember(m.id, { ageGroup: e.target.value as AgeGroup })}
                    className="form-select"
                  >
                    <option value="u5">Under 5 years (Infant / Toddler)</option>
                    <option value="5-12">5–12 years (Child)</option>
                    <option value="13-17">13–17 years (Teen)</option>
                    <option value="18-64">18–64 years (Adult)</option>
                    <option value="65+">65+ years (Senior)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sensitivity Flags</label>
                  <div className="flags-wrap">
                    {(['asthma_copd', 'heart', 'pregnancy', 'other_sensitivity'] as Flag[]).map(
                      (flag) => {
                        const active = m.flags.includes(flag);
                        const label =
                          flag === 'asthma_copd'
                            ? 'Asthma / Breathing'
                            : flag === 'heart'
                              ? 'Heart condition'
                              : flag === 'pregnancy'
                                ? 'Pregnancy'
                                : 'Other sensitivity';
                        return (
                          <button
                            key={flag}
                            type="button"
                            onClick={() => toggleFlag(m.id, flag)}
                            className={`tag cursor-pointer ${active ? 'tag-urgent' : 'tag-cost'}`}
                          >
                            {active ? (
                              <Icon name="check" size={12} aria-hidden="true" />
                            ) : (
                              <span>+ </span>
                            )}
                            {label}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button type="button" className="btn-secondary" onClick={addMember}>
              + Add Family Member
            </button>

            <div className="form-actions-row">
              <button type="button" className="btn-secondary btn-back" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button type="button" className="btn-primary btn-next" onClick={() => setStep(3)}>
                Next: Home &amp; Setup →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Home & Equipment */}
        {step === 3 && (
          <div className="card">
            <h2 className="card-title">Step 3: Home &amp; Equipment</h2>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Tenure</label>
                <select value={tenure} onChange={(e) => setTenure(e.target.value as Tenure)} className="form-select">
                  <option value="rent">Rented</option>
                  <option value="own">Owned</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Home Type</label>
                <select value={housingType} onChange={(e) => setHousingType(e.target.value as HousingType)} className="form-select">
                  <option value="apartment">Apartment</option>
                  <option value="house">Independent House</option>
                </select>
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Cooking Fuel</label>
                <select value={fuel} onChange={(e) => setFuel(e.target.value as CookingFuel)} className="form-select">
                  <option value="lpg">LPG / Piped Gas</option>
                  <option value="electric">Electric / Induction</option>
                  <option value="biomass">Biomass / Firewood</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Kitchen Exhaust</label>
                <select
                  value={hasExhaust ? 'yes' : 'no'}
                  onChange={(e) => setHasExhaust(e.target.value === 'yes')}
                  className="form-select"
                >
                  <option value="yes">Chimney / Exhaust Fan</option>
                  <option value="no">No mechanical exhaust</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Home Heating (Combustion Safety)</label>
              <select value={homeHeating} onChange={(e) => setHomeHeating(e.target.value as HomeHeating)} className="form-select">
                <option value="none">No heating / Warm climate</option>
                <option value="electric">Electric heating / Heat pump</option>
                <option value="combustion">Combustion (Angithi / gas / kerosene)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Equipment Owned</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={hasPurifier}
                    onChange={(e) => setHasPurifier(e.target.checked)}
                  />
                  HEPA Air Purifier
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={hasWindowAC}
                    onChange={(e) => setHasWindowAC(e.target.checked)}
                  />
                  Window or Split AC
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={hasHvac}
                    onChange={(e) => setHasHvac(e.target.checked)}
                  />
                  Central HVAC
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Budget Tier</label>
              <select value={budget} onChange={(e) => setBudget(e.target.value as BudgetTier)} className="form-select">
                <option value="free">Free only (No purchases)</option>
                <option value="low">Low cost (Masks, basic weather strips)</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>

            <div className="form-actions-row">
              <button type="button" className="btn-secondary btn-back" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button type="button" className="btn-primary btn-next" onClick={() => setStep(4)}>
                Next: Travel &amp; Commute →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Travel */}
        {step === 4 && (
          <div className="card">
            <h2 className="card-title">Step 4: Commute &amp; Travel</h2>

            <div className="form-group">
              <label className="form-label">Primary Commute Modes</label>
              <div className="flags-wrap">
                {(['two_wheeler', 'car', 'bus', 'metro_rail', 'walk', 'cycle'] as Mode[]).map((mode) => {
                  const active = modes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() =>
                        setModes(active ? modes.filter((m) => m !== mode) : [...modes, mode])
                      }
                      className={`tag cursor-pointer ${active ? 'tag-exposure' : 'tag-cost'}`}
                    >
                      {active ? (
                        <Icon name="check" size={12} aria-hidden="true" />
                      ) : (
                        <span>+ </span>
                      )}
                      {mode.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">One-Way Distance (km)</label>
                <input
                  type="number"
                  className="form-input"
                  value={oneWayKm}
                  onChange={(e) => setOneWayKm(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trips Per Week</label>
                <input
                  type="number"
                  className="form-input"
                  value={tripsPerWeek}
                  onChange={(e) => setTripsPerWeek(Math.max(0, parseInt(e.target.value) || 0))}
                  min={0}
                  max={7}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Public Transit Accessibility</label>
              <select
                value={transitAvailable === true ? 'yes' : transitAvailable === false ? 'no' : 'unknown'}
                onChange={(e) =>
                  setTransitAvailable(
                    e.target.value === 'yes' ? true : e.target.value === 'no' ? false : 'unknown',
                  )
                }
                className="form-select"
              >
                <option value="yes">Accessible near home or work</option>
                <option value="no">Not available / impractical</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Flexibility &amp; Exposure</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={canShiftTime}
                    onChange={(e) => setCanShiftTime(e.target.checked)}
                  />
                  Can shift commute departure by 30–60 mins
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={canWorkRemotely}
                    onChange={(e) => setCanWorkRemotely(e.target.checked)}
                  />
                  Can work remotely on bad smog days
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={outdoorWorker}
                    onChange={(e) => setOutdoorWorker(e.target.checked)}
                  />
                  Family member is an outdoor worker
                </label>
              </div>
            </div>

            <div className="form-actions-row">
              <button type="button" className="btn-secondary btn-back" onClick={() => setStep(3)}>
                ← Back
              </button>
              <button type="button" className="btn-primary btn-next" onClick={() => setStep(5)}>
                Next: Daily Routine →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Routine */}
        {step === 5 && (
          <div className="card">
            <h2 className="card-title">Step 5: Daily Schedule</h2>
            <p className="text-sm text-muted">
              Helps align your 6-slot timeline with actual exposure windows.
            </p>

            <div className="grid-2-col">
              <div className="form-group">
                <label className="form-label">Wake Up</label>
                <input
                  type="text"
                  className="form-input"
                  value={wake}
                  onChange={(e) => setWake(e.target.value)}
                  placeholder="06:00"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Leave Home</label>
                <input
                  type="text"
                  className="form-input"
                  value={leave}
                  onChange={(e) => setLeave(e.target.value)}
                  placeholder="07:30"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Return Home</label>
                <input
                  type="text"
                  className="form-input"
                  value={returnHome}
                  onChange={(e) => setReturnHome(e.target.value)}
                  placeholder="17:30"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bedtime</label>
                <input
                  type="text"
                  className="form-input"
                  value={bed}
                  onChange={(e) => setBed(e.target.value)}
                  placeholder="22:00"
                  required
                />
              </div>
            </div>

            <div className="form-actions-row mt-3">
              <button type="button" className="btn-secondary btn-back" onClick={() => setStep(4)}>
                ← Back
              </button>
              <button type="submit" className="btn-primary btn-next">
                Save &amp; Generate Plan
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
