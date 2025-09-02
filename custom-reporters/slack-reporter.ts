import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { request as apiRequest } from '@playwright/test';

interface TestInfo {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'interrupted' | 'timedOut';
  duration: number;
  error?: string;
  projectName?: string;
  videoPath?: string;
}

/**
 * Slack reporter that posts test results to a Slack webhook.
 * Sends notifications when SEND_SLACK_NOTIFICATION is "true" and SLACK_WEBHOOK_URL is configured.
 * Falls back to console logging if environment variables are missing.
 */
class SlackReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private testResults: TestInfo[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const testInfo: TestInfo = {
      title: test.title,
      status: result.status,
      duration: result.duration,
      projectName: test.parent.project()?.name,
    };

    if (result.error) {
      testInfo.error = result.error.message || result.error.toString();
    }

    // Capture video path for failed tests
    if (result.status === 'failed' && result.attachments) {
      const videoAttachment = result.attachments.find(a => a.name === 'video');
      if (videoAttachment && videoAttachment.path) {
        testInfo.videoPath = videoAttachment.path;
      }
    }

    this.testResults.push(testInfo);

    if (result.status === 'passed') this.passed += 1;
    else if (result.status === 'failed') this.failed += 1;
    else if (result.status === 'skipped') this.skipped += 1;
  }

  async onEnd(result: FullResult): Promise<void> {
    const summary = `passed=${this.passed}, failed=${this.failed}, skipped=${this.skipped}`;
    
    // Check if Slack notification is enabled
    const sendSlackNotification = process.env.SEND_SLACK_NOTIFICATION === 'true';
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    console.log(`[SlackReporter] Configuration check:`);
    console.log(`  SEND_SLACK_NOTIFICATION: ${sendSlackNotification}`);
    console.log(`  SLACK_WEBHOOK_URL: ${slackWebhookUrl ? '[SET]' : '[NOT SET]'}`);

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
      console.log(`[SlackReporter] Attempting to send Slack notification...`);
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

    const failedTests = this.testResults.filter(t => t.status === 'failed');
    const passedTests = this.testResults.filter(t => t.status === 'passed');
    const skippedTests = this.testResults.filter(t => t.status === 'skipped');

    const message: {
      text: string;
      blocks: Array<Record<string, unknown>>;
    } = {
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

    // Add failed tests details
    if (failedTests.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*:x: Failed Tests (${failedTests.length}):*`
        }
      });

      failedTests.slice(0, 10).forEach(test => { // Limit to 10 for Slack message size
        const errorText = test.error ? test.error.substring(0, 200) + (test.error.length > 200 ? '...' : '') : 'No error details';
        const durationMs = Math.round(test.duration);
        const avgDuration = Math.round((result.duration || 0) / total);
        const timingInfo = durationMs > avgDuration * 1.5 ? ` (slow: ${durationMs}ms vs avg ${avgDuration}ms)` : ` (${durationMs}ms)`;
        
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${test.title}*${timingInfo}\n  ${test.projectName ? `_${test.projectName}_: ` : ''}${errorText}`
          }
        });
      });

      if (failedTests.length > 10) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_... and ${failedTests.length - 10} more failed tests_`
          }
        });
      }
    }

    // Add passed tests summary
    if (passedTests.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*:white_check_mark: Passed Tests (${passedTests.length}):*`
        }
      });

      if (passedTests.length <= 10) {
        passedTests.forEach(test => {
          const durationMs = Math.round(test.duration);
          message.blocks.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `• *${test.title}* (${durationMs}ms)${test.projectName ? ` _${test.projectName}_` : ''}`
            }
          });
        });
      } else {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_${passedTests.length} tests passed successfully_`
          }
        });
      }
    }

    // Add skipped tests summary
    if (skippedTests.length > 0) {
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*:warning: Skipped Tests (${skippedTests.length}):*`
        }
      });

      skippedTests.slice(0, 5).forEach(test => {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${test.title}*${test.projectName ? ` _${test.projectName}_` : ''}`
          }
        });
      });

      if (skippedTests.length > 5) {
        message.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_... and ${skippedTests.length - 5} more skipped tests_`
          }
        });
      }
    }

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