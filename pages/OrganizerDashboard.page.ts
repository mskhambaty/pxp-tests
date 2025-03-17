/* eslint-disable playwright/no-wait-for-timeout */
import { expect, type Locator, type Page } from '@playwright/test';

export class OrganizerDashboardPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigates to the participant dashboard page.
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page.getByRole('button', { name: 'Log In' })).toBeHidden({ timeout: 10000 });
    await this.page.goto('/account/organizer-dashboard');
  }

  /**
   * Retrieves a locator for a fundraiser by its name.
   *
   * @param {string} name - The name of the fundraiser to locate.
   * @returns {Locator} The locator for the fundraiser with the specified name.
   */
  getFundraiserWithName(name: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: name });
  }

  async changeFundraiserTitleTo(fundraiser: string, newTitle: string) {
    if (!this.page.url().endsWith('/account/organizer-dashboard')) {
      await this.page.goto('/account/organizer-dashboard');
    }
    const createdFundraiser = this.page.getByRole('listitem').filter({ hasText: fundraiser });
    await expect(createdFundraiser.getByText('364 days left')).toBeVisible({ timeout: 20000 });
    await createdFundraiser.getByText('See details').click();
    await this.page.locator("input[name='my-fundraiser title']").fill(newTitle);
    await this.page.getByRole('link', { name: 'Preview' }).click();
    const pagePromise = this.page.context().waitForEvent('page');
    const newPage = await pagePromise;
    await expect(newPage.getByRole('heading', { name: newTitle }).first()).toBeVisible();
  }
}
