/**
 * helpers/global-teardown.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs ONCE after the entire test suite finishes.
 * Use for: cleaning up resources, generating summary reports,
 * sending Slack/Teams notifications, deleting test data from the DB, etc.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

async function globalTeardown(config) {
  logger.info('═══════════════════════════════════════════════');
  logger.info('  Global Teardown — Playwright Automation Framework');
  logger.info('═══════════════════════════════════════════════');

  // ── Read and log test result summary ─────────────────────────────────────
  const jsonReport = path.join(process.cwd(), 'reports/json/results.json');
  if (fs.existsSync(jsonReport)) {
    try {
      const results = JSON.parse(fs.readFileSync(jsonReport, 'utf-8'));
      const { stats } = results;
      if (stats) {
        logger.info(`Tests:    ${stats.expected ?? '-'} passed / ${stats.unexpected ?? '-'} failed`);
        logger.info(`Duration: ${((stats.duration ?? 0) / 1000).toFixed(1)}s`);
      }
    } catch {
      // JSON report may not exist on first run
    }
  }

  // ── Clean up temporary/auth state files ──────────────────────────────────
  const authState = path.join(process.cwd(), 'helpers/auth-state.json');
  if (fs.existsSync(authState)) {
    fs.unlinkSync(authState);
    logger.info('Auth state file removed');
  }

  // ── Notify external systems (CI badge, Slack, etc.) ───────────────────────
  // if (process.env.SLACK_WEBHOOK_URL) {
  //   await notifySlack(results);
  // }

  logger.info('Global Teardown complete ✓');
  logger.info('HTML report: npx playwright show-report reports/html');
  logger.info('═══════════════════════════════════════════════');
}

module.exports = globalTeardown;
