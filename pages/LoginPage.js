/**
 * pages/LoginPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the Login page (https://the-internet.herokuapp.com/login).
 * Encapsulates all selectors and actions related to authentication.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');
const logger = require('../helpers/logger');

class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Locators ────────────────────────────────────────────────────────────
    // Using semantic locators where possible (role / label / placeholder)
    this.usernameInput  = page.getByLabel('Username');
    this.passwordInput  = page.getByLabel('Password');
    this.loginButton    = page.getByRole('button', { name: 'Login' });
    this.flashMessage   = page.locator('#flash');
    this.logoutButton   = page.getByRole('link',   { name: 'Logout' });
    this.pageHeader     = page.locator('h2');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Open the login page. */
  async open() {
    await this.navigateTo('/login');
    logger.info('Login page opened');
  }

  /**
   * Fill and submit the login form.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    logger.info(`Logging in as "${username}"`);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Log in with credentials stored in environment variables. */
  async loginWithEnvCredentials() {
    await this.login(
      process.env.VALID_USERNAME,
      process.env.VALID_PASSWORD,
    );
  }

  /** Click the Logout button. */
  async logout() {
    logger.info('Logging out');
    await this.logoutButton.click();
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  /** Return the text of the flash / notification banner. */
  async getFlashMessage() {
    await this.flashMessage.waitFor({ state: 'visible' });
    return this.flashMessage.innerText();
  }

  // ── Assertions ────────────────────────────────────────────────────────────

  /** Assert that the flash message indicates a successful login. */
  async assertLoginSuccess() {
    await expect(this.flashMessage).toContainText('You logged into a secure area!');
    await expect(this.logoutButton).toBeVisible();
  }

  /** Assert that the flash message indicates a failed login. */
  async assertLoginFailure() {
    await expect(this.flashMessage).toContainText('Your username is invalid!');
  }

  /** Assert that we are on the login page. */
  async assertOnLoginPage() {
    await expect(this.page).toHaveURL(/.*login/);
    await expect(this.pageHeader).toContainText('Login Page');
  }

  /** Assert the secure area page is visible after login. */
  async assertOnSecureArea() {
    await expect(this.page).toHaveURL(/.*secure/);
    await expect(this.pageHeader).toContainText('Secure Area');
  }
}

module.exports = LoginPage;
