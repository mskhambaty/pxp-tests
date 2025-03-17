import { expect, type Locator, type Page } from '@playwright/test';

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
    await expect(this.page.getByRole('button', { name: 'Log In' })).toBeHidden({ timeout: 10000 });
    await this.page.goto('/account/participant-dashboard');
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
