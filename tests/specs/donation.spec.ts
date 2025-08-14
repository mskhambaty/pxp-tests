import { test, expect } from '@playwright/test';
import { CampaignPage } from '../../pages/Campaign.page';

// Donation tests for desktop and mobile on the test fundraiser.  These
// correspond to the original [1-D] and [1-M] tests.  The campaign used
// here relaxes checkout requirements so that closing the card form still
// counts as a donation.

test.describe('Donations on test fundraiser', () => {
  const fundraiserSlug = 'test-fundraiser-(donations-possible)';
  const donationAmount = 25;

  test('Desktop: should donate to a fundraiser', async ({ page }) => {
    const campaign = new CampaignPage(page);
    await campaign.open(fundraiserSlug);
    await campaign.donate({
      contributionAmount: donationAmount,
      checkoutDetails: {
        email: `donor+${Date.now()}@example.com`,
        firstName: 'Desktop',
        lastName: 'Donor',
      },
    });
    // After donation, expect to land on the participant signup flow (or dashboard).  A generic assertion
    // to ensure the flow didn’t error out.
    await expect(page).not.toHaveURL(/error/i);
  });

  test('Mobile: should donate to a fundraiser', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const campaign = new CampaignPage(page);
    await campaign.open(fundraiserSlug);
    await campaign.donate({
      contributionAmount: donationAmount,
      checkoutDetails: {
        email: `donor.mobile+${Date.now()}@example.com`,
        firstName: 'Mobile',
        lastName: 'Donor',
      },
    });
    await expect(page).not.toHaveURL(/error/i);
    await context.close();
  });
});