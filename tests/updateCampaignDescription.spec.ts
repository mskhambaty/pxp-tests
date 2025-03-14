/* eslint-disable playwright/expect-expect */
import { test } from '../fixtures/fixtures';
import { createCampaignPayload } from '../payloads/createCampaignPayload';

test('should succesfully update campaign description', async ({
  panXpanApi,
  homePage,
  organizerDashboardPage,
}) => {
  const fundraiser_name = `Test fund raiser ${new Date().toISOString()}`;
  const { campaign_id } = await panXpanApi.createCampaign({
    ...createCampaignPayload,
    fundraiser_name,
  });
  await homePage.loginUser(process.env.USER_NAME as string, process.env.USER_PASSWORD as string);
  await organizerDashboardPage.changeFundraiserTitleTo(
    fundraiser_name,
    fundraiser_name + 'new edit',
  );
  await panXpanApi.deleteCampaign({ campaign_id: campaign_id.toString() });
});
