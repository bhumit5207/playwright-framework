/**
 * tests/e2e/login.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Test suite for Login functionality.
 * Covers: valid login, invalid login, logout, and navigation assertions.
 * Tags: @smoke, @regression, @login
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { test, expect } = require('../../fixtures/fixtures');
const testData         = require('../../data/test-data.json');

test.describe('Login Page Tests @smoke @regression', () => {

  // ── Hooks ─────────────────────────────────────────────────────────────────

  test.beforeEach(async ({ loginPage }) => {
    // Navigate to the login page before every test in this suite
    await loginPage.open();
    await loginPage.assertOnLoginPage();
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Capture a screenshot on failure automatically (also done by Playwright config)
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true });
      await testInfo.attach('failure-screenshot', {
        body: screenshot,
        contentType: 'image/png',
      });
    }
  });

  // ── Test cases ────────────────────────────────────────────────────────────

  test('TC-LOGIN-01: Successful login with valid credentials @smoke', async ({ loginPage }) => {
    const { username, password } = testData.validUsers[0];

    await loginPage.login(username, password);
    await loginPage.assertLoginSuccess();
    await loginPage.assertOnSecureArea();
  });

  test('TC-LOGIN-02: Login fails with invalid username @regression', async ({ loginPage }) => {
    await loginPage.login(
      testData.invalidUsers[0].username,
      testData.invalidUsers[0].password,
    );
    await loginPage.assertLoginFailure();
  });

  test('TC-LOGIN-03: Login fails with valid username, wrong password', async ({ loginPage }) => {
    await loginPage.login(
      testData.invalidUsers[1].username,
      testData.invalidUsers[1].password,
    );

    const flash = await loginPage.getFlashMessage();
    expect(flash).toContain('Your password is invalid!');
  });

  test('TC-LOGIN-04: Login button is present and enabled', async ({ loginPage }) => {
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.loginButton).toBeEnabled();
  });

  test('TC-LOGIN-05: Successful logout after login @smoke', async ({ loginPage }) => {
    await loginPage.login(
      process.env.VALID_USERNAME,
      process.env.VALID_PASSWORD,
    );
    await loginPage.assertLoginSuccess();

    await loginPage.logout();
    await loginPage.assertOnLoginPage();

    // Confirm logout flash message
    const flash = await loginPage.getFlashMessage();
    expect(flash).toContain('You logged out of the secure area!');
  });

  test('TC-LOGIN-06: Page title is correct', async ({ loginPage }) => {
    const title = await loginPage.getPageTitle();
    expect(title).toBe('The Internet');
  });

  test('TC-LOGIN-07: Login with env credentials via helper method', async ({ loginPage }) => {
    await loginPage.loginWithEnvCredentials();
    await loginPage.assertLoginSuccess();
  });

  test('TC-LOGIN-08: Secure area is not accessible without login', async ({ page }) => {
    await page.goto('/secure');
    // Should redirect back to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('TC-LOGIN-09: Data-driven login tests', async ({ loginPage }) => {
    // Iterate over all invalid user scenarios
    for (const user of testData.invalidUsers.slice(0, 2)) {
      await loginPage.open();
      await loginPage.login(user.username, user.password);
      const flash = await loginPage.getFlashMessage();
      expect(flash).toMatch(/invalid/i);
    }
  });

  test('TC-LOGIN-10: Pre-authenticated fixture test', async ({ authenticatedPage }) => {
    // This test receives a page that's already logged in via the fixture
    await expect(authenticatedPage).toHaveURL(/.*secure/);
  });
});
