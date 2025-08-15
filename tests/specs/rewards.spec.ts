// Use the extended test fixtures to access custom page objects like
// organizerDashboardPage.  Import expect from the same module to keep
// consistency with other specs.
import { test, expect } from '../../fixtures/fixtures';
import { CollectiblePage } from '../../pages/Collectible.page';
import { RewardsPage } from '../../pages/Rewards.page';

// This spec adds a tier-wide reward to a collectible and verifies it is
// visible to a participant.  It assumes test users exist for organizer and
// participant roles and that login state is provided via storageState.

// The Rewards flow is currently disabled.  The existing test fundraiser requires
// manual teardown of rewards and the API does not expose reward deletion.  Once
// reward cleanup is available, re-enable this suite by removing `.skip()`.
test.describe('Rewards Flow', () => {
  test('7-D. add reward to collectible and verify participant sees it', async (
    { page, browser, organizerDashboardPage },
    testInfo,
  ) => {
    // Only run on Desktop project
    if (testInfo.project?.name && testInfo.project.name.toLowerCase() !== 'desktop') {
      test.skip();
    }
    const dashboard = organizerDashboardPage;
    const collectibles = new CollectiblePage(page);
    const rewards = new RewardsPage(page);
    // Navigate to organizer dashboard and select the special test campaign
    await dashboard.goto();
    const campaignName = 'TEST FUNDRAISER (Donations possible)';
    await dashboard.selectCampaign(campaignName);
    // Create a new collectible to attach the reward to; give it a unique name
    await dashboard.openNavTab('collectibles');
    const collectibleName = `Rewardable Collectible ${Date.now()}`;
    await collectibles.createPaidCollectible({
      name: collectibleName,
      price: 25,
      description: 'Rewardable badge',
      style: 'Abstract',
      metricAmount: 1,
    });
    // Navigate to rewards tab and add a tier-wide reward
    await dashboard.openNavTab('rewards');
    const rewardDescription = 'Exclusive Wallpaper';
    const rewardUrl = 'https://example.com/wallpaper.jpg';
    await rewards.addTierReward(collectibleName, rewardDescription, 'Link', rewardUrl);
    // Verify the reward appears for a participant
    const participantContext = await browser.newContext();
    const participantPage = await participantContext.newPage();
    const slug = 'test-fundraiser-(donations-possible)';
    await rewards.participantShouldSeeReward(
      participantPage,
      slug,
      rewardDescription,
      rewardUrl,
    );
    await participantContext.close();
    // Note: cleanup of the reward is not yet available via API or UI; it will persist.
  });
});