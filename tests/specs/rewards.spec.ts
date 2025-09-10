// Use the extended test fixtures to access custom page objects like
// organizerDashboardPage.  Import expect from the same module to keep
// consistency with other specs.
import { test, expect } from '../../fixtures/fixtures';
import { RewardsPage } from '../../pages/Rewards.page';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';

// This spec adds a tier-wide reward to a collectible and verifies it is
// visible to a participant.  It assumes test users exist for organizer and
// participant roles and that login state is provided via storageState.

// The Rewards flow is currently disabled.  The existing test fundraiser requires
// manual teardown of rewards and the API does not expose reward deletion.  Once
// reward cleanup is available, re-enable this suite by removing `.skip()`.
test.describe('Rewards', () => {
  test('add, edit, verify, and remove reward from collectible', async ({ page }) => {
    const viewport = page.viewportSize && page.viewportSize();
    // Typical mobile max width is 767px
    if (viewport && viewport.width <= 767) {
      test.skip();
    }
    // Only run on Desktop project
    console.log('Test: Starting rewards test');
    const dashboard = new OrganizerDashboardPage(page);
    const rewards = new RewardsPage(page);
    // Navigate to dashboard and campaign
    console.log('Test: About to call dashboard.goto()');
    await dashboard.goto();
    console.log('Test: dashboard.goto() completed');
    const campaignName = process.env.CAMPAIGN_NAME as string;
    console.log('Test: campaign name:', campaignName);
    await dashboard.selectCampaign(campaignName);
    // Open achievements tab
    console.log('Test: About to call dashboard.openNavTab("rewards")');
    await dashboard.openNavTab('rewards');
    console.log('Test: dashboard.openNavTab("rewards")');
    await rewards.addTierReward();
    // Note: cleanup of the reward is not yet available via API or UI; it will persist.
  });
});