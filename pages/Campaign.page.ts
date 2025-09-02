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
  private checkoutCloseButton: Locator;
  private checkoutFirstName: Locator;
  private checkoutLastName: Locator;

  constructor(page: Page) {
    this.page = page;
    // The contribute button may have various labels; use a case‑insensitive regex.
    this.contributeNowButton = this.page.getByRole('button', { name: /contribute now|donate|contribute/i });
    // Ask your Wix developer to rename the contribution amount input to the ID
    // `contributionAmountInput` so it can be selected reliably.  Fallback to
    // common selectors (placeholder or name) if the ID is missing.
    this.contributionAmountInput = this.page.locator(
      [
        '#contributionAmountInput',
        'input[name="amount"]',
        'input[placeholder*="Amount" i]',
        'input[aria-label*="amount" i]',
        // Some UIs use number inputs with spinbutton role
        'input[role="spinbutton"]',
        // Some UIs use contenteditable divs for masked currency fields
        'div[contenteditable="true"][aria-label*="amount" i]',
        'div[contenteditable="true"][data-placeholder*="Amount" i]',
      ].join(', '),
    );
    this.addAdditionalCollectiblesButton = this.page.getByRole('button', {
      name: /add( additional)? (digital )?collectibles?|add collectible/i,
    });
    // Continue/Next/Proceed in dialogs
    this.continueButton = this.page.getByRole('button', { name: /continue|next|proceed/i });
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
    this.checkoutCloseButton = this.page
      .frameLocator("iframe[src*='payment']")
      .locator('button[aria-label="Close"]');
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
    await this.contributeNowButton.scrollIntoViewIfNeeded().catch(() => { });
    await this.contributeNowButton.click({ force: true });
    // Wait for donation modal/section to appear (amount field or terms checkbox)
    await Promise.race([
      this.contributionAmountInput.first().waitFor({ state: 'visible', timeout: 15000 }),
      this.termsCheckbox.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => Promise.resolve()),
    ]).catch(() => { });
    // Fill donation amount (robustly handles masked/currency inputs)
    await this.fillContributionAmountSafely(contributionAmount);
    // Optionally add extra collectibles
    // if (additionalCollectibles && additionalCollectibles.length > 0) {
    //   await this.addAdditionalCollectiblesButton.scrollIntoViewIfNeeded().catch(() => { });
    //   await this.addAdditionalCollectiblesButton.click({ force: true });
    //   for (const additionalCollectible of additionalCollectibles) {
    //     const nameLocator = this.page.getByText(additionalCollectible.name).first();
    //     const combobox = nameLocator.locator(
    //       "xpath=following::input[@role='combobox'][0]",
    //     );
        
    //     await combobox.click();
    //     await this.page
    //       .locator(`#menuitem-${additionalCollectible.quantity}`)
    //       .click();
    //   }
    //   // Click Continue/Next after selecting additional collectibles
    //   await this.clickContinueInDialog();
    // }
    // Accept terms by checking the checkbox
    await this.termsCheckbox.check();
    // Click contribute again to open payment iframe
    await this.contributeNowButton.click({ force: true });
    // Fill checkout details inside the payment iframe
    await this.checkoutEmailInput.fill(checkoutDetails.email);
    await this.checkoutFirstName.fill(checkoutDetails.firstName);
    await this.checkoutLastName.fill(checkoutDetails.lastName);
    // Continue through the payment modal twice (first to summary, second to confirm)
    const paymentFrame = this.page.frameLocator("iframe[src*='payment']");
    await paymentFrame.getByRole('button', { name: /continue/i }).click();
    // await paymentFrame.getByRole('button', { name: /continue|confirm|pay|complete/i }).click();
    // Close the payment modal; this registers the donation on the relaxed test page
    await this.checkoutCloseButton.click();
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

  /**
   * Some Wix inputs are masked or pre-filled with currency symbols. This helper
   * ensures the contribution amount is entered reliably by trying standard
   * typing first, then falling back to programmatic set with input/change events.
   */
  private async fillContributionAmountSafely(amount: number): Promise<void> {
    const value = amount.toString();
    // Try to locate the amount field in common places: current doc, dialog, iframes
    const input = await this.findAmountField();
    // Debug: screenshot before typing
    await this.page.screenshot({ path: 'before_amount.png', fullPage: false }).catch(() => { });
    // Wait until the input is attached and visible
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.scrollIntoViewIfNeeded().catch(() => { });
    // Try normal user-like interaction
    await input.click({ force: true });
    await input.press('Control+A').catch(() => { });
    await input.press('Meta+A').catch(() => { });
    await input.press('Backspace').catch(() => { });
    // If it's a true input element, type. If it's contenteditable, set innerText via keyboard
    const tagName = (await input.evaluate((el) => el.tagName).catch(() => 'INPUT')) as string;
    if (tagName.toUpperCase() === 'INPUT') {
      await input.type(value, { delay: 50 }).catch(() => { });
    } else {
      await input.type(value, { delay: 50 }).catch(() => { });
    }
    // Verify the value reflects the amount digits
    let typed = '';
    try {
      typed = await input.inputValue();
    } catch {
      // If not an input, read textContent for contenteditable
      typed = (await input.textContent()) || '';
    }
    if (typed.replace(/[^0-9]/g, '') === value) return;
    // Fallback 1: for spinbutton, send ArrowUp the required number of times
    const role = (await input.getAttribute('role').catch(() => null)) || '';
    if (role.toLowerCase() === 'spinbutton') {
      const num = parseInt(value, 10);
      for (let i = 0; i < Math.min(num, 50); i += 1) {
        await input.press('ArrowUp').catch(() => { });
      }
      const afterSpin = (await input.inputValue().catch(async () => (await input.textContent()) || '')) || '';
      if (afterSpin.replace(/[^0-9]/g, '') === value) return;
    }
    // Fallback: programmatically set the value and dispatch events
    await input.evaluate((el, v) => {
      const isInput = (el as HTMLElement).tagName.toUpperCase() === 'INPUT';
      if (isInput) {
        const inputEl = el as HTMLInputElement;
        inputEl.value = v;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        inputEl.dispatchEvent(new Event('blur', { bubbles: true }));
      } else {
        const ce = el as HTMLElement;
        ce.textContent = v;
        ce.dispatchEvent(new Event('input', { bubbles: true }));
        ce.dispatchEvent(new Event('change', { bubbles: true }));
        ce.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    }, value);
    // Final assertion to ensure digits are present
    let finalVal = '';
    try {
      finalVal = await input.inputValue();
    } catch {
      finalVal = (await input.textContent()) || '';
    }
    expect(finalVal.replace(/[^0-9]/g, '')).toBe(value);
    // Debug: screenshot after typing
    await this.page.screenshot({ path: 'after_amount.png', fullPage: false }).catch(() => { });
  }




  /** Click the Continue/Next button in the active dialog or section. */
  private async clickContinueInDialog(): Promise<void> {
    const dialog = this.page.getByRole('dialog');
    const btnInDialog = dialog.getByRole('button', { name: /continue|next|proceed|done|confirm/i }).first();
    if (await btnInDialog.isVisible().catch(() => false)) {
      await btnInDialog.click({ force: true });
      return;
    }
    await this.continueButton.click({ force: true });
  }

  /**
   * Locate the amount field within the main document, any role=dialog layer, or any iframe.
   */
  private async findAmountField(): Promise<Locator> {
    // Prefer visible element in current document
    let candidate = this.contributionAmountInput.filter({ hasNot: this.page.locator('[disabled]') }).first();
    if (await candidate.isVisible().catch(() => false)) return candidate;
    // Look within dialogs/modals
    const dialog = this.page.getByRole('dialog');
    candidate = dialog.locator(
      [
        '#input_comp-lga0alwh',
        'input[name="amount"]',
        'input[placeholder*="Amount" i]',
        'input[aria-label*="amount" i]',
        'input[role="spinbutton"]',
        'div[contenteditable="true"][aria-label*="amount" i]',
        'div[contenteditable="true"][data-placeholder*="Amount" i]',
      ].join(', '),
    ).first();
    if (await candidate.isVisible().catch(() => false)) return candidate;
    // Search across iframes for a matching control
    for (const frame of this.page.frames()) {
      try {
        const loc = frame.locator(
          [
            '#input_comp-lga0alwh',
            'input[name="amount"]',
            'input[placeholder*="Amount" i]',
            'input[aria-label*="amount" i]',
            'input[role="spinbutton"]',
            'div[contenteditable="true"][aria-label*="amount" i]',
            'div[contenteditable="true"][data-placeholder*="Amount" i]',
          ].join(', '),
        ).first();
        if (await loc.isVisible().catch(() => false)) return loc;
      } catch {
        // Ignore cross-origin frames
      }
    }
    // Fall back to original top-level selector (will likely throw later)
    return this.contributionAmountInput.first();
  }
}