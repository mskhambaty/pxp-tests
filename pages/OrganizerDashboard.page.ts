/* eslint-disable playwright/no-wait-for-timeout */
import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Page object for the organizer dashboard.
 *
 * The new dashboard UI removes the brittle selectors that relied on dynamic
 * text (such as “364 days left”) and instead exposes stable element IDs.  Ask
 * your Wix developer to rename the relevant controls in the Properties & Events
 * panel to match the IDs used below.  Each ID should remain unique and
 * unchanged across deployments.
 */
export class OrganizerDashboardPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Click a navigation tab in the dashboard’s left nav.  All tabs have
   * predefined IDs (dashboardTab, editTab, collectiblesTab, rewardsTab,
   * achievementsTab, transactionsTab, payoutsTab).  If an invalid tab is
   * provided an error will be thrown.
   */
  async openNavTab(tab: 'dashboard' | 'edit' | 'collectibles' | 'rewards' | 'achievements' | 'transactions' | 'payouts'): Promise<void> {
    const tabIds: Record<string, string> = {
      dashboard: '#dashboardTab',
      edit: '#editTab',
      collectibles: '#collectiblesTab',
      rewards: '#rewardsTab',
      achievements: '#achievementsTab',
      transactions: '#transactionsTab',
      payouts: '#payoutsTab',
    };
    const selector = tabIds[tab];
    if (!selector) {
      throw new Error(`Unknown nav tab: ${tab}`);
    }
    await this.page.locator(selector).click();
  }

  /**
   * Navigate to the organizer dashboard.  This helper ensures that any
   * unauthenticated logins are bypassed by waiting for the login button to
   * disappear and then loads the dashboard route directly.
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
    // Wait for login button to hide to indicate the user is authenticated.
    await expect(this.page.getByRole('button', { name: 'Log In' })).toBeHidden({ timeout: 10000 });
    await this.page.goto('/account/organizer-dashboard');
  }

  /**
   * Change the title of a fundraiser (campaign) from the dashboard.
   *
   * @param fundraiser The existing name of the fundraiser to locate.
   * @param newTitle   The new title to set on the campaign edit form.
   */
  async changeFundraiserTitleTo(fundraiser: string, newTitle: string): Promise<void> {
    // Ensure we are on the organizer dashboard
    if (!this.page.url().includes('/account/organizer-dashboard')) {
      await this.page.goto('/account/organizer-dashboard');
    }

    // Locate the fundraiser card by its visible title text.  Each fundraiser
    // renders as a listitem (li) with the campaign name in its text.  We
    // filter to the card whose text contains the existing fundraiser name.
    const fundraiserCard = this.page.getByRole('listitem').filter({ hasText: fundraiser });

    // Click the card’s edit button to open the Edit Campaign screen.  The
    // button should have the ID `editCampaignButton`.  If the ID hasn’t been
    // applied yet, this locator falls back to a role‐based lookup.
    const editButton: Locator = fundraiserCard.locator('#editCampaignButton');
    const hasEditButton = await editButton.count();
    if (hasEditButton > 0) {
      await editButton.first().click();
    } else {
      await fundraiserCard.getByRole('button', { name: /edit/i }).click();
    }

    // Fill the new title using the renamed input ID `campaignTitleInput`.
    await this.page.locator('#campaignTitleInput').fill(newTitle);

    // Save changes via the renamed save button `saveChangesButton`.
    await this.page.locator('#saveChangesButton').click();

    // Wait for the toast notification to appear.  The toast container should
    // have the ID `toastNotification` and include the word “saved”.
    const toast = this.page.locator('#toastNotification');
    await expect(toast).toContainText(/saved/i);

    // Return to the organizer dashboard and verify the updated title appears.
    await this.page.goto('/account/organizer-dashboard');
    await expect(this.page.getByRole('listitem').filter({ hasText: newTitle })).toBeVisible();
  }

  /**
   * Select a campaign from the organizer dashboard by its displayed name.  When you log
   * in you are presented with a list of all campaigns associated with your
   * account.  Clicking a list item navigates to that campaign’s dashboard where
   * the left nav is available.  Each list item is a `<li>` containing the
   * campaign title; we simply click on the matching item.
   *
   * @param fundraiser The campaign name to open
   */
  async selectCampaign(fundraiser: string): Promise<void> {
    await this.page.getByRole('listitem').filter({ hasText: fundraiser }).first().click();
    // Wait for the campaign dashboard to load by checking the nav exists
    await expect(this.page.locator('#dashboardTab')).toBeVisible();
  }

  /**
   * Click one of the quick action buttons on the campaign dashboard card when on
   * the organizer dashboard list view.  These actions include previewing the
   * campaign, editing it, viewing collectibles, rewards, achievements and
   * transactions, or adding new items.  Provide the action key to click the
   * corresponding button.
   *
   * Available actions:
   *  - preview: click the campaign preview button (id `c-preview`)
   *  - editCampaign: click the edit campaign button (id `editCampaignButton`)
   *  - viewCollectibles: click the “View all” collectibles button (id `d-collectibles-btn`)
   *  - addCollectible: click the “Add New” collectibles button (id `d-add-collectibles-btn`)
   *  - viewRewards: click the “View all” rewards button (id `d-rewards-btn`)
   *  - addReward: click the “Add New” rewards button (id `d-add-rewards-btn`)
   *  - viewAchievements: click the “View all” achievements button (id `d-achievement-btn`)
   *  - addAchievement: click the “Add New” achievements button (id `d-add-achievements-btn`)
   *  - viewTransactions: click the transactions card’s view button (id `d-view-transaction`)
   *
   * @param action One of the above action keys
   */
  async clickDashboardCardAction(action: 'preview' | 'editCampaign' | 'viewCollectibles' | 'addCollectible' | 'viewRewards' | 'addReward' | 'viewAchievements' | 'addAchievement' | 'viewTransactions'): Promise<void> {
    const selectors: Record<typeof action, string> = {
      preview: '#c-preview',
      editCampaign: '#editCampaignButton',
      viewCollectibles: '#d-collectibles-btn',
      addCollectible: '#d-add-collectibles-btn',
      viewRewards: '#d-rewards-btn',
      addReward: '#d-add-rewards-btn',
      viewAchievements: '#d-achievement-btn',
      addAchievement: '#d-add-achievements-btn',
      viewTransactions: '#d-view-transaction',
    } as const;
    await this.page.locator(selectors[action]).click();
  }
}