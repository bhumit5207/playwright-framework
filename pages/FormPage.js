/**
 * pages/FormPage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object covering various HTML form controls:
 *   – Text inputs / textareas
 *   – Select dropdowns
 *   – Checkboxes
 *   – Radio buttons
 *   – File upload
 * Targets pages on the-internet.herokuapp.com.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');
const logger = require('../helpers/logger');

class FormPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Dropdown locators (https://the-internet.herokuapp.com/dropdown) ────
    this.dropdown = page.locator('#dropdown');

    // ── Checkbox locators (https://the-internet.herokuapp.com/checkboxes) ──
    this.checkboxes = page.locator('input[type="checkbox"]');

    // ── File upload locators (https://the-internet.herokuapp.com/upload) ───
    this.fileInput      = page.locator('#file-upload');
    this.uploadButton   = page.locator('#file-submit');
    this.uploadedFiles  = page.locator('#uploaded-files');

    // ── Key press page ─────────────────────────────────────────────────────
    this.keyPressResult = page.locator('#result');
    this.keyPressInput  = page.locator('#target');

    // ── Dynamic controls (https://…/dynamic_controls) ─────────────────────
    this.enableCheckbox = page.locator('#checkbox input');
    this.toggleCheckboxBtn = page.locator("button[onclick='swapCheckbox()']");
    this.enableInputBtn    = page.locator("button[onclick='swapInput()']");
    this.dynamicInput      = page.locator('#input-example input');
    this.message           = page.locator('#message');
  }

  // ── Dropdown page ─────────────────────────────────────────────────────────

  async openDropdownPage() {
    await this.navigateTo('/dropdown');
  }

  async selectDropdownOption(label) {
    logger.info(`Selecting dropdown option: ${label}`);
    await this.dropdown.selectOption({ label });
  }

  async selectDropdownByValue(value) {
    await this.dropdown.selectOption({ value });
  }

  async getSelectedDropdownText() {
    // Get the inner text of the selected <option>
    return this.dropdown.evaluate((el) => el.options[el.selectedIndex].text);
  }

  async assertDropdownSelection(expectedLabel) {
    const selected = await this.getSelectedDropdownText();
    expect(selected).toBe(expectedLabel);
  }

  // ── Checkboxes page ───────────────────────────────────────────────────────

  async openCheckboxesPage() {
    await this.navigateTo('/checkboxes');
  }

  /** Check the checkbox at a given 1-based index (1 or 2 on this demo page). */
  async checkByIndex(index) {
    logger.info(`Checking checkbox at index ${index}`);
    await this.checkboxes.nth(index - 1).check();
  }

  async uncheckByIndex(index) {
    await this.checkboxes.nth(index - 1).uncheck();
  }

  async isCheckboxChecked(index) {
    return this.checkboxes.nth(index - 1).isChecked();
  }

  async assertCheckboxState(index, checked) {
    if (checked) {
      await expect(this.checkboxes.nth(index - 1)).toBeChecked();
    } else {
      await expect(this.checkboxes.nth(index - 1)).not.toBeChecked();
    }
  }

  // ── File upload page ──────────────────────────────────────────────────────

  async openFileUploadPage() {
    await this.navigateTo('/upload');
  }

  async uploadFile(filePath) {
    logger.info(`Uploading: ${filePath}`);
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }

  async getUploadedFileName() {
    return this.uploadedFiles.innerText();
  }

  async assertFileUploaded(fileName) {
    await expect(this.uploadedFiles).toContainText(fileName);
  }

  // ── Key press page ────────────────────────────────────────────────────────

  async openKeyPressPage() {
    await this.navigateTo('/key_presses');
  }

  async pressKeyAndVerify(key) {
    await this.page.keyboard.press(key);
    return this.keyPressResult.innerText();
  }

  // ── Dynamic controls page ─────────────────────────────────────────────────

  async openDynamicControlsPage() {
    await this.navigateTo('/dynamic_controls');
  }

  async toggleCheckboxVisibility() {
    await this.toggleCheckboxBtn.click();
    // Wait for the loading indicator to disappear
    await this.message.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async enableInput() {
    await this.enableInputBtn.click();
    await this.message.waitFor({ state: 'visible', timeout: 10_000 });
  }

  async assertInputEnabled() {
    await expect(this.dynamicInput).toBeEnabled();
  }

  async assertInputDisabled() {
    await expect(this.dynamicInput).toBeDisabled();
  }
}

module.exports = FormPage;
