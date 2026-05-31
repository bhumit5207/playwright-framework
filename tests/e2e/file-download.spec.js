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
    await page.waitForLoadState('domcontentloaded');

    // Locate the first downloadable link - skip GitHub links
    let downloadLink = null;
    const allLinks = await page.locator('a').all();
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href').catch(() => '');
      const text = await link.innerText().catch(() => '');
      const isVisible = await link.isVisible().catch(() => false);
      
      // Skip GitHub and social links, find actual download links
      if (isVisible && href && !href.includes('github') && !href.includes('http') && text && text.trim()) {
        downloadLink = link;
        break;
      }
    }

    if (!downloadLink) {
      throw new Error('No downloadable links found on /download page');
    }

    const fileName = await downloadLink.innerText();

    // Trigger download and wait for it to complete with extended timeout
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
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
    await page.waitForLoadState('domcontentloaded');

    // Get all visible download links (skip GitHub and social links)
    const allLinks = await page.locator('a').all();
    const downloadLinks = [];
    
    for (const link of allLinks) {
      const href = await link.getAttribute('href').catch(() => '');
      const text = await link.innerText().catch(() => '');
      const isVisible = await link.isVisible().catch(() => false);
      
      // Skip GitHub and social links
      if (isVisible && href && !href.includes('github') && !href.includes('http') && text && text.trim()) {
        downloadLinks.push(link);
      }
    }

    expect(downloadLinks.length).toBeGreaterThan(0);

    // Test first downloadable link only for speed
    const expectedName = (await downloadLinks[0].innerText()).trim();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      downloadLinks[0].click(),
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
