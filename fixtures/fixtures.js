/**
 * fixtures/fixtures.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom Playwright fixtures that extend the base `test` object.
 * All page objects and helpers are provided as fixtures so tests
 * receive them via dependency injection — no manual `new` calls.
 *
 * Usage in a spec file:
 *   const { test, expect } = require('../fixtures/fixtures');
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { test: base, expect } = require('@playwright/test');
const LoginPage    = require('../pages/LoginPage');
const FormPage     = require('../pages/FormPage');
const { AlertPage, FramePage, TablePage, DragDropPage, WindowPage } = require('../pages/AdvancedPages');
const ApiHelper    = require('../helpers/ApiHelper');
const logger       = require('../helpers/logger');

// Re-export `expect` so test files can import both from this module
exports.expect = expect;

exports.test = base.extend({

  // ── Page object fixtures ──────────────────────────────────────────────────

  /** Provides a LoginPage instance bound to the current test's page. */
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  /** Provides a FormPage instance. */
  formPage: async ({ page }, use) => {
    await use(new FormPage(page));
  },

  /** Provides an AlertPage instance. */
  alertPage: async ({ page }, use) => {
    await use(new AlertPage(page));
  },

  /** Provides a FramePage instance. */
  framePage: async ({ page }, use) => {
    await use(new FramePage(page));
  },

  /** Provides a TablePage instance. */
  tablePage: async ({ page }, use) => {
    await use(new TablePage(page));
  },

  /** Provides a DragDropPage instance. */
  dragDropPage: async ({ page }, use) => {
    await use(new DragDropPage(page));
  },

  /** Provides a WindowPage instance. */
  windowPage: async ({ page }, use) => {
    await use(new WindowPage(page));
  },

  // ── API fixture ───────────────────────────────────────────────────────────

  /** Provides an ApiHelper bound to the Playwright request context. */
  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request));
  },

  // ── Authenticated page fixture ────────────────────────────────────────────

  /**
   * Provides a Page that is already logged in.
   * Tests using this fixture skip the login steps.
   */
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.open();
    await loginPage.loginWithEnvCredentials();
    await loginPage.assertOnSecureArea();
    logger.info('Pre-authenticated page ready for test');
    await use(page);
    // Cleanup: logout after each test that uses this fixture
    const lp = new LoginPage(page);
    try {
      await lp.logout();
    } catch {
      // Ignore logout errors during teardown
    }
  },

  // ── Data fixtures ─────────────────────────────────────────────────────────

  /** Provides fresh user test data for each test. */
  testUser: async ({}, use) => {
    const { faker } = require('@faker-js/faker');
    await use({
      firstName: faker.person.firstName(),
      lastName:  faker.person.lastName(),
      email:     faker.internet.email(),
      phone:     faker.phone.number(),
      address:   faker.location.streetAddress(),
      city:      faker.location.city(),
    });
  },
});
