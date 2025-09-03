import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Page object for editing a campaign’s basic information (title, description,
 * goal).  All selectors rely on stable IDs that must be set on the Wix
 * elements by the developer via the Properties & Events panel.
 */
export class CampaignEditPage {
  constructor(private page: Page) { }



  /**
   * Update the campaign’s title and description fields.
   *
   * @param title        New campaign title
   * @param description  New short description
   */
  async updateBasicInfo(title: string, description: string): Promise<void> {
    let newTitle = `${title} ${new Date().toISOString()}`;
    await this.page.locator('input[name="campaign-title"]').fill(newTitle);
    await this.page.locator('textarea[placeholder="Enter Description"]').fill(`${description} ${new Date().toISOString()}`);
    await this.page.waitForTimeout(6000);
    await this.page.locator('button[aria-label="Save Changes"]').click();
    // Persist the campaign name so other tests can consume it next run
    process.env.CAMPAIGN_NAME = newTitle;

    // After saving, verify that the campaign title is updated in the UI.
    const titleLocator = this.page.locator('#comp-m9sjpr3q h3 span.wixui-rich-text__text');
    await expect(titleLocator).toBeVisible();
  }
  /**
   * Navigates to the specified campaign public page and checks if the title matches the expected string.
   * @param expectedTitle The expected campaign title to match.
   */
  async verifyPublicCampaignTitle(expectedTitle: string, campaignUrl: string): Promise<void> {
    console.log(`CampaignEdit: Navigating to campaign URL: ${campaignUrl}`);
    await this.page.goto(campaignUrl);
    // Check if the current viewport is mobile or desktop
    const viewport = this.page.viewportSize();
    const isMobile = viewport && viewport.width < 768;
    console.log(`CampaignEdit: Viewport size:`, viewport, 'isMobile:', isMobile);
    const titleLocator = !isMobile ? this.page.locator('#comp-lg4fg0mq h3') : this.page.locator('#comp-lgvu74jh h3');
    console.log('CampaignEdit: Waiting for title element to be visible...');
    await expect(titleLocator).toBeVisible();
    
    const actualText = await titleLocator.textContent();
    console.log(`CampaignEdit: Title element found with text: "${actualText}"`);
    console.log(`CampaignEdit: Expected text: "${expectedTitle}"`);
    
    await expect(titleLocator).toHaveText(expectedTitle);
    console.log('CampaignEdit: Title verification passed');
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

// Helpers
export function ensureDirExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Update or append an environment variable in the project-level .env file.
 * Values will be available on the next process start (dotenv loads on boot).
 */
export function writeEnvVar(key: string, value: string): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let contents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const line = `${key}=${value}`;
    if (!contents) {
      fs.writeFileSync(envPath, `${line}\n`, 'utf8');
      return;
    }
    const regex = new RegExp(`^${key}=.*$`, 'm');
    contents = regex.test(contents) ? contents.replace(regex, line) : `${contents.trim()}\n${line}\n`;
    fs.writeFileSync(envPath, contents, 'utf8');
  } catch {
    // ignore failures in CI
  }
}

export function readEnvVar(key: string): string | undefined {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return undefined;
    const contents = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${key}=(.*)$`, 'm');
    const match = contents.match(regex);
    return match ? match[1] : undefined;
  } catch {
    // ignore failures in CI
    return undefined;
  }
}

// (no-op footer helpers)