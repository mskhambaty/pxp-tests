import { test as base } from '@playwright/test';
import { PanXpanApi } from './panXpanApi';
import { CampaignPage } from '../pages/Campaign.page';
import { ParticipantDashboardPage } from '../pages/ParticipantDashboard.page';

export const test = base.extend<{
  panXpanApi: PanXpanApi;
  campaignPage: CampaignPage;
  participantDashboardPage: ParticipantDashboardPage;
  yopmail: {
    email: string;
    getConfirmationCode: () => Promise<string>;
    page: import('@playwright/test').Page;
  };
}>({
  panXpanApi: async ({}, use) => {
    const api = new PanXpanApi('https://www.panxpan.com/_functions', process.env.API_KEY as string);
    await use(api);
  },
  campaignPage: async ({ page }, use) => {
    await use(new CampaignPage(page));
  },
  participantDashboardPage: async ({ page }, use) => {
    await use(new ParticipantDashboardPage(page));
  },
  yopmail: async ({ browser }, use) => {
    const yopmailPage = await browser.newPage();
    yopmailPage.addLocatorHandler(yopmailPage.locator('.fc-dialog-container'), async () => {
      await yopmailPage.getByRole('button', { name: 'Consent' }).click();
    });
    await yopmailPage.goto('https://yopmail.com/email-generator');

    let email = await yopmailPage.locator('#egen').textContent();
    if (!email) {
      throw new Error('Failed to retrieve email from Yopmail.');
    } else {
      email = email.split(';').pop() as string;
    }
    await yopmailPage.getByText('Check Inbox').click();
    const getConfirmationCode = async () => {
      await yopmailPage.locator('#refresh').click();
      const confirmationCode = await yopmailPage
        .frameLocator("iframe[name='ifmail']")
        .locator('bdi')
        .textContent();
      if (!confirmationCode) {
        throw new Error('Failed to retrieve confirmation code from Yopmail.');
      }
      return confirmationCode;
    };
    await use({ email, getConfirmationCode, page: yopmailPage });
    await yopmailPage.close();
  },
});

export { expect } from '@playwright/test';
