import { useState, useEffect, useMemo } from 'react';

let manualSevereMode = false;
const severeListeners = new Set<() => void>();

function notify() {
  for (const l of severeListeners) l();
}

export function getManualSevereMode(): boolean {
  return manualSevereMode;
}

export function setManualSevereMode(enabled: boolean): void {
  manualSevereMode = enabled;
  notify();
}

export function toggleManualSevereMode(): boolean {
  manualSevereMode = !manualSevereMode;
  notify();
  return manualSevereMode;
}

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

