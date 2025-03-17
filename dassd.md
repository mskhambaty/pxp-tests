# Playwright End-to-End Testing

This repository contains automated end-to-end (E2E) tests using [Playwright](https://playwright.dev/). The tests follow the **Page Object Model (POM)** design pattern and are integrated with **GitHub Actions** for CI/CD automation.

---

## 📌 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Creating New Test Scripts](#creating-new-test-scripts)
- [GitHub Actions Workflow](#github-actions-workflow)
- [Triggering the GitHub Actions Pipeline](#triggering-the-github-actions-pipeline)
- [Debugging & Troubleshooting](#debugging--troubleshooting)
- [Reporting](#reporting)
- [Maintaining Tests](#maintaining-tests)

---

## ✅ Prerequisites

Ensure you have the following installed:

- [Node.js (LTS)](https://nodejs.org/)
- [Playwright](https://playwright.dev/)
- A package manager (npm, yarn, or pnpm)
- Git

---

## 📥 Installation

Clone the repository and install dependencies:

```sh
# Clone the repository
git clone https://github.com/your-username/playwright-project.git
cd playwright-project

# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps
```

---

## 📂 Project Structure

```
root/
│── tests/               # Test scripts
│── custom-reporters/
│── fixtures/
│── payloads/
│── pages/               # Page Object Model (POM) classes
│── utils/               # Utility functions
│── playwright.config.ts # Playwright configuration
│── package.json         # Project dependencies
│── .github/workflows/   # GitHub Actions workflows
```

### Page Object Model (POM)

Each page is represented as a class inside the `pages/` directory:

```ts
// Example: pages/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  private page: Page;
  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('https://example.com/login');
  }

  async login(username: string, password: string) {
    await this.page.fill('#username', username);
    await this.page.fill('#password', password);
    await this.page.click('#login-button');
  }
}
```

---

## ▶️ Running Tests

To run Playwright tests locally:

```sh
npx playwright test
```

Run tests in headed mode (for debugging):

```sh
npx playwright test --headed
```

Run tests in a specific browser:

```sh
npx playwright test --browser=chromium
```

Run tests with slow motion:

```sh
npx playwright test --slow-mo=500
```

Run a single test file:

```sh
npx playwright test tests/example.spec.ts
```

Generate an HTML report:

```sh
npx playwright show-report
```

---

## 🛠️ Creating New Test Scripts

New test scripts should be placed inside the `tests/` directory and follow the POM pattern:

```ts
// Example: tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('User can log in successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('testuser', 'password123');
  expect(await page.url()).toContain('/dashboard');
});
```

---

## 🔄 GitHub Actions Workflow

The repository includes a GitHub Actions workflow to automate test execution.

### Workflow Configuration

```yaml
name: Playwright E2E Tests

on:
  workflow_dispatch:
    inputs:
      send_report_email:
        description: 'Send report email'
        required: false
        default: 'false'
        type: boolean

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    env:
      USER_NAME: ${{ secrets.USER_NAME }}
      USER_PASSWORD: ${{ secrets.USER_PASSWORD }}
      API_KEY: ${{ secrets.API_KEY }}
      SEND_REPORT_EMAIL: ${{ github.event.inputs.send_report_email }}
      MAILGUN_API_KEY: ${{ secrets.MAILGUN_API_KEY }}
      MAILGUN_DOMAIN: ${{ secrets.MAILGUN_DOMAIN }}
      EMAIL_TO: ${{ secrets.EMAIL_TO }}

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: lts/*
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report-${{ github.run_id }}
          path: playwright-report/
          retention-days: 5
```

---

## 🚀 Triggering the GitHub Actions Pipeline

To manually trigger the GitHub Actions workflow:

1. Navigate to your repository on GitHub.
2. Click on the **Actions** tab.
3. Locate the **Playwright E2E Tests** workflow in the left sidebar.
4. Click on the **Run workflow** dropdown button.
5. (Optional) Set `send_report_email` to `true` or `false` as required.
6. Click the **Run workflow** button to start the pipeline.

This will execute the Playwright tests as defined in the workflow.

---

## 🐞 Debugging & Troubleshooting

- Use `--headed` mode for debugging.
- Capture screenshots on failure using:
  ```ts
  await page.screenshot({ path: 'screenshot.png' });
  ```
- View Playwright traces:
  ```sh
  npx playwright show-trace trace.zip
  ```

---

## 📊 Reporting

- HTML reports are generated in the `playwright-report/` directory.
- Open the report locally:
  ```sh
  npx playwright show-report
  ```
- The GitHub Actions workflow stores reports as artifacts.

---

## 🔄 Maintaining Tests

- Regularly update dependencies:
  ```sh
  npm update
  ```
- Ensure selectors are stable.
- Group similar actions into helper functions.
- Keep test scripts atomic and independent.
- Review CI logs for flaky tests and fix them promptly.

---

## 🎯 Conclusion

This Playwright project uses the **Page Object Model (POM)** for structured and maintainable test scripts. GitHub Actions ensures smooth test execution in CI/CD. Follow best practices to ma
