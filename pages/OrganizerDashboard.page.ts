import { expect, Page } from '@playwright/test';

type NavTab =
  | 'dashboard'
  | 'edit'
  | 'collectibles'
  | 'rewards'
  | 'achievements'
  | 'transactions'
  | 'payouts';

export class OrganizerDashboardPage {
  constructor(private page: Page) {}

  private baseUrl(): string {
    return process.env.PXP_BASE_URL ?? 'https://app.panxpan.com';
  }

  /**
   * Navigate to organizer dashboard and ensure we're logged in.
   * Uses PXP_USERNAME / PXP_PASSWORD (GitHub Actions secrets) if login is needed.
   */
  async goto(): Promise<void> {
    const base = this.baseUrl();
    await this.page.goto(`${base}/`);

    // Detect "Log In" button; Wix can render as button or link.
    const loginBtn = this.page.getByRole('button', { name: /log in|sign in/i }).first();
    const loginLnk = this.page.getByRole('link', { name: /log in|sign in/i }).first();

    const isLoggedOut =
      (await loginBtn.isVisible().catch(() => false)) ||
      (await loginLnk.isVisible().catch(() => false));

    if (isLoggedOut) {
      const email = process.env.PXP_USERNAME;
      const password = process.env.PXP_PASSWORD;

      if (!email || !password) {
        throw new Error('Missing PXP_USERNAME or PXP_PASSWORD env vars for organizer login.');
      }

      if (await loginBtn.isVisible().catch(() => false)) {
        await loginBtn.click().catch(() => {});
      } else if (await loginLnk.isVisible().catch(() => false)) {
        await loginLnk.click().catch(() => {});
      }

      // Try label-based fields first, then fallbacks.
      const emailInput =
        this.page.getByLabel(/email/i).first() ??
        this.page.locator('input[type="email"]').first();
      const passwordInput =
        this.page.getByLabel(/password/i).first() ??
        this.page.locator('input[type="password"]').first();

      await emailInput.fill(email);
      await passwordInput.fill(password);

      const submit =
        this.page.getByRole('button', { name: /log in|sign in|continue/i }).first();
      await submit.click();

      // Wait for redirect; fallback: direct navigation
      await this.page
        .waitForURL(/\/account\/organizer-dashboard/i, { timeout: 30000 })
        .catch(async () => {
          await this.page.goto(`${base}/account/organizer-dashboard`);
        });
    } else {
      await this.page.goto(`${base}/account/organizer-dashboard`);
    }

    // Confirm left nav loaded
    await this.page.locator('#dashboardTab').first().waitFor({ timeout: 30000 });
  }

  /**
   * From the campaign list page, select a specific campaign by name,
   * or click the first campaign if not found.
   */
  async selectCampaign(fundraiserName?: string): Promise<void> {
    // Try list items/links that include the campaign name.
    if (fundraiserName) {
      const namedItem = this.page
        .locator('li, a, [role="listitem"]')
        .filter({ hasText: fundraiserName })
        .first();
      if ((await namedItem.count()) > 0) {
        await namedItem.click();
      } else {
        // Fallback to first visible list item or card link
        const firstItem = this.page.locator('li, a, [role="listitem"]').first();
        await firstItem.click();
      }
    } else {
      const firstItem = this.page.locator('li, a, [role="listitem"]').first();
      await firstItem.click();
    }

    // Wait for the left nav on the campaign dashboard
    await this.page.locator('#dashboardTab').first().waitFor({ timeout: 30000 });
  }

  /**
   * Click a left-nav tab by semantic name mapped to the stable IDs you set.
   */
  async openNavTab(t
