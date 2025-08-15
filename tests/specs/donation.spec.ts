import { test } from '@playwright/test';
import { CampaignPage } from '../../pages/Campaign.page';

const TEST_FUNDRAISER_URL =
  'https://www.panxpan.com/projects/test-fundraiser-(donations-possible)';

test.describe('Donations on test fundraiser', () => {
  test('5-D. Desktop: should donate to a fundraiser', async ({ page }, testInfo) => {
    if (testInfo.project.name.toLowerCase() !== 'desktop') test.skip();

    const campaign = new CampaignPage(page);
    await campaign.donate({
      campaignUrl: TEST_FUNDRAISER_URL,
      contributionAmount: 25,
    });
  });

  test('6-M. Mobile: should donate to a fundraiser', async ({ page }, testInfo) => {
    if (testInfo.project.name.toLowerCase() !== 'mobile') test.skip();

    const campaign = new CampaignPage(page);
    await campaign.donate({
      campaignUrl: TEST_FUNDRAISER_URL,
      contributionAmount: 10,
    });
  });
});
