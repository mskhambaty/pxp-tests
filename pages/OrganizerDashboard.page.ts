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
  constructor(private page: Page) { }

  /**
   * Navigate to the organizer dashboard. If the user is not logged in
   * (determined by presence of a Log In/Sign In button or link), this method
   * performs a login using the USER_NAME and USER_PASSWORD environment
   * variables. After authentication it navigates to the dashboard route. The
   * Playwright baseURL should already point to https://www.panxpan.com.
   */
  async goto(): Promise<void> {
    console.log('OrganizerDashboard: Starting goto()');
    // Navigate to site root (baseURL defined in Playwright config)
    await this.page.goto('/');
    console.log('OrganizerDashboard: Navigated to /');
    // Wait for page to load
    await this.page.waitForTimeout(2000);
    console.log('OrganizerDashboard: Waited for page load');

    // Check if we need to open mobile menu first (for desktop viewport)
    const viewport = this.page.viewportSize();
    const isMobileViewport = viewport && viewport.width < 768;
    console.log('OrganizerDashboard: Viewport size:', viewport, 'isMobile:', isMobileViewport);

    // Try to open burger menu if login button is not visible (desktop layout)
    if (isMobileViewport) {
      const burgerMenu = this.page.locator('#comp-m90x47k7_r_comp-lg6uf78w').first();
      if (await burgerMenu.isVisible().catch(() => false)) {
        console.log('OrganizerDashboard: Clicking burger menu');
        await burgerMenu.click().catch(() => { });
        await this.page.waitForTimeout(1000);
      }
    }

    // Detect login controls; Wix may render them as buttons or links.
    const loginBtn = this.page.getByRole('button', { name: /log in|sign in/i }).first();
    const loginLnk = this.page.getByRole('link', { name: /log in|sign in/i }).first();
    // Also check for buttons with "Log In" text content
    const loginBtnByText = this.page.locator('button:has-text("Log In"), button:has-text("Sign In")').first();
    // Check for specific Wix login button with aria-label
    const loginWithEmailBtn = this.page.getByRole('button', { name: /log in with email/i }).first();
    // Check for button with data-testid
    const loginByTestId = this.page.locator('button[data-testid="buttonElement"]:has-text("Log in with Email")').first();
    console.log('OrganizerDashboard: Checking login button visibility...');
    const loginBtnVisible = await loginBtn.isVisible().catch(() => false);
    const loginLnkVisible = await loginLnk.isVisible().catch(() => false);
    const loginBtnByTextVisible = await loginBtnByText.isVisible().catch(() => false);
    const loginWithEmailBtnVisible = await loginWithEmailBtn.isVisible().catch(() => false);
    const loginByTestIdVisible = await loginByTestId.isVisible().catch(() => false);
    // Add a short delay to ensure UI is fully rendered before checking login button visibility
    await this.page.waitForTimeout(2000);
    console.log('OrganizerDashboard: Login button visibility:', {
      loginBtn: loginBtnVisible,
      loginLnk: loginLnkVisible,
      loginBtnByText: loginBtnByTextVisible,
      loginWithEmailBtn: loginWithEmailBtnVisible,
      loginByTestId: loginByTestIdVisible
    });

    let isLoggedOut = loginBtnVisible || loginLnkVisible || loginBtnByTextVisible || loginWithEmailBtnVisible || loginByTestIdVisible;

    // Force skip login for mobile viewport since login buttons may not be visible

    console.log('OrganizerDashboard: isLoggedOut:', isLoggedOut);

    if (isLoggedOut) {
      console.log('OrganizerDashboard: User is logged out, attempting login...');
      const email = process.env.USER_NAME;
      const password = process.env.USER_PASSWORD;
      console.log('OrganizerDashboard: Environment variables check:', {
        hasEmail: !!email,
        hasPassword: !!password,
        emailLength: email?.length || 0
      });
      if (!email || !password) {
        console.log('OrganizerDashboard: Missing environment variables, throwing error');
        throw new Error('Missing USER_NAME or USER_PASSWORD environment variables for organizer login.');
      }
      // Open the login form (button or link)
      console.log('OrganizerDashboard: Attempting to click login button...');
      let buttonClicked = false;
      await this.page.waitForTimeout(2000);

      // First, try to click the main login button to open the modal
      if (await loginBtn.isVisible().catch(() => false)) {
        console.log('OrganizerDashboard: Clicking main loginBtn to open modal');
        await loginBtn.click({ force: true });
        buttonClicked = true;
        await this.page.waitForTimeout(2000);

        // Now look for the "Log in with Email" button inside the modal
        const loginWithEmailInModal = this.page.getByRole('button', { name: /log in with email/i });
        if (await loginWithEmailInModal.isVisible().catch(() => false)) {
          console.log('OrganizerDashboard: Found Log in with Email button in modal, clicking it');
          await loginWithEmailInModal.click({ force: true });
          await this.page.waitForTimeout(2000);
        }
      } else if (await loginLnk.isVisible().catch(() => false)) {
        console.log('OrganizerDashboard: Clicking loginLnk');
        await loginLnk.click({ force: true });
        buttonClicked = true;
      } else if (await loginBtnByText.isVisible().catch(() => false)) {
        console.log('OrganizerDashboard: Clicking loginBtnByText');
        await loginBtnByText.click({ force: true });
        buttonClicked = true;
      } else if (await loginWithEmailBtn.isVisible().catch(() => false)) {
        console.log('OrganizerDashboard: Clicking loginWithEmailBtn');
        await loginWithEmailBtn.click({ force: true });
        buttonClicked = true;
      } else if (await loginByTestId.isVisible().catch(() => false)) {
        console.log('OrganizerDashboard: Clicking loginByTestId');
        await loginByTestId.click({ force: true });
        buttonClicked = true;
      }

      console.log('OrganizerDashboard: Button clicked:', buttonClicked);
      console.log('OrganizerDashboard: Waiting for login form to appear...');
      this.page.locator('button[aria-label="Log in with Email"]').click();

      // Wait for the login form to appear
      try {
        await this.page.waitForSelector('input[type="email"], input[type="password"]', { timeout: 10000 });
        console.log('OrganizerDashboard: Login form appeared');
      } catch (error) {
        console.log('OrganizerDashboard: Login form did not appear, trying alternative approach');
        // Try clicking any visible button that might open the form
        const allButtons = this.page.locator('button');
        const buttonCount = await allButtons.count();
        console.log('OrganizerDashboard: Found', buttonCount, 'buttons on page');

        for (let i = 0; i < Math.min(buttonCount, 10); i++) {
          const button = allButtons.nth(i);
          const text = await button.textContent().catch(() => '');
          if (text?.toLowerCase().includes('log in') || text?.toLowerCase().includes('sign in')) {
            console.log('OrganizerDashboard: Trying button with text:', text);
            await button.click({ force: true });
            await this.page.waitForTimeout(1000);
            break;
          }
        }
      }

      await this.page.waitForTimeout(2000);
      // Fill credentials using specific IDs from the form
      console.log('OrganizerDashboard: Looking for email and password inputs...');
      const emailInputById = this.page.locator('#input_input_emailInput_SM_ROOT_COMP575');
      const passwordInputById = this.page.locator('#input_input_passwordInput_SM_ROOT_COMP575');

      const emailInputByIdVisible = await emailInputById.isVisible().catch(() => false);
      const passwordInputByIdVisible = await passwordInputById.isVisible().catch(() => false);
      console.log('OrganizerDashboard: Input visibility:', {
        emailInputById: emailInputByIdVisible,
        passwordInputById: passwordInputByIdVisible
      });

      try {
        if (emailInputByIdVisible) {
          console.log('OrganizerDashboard: Filling email with specific ID');
          await emailInputById.fill(email);
          console.log('OrganizerDashboard: Email filled successfully with ID');
        } else {
          console.log('OrganizerDashboard: Filling email with type selector');
          await this.page.locator('input[type="email"]').first().fill(email);
          console.log('OrganizerDashboard: Email filled with type selector');
        }
      } catch (error) {
        console.log('OrganizerDashboard: Email fill failed:', error);
        throw error;
      }

      // Wait a bit for password field to appear
      await this.page.waitForTimeout(1000);

      // Re-check password input visibility
      const passwordInputByType = await this.page.locator('input[type="password"]').first().isVisible().catch(() => false);
      console.log('OrganizerDashboard: Password input visibility after wait:', {
        byType: passwordInputByType
      });

      try {
        if (passwordInputByIdVisible) {
          console.log('OrganizerDashboard: Filling password with specific ID');
          await passwordInputById.fill(password);
          console.log('OrganizerDashboard: Password filled successfully with ID');
        } else if (passwordInputByType) {
          console.log('OrganizerDashboard: Filling password with type selector');
          await this.page.locator('input[type="password"]').first().fill(password);
          console.log('OrganizerDashboard: Password filled with type selector');
        } else {
          console.log('OrganizerDashboard: No password input found, trying alternative selectors');
          // Try other common password selectors
          const altPassword = this.page.locator('input[name*="password"], input[placeholder*="password" i]').first();
          if (await altPassword.isVisible().catch(() => false)) {
            await altPassword.fill(password);
            console.log('OrganizerDashboard: Password filled with alternative selector');
          } else {
            throw new Error('No password input field found');
          }
        }
      } catch (error) {
        console.log('OrganizerDashboard: Password fill failed:', error);
        throw error;
      }
      // Submit the login form
      console.log('OrganizerDashboard: Looking for submit button...');
      const submit = this.page.getByRole('button', { name: /log in|sign in|continue/i }).first();
      const submitByTestId = this.page.locator('button[data-testid="buttonElement"]:has-text("Log In")');
      const submitByAriaLabel = this.page.locator('button[aria-label="Log In"]');
      const submitVisible = await submit.isVisible().catch(() => false);
      const submitByTestIdVisible = await submitByTestId.isVisible().catch(() => false);
      const submitByAriaLabelVisible = await submitByAriaLabel.isVisible().catch(() => false);
      console.log('OrganizerDashboard: Submit button visibility:', {
        submit: submitVisible,
        submitByTestId: submitByTestIdVisible,
        submitByAriaLabel: submitByAriaLabelVisible
      });

      if (submitByAriaLabelVisible) {
        console.log('OrganizerDashboard: Clicking submit button by aria-label');
        await submitByAriaLabel.click();
      } else if (submitByTestIdVisible) {
        console.log('OrganizerDashboard: Clicking submit button by testid');
        await submitByTestId.click();
      } else if (submitVisible) {
        console.log('OrganizerDashboard: Clicking submit button by role');
        await submit.click();
      } else {
        console.log('OrganizerDashboard: Submit button not found, trying Enter key');
        await this.page.keyboard.press('Enter');
      }

      console.log('OrganizerDashboard: Waiting for redirect to dashboard...');
      // Wait for redirect; if it fails, explicitly navigate to the organizer dashboard
      try {
        // await this.page.waitForURL(/\/account\/organizer-dashboard/i, { timeout: 30000 });
        await this.page.waitForTimeout(3000);
        await this.page.goto('/account/organizer-dashboard');

        console.log('OrganizerDashboard: Successfully redirected to dashboard');
      } catch (error) {
        console.log('OrganizerDashboard: Redirect failed, navigating manually:', error);
      }
    } else {
      // Already authenticated; navigate directly to the dashboard route
      console.log('OrganizerDashboard: User appears to be logged in, navigating to dashboard');
      await this.page.goto('/account/organizer-dashboard');
    }
    // Confirm left nav loaded
    // await this.page.locator('#dashboardTab').first().waitFor({ timeout: 30000 });
  }

  /**
   * Click a navigation tab in the dashboard’s left nav. All tabs have
   * predefined IDs. Throws if an unknown tab is provided.
   */
  async openNavTab(
    tab: 'dashboard' | 'edit' | 'collectibles' | 'rewards' | 'achievements' | 'transactions' | 'payouts',
  ): Promise<void> {
    console.log('OrganizerDashboard: openNavTab() requested:', tab);

    const viewport = this.page.viewportSize();
    const isMobileViewport = viewport && viewport.width < 768;
    if (isMobileViewport) {
      const burgerMenu = this.page.locator('#comp-ma3zmsi1').first();
      if (await burgerMenu.isVisible().catch(() => false)) {
        console.log('OrganizerDashboard: Clicking burger menu');
        await burgerMenu.click().catch(() => { });
        await this.page.waitForTimeout(1000);
      }
      const selectors: Record<string, string> = {
        dashboard: '#comp-ma3zpfc1',
        edit: '#comp-ma3zpfc4',
        collectibles: '#comp-ma3zpfc7',
        rewards: '#comp-ma3zpfca',
        achievements: '#comp-ma3zpfc83',
        transactions: '#comp-ma3zpfcc7',
        payouts: '#comp-mcvzh0gc',
      };
      const selector = selectors[tab];
      if (!selector) throw new Error(`Unknown nav tab: ${tab}`);
      const tabLocator = this.page.locator(selector).first();
      const visible = await tabLocator.isVisible().catch(() => false);
      console.log('OrganizerDashboard: openNavTab() selector & visible:', selector, visible);
      if (!visible) {
        // Small wait to allow left-nav to render
        await this.page.waitForTimeout(1000);
      }
      await tabLocator.click({ force: true });
      console.log('OrganizerDashboard: openNavTab() clicked:', tab);
      // Best-effort wait for tab panel content to render
      await this.page.waitForTimeout(500);
    } else {
      const selectors: Record<string, string> = {
        dashboard: '#comp-m9sipgef',
        edit: '#comp-m9sjflj0',
        collectibles: '#comp-m9sj2iag',
        rewards: '#comp-m9sjc6ye',
        achievements: '#comp-m9sj6wpn',
        transactions: '#comp-m9sj8btw',
        payouts: '#comp-m9sjdkpy',
      };

      const selector = selectors[tab];
      if (!selector) throw new Error(`Unknown nav tab: ${tab}`);
      const tabLocator = this.page.locator(selector).first();
      const visible = await tabLocator.isVisible().catch(() => false);
      console.log('OrganizerDashboard: openNavTab() selector & visible:', selector, visible);
      if (!visible) {
        // Small wait to allow left-nav to render
        await this.page.waitForTimeout(1000);
      }
      await tabLocator.click({ force: true });
      console.log('OrganizerDashboard: openNavTab() clicked:', tab);
      // Best-effort wait for tab panel content to render
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Select a campaign from the dashboard list by its displayed name. Each
   * campaign renders as a list item (li) containing the campaign’s name.
   */
  async selectCampaign(fundraiser: string): Promise<void> {
    // Add debugging for viewport and campaign selection
    const viewport = this.page.viewportSize();
    console.log('selectCampaign: viewport size:', viewport);
    const isMobileViewport = viewport && viewport.width < 768;
    console.log('selectCampaign: isMobileViewport:', isMobileViewport);
    console.log('selectCampaign: Attempting to select campaign:', fundraiser);
    // Wait for at least one listitem to be visible before proceeding
    await this.page.getByRole('listitem').first().waitFor({ state: 'visible', timeout: 10000 });
    const campaignLocator = this.page.getByRole('listitem').filter({ hasText: fundraiser }).first();
    const campaignCount = await campaignLocator.count();
    console.log('selectCampaign: Matching campaign count:', campaignCount);
    if (campaignCount === 0) {
      throw new Error(`selectCampaign: No campaign found with name: ${fundraiser}`);
    }
    console.log('selectCampaign: Clicking campaign locator');
    await this.page.waitForTimeout(4000);
    await campaignLocator.locator('.collectiblesButton[dir="ltr"]').click({ force: true });
    if (isMobileViewport) {
      console.log('selectCampaign: Expecting mobile dashboard selector #comp-m9sjpr3q');
      await expect(this.page.locator('#comp-m9sjpr3q')).toBeVisible();
    } else {
      console.log('selectCampaign: Expecting desktop dashboard selector #comp-m9sipgef');
      await expect(this.page.locator('#comp-m9sipgef')).toBeVisible();
    }
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