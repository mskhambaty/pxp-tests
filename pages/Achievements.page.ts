import { Page, expect } from '@playwright/test';

/**
 * Page object for managing achievements on the organizer dashboard.  Each month
 * is represented by a card with a data attribute.  IDs used here must be set
 * on the Wix elements by the developer.
 */
export class AchievementsPage {
  constructor(private page: Page) {}

  async openTab(): Promise<void> {
    await this.page.locator('#achievementsTab').click();
    // After navigating, wait for the achievements list to load.  The new UI
    // labels each month row with the id `ac-date`.
    await expect(this.page.locator('#ac-date')).toBeVisible();
  }

  /**
   * Add an achievement for a given month.  The month parameter should be the
   * `YYYY-MM` formatted string used to construct the card’s ID (e.g. `2025-08`).
   */
  async addAchievement(month: string, funds: number, metric: string, filePath: string): Promise<void> {
    // Click the “Add New Achievement” button on the dashboard card.  This id
    // lives on the dashboard page rather than the achievements tab, but it
    // opens the same modal.
    await this.page.locator('#d-add-achievements-btn').click();
    // Fill out the modal fields.  Provide a generic title based on the month
    // to ensure uniqueness.  The description parameter is used for both the
    // description and metric input to keep things simple.
    await this.page.locator('#ac-title-input').fill(`Achievement ${month}`);
    await this.page.locator('#ac-description-input').fill(metric);
    await this.page.locator('#achievementFundsInput').fill(String(funds));
    await this.page.locator('#achievementMetricInput').fill(metric);
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.locator('#achievementProofInput').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    await this.page.locator('#achievementSaveButton').click();
    // After saving, locate the month row by its label and verify its status
    const monthRow = this.page.locator('#ac-date').filter({ hasText: month });
    await expect(monthRow.locator('#ac-date-text')).toContainText(/recorded/i);
  }

  /**
   * Convert an existing plan entry into an achievement for a given month.
   */
  async convertPlanToAchievement(month: string): Promise<void> {
    // Find the month row by its date text and click its action button.  The
    // action button may show “Convert To Achievement”.
    const monthRow = this.page.locator('#ac-date').filter({ hasText: month });
    await monthRow.locator('#ac-action-btn').click();
    await this.page.locator('#confirmConvertButton').click();
    await expect(monthRow.locator('#ac-date-text')).toContainText(/recorded/i);
  }
}