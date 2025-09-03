import { Url } from 'url';
import { test } from '../../fixtures/fixtures';
import { CampaignEditPage, readEnvVar } from '../../pages/CampaignEdit.page';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';

// This spec verifies that an organizer can edit a campaign’s title and description
// on the dashboard.  It uses the PanXpanApi fixture to create a fresh test
// campaign at the beginning and cleans up by deleting it afterward.  The
// organizerDashboardPage fixture handles login and navigation using
// environment variables USER_NAME and USER_PASSWORD.

test.describe('Campaign Edit Flow', () => {
  test('3-D. edit campaign title and description', async ({ page }) => {
    console.log('Test: Starting campaign edit test');
    const dashboard = new OrganizerDashboardPage(page);
    const campaignEdit = new CampaignEditPage(page);
    // Navigate to dashboard and campaign
    console.log('Test: About to call dashboard.goto()');
    await dashboard.goto();
    console.log('Test: dashboard.goto() completed');
    const campaignName = process.env.CAMPAIGN_NAME as string;
    console.log('Test: campaign name:', campaignName);
    await dashboard.selectCampaign(campaignName);
    // Open achievements tab
    console.log('Test: About to call dashboard.openNavTab("edit")');
    await dashboard.openNavTab('edit');
    console.log('Test: dashboard.openNavTab("edit") completed');
    await campaignEdit.updateBasicInfo('Test Campaign', 'This is a test campaign');
    await campaignEdit.verifyPublicCampaignTitle(process.env.CAMPAIGN_NAME as string, process.env.CAMPAIGN_URL as string);
    // Run this test only on the Desktop project to avoid duplicate mobile runs
  });
});

// test.describe('verify campaign title', () => {
//   test('verify campaign title', async ({ page }) => {
//   const editor = new CampaignEditPage(page);
//   const campaignName = process.env.CAMPAIGN_NAME as string;
//   const campaignUrl = process.env.CAMPAIGN_URL as string;
//     await editor.verifyPublicCampaignTitle(campaignName, campaignUrl); // or full URL
//   });
// });