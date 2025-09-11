import { Page, expect } from '@playwright/test';

/**
 * Page object for managing rewards on a collectible.  Relies on stable IDs
 * assigned to elements in the rewards UI.
 */
export class RewardsPage {
  constructor(private page: Page) { }


  async addTierReward(): Promise<void> {
    // Find the first pending reward card and store its name for future use, then click its "Fulfill Now" button
    const firstPendingCard = this.page.locator('.card.pending').first();
    const rewardName = await firstPendingCard.locator('.card-title').innerText();
    console.log(`RewardsPage: Reward name: ${rewardName}`);
    await firstPendingCard.locator('.fulfill-btn').click();
    await this.page.locator('#input_comp-madpf4yp').fill("https://www.panxpan.com/");
    await this.page.locator('button[aria-label="Save Changes"]').click();
    // After fulfilling, check that the card with the same rewardName is now marked as fulfilled
    const fulfilledCard = this.page.locator('.card.fulfilled').filter({
      has: this.page.locator('.box-header strong', { hasText: rewardName })
    });
    await expect(fulfilledCard).toHaveCount(1);
    // Click the "edit" button under the fulfilled card we just verified
    const editButton = fulfilledCard.locator('.edit-btn');
    await editButton.click();
    let newRewardName = "https://www.panxpan.com/test";
    console.log(`RewardsPage: Filling new reward description with: ${newRewardName}`);
    // await this.page.locator('#input_comp-makv289l').fill(newRewardName);
    await this.page.locator('#input_comp-makv289l').click({ clickCount: 1 }); // select all
    await this.page.waitForTimeout(500);
    await this.page.locator('#input_comp-makv289l').press('Control+A');
    await this.page.waitForTimeout(500);
    await this.page.locator('#input_comp-makv289l').press('Delete');
    await this.page.waitForTimeout(500);
    await this.page.locator('#input_comp-makv289l').type(newRewardName, { delay: 20 });
    await this.page.locator('button[aria-label="Update Reward"]').click();

    const fulfilledCard2 = this.page.locator('.card.fulfilled').filter({
      has: this.page.locator('.content-box a', { hasText: newRewardName })
    });

    await expect(fulfilledCard2).toHaveCount(1);
    await editButton.click();
    await this.page.waitForTimeout(2000);
    await this.page.locator('button[aria-label="Delete Fulfillment"]').click();
    // await this.page.waitForTimeout(10000);
    // Navigate to the rewards tab via the left navigation or the card’s button
  }

  /**
   * Verify that a reward is visible to a participant viewing the campaign.  This helper
   * should be called in a separate browser context with the participant page loaded.
   */
  async participantShouldSeeReward(participantPage: Page, campaignId: string, description: string, url: string): Promise<void> {
    await participantPage.goto(`/participant/campaign/${campaignId}`);
    // Expand rewards section – the participant interface may not have an ID
    // so fall back to a role-based locator if necessary.
    const expandButton = participantPage.locator('#expandRewardsSection').or(participantPage.getByRole('button', { name: /rewards/i }));
    if (await expandButton.count()) {
      await expandButton.first().click();
    }
    await expect(participantPage.getByText(description)).toBeVisible();
    await expect(participantPage.getByRole('link', { name: new RegExp(description, 'i') })).toHaveAttribute('href', url);
  }
}