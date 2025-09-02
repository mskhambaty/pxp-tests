import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { request as apiRequest } from '@playwright/test';

/**
 * Slack reporter that posts test results to a Slack webhook.
 * Sends notifications when SEND_SLACK_NOTIFICATION is "true" and SLACK_WEBHOOK_URL is configured.
 * Falls back to console logging if environment variables are missing.
 */
class SlackReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;

  onTestEnd(_: TestCase, result: TestResult): void {
    if (result.status === 'passed') this.passed += 1;
    else if (result.status === 'failed') this.failed += 1;
    else if (result.status === 'skipped') this.skipped += 1;
  }

  async onEnd(result: FullResult): Promise<void> {
    const summary = `passed=${this.passed}, failed=${this.failed}, skipped=${this.skipped}`;
    
    // Check if Slack notification is enabled
    const sendSlackNotification = process.env.SEND_SLACK_NOTIFICATION === 'true';
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!sendSlackNotification) {
      console.log(`[SlackReporter] Slack notifications disabled. Completed run: ${summary}`);
      return;
    }

    if (!slackWebhookUrl) {
      console.warn('[SlackReporter] SLACK_WEBHOOK_URL not configured. Skipping Slack notification.');
      console.log(`[SlackReporter] Completed run: ${summary}`);
      return;
    }

    try {
      await this.sendSlackNotification(slackWebhookUrl, result);
      console.log(`[SlackReporter] Slack notification sent successfully. ${summary}`);
    } catch (error) {
      console.error('[SlackReporter] Failed to send Slack notification:', error);
      console.log(`[SlackReporter] Completed run: ${summary}`);
    }
  }

  private async sendSlackNotification(webhookUrl: string, result: FullResult): Promise<void> {
    const total = this.passed + this.failed + this.skipped;
    const status = this.failed > 0 ? ':x: FAILED' : ':white_check_mark: PASSED';
    const githubRepo = process.env.GITHUB_REPOSITORY || 'unknown';
    const githubRunId = process.env.GITHUB_RUN_ID || 'unknown';
    const githubServerUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    
    const runUrl = githubRunId !== 'unknown' 
      ? `${githubServerUrl}/${githubRepo}/actions/runs/${githubRunId}`
      : undefined;

    const message = {
      text: `Playwright Test Results ${status}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `Playwright Test Results ${status}`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Total Tests:* ${total}`
            },
            {
              type: 'mrkdwn',
              text: `*Passed:* ${this.passed}`
            },
            {
              type: 'mrkdwn',
              text: `*Failed:* ${this.failed}`
            },
            {
              type: 'mrkdwn',
              text: `*Skipped:* ${this.skipped}`
            }
          ]
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Repository:* ${githubRepo}`
            },
            {
              type: 'mrkdwn',
              text: `*Duration:* ${Math.round((result.duration || 0) / 1000)}s`
            }
          ]
        }
      ]
    };

    if (runUrl) {
      message.blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View GitHub Run'
            },
            url: runUrl
          }
        ]
      });
    }

    const requestContext = await apiRequest.newContext();
    try {
      const response = await requestContext.fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(message),
      });

      if (!response.ok()) {
        throw new Error(`Slack webhook returned ${response.status()}: ${response.statusText()}`);
      }
    } finally {
      await requestContext.dispose();
    }
  }
}

export default SlackReporter;