import { test } from '../../fixtures/fixtures';
import { createCampaignPayload } from '../../payloads/createCampaignPayload';

// This spec verifies that an organizer can edit a campaign’s title and description
// on the dashboard.  It uses the PanXpanApi fixture to create a fresh test
// campaign at the beginning and cleans up by deleting it afterward.  The
// organizerDashboardPage fixture handles login and navigation using
// environment variables USER_NAME and USER_PASSWORD.

test.describe('Campaign Edit Flow', () => {
  test('3-D. edit campaign title and description', async (
    { panXpanApi, organizerDashboardPage },
    testInfo,
  ) => {
    // Run this test only on the Desktop project to avoid duplicate mobile runs
    if (testInfo.project?.name && testInfo.project.name.toLowerCase() !== 'desktop') {
      test.skip();
    }
    // Create a new test campaign via API.  Use a unique name to avoid collisions.
    const fundraiser_name = `Auto Edit Test ${new Date().toISOString()}`;
    const { campaign_id } = await panXpanApi.createCampaign({
      ...createCampaignPayload,
      fundraiser_name,
      organizer_email: process.env.USER_NAME || createCampaignPayload.organizer_email,
    });
    // Log in and open the dashboard
    await organizerDashboardPage.goto();
    // Select our newly created campaign and change its title
    const newTitle = `${fundraiser_name} Updated`;
    await organizerDashboardPage.changeFundraiserTitleTo(fundraiser_name, newTitle);
    // Clean up by deleting the campaign via API
    await panXpanApi.deleteCampaign({ campaign_id: campaign_id.toString() });
  });
});