/* eslint-disable playwright/no-wait-for-timeout */
import { type Locator, type Page } from '@playwright/test';

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

  async signupUser(email: string, password: string, isMobile: true | false = false): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForTimeout(2000);
    if (isMobile) {
      await this.page.locator('header button').first().click();
    }
    await this.loginButton.click();
    await this.signUpButton.click();
    await this.signUpWithEmailButton.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await Promise.all([
      this.page.waitForResponse((res) => res.status() == 200 && res.url().includes('register')),
      this.signUpButton.click(),
      this.page.waitForTimeout(5000),
    ]);
    await this.page.goto('/');
  }

  async loginUser(email: string, password: string, isMobile: true | false = false): Promise<void> {
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
      this.page.waitForResponse((res) => res.status() == 200 && res.url().includes('login')),
      this.loginButton.last().click(),
    ]);
    await this.page.waitForTimeout(5000);
  }

  async claimCampaign(link: string, email: string): Promise<void> {
    await this.page.goto(link);
    await this.page.waitForTimeout(5000);
    if (await this.page.locator('#chat-messages-list').isVisible()) {
      await this.page.locator("button[aria-label='Minimize Chat']").click();
    }
    await this.page.getByPlaceholder('Enter email address').fill(email);
    // eslint-disable-next-line playwright/no-force-option
    await this.page.getByRole('button', { name: 'Claim campaign' }).click({ force: true });
    await this.page.waitForTimeout(5000);
  }
}
