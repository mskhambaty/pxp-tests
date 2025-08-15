import { test, expect } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';

test.describe('Campaign Edit Flow', () => {
  test('3-D. edit campaign title and description', async ({ page }, testInfo) => {
    if (testInfo.project.name.toLowerCase() !== 'desktop') test.skip();

    const dash = new OrganizerDashboardPage(page);
    await dash.goto();

    // Prefer targeting your newly created campaign via name pattern
    const newCampaignName = process.env.PXP_TEST_CAMPAIGN_NAME; // e.g., "AUTO-..."
    await dash.selectCampaign(newCampaignName);

    // Open Edit tab
    await dash.openNavTab('edit');

    // Update fields with a timestamp to make persistence obvious
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const newTitle = `Auto Title ${ts}`;
    const newDesc = `Auto Description ${ts}`;

    await page.locator('#campaignTitleInput').fill(newTitle);
    await page.locator('#campaignShortDescInput').fill(newDesc);
    await page.locator('#saveChangesButton').click();

    // Wait for toast
    await expect(page.locator('#toastNotification')).toBeVisible({ timeout: 15000 });

    // Reload and assert persistence
    await page.reload();
    await expect(page.locator('#campaignTitleInput')).toHaveValue(newTitle);
    await expect(page.locator('#campaignShortDescInput')).toHaveValue(newDesc);
  });
});
