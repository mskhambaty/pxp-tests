import { test, expect } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';
import { CollectiblePage } from '../../pages/Collectible.page';

// This spec covers creating and editing collectibles on the organizer dashboard.

test.describe('Collectibles Management', () => {
  test('create and update paid collectible', async ({ page }) => {
    const dashboard = new OrganizerDashboardPage(page);
    const collectibles = new CollectiblePage(page);
    // Navigate and open campaign
    await dashboard.goto();
    const campaignName = 'My Test Campaign';
    await dashboard.selectCampaign(campaignName);
    // Navigate to collectibles tab via side nav
    await dashboard.openNavTab('collectibles');
    // Create a new paid collectible using a placeholder image path (to be provided in fixtures)
    const collectibleName = `Test Collectible ${Date.now()}`;
    await collectibles.createPaidCollectible({
      name: collectibleName,
      price: 50,
      imagePath: undefined, // rely on AI generation
      description: 'A beautiful badge',
      style: 'Illustration',
      metricAmount: 1,
    });
    // Edit the collectible amount
    await collectibles.editPaidCollectibleAmount(collectibleName, 75);
  });
});