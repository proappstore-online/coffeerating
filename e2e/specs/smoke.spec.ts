import { test, expect, hasSession } from '../fixtures';

// Baseline behavioural smoke. tsc + a green build can't tell you the app boots —
// this opens it in a real browser and checks it mounts and doesn't crash. QA
// agents add per-feature specs alongside this file; they run against the same
// live deploy with the same signed-in fixture.
test('app boots and mounts without crashing', async ({ app, pageErrors }) => {
  await expect(app.locator('#root')).not.toBeEmpty();
  expect(pageErrors).toEqual([]);
});

test('signed-in: lands past the sign-in wall', async ({ app }) => {
  test.skip(!hasSession, 'no E2E fixture session configured (set PAS_E2E_SESSION_TOKEN)');
  // The app cleared the auth hash on init; a signed-in app should not present a
  // sign-in call-to-action as its primary content.
  await expect(app.locator('#root')).not.toBeEmpty();
  await expect(app.getByRole('button', { name: /sign in/i })).toHaveCount(0);
});
