import { Page, expect } from '@playwright/test';

/**
 * Page object encapsulating interactions with the collectibles section of
 * a campaign.  The organizer can create new collectibles (paid or earned),
 * edit existing ones and view stats such as the number claimed.  This class
 * assumes the Wix editor has renamed IDs on the collectible UI as described
 * in the client spec.  In particular, we rely on the following IDs:
 *
 *  - `collectiblesTab` (nav tab to open the collectibles page)
 *  - `createCollectibleButton` (button to launch the create collectible modal)
 *  - Inputs on the modal: `collectibleImageInput`, `collectibleTypeSelect`,
 *    `collectibleNameInput`, `collectibleAmountInput`, `collectibleSaveButton`
 *  - Additional fields for AI‑generated images: `tabs2`, `add-c-image-description`,
 *    `add-c-image-style`, `add-c-image-createBtn`, `c-add-metricAmount`
 *  - Repeaters for paid and earned collectibles: `box895` (paid section),
 *    `paid-title`, `paid-price`, `paid-claimed`, `earnedCollectiblesRepeater`,
 *    `earned-title`, `earned-claimed`
 */
export class CollectiblePage {
  constructor(private page: Page) {}

  /** Navigate to the collectibles tab using the side navigation. */
  async openTab(): Promise<void> {
    await this.page.locator('#collectiblesTab').click();
    // Ensure the paid collectibles heading is visible to confirm the page loaded
    await expect(this.page.locator('#paid-heading')).toBeVisible();
  }

  /**
   * Create a new paid collectible via the modal.  If an imagePath is
   * provided it will be uploaded via the file input.  Otherwise the AI tab
   * can be used by describing the desired image and style; the create
   * button will then be clicked.  After creation the method asserts that
   * a new card appears with the given name and price.
   */
  async createPaidCollectible({
    name,
    price,
    imagePath,
    description,
    style,
    metricAmount,
  }: {
    name: string;
    price: number;
    imagePath?: string;
    description?: string;
    style?: string;
    metricAmount?: number;
  }): Promise<void> {
    // Click the add collectible button on the dashboard card if present
    // or the createCollectibleButton in the collectibles tab.
    const createButton = this.page.locator('#d-add-collectibles-btn').or(this.page.locator('#createCollectibleButton'));
    if (await createButton.count()) {
      await createButton.first().click();
    }
    // Wait for modal to appear
    await expect(this.page.locator('#collectibleNameInput')).toBeVisible();
    // Upload or generate image
    if (imagePath) {
      const fileChooserPromise = this.page.waitForEvent('filechooser');
      await this.page.locator('#collectibleImageInput').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(imagePath);
    } else if (description && style) {
      // Use AI generation tab
      await this.page.locator('#tabs2').click();
      await this.page.locator('#add-c-image-description').fill(description);
      await this.page.locator('#add-c-image-style').fill(style);
      await this.page.locator('#add-c-image-createBtn').click();
      // Wait for image to be generated; adjust timeout as needed
      await this.page.waitForTimeout(5000);
    }
    // Select type 'Paid'
    await this.page.locator('#collectibleTypeSelect').selectOption({ label: 'Paid' });
    // Fill name and amount
    await this.page.locator('#collectibleNameInput').fill(name);
    await this.page.locator('#collectibleAmountInput').fill(String(price));
    // Fill metric amount (donation per impact unit) if provided
    if (metricAmount !== undefined) {
      await this.page.locator('#c-add-metricAmount').fill(String(metricAmount));
    }
    // Save collectible
    await this.page.locator('#collectibleSaveButton').click();
    // Verify that the new paid collectible appears in the list
    const newCard = this.page.locator('#paid-title', { hasText: name });
    await expect(newCard).toBeVisible();
    const priceLabel = this.page.locator('#paid-price').filter({ hasText: `$${price}` });
    await expect(priceLabel).toBeVisible();
  }

  /**
   * Edit the amount of an existing paid collectible.  This clicks the more
   * actions menu for the collectible (if available) and fills a new price.
   *
   * @param name   The name of the collectible to edit
   * @param amount New donation amount
   */
  async editPaidCollectibleAmount(name: string, amount: number): Promise<void> {
    // Find the paid collectible card by its title
    const card = this.page.locator('#paid-title').filter({ hasText: name }).first();
    // Click the more actions button; fallback to first action button
    const actionButton = card.locator('#paid-more-actions').or(card.getByRole('button', { name: /more/i }));
    if (await actionButton.count()) {
      await actionButton.first().click();
    }
    // Click edit option
    await this.page.getByRole('menuitem', { name: /edit/i }).click();
    // Now update amount in modal
    await this.page.locator('#collectibleAmountInput').fill(String(amount));
    await this.page.locator('#collectibleSaveButton').click();
    // Verify price updated
    await expect(this.page.locator('#paid-price').filter({ hasText: `$${amount}` })).toBeVisible();
  }
}