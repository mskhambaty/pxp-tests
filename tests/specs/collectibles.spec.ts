import { test } from '../../fixtures/fixtures';
import { createCampaignPayload } from '../../payloads/createCampaignPayload';
import { CollectiblePage } from '../../pages/Collectible.page';

// This spec covers creating and editing a paid collectible on a new test campaign.
// It seeds a campaign via the API, logs in as the organizer, adds a collectible,
// then edits the collectible price.  Afterwards it cleans up the campaign via API.

test.describe('Collectibles Management', () => {
  test('4-D. create and update paid collectible', async (
    { panXpanApi, organizerDashboardPage, page },
    testInfo,
  ) => {
    // Run this spec only on the Desktop project
    if (testInfo.project?.name && testInfo.project.name.toLowerCase() !== 'desktop') {
      test.skip();
    }
    // Create a new test campaign via API
    const fundraiser_name = `Auto Collectible ${new Date().toISOString()}`;
    const { campaign_id } = await panXpanApi.createCampaign({
      ...createCampaignPayload,
      fundraiser_name,
      organizer_email: process.env.USER_NAME || createCampaignPayload.organizer_email,
    });
    // Login and open dashboard
    await organizerDashboardPage.goto();
    // Select our campaign
    await organizerDashboardPage.selectCampaign(fundraiser_name);
    // Navigate to collectibles tab
    await organizerDashboardPage.openNavTab('collectibles');
    const collectibles = new CollectiblePage(page);
    // Create a new paid collectible using AI generation (no imagePath provided)
    const collectibleName = `Collectible ${Date.now()}`;
    await collectibles.createPaidCollectible({
      name: collectibleName,
      price: 50,
      description: 'Test collectible description',
      style: 'Illustration',
      metricAmount: 1,
    });
    // Edit the collectible price
    await collectibles.editPaidCollectibleAmount(collectibleName, 75);
    // Clean up
    await panXpanApi.deleteCampaign({ campaign_id: campaign_id.toString() });
  });
});