import { test, expect, BrowserContext } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';
import { CollectiblePage } from '../../pages/Collectible.page';
import { RewardsPage } from '../../pages/Rewards.page';

// This spec adds a tier-wide reward to a collectible and verifies it is
// visible to a participant.  It assumes test users exist for organizer and
// participant roles and that login state is provided via storageState.

test.describe('Rewards Flow', () => {
  test('add reward to collectible and verify participant sees it', async ({ page, browser }) => {
    const dashboard = new OrganizerDashboardPage(page);
    const collectibles = new CollectiblePage(page);
    const rewards = new RewardsPage(page);

    // Navigate to organizer dashboard and select campaign
    await dashboard.goto();
    const campaignName = 'My Test Campaign';
    await dashboard.selectCampaign(campaignName);
    // Create a new collectible to attach the reward to
    await dashboard.openNavTab('collectibles');
    const collectibleName = `Rewardable Collectible ${Date.now()}`;
    await collectibles.createPaidCollectible({
      name: collectibleName,
      price: 25,
      description: 'Rewardable badge',
      style: 'Abstract',
      metricAmount: 1,
    });
    // Navigate to rewards tab
    await dashboard.openNavTab('rewards');
    // Add a tier-wide reward
    const rewardDescription = 'Exclusive Wallpaper';
    const rewardUrl = 'https://example.com/wallpaper.jpg';
    await rewards.addTierReward(collectibleName, rewardDescription, 'Link', rewardUrl);

    // Create a participant context to verify reward appears
    const participantContext = await browser.newContext({ storageState: 'state/participant.json' });
    const participantPage = await participantContext.newPage();
    // The campaign slug may be derived from the name; here we assume the slug is lowercased and hyphenated
    const slug = campaignName.toLowerCase().replace(/\s+/g, '-');
    await rewards.participantShouldSeeReward(participantPage, slug, rewardDescription, rewardUrl);
    await participantContext.close();
  });
});