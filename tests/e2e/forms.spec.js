/**
 * tests/e2e/forms.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests for:
 *   – Select dropdowns
 *   – Checkboxes
 *   – Radio buttons (via Key Presses page)
 *   – File upload
 *   – Dynamic controls (enable/disable input)
 * Tags: @forms @regression
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { test, expect } = require('../../fixtures/fixtures');
const path             = require('path');
const testData         = require('../../data/test-data.json');

test.describe('Form Controls Tests @forms @regression', () => {

  // ── DROPDOWN TESTS ────────────────────────────────────────────────────────

  test.describe('Dropdown', () => {

    test.beforeEach(async ({ formPage }) => {
      await formPage.openDropdownPage();
    });

    test('TC-DROP-01: Select option by label @smoke', async ({ formPage }) => {
      await formPage.selectDropdownOption('Option 1');
      const selected = await formPage.getSelectedDropdownText();
      expect(selected).toBe('Option 1');
    });

    test('TC-DROP-02: Select option by value', async ({ formPage }) => {
      await formPage.selectDropdownByValue('2');
      const selected = await formPage.getSelectedDropdownText();
      expect(selected).toBe('Option 2');
    });

    test('TC-DROP-03: Verify all dropdown options are present', async ({ formPage }) => {
      const allOptions = await formPage.dropdown.evaluate((el) =>
        Array.from(el.options).map((o) => o.text),
      );
      expect(allOptions).toContain('Option 1');
      expect(allOptions).toContain('Option 2');
    });

    test('TC-DROP-04: Data-driven dropdown selection', async ({ formPage }) => {
      for (const option of testData.dropdownOptions) {
        await formPage.selectDropdownByValue(option.value);
        await formPage.assertDropdownSelection(option.label);
      }
    });
  });

  // ── CHECKBOX TESTS ────────────────────────────────────────────────────────

  test.describe('Checkboxes', () => {

    test.beforeEach(async ({ formPage }) => {
      await formPage.openCheckboxesPage();
    });

    test('TC-CHK-01: Check a checkbox @smoke', async ({ formPage }) => {
      await formPage.checkByIndex(1);
      await formPage.assertCheckboxState(1, true);
    });

    test('TC-CHK-02: Uncheck a checkbox', async ({ formPage }) => {
      // Second checkbox is checked by default on this page
      await formPage.uncheckByIndex(2);
      await formPage.assertCheckboxState(2, false);
    });

    test('TC-CHK-03: Toggle checkbox state', async ({ formPage }) => {
      const initialState = await formPage.isCheckboxChecked(1);
      if (initialState) {
        await formPage.uncheckByIndex(1);
      } else {
        await formPage.checkByIndex(1);
      }
      const newState = await formPage.isCheckboxChecked(1);
      expect(newState).toBe(!initialState);
    });

    test('TC-CHK-04: Verify both checkboxes exist', async ({ formPage }) => {
      const count = await formPage.checkboxes.count();
      expect(count).toBe(2);
    });

    test('TC-CHK-05: Check all checkboxes', async ({ formPage }) => {
      const count = await formPage.checkboxes.count();
      for (let i = 1; i <= count; i++) {
        await formPage.checkByIndex(i);
        await formPage.assertCheckboxState(i, true);
      }
    });
  });

  // ── FILE UPLOAD TESTS ─────────────────────────────────────────────────────

  test.describe('File Upload', () => {

    test.beforeEach(async ({ formPage }) => {
      await formPage.openFileUploadPage();
    });

    test('TC-UPL-01: Upload a text file @smoke', async ({ formPage }) => {
      const filePath = path.join(process.cwd(), 'data', 'sample-upload.txt');
      await formPage.uploadFile(filePath);
      await formPage.assertFileUploaded('sample-upload.txt');
    });

    test('TC-UPL-02: File input is visible before upload', async ({ formPage }) => {
      await expect(formPage.fileInput).toBeVisible();
      await expect(formPage.uploadButton).toBeVisible();
    });
  });

  // ── DYNAMIC CONTROLS TESTS ────────────────────────────────────────────────

  test.describe('Dynamic Controls', () => {

    test.beforeEach(async ({ formPage }) => {
      await formPage.openDynamicControlsPage();
    });

    test('TC-DYN-01: Enable input dynamically', async ({ formPage }) => {
      await formPage.assertInputDisabled();
      await formPage.enableInput();
      await formPage.assertInputEnabled();
    });

    test('TC-DYN-02: Toggle checkbox visibility', async ({ formPage }) => {
      // The checkbox is visible initially; clicking Remove hides it
      const checkbox = formPage.page.locator('#checkbox');
      await expect(checkbox).toBeVisible();
      await formPage.toggleCheckboxVisibility();
    });
  });

  // ── KEY PRESS / KEYBOARD TESTS ────────────────────────────────────────────

  test.describe('Keyboard Interactions', () => {

    test.beforeEach(async ({ formPage }) => {
      await formPage.openKeyPressPage();
    });

    test('TC-KEY-01: Press Enter key', async ({ formPage }) => {
      const result = await formPage.pressKeyAndVerify('Enter');
      expect(result).toContain('ENTER');
    });

    test('TC-KEY-02: Press arrow keys', async ({ formPage }) => {
      const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const keyNames = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

      for (let i = 0; i < keys.length; i++) {
        await formPage.page.keyboard.press(keys[i]);
        const result = await formPage.keyPressResult.innerText();
        expect(result).toContain(keyNames[i]);
      }
    });

    test('TC-KEY-03: Press Tab key', async ({ formPage }) => {
      const result = await formPage.pressKeyAndVerify('Tab');
      expect(result).toContain('TAB');
    });
  });

  // ── MOUSE ACTIONS TESTS ───────────────────────────────────────────────────

  test.describe('Mouse Actions', () => {

    test('TC-MOUSE-01: Hover over element reveals content', async ({ page }) => {
      await page.goto('/hovers');
      const figures = page.locator('.figure');
      await expect(figures).toHaveCount(3);

      // Hover over first figure
      await figures.first().hover();

      // Caption should become visible on hover
      const caption = figures.first().locator('.figcaption');
      await expect(caption).toBeVisible();
    });

    test('TC-MOUSE-02: Right-click opens context menu', async ({ page }) => {
      // Context menus are tested at the JS level; Playwright intercepts them
      await page.goto('/context_menu');
      const hotspot = page.locator('#hot-spot');

      // Set up dialog listener before triggering right-click
      const dialogPromise = page.waitForEvent('dialog');
      await hotspot.click({ button: 'right' });
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('You selected a context menu');
      await dialog.accept();
    });
  });
});
