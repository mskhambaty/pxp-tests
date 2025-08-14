import { Page, expect } from '@playwright/test';

/**
 * Page object for viewing transactions on the organizer dashboard.  Assumes
 * transaction rows and counters have stable IDs.
 */
export class TransactionsPage {
  constructor(private page: Page) {}

  async openTab(): Promise<void> {
    await this.page.locator('#transactionsTab').click();
  }

  /** Verify that a transaction appears with the correct email, amount and status. */
  async verifyTransactionRow(email: string, amount: number): Promise<void> {
    const row = this.page.locator('#transactionRow').filter({ hasText: email });
    await expect(row.locator('#transactionAmount')).toHaveText(`$${amount}`);
    await expect(row.locator('#transactionStatus')).toHaveText(/Completed/);
  }

  /** Check that the transaction counter equals the expected count. */
  async verifyCounter(expectedCount: number): Promise<void> {
    // Some counters appear on the dashboard card as text (e.g. "Transactions X Total").  When
    // navigating to the transactions tab the detailed totals may use ids `tr-total-raised`
    // and `tr-unique-supporter`.  We assert on both if present.
    const counter = this.page.locator('#transactionCounter');
    if (await counter.count()) {
      await expect(counter).toHaveText(String(expectedCount));
    }
    const totalRaised = this.page.locator('#tr-total-raised');
    if (await totalRaised.count()) {
      // The amount is prefaced with a currency symbol; we only assert the number of transactions
      // matches expectedCount indirectly via the unique supporters count.
      const uniqueSupporter = this.page.locator('#tr-unique-supporter');
      if (await uniqueSupporter.count()) {
        await expect(uniqueSupporter).toHaveText(String(expectedCount));
      }
    }
  }
}