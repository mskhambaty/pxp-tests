import { Page, expect } from '@playwright/test';

/**
 * Page object for editing a campaign’s basic information (title, description,
 * goal).  All selectors rely on stable IDs that must be set on the Wix
 * elements by the developer via the Properties & Events panel.
 */
export class CampaignEditPage {
  constructor(private page: Page) {}

  /** Navigate to the edit page for a given campaign ID. */
  async goto(campaignId: string): Promise<void> {
    await this.page.goto(`/campaign/${campaignId}/edit`);
  }

  /**
   * Update the campaign’s title and description fields.
   *
   * @param title        New campaign title
   * @param description  New short description
   */
  async updateBasicInfo(title: string, description: string): Promise<void> {
    await this.page.locator('#campaignTitleInput').fill(title);
    await this.page.locator('#campaignShortDescInput').fill(description);
    await this.page.locator('#saveChangesButton').click();
    const toast = this.page.locator('#toastNotification');
    await expect(toast).toContainText(/saved/i);
  }

  /**
   * Attempt to set the fundraising goal.  If the value is below the minimum
   * allowed ($100), a validation message should appear.
   */
  async setFundraisingGoal(value: number): Promise<void> {
    await this.page.locator('#campaignGoalInput').fill(String(value));
    await this.page.locator('#saveChangesButton').click();
  }

  /**
   * Expect a validation error to be visible when the goal is too low.  The
   * inline error element should have ID `goalError`.
   */
  async expectGoalValidationError(): Promise<void> {
    await expect(this.page.locator('#goalError')).toBeVisible();
  }
}