import { type Locator, type Page } from '@playwright/test';

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
    this.contributeNowButton = this.page.getByRole('button', { name: 'Contribute Now' });
    this.contributionAmountInput = this.page.locator('#input_comp-lga0alwh');
    this.addAdditionalCollectiblesButton = this.page.getByRole('button', {
      name: 'Add additional digital collectibles',
    });
    this.continueButton = this.page.getByRole('button', { name: 'Continue' });
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
   * Navigates to the specified campaign page.
   *
   * @param {string} campaignName - The name of the campaign to open.
   */
  async open(campaignName: string): Promise<void> {
    await this.page.goto(`/projects/${campaignName}`);
  }

  /**
   * Donates to the campaign, optionally selecting additional collectibles and providing checkout details.
   *
   * @param {Object} donationDetails - The details for the donation.
   * @param {number} donationDetails.contributionAmount - The amount to contribute.
   * @param {Array<{ name: string, quantity: number }>} [donationDetails.additionalCollectibles] - Optional list of additional collectibles to add.
   * @param {Object} donationDetails.checkoutDetails - The checkout details.
   * @param {string} donationDetails.checkoutDetails.email - The email address for the checkout.
   * @param {string} donationDetails.checkoutDetails.firstName - The first name for the checkout.
   * @param {string} donationDetails.checkoutDetails.lastName - The last name for the checkout.
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
      .getByRole('button', { name: 'Continue' })
      .click();
    await this.page
      .frameLocator("iframe[src*='payment']")
      .getByRole('button', { name: 'Continue' })
      .click();
    await this.page.frameLocator("iframe[src*='payment']").locator("[aria-label='Close']").click();
  }

  /**
   * Waits for the code verification email to arrive, waiting up to 2 minutes.
   */
  async waitForCodeVerificationEmail(): Promise<void> {
    // eslint-disable-next-line playwright/no-wait-for-timeout
    await this.page.waitForTimeout(120000);
  }

  /**
   * Enters the provided verification code into the form.
   *
   * @param {string} verificationCode - The verification code to enter.
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
   * Signs up a newly created user with the provided password.
   *
   * @param {string} password - The password to set for the new user.
   */
  async signupNewlyCreatedUserWithPassword(password: string): Promise<void> {
    await this.page.locator("input[name='create-password']").fill(password);
    await this.page.getByText('Sign up and claim collectible').click();
    await this.page.waitForURL('**/participant-dashboard', { timeout: 45000 });
  }
}
