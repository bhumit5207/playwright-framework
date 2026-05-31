/**
 * helpers/logger.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Winston logger used across all page objects and tests.
 * Log level is controlled via the LOG_LEVEL environment variable.
 * Outputs to console (coloured) and to a rolling file under logs/.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure the logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const { combine, timestamp, colorize, printf, json } = format;

/** Human-readable format for the console. */
const consoleFormat = printf(({ level, message, timestamp: ts }) => {
  return `[${ts}] ${level}: ${message}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    // ── Console (coloured) ──────────────────────────────────────────────────
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat,
      ),
    }),

    // ── File: combined log ──────────────────────────────────────────────────
    new transports.File({
      filename: path.join(logsDir, 'test-run.log'),
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
      format: combine(timestamp(), json()),
    }),

    // ── File: errors only ───────────────────────────────────────────────────
    new transports.File({
      filename: path.join(logsDir, 'errors.log'),
      level: 'error',
      format: combine(timestamp(), json()),
    }),
  ],
});

module.exports = logger;
