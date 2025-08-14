import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page object encapsulating interactions on a public campaign page.  It
 * represents the flow a participant uses to donate to a campaign.  The
 * original implementation relied on Wix‑generated selectors such as
 * `#input_comp-lga0alwh` which change every time the site is published.
 * We instead target inputs by stable IDs provided by the Wix developer.
 */
export class CampaignPage {
  private page: Page;
  private contributeNowButton: Locator;
  private contributionAmountInput: Locator;
  private addAdditionalCollectiblesButton: Locator;
  private continueButton: Locator;
  private termsCheckbox: Locator;
  private checkoutEmailInput: Locator;
  private checkoutFirstName: Locator;
  private checkoutLastName: Locator;

  constructor(page: Page) {
    this.page = page;
    this.contributeNowButton = this.page.getByRole('button', { name: /contribute now/i });
    // Ask your Wix developer to rename the contribution amount input to the ID
    // `contributionAmountInput` so it can be selected reliably.
    this.contributionAmountInput = this.page.locator('#contributionAmountInput');
    this.addAdditionalCollectiblesButton = this.page.getByRole('button', {
      name: /add additional digital collectibles/i,
    });
    this.continueButton = this.page.getByRole('button', { name: /continue/i });
    this.termsCheckbox = this.page.locator("input[type='checkbox']");
    this.checkoutEmailInput = this.page
      .frameLocator("iframe[src*='payment']")
      .locator('input#email');
    this.checkoutFirstName = this.page
      .frameLocator("iframe[src*='payment']")
      .locator('input#firstName');
    this.checkoutLastName = this.page
      .frameLocator("iframe[src*='payment']")
      .locator('input#lastName');
  }

  /**
   * Navigate to a campaign by its slug or name.
   *
   * @param campaignName slug of the campaign route (e.g. `my-campaign`)
   */
  async open(campaignName: string): Promise<void> {
    await this.page.goto(`/projects/${campaignName}`);
  }

  /**
   * Donate to the current campaign.  Accepts the amount, optional additional
   * collectibles and checkout details.  The flow follows the on‑site payment
   * integration and uses stable selectors.
   */
  async donate({
    contributionAmount,
    additionalCollectibles,
    checkoutDetails,
  }: {
    contributionAmount: number;
    additionalCollectibles?: { name: string; quantity: number }[];
    checkoutDetails: { email: string; firstName: string; lastName: string };
  }): Promise<void> {
    await this.contributeNowButton.click();
    await this.contributionAmountInput.fill(contributionAmount.toString());
    if (additionalCollectibles) {
      await this.addAdditionalCollectiblesButton.click();
      for (const additionalCollectible of additionalCollectibles) {
        await this.page
          .getByText(additionalCollectible.name)
          .locator('xpath=following::input[@role="combobox"][1]')
          .first()
          .click();
        await this.page.locator(`#menuitem-${additionalCollectible.quantity}`).click();
      }
      await this.continueButton.click();
    }
    await this.termsCheckbox.check();
    await this.contributeNowButton.click();
    await this.checkoutEmailInput.fill(checkoutDetails.email);
    await this.checkoutFirstName.fill(checkoutDetails.firstName);
    await this.checkoutLastName.fill(checkoutDetails.lastName);
    await this.page
      .frameLocator("iframe[src*='payment']")
      .getByRole('button', { name: /continue/i })
      .click();
    await this.page
      .frameLocator("iframe[src*='payment']")
      .getByRole('button', { name: /continue/i })
      .click();
    await this.page.frameLocator("iframe[src*='payment']").locator("[aria-label='Close']").click();
  }

  /**
   * Wait for a verification email to arrive.  In a real test this should be
   * replaced with polling a test inbox or intercepting mailgun.  Here we
   * simulate by waiting.
   */
  async waitForCodeVerificationEmail(): Promise<void> {
    await this.page.waitForTimeout(60000);
  }

  /**
   * Enter the verification code into the multi‑input verification form.
   *
   * @param verificationCode 6‑digit code from the email
   */
  async enterVerificationCode(verificationCode: string): Promise<void> {
    let index = 0;
    for (const char of verificationCode.split('')) {
      await this.page.locator("input[placeholder='0']").nth(index).click();
      await this.page.locator("input[placeholder='0']").nth(index).fill(char);
      index += 1;
    }
    await this.continueButton.click();
  }

  /**
   * After donation, newly created participants must set a password.  Fill the
   * password input and click the sign‑up button.
   */
  async signupNewlyCreatedUserWithPassword(password: string): Promise<void> {
    await this.page.locator("input[name='create-password']").fill(password);
    await this.page.getByText('Sign up and claim collectible').click();
    await this.page.waitForURL('**/participant-dashboard', { timeout: 45000 });
  }
}