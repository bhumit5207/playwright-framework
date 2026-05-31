/**
 * pages/BasePage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Abstract base class shared by every page object.
 * Centralises common interactions: navigation, waits, screenshots, assertions,
 * and rich logging so individual page objects stay lean.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { expect } = require('@playwright/test');
const logger = require('../helpers/logger');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page  Playwright Page instance
   */
  constructor(page) {
    this.page = page;
    this.timeout = parseInt(process.env.ACTION_TIMEOUT) || 15_000;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  /** Navigate to a URL (absolute or relative to baseURL). */
  async navigateTo(url) {
    logger.info(`Navigating to: ${url}`);
    // Default to DOMContentLoaded for faster navigation; individual pages
    // should wait for specific elements if they require full load.
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /** Reload the current page. */
  async reloadPage() {
    logger.info('Reloading page');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  /** Go back in browser history. */
  async goBack() {
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  /** Return the current page URL. */
  async getCurrentUrl() {
    return this.page.url();
  }

  /** Return the page <title>. */
  async getPageTitle() {
    return this.page.title();
  }

  // ── Element interactions ──────────────────────────────────────────────────

  /** Click an element located by the given selector. */
  async clickElement(selector) {
    logger.debug(`Clicking: ${selector}`);
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: this.timeout });
    await this.page.locator(selector).click();
  }

  /**
   * Click a Playwright `Locator` with a safe fallback to `force: true` when
   * a normal click fails (e.g. overlay intercepts pointer events).
   * @param {import('@playwright/test').Locator} locator
   */
  async clickLocator(locator) {
    try {
      await locator.waitFor({ state: 'visible', timeout: this.timeout });
      await locator.click();
      return;
    } catch (err) {
      logger.warn(`Click failed: ${err.message}. Trying DOM click via evaluate()`);
    }

    // Try invoking the click via page DOM (sometimes bypasses overlays)
    try {
      await this.removeBlockingOverlays();
      await locator.evaluate((el) => el.click());
      return;
    } catch (err) {
      logger.warn(`DOM click failed: ${err.message}. Falling back to force click.`);
    }

    // Last resort: force the click
    await locator.click({ force: true });
  }

  /**
   * Attempt to click by CSS selector string. This bypasses Playwright's
   * locator waiting and can succeed when overlays intercept pointer events.
   * Order: try normal locator.click(), then DOM `querySelector(...).click()`,
   * then force click via locator.
   * @param {string} selector
   */
  async clickSelectorFallback(selector) {
    const loc = this.page.locator(selector);
    try {
      await loc.click();
      return;
    } catch (err) {
      logger.warn(`clickSelectorFallback normal click failed: ${err.message}`);
    }

    try {
      await this.removeBlockingOverlays();
      await this.page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el) el.click();
      }, selector);
      return;
    } catch (err) {
      logger.warn(`clickSelectorFallback DOM click failed: ${err.message}`);
    }

    // Final attempt: force
    await loc.click({ force: true });
  }

  /** Remove common blocking overlay elements that intercept pointer events. */
  async removeBlockingOverlays() {
    try {
      await this.page.evaluate(() => {
        const selectors = [
          '.tox-tinymce-aux', // TinyMCE helper overlay
          '.modal-backdrop',
          '.overlay',
          '.popover',
        ];
        for (const sel of selectors) {
          document.querySelectorAll(sel).forEach((el) => el.remove());
        }
        // Also clear any inline blocking styles
        document.querySelectorAll('[style*="pointer-events:"]')
          .forEach((el) => el.style.removeProperty('pointer-events'));
      });
    } catch (err) {
      logger.warn(`removeBlockingOverlays failed: ${err.message}`);
    }
  }

  /** Double-click an element. */
  async doubleClickElement(selector) {
    logger.debug(`Double-clicking: ${selector}`);
    await this.page.locator(selector).dblclick();
  }

  /** Right-click (context-menu) an element. */
  async rightClickElement(selector) {
    await this.page.locator(selector).click({ button: 'right' });
  }

  /** Click and hold (mouse down only). */
  async clickAndHold(selector) {
    await this.page.locator(selector).hover();
    await this.page.mouse.down();
  }

  /** Type text into an input field (clears first). */
  async typeText(selector, text) {
    logger.debug(`Typing "${text}" into: ${selector}`);
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: this.timeout });
    await this.page.locator(selector).clear();
    await this.page.locator(selector).fill(text);
  }

  /** Type text character-by-character (simulates real keystrokes). */
  async slowType(selector, text, delay = 50) {
    await this.page.locator(selector).click();
    await this.page.locator(selector).pressSequentially(text, { delay });
  }

  /** Clear an input field. */
  async clearField(selector) {
    await this.page.locator(selector).clear();
  }

  /** Read the visible text of an element. */
  async getElementText(selector) {
    return this.page.locator(selector).innerText();
  }

  /** Read the value of an input element. */
  async getInputValue(selector) {
    return this.page.locator(selector).inputValue();
  }

  /** Read an attribute value. */
  async getAttribute(selector, attribute) {
    return this.page.locator(selector).getAttribute(attribute);
  }

  /** Return true when the element is visible in the viewport. */
  async isElementVisible(selector) {
    return this.page.locator(selector).isVisible();
  }

  /** Return true when the element is enabled. */
  async isElementEnabled(selector) {
    return this.page.locator(selector).isEnabled();
  }

  /** Return true when a checkbox / radio is checked. */
  async isElementChecked(selector) {
    return this.page.locator(selector).isChecked();
  }

  // ── Keyboard & mouse ─────────────────────────────────────────────────────

  /** Press a keyboard key (e.g. 'Enter', 'Tab', 'Escape'). */
  async pressKey(key) {
    logger.debug(`Pressing key: ${key}`);
    await this.page.keyboard.press(key);
  }

  /** Hold a modifier key while executing an action callback. */
  async holdKeyAndClick(key, selector) {
    await this.page.keyboard.down(key);
    await this.clickElement(selector);
    await this.page.keyboard.up(key);
  }

  /** Hover over an element. */
  async hoverElement(selector) {
    await this.page.locator(selector).hover();
  }

  /** Scroll an element into the visible viewport. */
  async scrollToElement(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /** Scroll the page by a pixel offset. */
  async scrollBy(x, y) {
    await this.page.mouse.wheel(x, y);
  }

  // ── Select / dropdown ─────────────────────────────────────────────────────

  /** Select an <option> by its visible label. */
  async selectByLabel(selector, label) {
    logger.debug(`Selecting "${label}" in: ${selector}`);
    await this.page.locator(selector).selectOption({ label });
  }

  /** Select an <option> by its value attribute. */
  async selectByValue(selector, value) {
    await this.page.locator(selector).selectOption({ value });
  }

  /** Select an <option> by its zero-based index. */
  async selectByIndex(selector, index) {
    await this.page.locator(selector).selectOption({ index });
  }

  /** Return the currently selected option label. */
  async getSelectedOption(selector) {
    return this.page.locator(selector).inputValue();
  }

  // ── Checkboxes / radio buttons ────────────────────────────────────────────

  /** Check a checkbox (no-op if already checked). */
  async checkCheckbox(selector) {
    await this.page.locator(selector).check();
  }

  /** Uncheck a checkbox (no-op if already unchecked). */
  async uncheckCheckbox(selector) {
    await this.page.locator(selector).uncheck();
  }

  // ── File upload ───────────────────────────────────────────────────────────

  /** Set a file input to the given file path(s). */
  async uploadFile(selector, filePaths) {
    logger.info(`Uploading file(s): ${filePaths}`);
    await this.page.locator(selector).setInputFiles(filePaths);
  }

  // ── Waits ─────────────────────────────────────────────────────────────────

  /** Wait until an element is visible. */
  async waitForVisible(selector, timeout = this.timeout) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /** Wait until an element is hidden / detached. */
  async waitForHidden(selector, timeout = this.timeout) {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  /** Wait a fixed number of milliseconds (use sparingly). */
  async waitForTimeout(ms) {
    await this.page.waitForTimeout(ms);
  }

  /** Wait for the network to be idle. */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /** Wait for a URL pattern to match. */
  async waitForUrl(urlOrPattern, timeout = this.timeout) {
    await this.page.waitForURL(urlOrPattern, { timeout });
  }

  /** Wait for a response matching a URL pattern and return it. */
  async waitForApiResponse(urlPattern) {
    return this.page.waitForResponse(urlPattern);
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  /** Accept the next dialog (alert / confirm / prompt). */
  async acceptAlert() {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  /** Dismiss the next dialog. */
  async dismissAlert() {
    this.page.once('dialog', (dialog) => dialog.dismiss());
  }

  /** Accept a prompt with a specific text value. */
  async acceptPromptWithText(text) {
    this.page.once('dialog', (dialog) => dialog.accept(text));
  }

  /** Capture the dialog message before accepting. */
  async getAlertText() {
    return new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const msg = dialog.message();
        await dialog.accept();
        resolve(msg);
      });
    });
  }

  // ── Frames ────────────────────────────────────────────────────────────────

  /** Return a FrameLocator for CSS/name/URL. */
  getFrame(frameSelector) {
    return this.page.frameLocator(frameSelector);
  }

  /** Return a Frame object by its name attribute. */
  getFrameByName(name) {
    return this.page.frame({ name });
  }

  // ── New tabs / windows ────────────────────────────────────────────────────

  /**
   * Click a link that opens a new tab and return the new Page.
   * @param {string} selector  Element that triggers the new tab
   */
  async clickAndGetNewTab(selector) {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.page.locator(selector).click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    logger.info(`New tab opened: ${newPage.url()}`);
    return newPage;
  }

  /** Return all open pages in the current browser context. */
  getAllPages() {
    return this.page.context().pages();
  }

  // ── Screenshots ───────────────────────────────────────────────────────────

  /** Capture a full-page screenshot and save it to the screenshots directory. */
  async takeScreenshot(name) {
    const filePath = `screenshots/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filePath, fullPage: true });
    logger.info(`Screenshot saved: ${filePath}`);
    return filePath;
  }

  /** Capture a screenshot of a single element. */
  async takeElementScreenshot(selector, name) {
    const filePath = `screenshots/${name}-${Date.now()}.png`;
    await this.page.locator(selector).screenshot({ path: filePath });
    return filePath;
  }

  // ── Assertions (wrapped expect for reuse) ────────────────────────────────

  /** Assert the page URL matches a string or regex. */
  async assertUrl(expected) {
    await expect(this.page).toHaveURL(expected);
  }

  /** Assert the page <title> equals the expected string. */
  async assertTitle(expected) {
    await expect(this.page).toHaveTitle(expected);
  }

  /** Assert an element is visible. */
  async assertVisible(selector) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  /** Assert an element's text equals the expected string. */
  async assertText(selector, expected) {
    await expect(this.page.locator(selector)).toHaveText(expected);
  }

  /** Assert an element contains a substring. */
  async assertContainsText(selector, expected) {
    await expect(this.page.locator(selector)).toContainText(expected);
  }

  /** Assert an input's value equals the expected string. */
  async assertInputValue(selector, expected) {
    await expect(this.page.locator(selector)).toHaveValue(expected);
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  /** Drag a source element and drop it onto a target element. */
  async dragAndDrop(sourceSelector, targetSelector) {
    logger.debug(`Drag ${sourceSelector} → ${targetSelector}`);
    await this.page.locator(sourceSelector).dragTo(this.page.locator(targetSelector));
  }

  /**
   * Manual drag using mouse events (more control for complex scenarios).
   */
  async dragAndDropManual(sourceSelector, targetSelector) {
    const source = this.page.locator(sourceSelector);
    const target = this.page.locator(targetSelector);

    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    await this.page.mouse.move(
      sourceBox.x + sourceBox.width / 2,
      sourceBox.y + sourceBox.height / 2,
    );
    await this.page.mouse.down();
    await this.page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 10 },
    );
    await this.page.mouse.up();
  }

  // ── Utility ───────────────────────────────────────────────────────────────

  /** Execute arbitrary JavaScript in the page context. */
  async executeScript(script, ...args) {
    return this.page.evaluate(script, ...args);
  }

  /** Read a localStorage item. */
  async getLocalStorageItem(key) {
    return this.page.evaluate((k) => window.localStorage.getItem(k), key);
  }

  /** Set a localStorage item. */
  async setLocalStorageItem(key, value) {
    await this.page.evaluate(([k, v]) => window.localStorage.setItem(k, v), [key, value]);
  }

  /** Read a cookie by name. */
  async getCookie(name) {
    const cookies = await this.page.context().cookies();
    return cookies.find((c) => c.name === name);
  }

  /** Add cookies to the current browser context. */
  async setCookies(cookies) {
    await this.page.context().addCookies(cookies);
  }

  /** Clear all cookies in the current context. */
  async clearCookies() {
    await this.page.context().clearCookies();
  }

  /** Count the number of elements matching a selector. */
  async getElementCount(selector) {
    return this.page.locator(selector).count();
  }

  /** Get all text values of a repeated selector (e.g. table rows). */
  async getAllTexts(selector) {
    return this.page.locator(selector).allInnerTexts();
  }
}

module.exports = BasePage;
