import { useState, useEffect, useMemo } from 'react';
import { type ScenarioType } from '../data/fallback-chain';

export const SCENARIO_STORAGE_KEY = 'airwise_scenario_v1';

let inMemoryScenario: ScenarioType = 'live';
const scenarioListeners = new Set<() => void>();

function notify() {
  for (const l of scenarioListeners) l();
}

const VALID_SCENARIOS = new Set<ScenarioType>(['live', 'clear', 'moderate', 'severe', 'stale']);

function isScenarioType(val: unknown): val is ScenarioType {
  return typeof val === 'string' && VALID_SCENARIOS.has(val as ScenarioType);
}

export function getScenario(): ScenarioType {
  if (typeof window === 'undefined' || !window.localStorage) {
    return inMemoryScenario;
  }
  try {
    const val = window.localStorage.getItem(SCENARIO_STORAGE_KEY);
    if (isScenarioType(val)) {
      inMemoryScenario = val;
      return inMemoryScenario;
    }
  } catch (_e) {
    // Fall back to inMemory
  }
  return inMemoryScenario;
}

export function setScenario(scenario: ScenarioType): void {
  inMemoryScenario = scenario;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SCENARIO_STORAGE_KEY, scenario);
    }
  } catch (_e) {
    // Ignore storage errors
  }
  notify();
}

export function useScenario(): {
  scenario: ScenarioType;
  setScenario: (s: ScenarioType) => void;
} {
  const [scenario, setScenarioState] = useState<ScenarioType>(() => getScenario());

  useEffect(() => {
    const update = () => setScenarioState(getScenario());
    scenarioListeners.add(update);
    return () => {
      scenarioListeners.delete(update);
    };
  }, []);

  return useMemo(
    () => ({
      scenario,
      setScenario,
    }),
    [scenario],
  );
}

