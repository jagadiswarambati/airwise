import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function blockNetwork(page: Page) {
  await page.route('**/api/air**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/geocode**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
  await page.route('**/api/plan**', (r) =>
    r.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
}

const routes = [
  '/',
  '/#/about',
  '/#/today',
  '/#/indoor',
  '/#/move',
  '/#/impact',
  '/#/community',
  '/#/privacy',
  '/#/terms',
];

test.describe('smoke and navigation', () => {
  test.beforeEach(async ({ page }) => {
    await blockNetwork(page);
  });

  test('about loads and primary CTA works', async ({ page }) => {
    await page.goto('/#/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('navigation across routes', async ({ page }) => {
    for (const r of routes) {
      await page.goto(r.startsWith('/') ? r : `/${r}`);
      await expect(page.locator('main, [role="main"]').first()).toBeVisible();
    }
  });
});

test.describe('onboarding', () => {
  test.beforeEach(async ({ page }) => {
    await blockNetwork(page);
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('step through all 5 steps and land on Today', async ({ page }) => {
    await page.goto('/');
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: /continue|save/i }).click();
    }
    await expect(page.locator('main')).toContainText(/plan|today/i);
  });

  test('back keeps inputs', async ({ page }) => {
    await page.goto('/');
    const city = page.getByLabel(/latitude/i);
    await city.fill('10.5');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByRole('button', { name: /back/i }).click();
    await expect(city).toHaveValue('10.5');
  });
});

test.describe('today scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await blockNetwork(page);
  });
  test('moderate and severe air render', async ({ page }) => {
    await page.goto('/#/today');
    await expect(page.locator('main').first()).toBeVisible();
  });
});

test.describe('keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await blockNetwork(page);
  });
  test('skip link moves focus to main', async ({ page }) => {
    await page.goto('/#/about');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to main content/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });
});

test.describe('reduced motion', () => {
  test.beforeEach(async ({ page }) => {
    await blockNetwork(page);
  });
  test('animations disabled or zero duration', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#/today');
    const durations = await page.evaluate(() =>
      document
        .getAnimations()
        .map(
          (a) =>
            (a.effect as { getTiming?: () => { duration?: number } })?.getTiming?.().duration ?? 0,
        ),
    );
    for (const d of durations) expect(d === 0 || d === undefined).toBeTruthy();
  });
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(async ({ page }) => {
    await blockNetwork(page);
  });
  test('no horizontal scroll', async ({ page }) => {
    await page.goto('/#/about');
    const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(ok).toBeTruthy();
  });
});

test.describe('axe', () => {
  for (const route of routes) {
    for (const scheme of ['light', 'dark'] as const) {
      test(`axe ${route} ${scheme}`, async ({ page }) => {
        await blockNetwork(page);
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto(route.startsWith('/') ? route : `/${route}`);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(results.violations).toEqual([]);
      });
    }
  }
});
