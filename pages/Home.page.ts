/* eslint-disable playwright/no-wait-for-timeout */
import { type Locator, type Page } from '@playwright/test';

/**
 * Page object for the PanXpan home/login page.  It encapsulates the login
 * and signup flows used by the donation and organizer tests.  The Wix
 * authentication modal uses dynamic selectors, so this object uses role
 * queries where possible.
 */
export class HomePage {
  private page: Page;
  private loginButton: Locator;
  private signUpButton: Locator;
  private signUpWithEmailButton: Locator;
  private emailInput: Locator;
  private passwordInput: Locator;
  private loginWithEmailButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = this.page.getByRole('button', { name: 'Log In' });
    this.signUpButton = this.page.getByRole('button', { name: 'Sign Up' });
    this.signUpWithEmailButton = this.page.getByRole('button', { name: 'Sign up with email' });
    this.loginWithEmailButton = this.page.getByRole('button', { name: 'Log in with Email' });
    this.emailInput = this.page.locator("input[type='email']");
    this.passwordInput = this.page.locator("input[type='password']");
  }

  /**
   * Sign up a user via the Wix authentication modal.  Accepts an email
   * address and password.  Optionally toggles mobile mode which triggers
   * the burger menu before opening the login/signup dialog.
   */
  async signupUser(email: string, password: string, isMobile: boolean = false): Promise<void> {
    await this.page.goto('/');
    // Wait for home page to load and modals to render
    await this.page.waitForTimeout(2000);
    if (isMobile) {
      // Open burger menu to reveal login on mobile
      await this.page.locator('header button').first().click();
    }
    await this.loginButton.click();
    await this.signUpButton.click();
    await this.signUpWithEmailButton.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    // Submit registration and wait for a successful response
    await Promise.all([
      this.page.waitForResponse((res) => res.status() === 200 && res.url().includes('register')),
      this.signUpButton.click(),
      this.page.waitForTimeout(5000),
    ]);
    await this.page.goto('/');
  }

  /**
   * Log a user in using email/password.  Accepts the same mobile flag as
   * signupUser.  Waits for a successful login response before returning.
   */
  async loginUser(email: string, password: string, isMobile: boolean = false): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForTimeout(2000);
    if (isMobile) {
      await this.page.locator('header button').first().click();
    }
    await this.loginButton.click();
    await this.loginWithEmailButton.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await Promise.all([
      this.page.waitForResponse((res) => res.status() === 200 && res.url().includes('login')),
      // The login button appears twice in the modal; select the last instance
      this.loginButton.last().click(),
    ]);
    await this.page.waitForTimeout(5000);
  }

  /**
   * Claim a campaign via a transfer link.  This flow is used in the
   * deprecated transfer-campaign tests and remains for backward
   * compatibility.
   */
  async claimCampaign(link: string, email: string): Promise<void> {
    await this.page.goto(link);
    await this.page.waitForTimeout(5000);
    // Minimize Wix chat if it appears
    await this.page.addLocatorHandler(
      this.page.frameLocator("iframe[title='Wix Chat']").locator('#chat-messages-list'),
      async () => {
        await this.page
          .frameLocator("iframe[title='Wix Chat']")
          .locator("button[aria-label='Minimize Chat']")
          .click();
      },
    );
    await this.page.getByPlaceholder('Enter email address').fill(email);
    // eslint-disable-next-line playwright/no-force-option
    await this.page.getByRole('button', { name: 'Claim campaign' }).click({ force: true });
    await this.page.waitForTimeout(5000);
  }
}