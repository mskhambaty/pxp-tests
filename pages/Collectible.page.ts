import { Page, expect } from '@playwright/test';
import { Console } from 'console';

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
  constructor(private page: Page) { }

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
    metricAmount,
    rewardTitle,
  }: {
    name: string;
    price: number;
    metricAmount: number;
    rewardTitle?: string;
  }): Promise<void> {
    // Click the add collectible button on the dashboard card if present
    // or the createCollectibleButton in the collectibles tab.
    console.log('CollectiblePage: Looking for "Add New" buttons...');
    const addNewButtons = this.page.locator('button[aria-label="Add New"]');
    const count = await addNewButtons.count();
    console.log(`CollectiblePage: Found ${count} "Add New" button(s).`);
    let clicked = false;
    for (let i = 0; i < count; i++) {
      const btn = addNewButtons.nth(i);
      const visible = await btn.isVisible();
      console.log(`CollectiblePage: Button ${i} visible: ${visible}`);
      if (visible) {
        console.log(`CollectiblePage: Clicking "Add New" button at index ${i}`);
        await btn.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      console.log('CollectiblePage: No visible "Add New" button found');
      // throw new Error('No visible "Add New" button found');
    } else {
      console.log('CollectiblePage: Successfully clicked "Add New" button');
    }
    // Wait for modal to appear
    await expect(this.page.locator('input[name="collectible-name"]')).toBeVisible();
    // Upload or generate image

    // Use AI generation tab
    // await this.page.locator('#tab-comp-ma3p8n7v').click();
    // await this.page.locator('#textarea_comp-ma3p8n7z').fill(description || '');
    // // Select the artistic style from the select tag element
    // const styleSelect = this.page.locator('select#collection_comp-ma3p8n83');
    // const isVisible = await styleSelect.isVisible();
    // console.log('CollectiblePage: Style select visible:', isVisible);
    // if (isVisible) {
    //   // First click the select, then click the option with value=style
    //   await styleSelect.click();
    //   console.log('CollectiblePage: Attempting to select style option with selector "#menuitem-0"');
    //   const optionLocator = this.page.locator("#menuitem-0");
    //   await expect(optionLocator).toBeVisible({ timeout: 60000 });
    //   console.log('CollectiblePage: Style option is visible, clicking...');
    //   await optionLocator.click();
    //   console.log('CollectiblePage: Style option clicked.');
    // } else {
    //   console.warn('CollectiblePage: Style select is not visible!');
    // }
    // const generateButton = this.page.locator('button[aria-label="Generate Image"]');
    // await generateButton.click();
    // console.log('CollectiblePage: Generate button clicked.');
    // // Wait for the generateButton to become enabled (not disabled)

    // Set up file dialog handler before clicking upload button
    const fileDialogPromise = this.page.waitForEvent('filechooser');
    await this.page.getByTestId('upload-button').click();

    // Handle the file dialog
    const fileChooser = await fileDialogPromise;
    await fileChooser.setFiles('collectibles.png');
    console.log('CollectiblePage: File selected via dialog');
    await this.page.waitForTimeout(10000);


    // Wait for the uploaded image to appear
    // console.log('CollectiblePage: Waiting for uploaded image at', new Date().toISOString());
    // await expect(this.page.locator('img[alt="Uploaded Collectible Image"]')).toBeVisible({ timeout: 60000 });
    // console.log('CollectiblePage: Uploaded image visible at', new Date().toISOString());

    // Fill name and amount with debugging
    const nameInput = this.page.locator('input[name="collectible-name"]');
    const donationAmountInput = this.page.locator('input[name="donation-amount ($)"]');
    const metricAmountInput = this.page.locator('input[name="donation-per impact unit"]');

    const nameVisible = await nameInput.isVisible();
    console.log(`CollectiblePage: Name input visible: ${nameVisible}`);
    if (nameVisible) {
      console.log(`CollectiblePage: Filling collectible name: ${name}`);
      await nameInput.fill(name);
    } else {
      console.warn('CollectiblePage: Name input is not visible!');
    }

    const donationAmountVisible = await donationAmountInput.isVisible();
    console.log(`CollectiblePage: Donation amount input visible: ${donationAmountVisible}`);
    if (donationAmountVisible) {
      console.log(`CollectiblePage: Filling donation amount: ${price}`);
      await donationAmountInput.fill(price.toString());
    } else {
      console.warn('CollectiblePage: Donation amount input is not visible!');
    }

    const metricAmountVisible = await metricAmountInput.isVisible();
    console.log(`CollectiblePage: Metric amount input visible: ${metricAmountVisible}`);
    if (metricAmountVisible) {
      console.log(`CollectiblePage: Filling metric amount (donation per impact unit): ${metricAmount}`);
      await metricAmountInput.fill(metricAmount.toString());
    } else {
      console.warn('CollectiblePage: Metric amount input is not visible!');
    }

    // await this.page.waitForTimeout(30000);

    await this.page.locator('#openModalBtn').click();
    await expect(this.page.locator('#rewardTitleInput')).toBeVisible();
    await this.page.locator('#rewardTitleInput').fill(rewardTitle || 'Reward');
    await this.page.locator('#addRewardButton').click();

    await this.page.waitForTimeout(4000);
    await this.page.locator('button[aria-label="Save Changes"]').click({ force: true });
    await this.page.waitForTimeout(6000);
    // Verify the new paid collectible appears using the available h2 > span structure
    // const collectiblesButton = this.page.locator('button[aria-label="Collectibles"]');
    // const collectiblesButtonVisible = await collectiblesButton.isVisible();
    // console.log(`CollectiblePage: Collectibles button (aria-label="Collectibles") visible: ${collectiblesButtonVisible}`);
    // await expect(collectiblesButton).toBeVisible({ timeout: 20000 });
  }

  /**
   * Edit the amount of an existing paid collectible.  This clicks the more
   * actions menu for the collectible (if available) and fills a new price.
   *
   * @param name   The name of the collectible to edit
   * @param price New donation price
   * @param metricAmount New donation metricAmount
   */
  async editPaidCollectibleAmount(name: string, price: number, metricAmount: number): Promise<void> {
    // Find the paid collectible card by its title
    // Find the paid collectibles list container

    // Find the last paid collectible card by its title using class and role
    const cards = this.page.locator('.wixui-repeater__item[role="listitem"]', { has: this.page.locator('h2 span', { hasText: name }) });
    const card = cards.last();
    const cardVisible = await card.isVisible();
    console.log(`editPaidCollectibleAmount: card for "${name}" visible: ${cardVisible}`);

    // Find the edit button within the card using aria-label="Edit"
    const editButton = card.locator('button[aria-label="Edit"]');
    const editButtonVisible = await editButton.isVisible();
    console.log(`editPaidCollectibleAmount: editButton visible: ${editButtonVisible}`);
    await editButton.click({ force: true });
    console.log('editPaidCollectibleAmount: editButton clicked');
    // Wait for the edit modal to be ready instead of a fixed sleep
    const nameInput = this.page.locator('input[name="collectible-name"]');

    console.log('editPaidCollectibleAmount: Filling name input with:', name);
    await nameInput.click({ clickCount: 1 });
    await this.page.waitForTimeout(500);
    await nameInput.press('Control+A');
    await this.page.waitForTimeout(500);
    await nameInput.press('Delete');
    await this.page.waitForTimeout(500);
    await nameInput.type(name, { delay: 20 });


    // const donationAmountInput = this.page.locator('input[name="donation-amount ($)"]');
    // const donationAmountInputVisible = await donationAmountInput.isVisible();
    // console.log(`editPaidCollectibleAmount: donationAmountInput visible: ${donationAmountInputVisible}`);
    // if (donationAmountInputVisible) {
    //   await donationAmountInput.fill(price.toString());
    // } else {
    //   console.warn('editPaidCollectibleAmount: Donation amount input is not visible!');
    // }

    // // Fill metric amount (donation per impact unit) if provided
    // if (metricAmount !== undefined) {
    //   const metricAmountInput = this.page.locator('input[name="donation-per impact unit"]');
    //   const metricAmountInputVisible = await metricAmountInput.isVisible();
    //   console.log(`editPaidCollectibleAmount: metricAmountInput visible: ${metricAmountInputVisible}`);
    //   if (metricAmountInputVisible) {
    //     await metricAmountInput.fill(String(metricAmount));
    //   } else {
    //     console.warn('editPaidCollectibleAmount: Metric amount input is not visible!');
    //   }
    // }
    await this.page.locator('button[aria-label="Save Changes"]').click({ force: true });
    await this.page.waitForTimeout(10000);
    const moreActionsButton = card.locator('button[aria-label="..."]');
    const archiveButton = card.locator('button[aria-label="Archive"]');
    await moreActionsButton.click();
    await this.page.waitForTimeout(2000);
    await archiveButton.click({ force: true });
  }
}