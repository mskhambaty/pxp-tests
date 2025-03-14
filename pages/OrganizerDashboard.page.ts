import { type Locator, type Page } from '@playwright/test';

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
}
