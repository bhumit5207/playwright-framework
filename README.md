# 🎭 Playwright Automation Framework

A **production-ready**, enterprise-grade test automation framework built with [Playwright](https://playwright.dev/) and JavaScript, following the **Page Object Model (POM)** design pattern.

---

## 📁 Folder Structure

```
playwright-automation-framework/
│
├── .github/
│   └── workflows/
│       └── playwright.yml          # GitHub Actions CI workflow
│
├── data/
│   ├── test-data.json              # Centralised test data
│   └── sample-upload.txt           # File used in upload tests
│
├── fixtures/
│   └── fixtures.js                 # Custom Playwright fixtures (DI for page objects)
│
├── helpers/
│   ├── ApiHelper.js                # Reusable API request wrapper
│   ├── custom-reporter.js          # Custom Playwright reporter
│   ├── global-setup.js             # Runs once before the suite
│   ├── global-teardown.js          # Runs once after the suite
│   ├── logger.js                   # Winston logger
│   └── utils.js                    # General-purpose utilities
│
├── pages/
│   ├── BasePage.js                 # Abstract base with shared methods
│   ├── LoginPage.js                # Login page object
│   ├── FormPage.js                 # Forms, dropdowns, checkboxes, upload
│   └── AdvancedPages.js            # Alerts, Frames, Tables, DragDrop, Windows
│
├── tests/
│   ├── e2e/
│   │   ├── login.spec.js           # Login tests
│   │   ├── forms.spec.js           # Form control tests
│   │   ├── advanced-interactions.spec.js  # Alerts, frames, windows, drag-drop, tables
│   │   └── file-download.spec.js   # File download tests
│   └── api/
│       └── api-validation.spec.js  # API tests using reqres.in
│
├── reports/                        # Generated test reports (gitignored)
├── screenshots/                    # Failure screenshots (gitignored)
├── videos/                         # Failure videos (gitignored)
├── traces/                         # Playwright traces (gitignored)
├── downloads/                      # Downloaded files from tests (gitignored)
│
├── .env                            # Environment variables (gitignored)
├── .env.example                    # Template for .env
├── .gitignore
├── playwright.config.js            # Main Playwright configuration
├── package.json
└── README.md
```

---

## ⚙️ Setup

### Prerequisites

- **Node.js** v18+
- **npm** v9+

### Install

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd playwright-automation-framework

# 2. Install npm dependencies
npm install

# 3. Install Playwright browsers
npx playwright install

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your values
```

---

## 🚀 Running Tests

### All tests (all browsers)
```bash
npm test
# or
npx playwright test
```

### Single spec file
```bash
npx playwright test tests/e2e/login.spec.js
```

### Specific browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Tagged tests
```bash
npx playwright test --grep @smoke
npx playwright test --grep @regression
npx playwright test --grep "@api"
npx playwright test --grep "@login"
```

### Headed mode (see the browser)
```bash
npm run test:headed
# or
npx playwright test --headed
```

### Debug mode (step-through with Playwright Inspector)
```bash
npm run test:debug
# or
npx playwright test --debug
```

### Parallel execution
```bash
npm run test:parallel          # 4 workers (default)
npx playwright test --workers=8
```

### Serial execution (1 worker)
```bash
npm run test:serial
```

### Interactive UI mode
```bash
npm run test:ui
```

---

## 📊 Reports

| Type | Command | Location |
|------|---------|----------|
| HTML | `npm run test:report` | `reports/html/index.html` |
| JUnit XML | Auto-generated | `reports/junit/results.xml` |
| JSON | Auto-generated | `reports/json/results.json` |
| Custom | Auto-generated | `reports/custom/*.json` |

```bash
# Open the HTML report
npx playwright show-report reports/html
```

---

## 🔧 Configuration

All configuration is in `playwright.config.js`. Key settings:

| Setting | Default | Env Variable |
|---------|---------|--------------|
| Base URL | `https://the-internet.herokuapp.com` | `BASE_URL` |
| Headless | `true` | `HEADLESS` |
| Workers | `4` | `WORKERS` |
| Retries | `0` (2 on CI) | — |
| Test timeout | `60s` | `TEST_TIMEOUT` |
| Expect timeout | `10s` | `EXPECT_TIMEOUT` |

---

## 🧪 Test Suites

| Suite | File | Tags |
|-------|------|------|
| Login | `tests/e2e/login.spec.js` | `@smoke @regression @login` |
| Forms & Controls | `tests/e2e/forms.spec.js` | `@forms @regression` |
| Advanced Interactions | `tests/e2e/advanced-interactions.spec.js` | `@advanced @regression` |
| File Download | `tests/e2e/file-download.spec.js` | `@download @regression` |
| API Validation | `tests/api/api-validation.spec.js` | `@api @smoke @regression` |

---

## 🏗️ Framework Architecture

### Page Object Model (POM)

Each page/feature area has a dedicated class:

```
BasePage  ←  LoginPage
          ←  FormPage
          ←  AlertPage
          ←  FramePage
          ←  TablePage
          ←  DragDropPage
          ←  WindowPage
```

**BasePage** provides 40+ reusable methods covering navigation, interactions, waits, assertions, screenshots, and more.

### Custom Fixtures

All page objects are injected via Playwright fixtures:

```js
const { test, expect } = require('../fixtures/fixtures');

test('login works', async ({ loginPage }) => {
  await loginPage.open();
  await loginPage.login('user', 'pass');
  await loginPage.assertLoginSuccess();
});
```

Available fixtures:
- `loginPage` — LoginPage instance
- `formPage` — FormPage instance  
- `alertPage` — AlertPage instance
- `framePage` — FramePage instance
- `tablePage` — TablePage instance
- `dragDropPage` — DragDropPage instance
- `windowPage` — WindowPage instance
- `apiHelper` — ApiHelper instance
- `authenticatedPage` — pre-logged-in Page
- `testUser` — random faker-generated user data

---

## 🔁 CI/CD

The `.github/workflows/playwright.yml` workflow:

1. **Smoke tests** on Chromium (fast feedback)
2. **Regression tests** on Chromium + Firefox + WebKit in parallel
3. **API tests** independently
4. Uploads HTML reports as artifacts
5. Publishes reports to GitHub Pages on `main` branch

Set these secrets in GitHub:
- `BASE_URL`
- `VALID_USERNAME`
- `VALID_PASSWORD`
- `API_BASE_URL`

---

## 📝 Coding Standards

- **async/await** throughout — no `.then()` chains
- **No hardcoded selectors** in test files — all in page objects
- **Environment variables** for all credentials and URLs
- **JSDoc** comments on all public methods
- Descriptive **test IDs** (`TC-LOGIN-01`, `TC-API-07`, etc.)
- **Tags** on every test (`@smoke`, `@regression`, `@api`, etc.)
- `logger.*` calls instead of `console.log`

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/my-test`
2. Add tests following the POM pattern
3. Tag tests with `@smoke` and/or `@regression`
4. Run `npm run lint` before committing
5. Open a PR — CI will run automatically
