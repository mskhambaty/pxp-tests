import { test, expect } from '../fixtures/fixtures';
import { createCampaignPayload } from '../payloads/createCampaignPayload';

test('should succesfully transfer campaign to another user', async ({
  panXpanApi,
  yopmail,
  homePage,
  organizerDashboardPage,
  viewport,
}) => {
  const fundraiser_name = `Test fund raiser ${new Date().toISOString()}`;
  let isMobile = false;
  if (viewport?.width === 390) {
    isMobile = true;
  }
  await homePage.signupUser(yopmail.email, 'testtest123', isMobile);
  const { campaign_id } = await panXpanApi.createCampaign({
    ...createCampaignPayload,
    fundraiser_name,
  });
  const transferLink = await panXpanApi.transferCampaign({
    campaign_id: campaign_id.toString(),
    transfer_to_email: yopmail.email,
  });
  await homePage.claimCampaign(transferLink, yopmail.email);
  await organizerDashboardPage.goto();
  await expect(organizerDashboardPage.getFundraiserWithName(fundraiser_name)).toBeVisible();
});
