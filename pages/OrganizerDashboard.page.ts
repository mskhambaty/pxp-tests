/* eslint-disable playwright/no-wait-for-timeout */
import { expect, Page } from '@playwright/test';

/**
 * Page object for the organizer dashboard.
 *
 * This implementation assumes your Wix developer has renamed key elements
 * using the IDs specified in the testing documentation. These IDs must
 * remain stable across deployments. The dashboard includes a left nav
 * (dashboardTab, editTab, collectiblesTab, rewardsTab, achievementsTab,
 * transactionsTab, payoutsTab) and a list of campaigns. It also exposes
 * quick‑action buttons on each campaign card (preview, edit, view and add
 * collectibles, rewards, achievements, transactions).
 */
export class OrganizerDashboardPage {
  constructor(private page: Page) {}

  /**
   * Navigate to the organizer dashboard. If the user is not logged in
   * (determined by presence of a Log In/Sign In button or link), this method
   * performs a login using the USER_NAME and USER_PASSWORD environment
   * variables. After authentication it navigates to the dashboard route. The
   * Playwright baseURL should already point to https://www.panxpan.com.
   */
  async goto(): Promise<void> {
    // Navigate to site root (baseURL defined in Playwright config)
    await this.page.goto('/');
    // Detect login controls; Wix may render them as buttons or links.
    const loginBtn = this.page.getByRole('button', { name: /log in|sign in/i }).first();
    const loginLnk = this.page.getByRole('link', { name: /log in|sign in/i }).first();
    const isLoggedOut =
      (await loginBtn.isVisible().catch(() => false)) ||
      (await loginLnk.isVisible().catch(() => false));
    if (isLoggedOut) {
      const email = process.env.USER_NAME;
      const password = process.env.USER_PASSWORD;
      if (!email || !password) {
        throw new Error('Missing USER_NAME or USER_PASSWORD environment variables for organizer login.');
      }
      // Open the login form (button or link)
      if (await loginBtn.isVisible().catch(() => false)) {
        await loginBtn.click().catch(() => {});
      } else if (await loginLnk.isVisible().catch(() => false)) {
        await loginLnk.click().catch(() => {});
      }
      // Fill credentials; prefer labelled inputs when available
      const emailInput = this.page.getByLabel(/email/i).first();
      const passwordInput = this.page.getByLabel(/password/i).first();
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(email);
      } else {
        await this.page.locator('input[type="email"]').first().fill(email);
      }
      if (await passwordInput.isVisible().catch(() => false)) {
        await passwordInput.fill(password);
      } else {
        await this.page.locator('input[type="password"]').first().fill(password);
      }
      // Submit the login form
      const submit = this.page.getByRole('button', { name: /log in|sign in|continue/i }).first();
      await submit.click();
      // Wait for redirect; if it fails, explicitly navigate to the organizer dashboard
      await this.page
        .waitForURL(/\/account\/organizer-dashboard/i, { timeout: 30000 })
        .catch(async () => {
          await this.page.goto('/account/organizer-dashboard');
        });
    } else {
      // Already authenticated; navigate directly to the dashboard route
      await this.page.goto('/account/organizer-dashboard');
    }
    // Confirm left nav loaded
    await this.page.locator('#dashboardTab').first().waitFor({ timeout: 30000 });
  }

  /**
   * Click a navigation tab in the dashboard’s left nav. All tabs have
   * predefined IDs. Throws if an unknown tab is provided.
   */
  async openNavTab(
    tab: 'dashboard' | 'edit' | 'collectibles' | 'rewards' | 'achievements' | 'transactions' | 'payouts',
  ): Promise<void> {
    const selectors: Record<string, string> = {
      dashboard: '#dashboardTab',
      edit: '#editTab',
      collectibles: '#collectiblesTab',
      rewards: '#rewardsTab',
      achievements: '#achievementsTab',
      transactions: '#transactionsTab',
      payouts: '#payoutsTab',
    };
    const selector = selectors[tab];
    if (!selector) throw new Error(`Unknown nav tab: ${tab}`);
    await this.page.locator(selector).click();
  }

  /**
   * Select a campaign from the dashboard list by its displayed name. Each
   * campaign renders as a list item (li) containing the campaign’s name.
   */
  async selectCampaign(fundraiser: string): Promise<void> {
    await this.page.getByRole('listitem').filter({ hasText: fundraiser }).first().click();
    await expect(this.page.locator('#dashboardTab')).toBeVisible();
  }

  /**
   * Change the title of a fundraiser (campaign) from the dashboard.
   *
   * @param fundraiser The existing name of the fundraiser to locate.
   * @param newTitle   The new title to set on the campaign edit form.
   */
  async changeFundraiserTitleTo(fundraiser: string, newTitle: string): Promise<void> {
    // Ensure on dashboard
    if (!this.page.url().includes('/account/organizer-dashboard')) {
      await this.page.goto('/account/organizer-dashboard');
    }
    // Locate card by name and open its edit action
    const card = this.page.getByRole('listitem').filter({ hasText: fundraiser }).first();
    const editButton = card.locator('#editCampaignButton');
    if (await editButton.count()) {
      await editButton.first().click();
    } else {
      await card.getByRole('button', { name: /edit/i }).click();
    }
    // Fill new title and save
    await this.page.locator('#campaignTitleInput').fill(newTitle);
    await this.page.locator('#saveChangesButton').click();
    // Verify toast
    const toast = this.page.locator('#toastNotification');
    await expect(toast).toContainText(/saved/i);
    // Go back and verify new title is displayed
    await this.page.goto('/account/organizer-dashboard');
    await expect(this.page.getByRole('listitem').filter({ hasText: newTitle })).toBeVisible();
  }

  /**
   * Click one of the quick action buttons on a campaign card while on the
   * dashboard list view. The action keys map to specific IDs that must be
   * set on the card buttons in Wix:
   *  - preview: #c-preview
   *  - editCampaign: #editCampaignButton
   *  - viewCollectibles: #d-collectibles-btn
   *  - addCollectible: #d-add-collectibles-btn
   *  - viewRewards: #d-rewards-btn
   *  - addReward: #d-add-rewards-btn
   *  - viewAchievements: #d-achievement-btn
   *  - addAchievement: #d-add-achievements-btn
   *  - viewTransactions: #d-view-transaction
   */
  async clickDashboardCardAction(
    action:
      | 'preview'
      | 'editCampaign'
      | 'viewCollectibles'
      | 'addCollectible'
      | 'viewRewards'
      | 'addReward'
      | 'viewAchievements'
      | 'addAchievement'
      | 'viewTransactions',
  ): Promise<void> {
    const selectors: Record<string, string> = {
      preview: '#c-preview',
      editCampaign: '#editCampaignButton',
      viewCollectibles: '#d-collectibles-btn',
      addCollectible: '#d-add-collectibles-btn',
      viewRewards: '#d-rewards-btn',
      addReward: '#d-add-rewards-btn',
      viewAchievements: '#d-achievement-btn',
      addAchievement: '#d-add-achievements-btn',
      viewTransactions: '#d-view-transaction',
    };
    const selector = selectors[action];
    if (!selector) throw new Error(`Unknown dashboard action: ${action}`);
    await this.page.locator(selector).click();
  }
}