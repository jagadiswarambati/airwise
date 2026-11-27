// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  checkBranches,
  isValidDependabotBranch,
  isAuthorizedBranch,
} from '../../scripts/check-branches.mjs';
import { CitySearchSection } from '../../src/ui/onboarding/components/CitySearchSection';
import { OnboardingFlow } from '../../src/ui/onboarding/OnboardingFlow';
import { getPersonalizedPlan } from '../../src/ai/client';
import { buildDeterministicPlan } from '../../src/domain/plan-builder';
import { evaluatePolicy } from '../../src/domain/policy';
import { deriveTimeSlots } from '../../src/domain/radar';
import { parsedModerateScenario } from '../../src/data/fallback-chain';
import { PRIYA_PROFILE } from '../fixtures/sample-profiles';
import * as geocodeClient from '../../src/data/providers/geocodeClient';
import { handlePlanCore } from '../../api/plan';

describe('Untested Branches Coverage (Since Attempt 1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. check:branches Output & Local Resolution Branches', () => {
    it('handles customLocalBranches option with authorized main branch', () => {
      const fakeLocal = '  main\n';
      const result = checkBranches({ customLocalBranches: fakeLocal });
      expect(result).toBe(true);
    });

    it('handles customLocalBranches with main and valid dependabot branch', () => {
      const fakeLocal = '  main\n  dependabot/npm_and_yarn/vite-8.3.8\n';
      const result = checkBranches({ customLocalBranches: fakeLocal });
      expect(result).toBe(true);
    });

    it('fails closed on customLocalBranches containing unauthorized branches', () => {
      const fakeLocal = '  main\n  feature/unauthorized\n';
      const result = checkBranches({ customLocalBranches: fakeLocal });
      expect(result).toBe(false);
    });

    it('fails closed when customLocalBranches is empty', () => {
      const result = checkBranches({ customLocalBranches: '   \n' });
      expect(result).toBe(false);
    });

    it('validates edge cases for isValidDependabotBranch', () => {
      expect(isValidDependabotBranch(null as unknown as string)).toBe(false);
      expect(isValidDependabotBranch(undefined as unknown as string)).toBe(false);
      expect(isValidDependabotBranch(12345 as unknown as string)).toBe(false);
      expect(isValidDependabotBranch('')).toBe(false);
      expect(isValidDependabotBranch('dependabot/')).toBe(false);
      expect(isValidDependabotBranch('dependabot/invalid char')).toBe(false);
      expect(isValidDependabotBranch('dependabot/has$special*char')).toBe(false);
      expect(isValidDependabotBranch('dependabot/nested/path/good-1.0')).toBe(true);
    });

    it('validates edge cases for isAuthorizedBranch', () => {
      expect(isAuthorizedBranch('main')).toBe(true);
      expect(isAuthorizedBranch('master')).toBe(false);
      expect(isAuthorizedBranch('production')).toBe(false);
      expect(isAuthorizedBranch('dependabot/npm_and_yarn/pkg-1.0.0')).toBe(true);
      expect(isAuthorizedBranch('dependabot/..')).toBe(false);
    });
  });

  describe('2. Location Search Error and Empty States', () => {
    it('clears results when search query is shorter than 2 characters', async () => {
      const user = userEvent.setup();
      render(<CitySearchSection onSelectCity={() => {}} />);

      const input = screen.getByLabelText(/search city or town/i);
      await user.type(input, 'a');

      // Wait 350ms to exceed debounce
      await new Promise((r) => setTimeout(r, 350));
      expect(screen.queryByRole('region', { name: /city search results/i })).toBeNull();
    });

    it('announces empty state when search returns zero results', async () => {
      const user = userEvent.setup();
      vi.spyOn(geocodeClient, 'searchCities').mockResolvedValue([]);

      render(<CitySearchSection onSelectCity={() => {}} />);
      const input = screen.getByLabelText(/search city or town/i);
      await user.type(input, 'NonExistentCityName123');

      await waitFor(() => {
        expect(screen.queryByRole('region', { name: /city search results/i })).toBeNull();
      });
    });

    it('falls back to offline bundled cities when search API throws an error', async () => {
      const user = userEvent.setup();
      vi.spyOn(geocodeClient, 'searchCities').mockRejectedValue(new Error('Network failure'));

      render(<CitySearchSection onSelectCity={() => {}} />);
      const input = screen.getByLabelText(/search city or town/i);
      // 'Delhi' exists in bundled cities.json
      await user.type(input, 'Delhi');

      await waitFor(() => {
        const resultsList = screen.getByRole('region', { name: /city search results/i });
        expect(resultsList).toBeDefined();
        expect(within(resultsList).getByText('Delhi')).toBeDefined();
      });
    });

    it('allows selecting a city from search results and updates form fields', async () => {
      const user = userEvent.setup();
      const mockSelect = vi.fn();
      vi.spyOn(geocodeClient, 'searchCities').mockResolvedValue([
        {
          name: 'Bengaluru',
          adminRegion: 'Karnataka',
          countryCode: 'IN',
          lat: 12.9716,
          lon: 77.5946,
        },
      ]);

      render(<CitySearchSection onSelectCity={mockSelect} />);
      const input = screen.getByLabelText(/search city or town/i);
      await user.type(input, 'Bengaluru');

      await waitFor(() => {
        const resultsList = screen.getByRole('region', { name: /city search results/i });
        expect(within(resultsList).getByText('Bengaluru')).toBeDefined();
      });

      const resultsList = screen.getByRole('region', { name: /city search results/i });
      const cityBtn = within(resultsList).getByRole('button');
      await user.click(cityBtn);

      expect(mockSelect).toHaveBeenCalledWith('Bengaluru, IN', 12.97, 77.59, 'IN');
      expect((input as HTMLInputElement).value).toBe('');
    });
  });

  describe('3. Onboarding Complete Step Flow & Back Navigation', () => {
    it('steps through all 5 onboarding steps and submits completed profile', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      render(
        <OnboardingFlow
          initialProfile={PRIYA_PROFILE}
          onComplete={onComplete}
          onLoadPriya={() => {}}
        />,
      );

      // Step 1: Where
      expect(screen.getByRole('heading', { level: 1, name: /where you live/i })).toBeDefined();
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      // Step 2: Household
      await screen.findByRole('heading', { level: 1, name: /who lives here/i });
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      // Step 3: Home
      await screen.findByRole('heading', { level: 1, name: /your home/i });
      // Test Back button from Step 3 to Step 2
      await user.click(screen.getByRole('button', { name: /^back$/i }));
      await screen.findByRole('heading', { level: 1, name: /who lives here/i });
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      // Step 3: Home again -> continue to Step 4
      await screen.findByRole('heading', { level: 1, name: /your home/i });
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      // Step 4: Commute & travel
      await screen.findByRole('heading', { level: 1, name: /commute & travel/i });
      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      // Step 5: Daily routine
      await screen.findByRole('heading', { level: 1, name: /daily routine/i });
      await user.click(screen.getByRole('button', { name: /save & generate plan/i }));

      expect(onComplete).toHaveBeenCalledTimes(1);
      const submittedProfile = onComplete.mock.calls[0][0];
      expect(submittedProfile.location.country).toBe('IN');
      expect(submittedProfile.members.length).toBeGreaterThan(0);
    });

    it('displays validation errors and prevents navigation when required fields are missing', async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      render(
        <OnboardingFlow initialProfile={null} onComplete={onComplete} onLoadPriya={() => {}} />,
      );

      // Step 1: Clear location name to trigger validation error
      const locationInput = screen.getByLabelText(/location name/i);
      await user.clear(locationInput);

      await user.click(screen.getByRole('button', { name: /^continue$/i }));

      // Must remain on Step 1 and display error summary
      expect(screen.getByRole('alert')).toBeDefined();
      expect(screen.getAllByText(/please enter a location name/i).length).toBeGreaterThan(0);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('4. Client API Error Paths (Timeout, 429, Invalid JSON, Malformed Reply)', () => {
    const profile = PRIYA_PROFILE;
    const snapshot = parsedModerateScenario;
    const slots = deriveTimeSlots(profile, snapshot.pm25.hourly, 'IN');
    const policyResult = evaluatePolicy(profile, snapshot, slots, false, 'IN');
    const deterministicPlan = buildDeterministicPlan(profile, snapshot, { targetRegion: 'IN' });

    it('safely falls back when Plan API returns HTTP 429 RateLimited', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          json: () =>
            Promise.resolve({
              error: { code: 'RateLimited', message: 'Too many requests' },
            }),
        }),
      );

      const result = await getPersonalizedPlan(
        deterministicPlan,
        snapshot,
        profile,
        slots,
        policyResult,
      );

      expect(result.isAIPersonalized).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.plan).toBe(deterministicPlan);
      expect(result.statusMessage).toContain('HTTP 429');
    });

    it('safely falls back when Plan API times out (AbortError)', async () => {
      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));

      const result = await getPersonalizedPlan(
        deterministicPlan,
        snapshot,
        profile,
        slots,
        policyResult,
      );

      expect(result.isAIPersonalized).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.plan).toBe(deterministicPlan);
      expect(result.statusMessage).toContain('timed out');
    });

    it('safely falls back when Plan API returns invalid non-JSON body', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.reject(new SyntaxError('Unexpected token < in JSON')),
        }),
      );

      const result = await getPersonalizedPlan(
        deterministicPlan,
        snapshot,
        profile,
        slots,
        policyResult,
      );

      expect(result.isAIPersonalized).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.plan).toBe(deterministicPlan);
      expect(result.statusMessage).toContain('Failed to contact plan service');
    });

    it('safely falls back when Plan API returns malformed success structure or safety error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              success: false,
              message: 'AI personalisation is unavailable right now.',
            }),
        }),
      );

      const result = await getPersonalizedPlan(
        deterministicPlan,
        snapshot,
        profile,
        slots,
        policyResult,
      );

      expect(result.isAIPersonalized).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.plan).toBe(deterministicPlan);
      expect(result.statusMessage).toContain('AI personalisation is unavailable right now.');
    });

    it('handlePlanCore returns 400 ValidationError on invalid JSON format', async () => {
      const res = await handlePlanCore(
        'malformed{not-valid-json',
        { 'content-type': 'application/json' },
        'POST',
      );
      expect(res.status).toBe(400);
      const errBody = res.body as { error: { code: string; message: string } };
      expect(errBody.error.code).toBe('ValidationError');
      expect(errBody.error.message).toContain('Invalid JSON body format');
    });
  });
});
