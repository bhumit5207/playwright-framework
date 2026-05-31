/**
 * eslint.config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * ESLint flat config (ESLint 9+).
 * Enforces consistent code style across the framework.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const js = require('@eslint/js');
const playwrightPlugin = require('eslint-plugin-playwright');

module.exports = [
  js.configs.recommended,

  // ── Global ignores ───────────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'reports/**',
      'test-results/**',
      'screenshots/**',
      'videos/**',
      'traces/**',
      'downloads/**',
      'logs/**',
    ],
  },

  // ── All JS files ─────────────────────────────────────────────────────────
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Promise: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      // ── Possible errors ──────────────────────────────────────────────────
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',

      // ── Best practices ───────────────────────────────────────────────────
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'warn',

      // ── Style ─────────────────────────────────────────────────────────────
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['warn', 'always'],
      'comma-dangle': ['warn', 'always-multiline'],
      'no-trailing-spaces': 'warn',
      'eol-last': ['warn', 'always'],
    },
  },

  // ── Test files ────────────────────────────────────────────────────────────
  {
    ...playwrightPlugin.configs['flat/recommended'],
    files: ['tests/**/*.spec.js', 'tests/**/*.test.js'],
    rules: {
      ...playwrightPlugin.configs['flat/recommended'].rules,
      'playwright/expect-expect': 'warn',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'warn',
    },
  },
];
