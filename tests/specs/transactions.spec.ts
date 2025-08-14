import { test } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';
import { CampaignPage } from '../../pages/Campaign.page';
import { TransactionsPage } from '../../pages/Transactions.page';

// Spec to verify transactions counter updates after a donation

test.describe('Transactions Verification', () => {
  test('donation updates transaction counter', async ({ page, browser }) => {
    const dashboard = new OrganizerDashboardPage(page);
    const transactions = new TransactionsPage(page);
    const campaignPage = new CampaignPage(page);
    // Navigate and select campaign
    await dashboard.goto();
    const campaignName = 'My Test Campaign';
    await dashboard.selectCampaign(campaignName);
    // Capture current transactions count if present
    await dashboard.openNavTab('transactions');
    let initialCount = 0;
    try {
      const counterText = await page.locator('#transactionCounter').innerText();
      initialCount = parseInt(counterText, 10) || 0;
    } catch {
      // If no counter yet, default to 0
    }
    // Perform a donation as participant (placeholder flow; may require real payment mocking)
    const participantContext = await browser.newContext({ storageState: 'state/participant.json' });
    const participantPage = await participantContext.newPage();
    const slug = campaignName.toLowerCase().replace(/\s+/g, '-');
    const campaignParticipant = new CampaignPage(participantPage);
    await campaignParticipant.open(slug);
    await campaignParticipant.donate({
      contributionAmount: 25,
      checkoutDetails: {
        email: 'donor@example.com',
        firstName: 'Donor',
        lastName: 'Test',
      },
    });
    await participantContext.close();
    // Refresh transactions page and verify count incremented
    await dashboard.openNavTab('transactions');
    await transactions.verifyCounter(initialCount + 1);
  });
});