import { useState, useEffect, useMemo } from 'react';

let manualSevereMode = false;
const severeListeners = new Set<() => void>();

function notify() {
  for (const l of severeListeners) l();
}

/**
 * getManualSevereMode.
 * @returns
 */
export function getManualSevereMode(): boolean {
  return manualSevereMode;
}

/**
 * setManualSevereMode.
 * @param enabled
 * @returns
 */
export function setManualSevereMode(enabled: boolean): void {
  manualSevereMode = enabled;
  notify();
}

/**
 * toggleManualSevereMode.
 * @returns
 */
export function toggleManualSevereMode(): boolean {
  manualSevereMode = !manualSevereMode;
  notify();
  return manualSevereMode;
}

/**
 * useManualSevereMode.
 * @returns
 */
export function useManualSevereMode(): {
  isManualSevereMode: boolean;
  setSevereMode: (enabled: boolean) => void;
  toggleSevereMode: () => void;
} {
  const [isManualSevereMode, setIsManualSevereMode] = useState<boolean>(getManualSevereMode());

  useEffect(() => {
    const update = () => setIsManualSevereMode(getManualSevereMode());
    severeListeners.add(update);
    return () => {
      severeListeners.delete(update);
    };
  }, []);

  return useMemo(
    () => ({
      isManualSevereMode,
      setSevereMode: setManualSevereMode,
      toggleSevereMode: toggleManualSevereMode,
    }),
    [isManualSevereMode],
  );
}

