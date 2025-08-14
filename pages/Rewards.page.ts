import { Page, expect } from '@playwright/test';

/**
 * Page object for managing rewards on a collectible.  Relies on stable IDs
 * assigned to elements in the rewards UI.
 */
export class RewardsPage {
  constructor(private page: Page) {}

  /**
   * Add a tier‑wide reward to the currently selected collectible.
   * @param collectibleName Name of the collectible you are adding the reward to (used to select the tab)
   * @param description     Reward description shown to participants
   * @param type            Reward type (e.g. `Link` or `Document`)
   * @param url             URL or attachment for the reward
   */
  async addTierReward(collectibleName: string, description: string, type: string, url: string): Promise<void> {
    // Navigate to the rewards tab via the left navigation or the card’s button
    await this.page.locator('#rewardsTab').click();
    // Select the collectible from the dropdown.  The dropdown uses the id
    // `a-r-collectibleDropdown` and options are labeled with the collectible names.
    await this.page.locator('#addRewardButton').click();
    await this.page.locator('#a-r-collectibleDropdown').selectOption({ label: collectibleName });
    // Select tier‑wide fulfillment type by clicking the appropriate radio button
    await this.page.locator('#a-r-fulfillmentType-t').check();
    // Choose distribution type if provided (link vs upload).  We expect `type` to
    // match an option’s label, such as `Link` or `Document`.
    await this.page.locator('#rewardDistributionTypeSelect').selectOption({ label: 'Tier-wide' });
    await this.page.locator('#rewardTypeSelect').selectOption({ label: type });
    // Fill in description and URL
    await this.page.locator('#rewardDescriptionInput').fill(description);
    await this.page.locator('#rewardUrlInput').fill(url);
    await this.page.locator('#rewardSaveButton').click();
    // Verify that the reward appears in the rewards repeater for the selected collectible
    const rewardsList = this.page.locator('#rewardsRepeater').filter({ has: this.page.locator('#rewards-r-title', { hasText: collectibleName }) });
    await expect(rewardsList).toContainText(description);
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