import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the participant dashboard.  This page displays digital
 * collectibles minted for the participant.  It relies on stable CSS
 * selectors or alt attributes to locate specific collectibles.
 */
export class ParticipantDashboardPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the participant dashboard.  Requires that the user is
   * already authenticated; waits for the login button to disappear before
   * visiting the dashboard route.  Handles minimizing the Wix chat widget.
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    // Ensure the user is logged in by waiting for the login button to hide
    await expect(this.page.getByRole('button', { name: 'Log In' })).toBeHidden({ timeout: 10000 });
    await this.page.goto('/account/participant-dashboard');
    // Minimize the chat widget if present
    await this.page.addLocatorHandler(
      this.page.frameLocator("iframe[title='Wix Chat']").locator('#chat-messages-list'),
      async () => {
        await this.page
          .frameLocator("iframe[title='Wix Chat']")
          .locator("button[aria-label='Minimize Chat']")
          .click();
      },
    );
    // Wait briefly for collectibles to load
    await this.page.waitForTimeout(5000);
  }

  /**
   * Locate a digital collectible card by its name.  The Wix layout wraps
   * each collectible in a `.card` element and uses the alt attribute of
   * the contained image to store the collectible’s name.
   */
  getDigitalCollectibleWithName(name: string): Locator {
    return this.page.locator('.card').filter({ has: this.page.locator(`[alt='${name}']`) });
  }
}