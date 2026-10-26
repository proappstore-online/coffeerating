import { test, expect, hasSession } from '../fixtures';

// Baseline behavioural smoke. tsc + a green build can't tell you the app boots —
// this opens it in a real browser and checks it mounts and doesn't crash. QA
// agents add per-feature specs alongside this file; they run against the same
// live deploy with the same signed-in fixture.
test('app boots and mounts without crashing', async ({ app, pageErrors }) => {
  await expect(app.locator('#root')).not.toBeEmpty();
  if (!hasSession) {
    await expect(app.getByRole('heading', { name: 'coffeerating', exact: true })).toBeVisible();
    await expect(app.getByRole('button', { name: 'Sign in with GitHub' })).toBeVisible();
    await expect(app.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test('release serves its build identity and installable PWA assets', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  const commit = await page.locator('meta[name="build-commit"]').getAttribute('content');
  expect(commit).toMatch(/^[a-f0-9]{40}$/);
  if (process.env.RELEASE_COMMIT_SHA) expect(commit).toBe(process.env.RELEASE_COMMIT_SHA);

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifestResponse = await page.request.get(manifestHref!);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('CoffeeRating');
  for (const icon of manifest.icons) {
    const iconResponse = await page.request.get(icon.src);
    expect(iconResponse.status()).toBe(200);
    expect(iconResponse.headers()['content-type']).toContain(icon.type);
  }

  // A missing registration script can pass the build while leaving the PWA inert.
  await expect.poll(() => page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.some((registration) => registration.active?.state === 'activated');
  })).toBe(true);
});

test('signed-in: lands past the sign-in wall', async ({ app }) => {
  test.skip(!hasSession, 'no E2E fixture session configured (set PAS_E2E_SESSION_TOKEN)');
  // The app cleared the auth hash on init; a signed-in app should not present a
  // sign-in call-to-action as its primary content.
  await expect(app.locator('#root')).not.toBeEmpty();
  await expect(app.getByRole('button', { name: /sign in/i })).toHaveCount(0);
});
