import { type Locator, type Page } from '@playwright/test';

export class ParticipantDashboardPage {
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
   * Retrieves a locator for a digital collectible card by its name.
   *
   * @param {string} name - The name of the digital collectible to locate.
   * @returns {Locator} The locator for the digital collectible card with the specified name.
   */
  getDigitalCollectibleWithName(name: string): Locator {
    return this.page.locator('.card').filter({ has: this.page.locator(`[alt='${name}']`) });
  }
}
