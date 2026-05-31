/**
 * helpers/utils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * General-purpose utility functions used across the framework.
 * Covers: date/time helpers, string manipulation, random data,
 * file I/O, retries, and assertion wrappers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');
const logger = require('./logger');

// ── Date / Time ───────────────────────────────────────────────────────────────

/** Return the current date as YYYY-MM-DD. */
const getCurrentDate = () => new Date().toISOString().split('T')[0];

/** Return the current timestamp as YYYYMMDD_HHmmss (safe for filenames). */
const getTimestamp = () =>
  new Date().toISOString().replace(/T/, '_').replace(/:/g, '').split('.')[0];

/** Add N days to a date and return the ISO string. */
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

// ── Random data ───────────────────────────────────────────────────────────────

/** Generate a random integer between min (inclusive) and max (inclusive). */
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

/** Return a random item from an array. */
const randomFrom = (arr) => arr[randomInt(0, arr.length - 1)];

/** Generate a random alphanumeric string of given length. */
const randomString = (length = 8) =>
  Math.random().toString(36).substring(2, 2 + length);

/** Generate random user data using faker. */
const generateUser = () => ({
  firstName: faker.person.firstName(),
  lastName:  faker.person.lastName(),
  email:     faker.internet.email(),
  phone:     faker.phone.number(),
  address:   faker.location.streetAddress(),
  city:      faker.location.city(),
  zip:       faker.location.zipCode(),
  password:  faker.internet.password({ length: 12, memorable: true }),
});

// ── String helpers ────────────────────────────────────────────────────────────

/** Capitalise the first letter of a string. */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/** Trim and normalise whitespace (collapse internal spaces). */
const normalizeWhitespace = (str) => str.trim().replace(/\s+/g, ' ');

/** Convert a string to a URL-friendly slug. */
const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── File I/O ──────────────────────────────────────────────────────────────────

/** Read a JSON file and return the parsed object. */
const readJson = (filePath) => {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  return JSON.parse(fs.readFileSync(abs, 'utf-8'));
};

/** Write an object to a JSON file (creates parent dirs if needed). */
const writeJson = (filePath, data, pretty = true) => {
  const abs = path.resolve(filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
};

/** Read a text file as a string. */
const readFile = (filePath) => fs.readFileSync(path.resolve(filePath), 'utf-8');

/** Ensure a directory exists, creating it recursively if needed. */
const ensureDir = (dirPath) => {
  const abs = path.resolve(dirPath);
  if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
  return abs;
};

// ── Retry helper ──────────────────────────────────────────────────────────────

/**
 * Retry an async function up to `maxRetries` times with an optional delay.
 * @param {Function} fn         Async function to retry
 * @param {number}   maxRetries Maximum number of attempts (default 3)
 * @param {number}   delayMs    Delay between retries in ms (default 1000)
 */
const retry = async (fn, maxRetries = 3, delayMs = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn(`Retry attempt ${attempt}/${maxRetries} failed: ${err.message}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
};

// ── Wait helpers ──────────────────────────────────────────────────────────────

/** Promise-based sleep. Use sparingly — prefer Playwright's built-in waits. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Environment ───────────────────────────────────────────────────────────────

/** Return an env var or a default value (throws if required and missing). */
const getEnv = (key, defaultValue, required = false) => {
  const value = process.env[key] ?? defaultValue;
  if (required && (value === undefined || value === null || value === '')) {
    throw new Error(`Required environment variable "${key}" is not set.`);
  }
  return value;
};

// ── Test helpers ──────────────────────────────────────────────────────────────

/**
 * Parse a table on the page and return it as an array of row-objects.
 * @param {import('@playwright/test').Page} page
 * @param {string} tableSelector  CSS selector for the <table>
 */
const parseHtmlTable = async (page, tableSelector) => {
  return page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return [];
    const headers = Array.from(table.querySelectorAll('thead th')).map((th) =>
      th.innerText.trim(),
    );
    return Array.from(table.querySelectorAll('tbody tr')).map((row) => {
      const cells = Array.from(row.querySelectorAll('td')).map((td) =>
        td.innerText.trim(),
      );
      return headers.reduce((obj, h, i) => {
        obj[h] = cells[i] ?? '';
        return obj;
      }, {});
    });
  }, tableSelector);
};

/**
 * Verify an array of strings is sorted alphabetically.
 * @param {string[]} arr
 * @param {'asc'|'desc'} order
 */
const isSorted = (arr, order = 'asc') => {
  for (let i = 0; i < arr.length - 1; i++) {
    const cmp = arr[i].localeCompare(arr[i + 1]);
    if (order === 'asc' && cmp > 0) return false;
    if (order === 'desc' && cmp < 0) return false;
  }
  return true;
};

module.exports = {
  // Date/time
  getCurrentDate, getTimestamp, addDays,
  // Random
  randomInt, randomFrom, randomString, generateUser,
  // String
  capitalize, normalizeWhitespace, slugify,
  // File I/O
  readJson, writeJson, readFile, ensureDir,
  // Control flow
  retry, sleep,
  // Environment
  getEnv,
  // Test
  parseHtmlTable, isSorted,
};
