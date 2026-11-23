type Listener = (msg: string) => void;
const listeners = new Set<Listener>();

let lastMessage = '';
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeLiveRegion(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentAnnouncement(): string {
  return lastMessage;
}

/**
 * Announces a message to screen readers via the global LiveRegion.
 * Deduplicates repeated messages and clears after 5 seconds.
 */
export function announce(message: string): void {
  const clean = message.trim();
  if (!clean) return;

  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }

  lastMessage = clean;
  for (const listener of listeners) {
    listener(clean);
  }

  clearTimer = setTimeout(() => {
    lastMessage = '';
    for (const listener of listeners) {
      listener('');
    }
  }, 5000);
}
