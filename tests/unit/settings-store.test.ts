import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSettings, setSettings, applyTheme } from '../../src/state/settingsStore';

describe('Settings Store', () => {
  let storage: Record<string, string> = {};
  let documentAttributes: Record<string, string> = {};
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  beforeEach(() => {
    storage = {};
    documentAttributes = {};

    globalThis.window = {
      localStorage: {
        getItem: (k: string) => storage[k] ?? null,
        setItem: (k: string, v: string) => {
          storage[k] = v;
        },
        removeItem: (k: string) => {
          delete storage[k];
        },
        clear: () => {
          storage = {};
        },
      },
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as Window & typeof globalThis;

    globalThis.document = {
      documentElement: {
        getAttribute: (name: string) => documentAttributes[name] ?? null,
        setAttribute: (name: string, val: string) => {
          documentAttributes[name] = val;
        },
        removeAttribute: (name: string) => {
          delete documentAttributes[name];
        },
        hasAttribute: (name: string) => name in documentAttributes,
      },
    } as unknown as Document;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
  });

  it('returns default settings when storage is empty', () => {
    const s = getSettings();
    expect(s.aiEnabled).toBe(false);
    expect(s.theme).toBe('system');
    expect(s.animatedSky).toBe(true);
  });

  it('persists theme update and dispatches change event', () => {
    const updated = setSettings({ theme: 'dark' });
    expect(updated.theme).toBe('dark');

    const retrieved = getSettings();
    expect(retrieved.theme).toBe('dark');
  });

  it('persists animatedSky update', () => {
    const updated = setSettings({ animatedSky: false });
    expect(updated.animatedSky).toBe(false);

    const retrieved = getSettings();
    expect(retrieved.animatedSky).toBe(false);
  });

  it('applies theme attribute to document root', () => {
    applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    applyTheme('system');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});
