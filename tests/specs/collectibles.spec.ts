import { test } from '../../fixtures/fixtures';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';
import { CollectiblePage } from '../../pages/Collectible.page';

// This spec covers creating and editing a paid collectible on a new test campaign.
// It seeds a campaign via the API, logs in as the organizer, adds a collectible,
// then edits the collectible price.  Afterwards it cleans up the campaign via API.

test.describe('Collectibles Management', () => {
  test('create and update paid collectible', async ({ page }) => {
    // Skip this test if running on a mobile viewport
    const viewport = page.viewportSize && page.viewportSize();
    // Typical mobile max width is 767px
    if (viewport && viewport.width <= 767) {
      test.skip();
    }
    console.log('Test: Starting collectibles test');
    const dashboard = new OrganizerDashboardPage(page);
    const collectibles = new CollectiblePage(page);
    // Navigate to dashboard and campaign
    console.log('Test: About to call dashboard.goto()');
    await dashboard.goto();
    console.log('Test: dashboard.goto() completed');
    const campaignName = process.env.CAMPAIGN_NAME as string;
    console.log('Test: campaign name:', campaignName);
    await dashboard.selectCampaign(campaignName);
    // Open achievements tab
    console.log('Test: About to call dashboard.openNavTab("collectibles")');
    await dashboard.openNavTab('collectibles');
    await page.waitForTimeout(3000);
    console.log('Test: dashboard.openNavTab("collectibles") completed');
    let collectibleName = 'Test collectible ' + Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 8);
    await collectibles.createPaidCollectible({
      name: collectibleName,
      price: 100,
      metricAmount: 100,
      rewardTitle: 'Thankyou letter',
    });
    await collectibles.editPaidCollectibleAmount(collectibleName, 200, 200);
  });
});