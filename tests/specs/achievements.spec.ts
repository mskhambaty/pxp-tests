import { test } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';
import { AchievementsPage } from '../../pages/Achievements.page';

// Tests related to achievements management on the organizer dashboard

test.describe.skip('Achievements Management', () => {
  test('add and convert achievements', async ({ page }) => {
    console.log('Test: Starting achievements test');
    const dashboard = new OrganizerDashboardPage(page);
    const achievements = new AchievementsPage(page);
    // Navigate to dashboard and campaign
    console.log('Test: About to call dashboard.goto()');
    await dashboard.goto();
    console.log('Test: dashboard.goto() completed');
    const campaignName = process.env.CAMPAIGN_NAME || 'Auto Collectible 2025-09-03T01:22:22.313Z';
    await dashboard.selectCampaign(campaignName);
    // Open achievements tab
    console.log('Test: About to call dashboard.openNavTab("achievements")');
    await dashboard.openNavTab('achievements');
    console.log('Test: dashboard.openNavTab("achievements") completed');
    await achievements.openTab();
    console.log('Test: achievements.openTab() completed');
    // Determine the current month/year (YYYY-MM) string for the new achievement
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    // Add a new achievement for this month
    await achievements.addAchievement(month, 5000, '200 lbs', '/path/to/proof.png');
    // If there is a plan for next month, convert it to an achievement
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    try {
      await achievements.convertPlanToAchievement(nextMonthStr);
    } catch (e) {
      // If no plan exists, ignore error
    }
  });
});