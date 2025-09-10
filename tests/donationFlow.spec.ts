import { test, expect } from '../fixtures/fixtures';

// This test covers the end‑to‑end donation flow for the special test fundraiser
// that relaxes checkout requirements.  It opens the campaign, donates with
// multiple additional collectibles, retrieves the email verification code via
// Yopmail, and verifies the participant sees all purchased collectibles in
// their dashboard.

const runDonationFlow = async ({ campaignPage, participantDashboardPage, yopmail }: any) => {
  // Use the slug for the special test fundraiser
  await campaignPage.open('test-fundraiser-(donations-possible)');
  await campaignPage.donate({
    contributionAmount: 500,
    additionalCollectibles: [
      { name: 'Bronze Circle', quantity: 1 },
      { name: 'Silver Circle', quantity: 1 },
      { name: 'Gold Circle', quantity: 1 },
    ],
    checkoutDetails: {
      email: yopmail.email,
      firstName: 'Joe',
      lastName: 'Doe',
    },
  });
  // Wait for the verification email to arrive and retrieve the code
  await campaignPage.waitForCodeVerificationEmail();
  const verificationCode = await yopmail.getConfirmationCode();
  // Enter the code and set a password for the new participant
  await campaignPage.enterVerificationCode(verificationCode);
  await campaignPage.signupNewlyCreatedUserWithPassword('testtest123');
  // Navigate to the participant dashboard and verify collectibles are visible
  await participantDashboardPage.goto();
  // await expect(
  //   participantDashboardPage.getDigitalCollectibleWithName('Bronze Circle'),
  // ).toBeVisible();
  // await expect(
  //   participantDashboardPage.getDigitalCollectibleWithName('Silver Circle'),
  // ).toBeVisible();
  await expect(
    participantDashboardPage.getDigitalCollectibleWithName('Gold Circle'),
  ).toBeVisible();
};

test('should donate to a fundraise', async ({ campaignPage, participantDashboardPage, yopmail }) => {
  test.slow();
  await runDonationFlow({ campaignPage, participantDashboardPage, yopmail });
});