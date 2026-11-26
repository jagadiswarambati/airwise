// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/App';
import { OnboardingFlow } from '../../src/ui/onboarding/OnboardingFlow';
import * as fallbackChain from '../../src/data/fallback-chain';
import { parsedClearScenario } from '../../src/data/fallback-chain';

describe('Onboarding & Air Data Render-Loop Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    document.title = 'AirWise';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders App with no profile and calls getAirSnapshot at most twice across multiple re-renders', async () => {
    const airSpy = vi.spyOn(fallbackChain, 'getAirSnapshot').mockResolvedValue({
      snapshot: parsedClearScenario,
      sourceTier: 'sample',
      isFallback: false,
    });

    const { rerender } = render(<App />);

    // Wait for initial effect to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Re-render App several times
    for (let i = 0; i < 5; i++) {
      rerender(<App />);
    }

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // In React 18, StrictMode in dev may mount twice; without StrictMode it mounts once.
    // In either case, it must not loop continuously on every re-render.
    expect(airSpy).toHaveBeenCalledTimes(1);
  });

  it('preserves focus on city search and location inputs during typing', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow onComplete={() => {}} onLoadPriya={() => {}} />);

    // 1. Test search city or town input
    const searchInput = screen.getByLabelText(/search city or town/i);
    await user.click(searchInput);
    expect(document.activeElement).toBe(searchInput);

    await user.type(searchInput, 'Delhi');
    expect(document.activeElement).toBe(searchInput);
    expect((searchInput as HTMLInputElement).value).toBe('Delhi');

    // 2. Test manual location name input
    const locationInput = screen.getByLabelText(/location name/i);
    await user.click(locationInput);
    expect(document.activeElement).toBe(locationInput);

    await user.clear(locationInput);
    await user.type(locationInput, 'Mumbai');
    expect(document.activeElement).toBe(locationInput);
    expect((locationInput as HTMLInputElement).value).toBe('Mumbai');
  });

  it('navigates to step 2 when clicking Continue with valid defaults', async () => {
    const user = userEvent.setup();
    render(<OnboardingFlow onComplete={() => {}} onLoadPriya={() => {}} />);

    // Initially at Step 1
    expect(screen.getByRole('heading', { level: 1, name: /where you live/i })).toBeDefined();

    // Click Continue (valid defaults are pre-populated)
    const continueBtn = screen.getByRole('button', { name: /^continue$/i });
    await user.click(continueBtn);

    // Transitions to Step 2
    expect(await screen.findByRole('heading', { level: 1, name: /who lives here/i })).toBeDefined();
  });

  it('displays ErrorSummary on invalid input and keeps it visible on subsequent renders', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<OnboardingFlow onComplete={() => {}} onLoadPriya={() => {}} />);

    const locationInput = screen.getByLabelText(/location name/i);
    await user.clear(locationInput);

    const continueBtn = screen.getByRole('button', { name: /^continue$/i });
    await user.click(continueBtn);

    // ErrorSummary should be visible
    const alert = screen.getByRole('alert');
    expect(alert).toBeDefined();
    expect(within(alert).getByText(/please enter a location name/i)).toBeDefined();

    // Re-render multiple times to prove errors are not wiped on re-render
    for (let i = 0; i < 3; i++) {
      rerender(<OnboardingFlow onComplete={() => {}} onLoadPriya={() => {}} />);
    }

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const alertAfterRerender = screen.getByRole('alert');
    expect(alertAfterRerender).toBeDefined();
    expect(within(alertAfterRerender).getByText(/please enter a location name/i)).toBeDefined();
  });

  it('handles "Use my location" with mocked geolocation once without a render loop', async () => {
    const user = userEvent.setup();
    let renderCount = 0;

    const mockGetCurrentPosition = vi.fn((success) => {
      success({
        coords: {
          latitude: 28.6139,
          longitude: 77.209,
        },
      });
    });

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: mockGetCurrentPosition,
      },
      configurable: true,
      writable: true,
    });

    function TrackedFlow() {
      renderCount++;
      return <OnboardingFlow onComplete={() => {}} onLoadPriya={() => {}} />;
    }

    render(<TrackedFlow />);
    const initialRenderCount = renderCount;

    const useLocationBtn = screen.getByRole('button', { name: /use my location/i });
    await user.click(useLocationBtn);

    expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);

    // Wait for state updates to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Location inputs updated
    expect(screen.getByDisplayValue('28.61')).toBeDefined();
    expect(screen.getByDisplayValue('77.21')).toBeDefined();

    // Verify renderCount stabilized and didn't explode into an infinite loop
    expect(renderCount).toBeLessThan(initialRenderCount + 10);
  });

  it('maintains entered values when moving Back and Continue across all 5 steps', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<OnboardingFlow onComplete={onComplete} onLoadPriya={() => {}} />);

    // Step 1: Change city to "Pune, India"
    const locationInput = screen.getByLabelText(/location name/i);
    await user.clear(locationInput);
    await user.type(locationInput, 'Pune, India');

    // Step 1 -> Step 2
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /who lives here/i })).toBeDefined();

    // Step 2 -> Step 3
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /your home/i })).toBeDefined();

    // Step 3 -> Step 4
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(
      await screen.findByRole('heading', { level: 1, name: /commute & travel/i }),
    ).toBeDefined();

    // Step 4 -> Step 5
    await user.click(screen.getByRole('button', { name: /^continue$/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /daily routine/i })).toBeDefined();

    // Step 5 -> Back to Step 4
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(
      await screen.findByRole('heading', { level: 1, name: /commute & travel/i }),
    ).toBeDefined();

    // Step 4 -> Back to Step 3
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /your home/i })).toBeDefined();

    // Step 3 -> Back to Step 2
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /who lives here/i })).toBeDefined();

    // Step 2 -> Back to Step 1
    await user.click(screen.getByRole('button', { name: /^back$/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /where you live/i })).toBeDefined();

    // Verify Pune, India is still in location name
    const preservedInput = screen.getByLabelText(/location name/i);
    expect((preservedInput as HTMLInputElement).value).toBe('Pune, India');
  });
});
