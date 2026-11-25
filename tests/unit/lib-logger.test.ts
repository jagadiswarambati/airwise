import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, debug, warn, error } from '../../src/lib/logger';
import { systemClock } from '../../src/lib/clock';

describe('logger and clock utilities (src/lib/logger.ts, src/lib/clock.ts)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('provides working systemClock returning Date instances', () => {
    const now = systemClock();
    expect(now).toBeInstanceOf(Date);
    expect(Number.isNaN(now.getTime())).toBe(false);
  });

  it('formats warning messages with and without error name', () => {
    warn('Profile read warning');
    expect(warnSpy).toHaveBeenCalledWith('[AirWise] Profile read warning');

    warn('Profile corrupted', 'SyntaxError');
    expect(warnSpy).toHaveBeenCalledWith('[AirWise] Profile corrupted: SyntaxError');
  });

  it('formats error messages with and without error name', () => {
    error('Network failed');
    expect(errorSpy).toHaveBeenCalledWith('[AirWise] Network failed');

    error('Network failed', 'TypeError');
    expect(errorSpy).toHaveBeenCalledWith('[AirWise] Network failed: TypeError');
  });

  it('exports logger object with debug, warn, and error methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');

    logger.warn('Object call test');
    expect(warnSpy).toHaveBeenCalledWith('[AirWise] Object call test');

    logger.error('Object error test');
    expect(errorSpy).toHaveBeenCalledWith('[AirWise] Object error test');

    debug('Debug msg');
    // In test environment (NODE_ENV=test), debug is a no-op
    expect(debugSpy).not.toHaveBeenCalled();
  });
});
