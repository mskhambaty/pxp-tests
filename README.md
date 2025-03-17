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

Run tests in headed mode (for debugging):

```sh
npx playwright test --headed
```

Run tests with slow motion:

```sh
npx playwright test --slow-mo=500
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

## 🔄 GitHub Actions Workflow

The repository includes a GitHub Actions workflow to automate test execution. The workflow uses environment variables stored as GitHub Secrets.
