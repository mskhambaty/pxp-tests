import { test, expect } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';
import { CampaignEditPage } from '../../pages/CampaignEdit.page';

// This spec verifies that an organizer can edit a campaign’s basic info
// from the dashboard and that the changes persist.

test.describe('Campaign Edit Flow', () => {
  test('edit campaign title and description', async ({ page }) => {
    const dashboard = new OrganizerDashboardPage(page);
    const editPage = new CampaignEditPage(page);
    // Navigate to organizer dashboard and log in via stored state or UI
    await dashboard.goto();
    // Select the first campaign (replace with actual name used in seeding)
    const campaignName = 'My Test Campaign';
    await dashboard.selectCampaign(campaignName);
    // Use left nav to open Edit tab
    await dashboard.openNavTab('edit');
    // Update basic info
    const newTitle = `Updated ${Date.now()}`;
    const newDesc = 'This is an updated short description.';
    await editPage.updateBasicInfo(newTitle, newDesc);
    // Return to dashboard and assert title updated
    await dashboard.openNavTab('dashboard');
    await expect(page.getByRole('listitem').filter({ hasText: newTitle })).toBeVisible();
  });
});