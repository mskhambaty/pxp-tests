import { test } from '../fixtures/fixtures';
import { createCampaignPayload } from '../payloads/createCampaignPayload';

// This legacy spec creates a test campaign via the PanXpan API, logs in as an organizer,
// edits the campaign title (and implicitly the description via the changeFundraiserTitleTo
// helper), and then cleans up the campaign.  It supports both desktop and mobile
// viewports via the `viewport` fixture.  The test uses USER_NAME and USER_PASSWORD
// environment variables for authentication.

test.describe.skip('legacy update campaign description (skipped)', () => {
// This legacy test is retained for reference but no longer runs.  The
// functionality is covered in tests/specs/campaign.spec.ts.
test('should successfully update campaign description', async ({
  panXpanApi,
  homePage,
  organizerDashboardPage,
  viewport,
}) => {
  const fundraiser_name = `Test fund raiser ${new Date().toISOString()}`;
  let isMobile = false;
  const { campaign_id } = await panXpanApi.createCampaign({
    ...createCampaignPayload,
    fundraiser_name,
  });
  if (viewport?.width === 390) {
    isMobile = true;
  }
  await homePage.loginUser(
    process.env.USER_NAME as string,
    process.env.USER_PASSWORD as string,
    isMobile,
  );
  await organizerDashboardPage.changeFundraiserTitleTo(
    fundraiser_name,
    `${fundraiser_name}new edit`,
  );
  await panXpanApi.deleteCampaign({ campaign_id: campaign_id.toString() });
});
});