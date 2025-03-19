# Playwright End-to-End Testing

This repository contains automated end-to-end (E2E) tests using [Playwright](https://playwright.dev/). The tests follow the **Page Object Model (POM)** design pattern and are integrated with **GitHub Actions**.

---

## 📌 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
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

- [Node.js](https://nodejs.org/)
- [Playwright](https://playwright.dev/)
- A package manager (npm, yarn, or pnpm)
- Git

---

## 📥 Installation

Clone the repository and install dependencies:

```sh
# Clone the repository
git clone https://github.com/mskhambaty/pxp-tests.git .

# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install --with-deps
```

---

## 🌍 Environment Variables

Before running the tests, configure your environment variables by renaming the `.env.local` file in the root directory to `.env`.

```sh
USER_NAME="your-username"
USER_PASSWORD="your-password"
API_KEY="your-api-key"
MAILGUN_API_KEY="your-mailgun-api-key"
MAILGUN_DOMAIN="your-mailgun-domain"
```

Fill in the values from your provided credentials.

---

## 📂 Project Structure

```
root/
│── tests/                  # Test scripts
│── custom-reporters/       # Playwright custom reporters
│── fixtures/               # Playwright custom fixtures
│── payloads/               # API payloads
│── pages/                  # Page Object Model (POM) classes
│── utils/                  # Utility functions
│── playwright.config.ts    # Playwright configuration
│── package.json            # Project dependencies
│── .github/workflows/      # GitHub Actions workflows
│── .env.local              # Environment variables (not committed)
```

---

## ▶️ Running Tests

To run Playwright tests locally:

```sh
npx playwright test
```

Run tests in headed mode:

```sh
npx playwright test --headed
```

Run tests in debug mode:

```sh
npx playwright test --debug
```

Run a single test file:

```sh
npx playwright test tests/donationFlow.spec.ts
```

Generate an HTML report:

```sh
npx playwright show-report
```

---

## 🛠️ Creating New Test Scripts

New test scripts should be placed inside the `tests/` directory and follow the POM pattern.

---

## 🔄 GitHub Actions Workflow

The repository includes two GitHub Actions workflows to automate test execution. One can be manually triggered `Playwright E2E Tests - On Demand` while the other one runs every day at midnight (UTC) `Playwright E2E Tests - On Schedule`

### Workflow Configuration

```yaml
name: Playwright E2E Tests - On Demand

on:
  workflow_dispatch:
    inputs:
      send_report_email:
        description: 'Send report email'
        required: false
        default: 'false'
        type: boolean
      send_slack_notification:
        description: 'Send Slack notification'
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
      SEND_SLACK_NOTIFICATION: ${{ github.event.inputs.send_slack_notification }}
      MAILGUN_API_KEY: ${{ secrets.MAILGUN_API_KEY }}
      MAILGUN_DOMAIN: ${{ secrets.MAILGUN_DOMAIN }}
      EMAIL_TO: ${{ secrets.EMAIL_TO }}
      GITHUB_RUN_ID: ${{ github.run_id }}
      GITHUB_REPOSITORY: ${{ github.repository }}
      GITHUB_SERVER_URL: ${{ github.server_url }}
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

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

This workflow:

- Runs tests on `ubuntu-latest`.
- Installs dependencies and browsers.
- Executes Playwright tests.
- Uploads the test report as an artifact.

---

## 🚀 Triggering the GitHub Actions Pipeline

To manually trigger the GitHub Actions workflow:

1. Navigate to your repository on GitHub.
2. Click on the **Actions** tab.
3. Locate the **Playwright E2E Tests - On Demand** workflow in the left sidebar.
4. Click on the **Run workflow** dropdown button.
5. (Optional) Set `send_report_email` to true or false as required.
6. (Optional) Set `send_slack_notification` to true or false as required.
7. Click the **Run workflow** button to start the pipeline.

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
