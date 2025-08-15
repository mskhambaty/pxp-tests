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
    // The contribute button may have various labels; use a case‑insensitive regex.
    this.contributeNowButton = this.page.getByRole('button', { name: /contribute now|donate/i });
    // Ask your Wix developer to rename the contribution amount input to the ID
    // `contributionAmountInput` so it can be selected reliably.  Fallback to
    // common selectors (placeholder or name) if the ID is missing.
    this.contributionAmountInput = this.page.locator(
      '#contributionAmountInput, input[name="amount"], input[placeholder*="Amount" i], input[aria-label*="amount" i]',
    );
    this.addAdditionalCollectiblesButton = this.page.getByRole('button', {
      name: /add additional digital collectibles/i,
    });
    this.continueButton = this.page.getByRole('button', { name: /continue/i });
    this.termsCheckbox = this.page.locator("input[type='checkbox']");
    // Checkout inputs live inside an iframe; target them by id.
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
    // Click Contribute/Donate button
    await this.contributeNowButton.click();
    // Fill donation amount
    await this.contributionAmountInput.fill(contributionAmount.toString());
    // Optionally add extra collectibles
    if (additionalCollectibles && additionalCollectibles.length > 0) {
      await this.addAdditionalCollectiblesButton.click();
      for (const additionalCollectible of additionalCollectibles) {
        // Select the collectible by name; then choose quantity from combobox dropdown
        const nameLocator = this.page.getByText(additionalCollectible.name).first();
        const combobox = nameLocator.locator(
          "xpath=following::input[@role='combobox'][1]",
        );
        await combobox.click();
        await this.page
          .locator(`#menuitem-${additionalCollectible.quantity}`)
          .click();
      }
      // Click Continue after selecting additional collectibles
      await this.continueButton.click();
    }
    // Accept terms by checking the checkbox
    await this.termsCheckbox.check();
    // Click contribute again to open payment iframe
    await this.contributeNowButton.click();
    // Fill checkout details inside the payment iframe
    await this.checkoutEmailInput.fill(checkoutDetails.email);
    await this.checkoutFirstName.fill(checkoutDetails.firstName);
    await this.checkoutLastName.fill(checkoutDetails.lastName);
    // Continue through the payment modal twice (first to summary, second to confirm)
    const paymentFrame = this.page.frameLocator("iframe[src*='payment']");
    await paymentFrame.getByRole('button', { name: /continue/i }).click();
    await paymentFrame.getByRole('button', { name: /continue/i }).click();
    // Close the payment modal; this registers the donation on the relaxed test page
    await paymentFrame.locator("[aria-label='Close']").click();
  }

  /**
   * Wait for a verification email to arrive.  In a real test this should be
   * replaced with polling a test inbox or intercepting mailgun.  Here we
   * simulate by waiting a fixed duration.
   */
  async waitForCodeVerificationEmail(): Promise<void> {
    // Wait 60 seconds to simulate email delivery
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
      const input = this.page.locator("input[placeholder='0']").nth(index);
      await input.click();
      await input.fill(char);
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