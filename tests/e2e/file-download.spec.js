/**
 * tests/e2e/file-download.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests for file download functionality.
 * Tags: @download @regression
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { test, expect } = require('../../fixtures/fixtures');
const path = require('path');
const fs   = require('fs');

test.describe('File Download Tests @download @regression', () => {

  test('TC-DL-01: Download a file and verify it exists @smoke', async ({ page }) => {
    await page.goto('/download');

    // Locate the first downloadable link
    const downloadLink = page.locator('a').first();
    const fileName = await downloadLink.innerText();

    // Trigger download and wait for it to complete
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadLink.click(),
    ]);

    // Save to our downloads directory
    const downloadPath = path.join(process.cwd(), 'downloads', fileName.trim());
    await download.saveAs(downloadPath);

    // Verify file was downloaded
    expect(fs.existsSync(downloadPath)).toBe(true);
    const stats = fs.statSync(downloadPath);
    expect(stats.size).toBeGreaterThan(0);

    // Cleanup
    fs.unlinkSync(downloadPath);
  });

  test('TC-DL-02: Download filename matches link text', async ({ page }) => {
    await page.goto('/download');

    const links = await page.locator('a').all();
    expect(links.length).toBeGreaterThan(0);

    // Test first link only for speed
    const expectedName = (await links[0].innerText()).trim();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      links[0].click(),
    ]);

    expect(download.suggestedFilename()).toBe(expectedName);
    await download.cancel(); // Don't actually save; we verified the name
  });

  test('TC-DL-03: Multiple files are listed for download', async ({ page }) => {
    await page.goto('/download');
    const count = await page.locator('a').count();
    expect(count).toBeGreaterThan(0);
  });
});
