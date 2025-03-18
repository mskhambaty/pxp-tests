import { test } from '../fixtures/fixtures';
import { createCampaignPayload } from '../payloads/createCampaignPayload';

test.only('should succesfully update campaign description', async ({
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
    fundraiser_name + 'new edit',
  );
  await panXpanApi.deleteCampaign({ campaign_id: campaign_id.toString() });
});
