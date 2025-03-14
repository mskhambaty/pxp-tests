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
    await this.page.locator("[class*='Avatar']").first().click();
    await this.page.getByRole('link', { name: 'Dashboard' }).click();
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
    const pagePromise = this.page.context().waitForEvent('page');
    await this.page.waitForTimeout(5000);
    await this.page
      .getByRole('listitem')
      .filter({ hasText: fundraiser })
      .getByText('See details')
      .click();
    await this.page.locator("input[name='my-fundraiser title']").fill(newTitle);
    await this.page.getByRole('link', { name: 'Preview' }).click();
    const newPage = await pagePromise;
    await expect(newPage.getByRole('heading', { name: newTitle }).first()).toBeVisible();
  }
}
