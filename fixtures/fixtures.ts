import { test as base } from '@playwright/test';
import { PanXpanApi } from './panXpanApi';
import { CampaignPage } from '../pages/Campaign.page';
import { ParticipantDashboardPage } from '../pages/ParticipantDashboard.page';
import { HomePage } from '../pages/Home.page';
import { OrganizerDashboardPage } from '../pages/OrganizerDashboard.page';

// Extend the base test fixture to include our custom fixtures: PanXpanApi,
// page objects for campaign and dashboards, and a Yopmail helper for email
// verification.  These fixtures are used throughout the test suite.

export const test = base.extend<{
  panXpanApi: PanXpanApi;
  campaignPage: CampaignPage;
  participantDashboardPage: ParticipantDashboardPage;
  homePage: HomePage;
  organizerDashboardPage: OrganizerDashboardPage;
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
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  organizerDashboardPage: async ({ page }, use) => {
    await use(new OrganizerDashboardPage(page));
  },
  yopmail: async ({ browser }, use) => {
    const yopmailPage = await browser.newPage({
      viewport: { width: 1280, height: 720 },
    });
    // Handle cookie consent dialogs on Yopmail
    await yopmailPage.addLocatorHandler(yopmailPage.locator('.fc-dialog-container'), async () => {
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

// Ensure consistent higher default timeouts across all tests
test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(60_000);
});