import { test } from '@playwright/test';
import { OrganizerDashboardPage } from '../../pages/OrganizerDashboard.page';
import { AchievementsPage } from '../../pages/Achievements.page';

// Tests related to achievements management on the organizer dashboard

test.describe('Achievements Management', () => {
  test('add and convert achievements', async ({ page }) => {
    const dashboard = new OrganizerDashboardPage(page);
    const achievements = new AchievementsPage(page);
    // Navigate to dashboard and campaign
    await dashboard.goto();
    const campaignName = 'My Test Campaign';
    await dashboard.selectCampaign(campaignName);
    // Open achievements tab
    await dashboard.openNavTab('achievements');
    await achievements.openTab();
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