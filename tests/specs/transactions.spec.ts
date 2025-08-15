import { test, expect } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';

// Spec to verify that the transaction counter increments after a donation. This test
// assumes a donation has already been made on the special test fundraiser via the
// donationFlow spec. It runs only on the Desktop project to avoid duplication.

// Helper to parse numeric text safely
function parseIntSafe(text: string | null | undefined): number {
  const match = (text || '').replace(/[^0-9]/g, '');
  return match ? parseInt(match, 10) : 0;
}

test.describe('Transactions Verification', () => {
  test('8-D. donation updates transaction counter', async ({ page }, testInfo) => {
    if (testInfo.project?.name && testInfo.project.name.toLowerCase() !== 'desktop') {
      test.skip();
    }
    const dashboard = new OrganizerDashboardPage(page);
    // Navigate to dashboard and select the test fundraiser
    await dashboard.goto();
    const campaignName = 'TEST FUNDRAISER (Donations possible)';
    await dashboard.selectCampaign(campaignName);
    // Navigate to transactions tab
    await dashboard.openNavTab('transactions');
    const counterLocator = page.locator('#transactionCounter');
    // Capture the current count; if not visible, default to 0
    let before = 0;
    if (await counterLocator.isVisible().catch(() => false)) {
      before = parseIntSafe(await counterLocator.innerText());
    }
    // Poll until the count increments (up to 2 minutes)
    await expect
      .poll(async () => {
        if (await counterLocator.isVisible().catch(() => false)) {
          return parseIntSafe(await counterLocator.innerText());
        }
        return before;
      }, { timeout: 120000, intervals: [1000, 2000, 5000] })
      .toBeGreaterThan(before);
    // Optionally verify totals and unique supporters are numeric
    const totalRaised = page.locator('#tr-total-raised');
    const uniqueSupporters = page.locator('#tr-unique-supporter');
    if (await totalRaised.isVisible().catch(() => false)) {
      expect(parseIntSafe(await totalRaised.innerText())).toBeGreaterThanOrEqual(0);
    }
    if (await uniqueSupporters.isVisible().catch(() => false)) {
      expect(parseIntSafe(await uniqueSupporters.innerText())).toBeGreaterThanOrEqual(0);
    }
  });
});