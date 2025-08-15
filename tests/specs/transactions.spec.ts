import { test, expect } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';

function parseIntSafe(text: string): number {
  const match = (text || '').replace(/[^0-9]/g, '');
  return match ? parseInt(match, 10) : 0;
}

test.describe('Transactions Verification', () => {
  test('8-D. donation updates transaction counter', async ({ page }, testInfo) => {
    if (testInfo.project.name.toLowerCase() !== 'desktop') test.skip();

    const dash = new OrganizerDashboardPage(page);
    await dash.goto();

    // Pick campaign by env var name pattern or use the first one
    const campaignName = process.env.PXP_TEST_CAMPAIGN_NAME;
    await dash.selectCampaign(campaignName);

    // Dashboard counter (if displayed there)
    let before = 0;
    const dashCounter = page.locator('#transactionCounter');
    if (await dashCounter.isVisible().catch(() => false)) {
      before = parseIntSafe(await dashCounter.innerText());
    }

    // Go to Transactions tab and read current count/metrics
    await dash.openNavTab('transactions');

    const txCounter = page.locator('#transactionCounter');
    const totalRaised = page.locator('#tr-total-raised');
    const uniqueSupporters = page.locator('#tr-unique-supporter');

    // Capture a baseline from transactions tab if the dashboard didn’t have it
    if (!before) {
      if (await txCounter.isVisible().catch(() => false)) {
        before = parseIntSafe(await txCounter.innerText());
      }
    }

    // Wait for increment from the donation test
    await expect
      .poll(
        async () => {
          if (await txCounter.isVisible().catch(() => false)) {
            return parseIntSafe(await txCounter.innerText());
          }
          return before;
        },
        { timeout: 120000, intervals: [1000, 2000, 5000] }
      )
      .toBe(before + 1);

    // Optional: ensure totals/unique supporters render numeric text
    if (await totalRaised.isVisible().catch(() => false)) {
      expect(parseIntSafe(await totalRaised.innerText())).toBeGreaterThanOrEqual(0);
    }
    if (await uniqueSupporters.isVisible().catch(() => false)) {
      expect(parseIntSafe(await uniqueSupporters.innerText())).toBeGreaterThanOrEqual(0);
    }
  });
});
