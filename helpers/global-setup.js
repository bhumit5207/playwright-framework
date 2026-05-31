/**
 * helpers/global-setup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs ONCE before the entire test suite.
 * Use for: creating shared auth state, seeding DB, spinning up mock servers,
 * or any expensive one-time preparation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function globalSetup(config) {
  logger.info('═══════════════════════════════════════════════');
  logger.info('  Global Setup — Playwright Automation Framework');
  logger.info('═══════════════════════════════════════════════');
  logger.info(`Base URL     : ${process.env.BASE_URL}`);
  logger.info(`Browser      : ${process.env.BROWSER || 'chromium'}`);
  logger.info(`Workers      : ${process.env.WORKERS || 4}`);
  logger.info(`Headless     : ${process.env.HEADLESS !== 'false'}`);
  logger.info(`Environment  : ${process.env.NODE_ENV || 'development'}`);
  logger.info('───────────────────────────────────────────────');

  // ── Ensure output directories exist ──────────────────────────────────────
  const dirs = ['screenshots', 'videos', 'traces', 'downloads', 'logs',
                 'reports/html', 'reports/junit', 'reports/json', 'test-results'];
  dirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.debug(`Created directory: ${dir}`);
    }
  });

  // ── Optional: generate shared auth state ─────────────────────────────────
  // Uncomment if your tests need a pre-authenticated session.
  /*
  logger.info('Generating shared authentication state…');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(`${process.env.BASE_URL}/login`);
  await page.fill('#username', process.env.VALID_USERNAME);
  await page.fill('#password', process.env.VALID_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**\/secure');
  await page.context().storageState({ path: './helpers/auth-state.json' });
  await browser.close();
  logger.info('Auth state saved → helpers/auth-state.json');
  */

  logger.info('Global Setup complete ✓');
}

module.exports = globalSetup;
