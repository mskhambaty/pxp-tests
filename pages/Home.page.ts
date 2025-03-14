/* eslint-disable playwright/no-wait-for-timeout */
import { expect, type Locator, type Page } from '@playwright/test';

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

  async signupUser(email: string, password: string): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForTimeout(2000);
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

  async loginUser(email: string, password: string): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForTimeout(2000);
    await this.loginButton.click();
    await this.loginWithEmailButton.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await Promise.all([
      this.page.waitForResponse((res) => res.status() == 200 && res.url().includes('login')),
      this.loginButton.last().click(),
      this.page.waitForTimeout(5000),
    ]);
  }

  async claimCampaign(link: string, email: string): Promise<void> {
    await this.page.goto(link);
    await this.page.waitForTimeout(5000);
    await this.page.getByPlaceholder('Enter email address').fill(email);
    await this.page.getByRole('button', { name: 'Claim campaign' }).click();
    await expect(this.page.getByText('Access to this page is restricted')).toBeVisible();
    await this.page.goto('/');
  }
}
