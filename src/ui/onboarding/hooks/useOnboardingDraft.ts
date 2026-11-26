import { useState, useEffect, useCallback } from 'react';
import {
  type BudgetTier,
  type CookingFuel,
  type Flag,
  type HomeHeating,
  type HouseholdProfile,
  type HousingType,
  type Member,
  type Mode,
  type Tenure,
  roleLabelFor,
} from '../../../domain/types';
import { announce } from '../../components/liveRegionAnnouncer';

const ONBOARDING_SESSION_CACHE_KEY = 'airwise_onboarding_session_draft_v1';

/**
 * Retrieves temporary session-cached draft to preserve inputs across browser session refreshes.
 */
export function getSessionDraft(): HouseholdProfile | null {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(ONBOARDING_SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists active draft to sessionStorage.
 */
export function saveSessionDraft(draft: HouseholdProfile): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(ONBOARDING_SESSION_CACHE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage write errors (e.g. quota limits)
  }
}

/**
 * Clears temporary session draft upon onboarding completion or reset.
 */
export function clearSessionDraft(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(ONBOARDING_SESSION_CACHE_KEY);
  } catch {
    // Ignore cleanup errors
  }
}

function useLocationDraft(initial?: HouseholdProfile | null) {
  const [cityLabel, setCityLabel] = useState(initial?.location.label || 'Hyderabad, India');
  const [lat, setLat] = useState<number>(initial?.location.lat || 17.38);
  const [lon, setLon] = useState<number>(initial?.location.lon || 78.48);
  const [country, setCountry] = useState<string>(initial?.location.country || 'IN');
  return { cityLabel, setCityLabel, lat, setLat, lon, setLon, country, setCountry };
}

function useMembersDraft(initial?: HouseholdProfile | null) {
  const defaultMember: Member = {
    id: '1',
    roleLabel: roleLabelFor({ ageGroup: '18-64' }),
    ageGroup: '18-64',
    flags: [],
  };
  const [members, setMembers] = useState<Member[]>(initial?.members || [defaultMember]);

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

  return { members, addMember, updateMember, removeMember, toggleFlag };
}

function getDefaultHome(initial?: HouseholdProfile | null) {
  if (!initial) {
    return {
      tenure: 'rent' as Tenure,
      housingType: 'apartment' as HousingType,
      fuel: 'lpg' as CookingFuel,
      hasExhaust: false,
      homeHeating: 'none' as HomeHeating,
      hasPurifier: false,
      hasWindowAC: true,
      hasHvac: false,
      budget: 'low' as BudgetTier,
    };
  }
  return {
    tenure: initial.housing.tenure,
    housingType: initial.housing.type,
    fuel: initial.cooking.fuel,
    hasExhaust: initial.cooking.hasExhaust,
    homeHeating: initial.homeHeating,
    hasPurifier: initial.equipment.purifier,
    hasWindowAC: initial.equipment.windowAC,
    hasHvac: initial.equipment.hvac,
    budget: initial.budget,
  };
}

function getDefaultCommute(initial?: HouseholdProfile | null) {
  if (!initial) {
    return {
      modes: ['two_wheeler'] as Mode[],
      oneWayKm: 12,
      tripsPerWeek: 5,
      transitAvailable: true as boolean | 'unknown',
      canShiftTime: false,
      canWorkRemotely: false,
      outdoorWorker: false,
    };
  }
  return {
    modes: initial.travel.modes,
    oneWayKm: initial.travel.oneWayKm,
    tripsPerWeek: initial.travel.tripsPerWeek,
    transitAvailable: initial.travel.transitAvailable,
    canShiftTime: initial.travel.canShiftTime,
    canWorkRemotely: initial.travel.canWorkRemotely,
    outdoorWorker: initial.travel.outdoorWorker,
  };
}

function useHomeDraft(initial?: HouseholdProfile | null) {
  const def = getDefaultHome(initial);
  const [tenure, setTenure] = useState<Tenure>(def.tenure);
  const [housingType, setHousingType] = useState<HousingType>(def.housingType);
  const [fuel, setFuel] = useState<CookingFuel>(def.fuel);
  const [hasExhaust, setHasExhaust] = useState<boolean>(def.hasExhaust);
  const [homeHeating, setHomeHeating] = useState<HomeHeating>(def.homeHeating);
  const [hasPurifier, setHasPurifier] = useState<boolean>(def.hasPurifier);
  const [hasWindowAC, setHasWindowAC] = useState<boolean>(def.hasWindowAC);
  const [hasHvac, setHasHvac] = useState<boolean>(def.hasHvac);
  const [budget, setBudget] = useState<BudgetTier>(def.budget);

  return {
    tenure, setTenure, housingType, setHousingType, fuel, setFuel, hasExhaust, setHasExhaust,
    homeHeating, setHomeHeating, hasPurifier, setHasPurifier, hasWindowAC, setHasWindowAC,
    hasHvac, setHasHvac, budget, setBudget,
  };
}

function useCommuteDraft(initial?: HouseholdProfile | null) {
  const def = getDefaultCommute(initial);
  const [modes, setModes] = useState<Mode[]>(def.modes);
  const [oneWayKm, setOneWayKm] = useState<number>(def.oneWayKm);
  const [tripsPerWeek, setTripsPerWeek] = useState<number>(def.tripsPerWeek);
  const [transitAvailable, setTransitAvailable] = useState<boolean | 'unknown'>(def.transitAvailable);
  const [canShiftTime, setCanShiftTime] = useState<boolean>(def.canShiftTime);
  const [canWorkRemotely, setCanWorkRemotely] = useState<boolean>(def.canWorkRemotely);
  const [outdoorWorker, setOutdoorWorker] = useState<boolean>(def.outdoorWorker);

  const toggleMode = (mode: Mode) => {
    setModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  };

  return {
    modes, toggleMode, oneWayKm, setOneWayKm, tripsPerWeek, setTripsPerWeek,
    transitAvailable, setTransitAvailable, canShiftTime, setCanShiftTime,
    canWorkRemotely, setCanWorkRemotely, outdoorWorker, setOutdoorWorker,
  };
}

function useRoutineDraft(initial?: HouseholdProfile | null) {
  const [wake, setWake] = useState(initial?.routine.wake || '06:00');
  const [leave, setLeave] = useState(initial?.routine.leave || '07:30');
  const [returnHome, setReturnHome] = useState(initial?.routine.returnHome || '17:30');
  const [bed, setBed] = useState(initial?.routine.bed || '22:00');

  return { wake, setWake, leave, setLeave, returnHome, setReturnHome, bed, setBed };
}

export function useOnboardingDraft(initialProfile?: HouseholdProfile | null) {
  const effectiveInitial = initialProfile || getSessionDraft();
  const loc = useLocationDraft(effectiveInitial);
  const mem = useMembersDraft(effectiveInitial);
  const home = useHomeDraft(effectiveInitial);
  const com = useCommuteDraft(effectiveInitial);
  const rout = useRoutineDraft(effectiveInitial);

  const buildRawProfile = useCallback((): HouseholdProfile => ({
    schemaVersion: 1,
    location: {
      lat: Math.round(loc.lat * 100) / 100,
      lon: Math.round(loc.lon * 100) / 100,
      label: loc.cityLabel.trim(),
      country: loc.country || (loc.cityLabel.includes('India') ? 'IN' : 'US'),
    },
    members: mem.members,
    housing: { tenure: home.tenure, type: home.housingType },
    cooking: { fuel: home.fuel, hasExhaust: home.hasExhaust },
    homeHeating: home.homeHeating,
    equipment: { purifier: home.hasPurifier, windowAC: home.hasWindowAC, hvac: home.hasHvac },
    budget: home.budget,
    travel: {
      modes: com.modes,
      oneWayKm: com.oneWayKm,
      tripsPerWeek: com.tripsPerWeek,
      transitAvailable: com.transitAvailable,
      canShiftTime: com.canShiftTime,
      canWorkRemotely: com.canWorkRemotely,
      outdoorWorker: com.outdoorWorker,
    },
    routine: {
      wake: rout.wake,
      leave: rout.leave,
      returnHome: rout.returnHome,
      cooking: ['07:00', '19:30'],
      bed: rout.bed,
    },
  }), [
    loc.cityLabel,
    loc.lat,
    loc.lon,
    loc.country,
    mem.members,
    home.tenure,
    home.housingType,
    home.fuel,
    home.hasExhaust,
    home.homeHeating,
    home.hasPurifier,
    home.hasWindowAC,
    home.hasHvac,
    home.budget,
    com.modes,
    com.oneWayKm,
    com.tripsPerWeek,
    com.transitAvailable,
    com.canShiftTime,
    com.canWorkRemotely,
    com.outdoorWorker,
    rout.wake,
    rout.leave,
    rout.returnHome,
    rout.bed,
  ]);

  // Automatically sync active draft to session storage for seamless session persistence
  useEffect(() => {
    saveSessionDraft(buildRawProfile());
  }, [buildRawProfile]);

  return { ...loc, ...mem, ...home, ...com, ...rout, buildRawProfile };
}
