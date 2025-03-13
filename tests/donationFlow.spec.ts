import { test, expect } from '../fixtures/fixtures';

test('should donate to a fundraise', async ({
  campaignPage,
  participantDashboardPage,
  yopmail,
}) => {
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
  await campaignPage.waitForCodeVerificationEmail();
  const verificationCode = await yopmail.getConfirmationCode();
  await campaignPage.enterVerificationCode(verificationCode);
  await campaignPage.signupNewlyCreatedUserWithPassword('testtest123');
  await participantDashboardPage.goto();
  await expect(
    participantDashboardPage.getDigitalCollectibleWithName('Bronze Circle'),
  ).toBeVisible();
  await expect(
    participantDashboardPage.getDigitalCollectibleWithName('Silver Circle'),
  ).toBeVisible();
  await expect(participantDashboardPage.getDigitalCollectibleWithName('Gold Circle')).toBeVisible();
});
