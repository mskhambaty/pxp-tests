import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import dotenv from 'dotenv';

dotenv.config();

class SlackReporter implements Reporter {
  private testResults: string[] = [];
  private failedTests = 0;
  private passedTests = 0;
  private skippedTests = 0;

  onTestEnd(test: TestCase, result: TestResult) {
    const status = result.status;
    let statusEmoji = '🟢';

    if (status === 'failed' || status === 'timedOut') {
      this.failedTests++;
      statusEmoji = '🔴';
    } else if (status === 'passed') {
      this.passedTests++;
    } else if (status === 'skipped') {
      this.skippedTests++;
      statusEmoji = '⚪';
    }
    const projectName = test.parent?.project()?.name || 'Unknown Project';
    this.testResults.push(
      `${statusEmoji} [${projectName}] ${test.title} - ${status.toUpperCase()}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onEnd(result: FullResult) {
    if (process.env.SEND_SLACK_NOTIFICATION !== 'true') return;

    const totalTests = this.passedTests + this.failedTests + this.skippedTests;
    const GITHUB_RUN_ID = process.env.GITHUB_RUN_ID;
    const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
    const GITHUB_SERVER_URL = process.env.GITHUB_SERVER_URL;
    const SLACK_WEBHOOK_URL =
      'https://hooks.slack.com/services/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';

    const ACTIONS_RUN_URL = `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
    const ARTIFACTS_URL = `${ACTIONS_RUN_URL}/artifacts`;

    console.log('ARTIFACTS_URL = ' + ACTIONS_RUN_URL);

    const summary = `
      *🚀 Playwright Test Report*
      *🟢 Passed:* ${this.passedTests}
      *🔴 Failed:* ${this.failedTests}
      *⚪ Skipped:* ${this.skippedTests}
      *📊 Total:* ${totalTests}
    `;

    console.log(summary);

    // const payload = {
    //   text: summary,
    //   attachments: [
    //     {
    //       text: `View details: <${ACTIONS_RUN_URL}>`,
    //       actions: [
    //         {
    //           type: 'button',
    //           text: 'View GitHub Actions Run',
    //           url: ACTIONS_RUN_URL,
    //         },
    //         {
    //           type: 'button',
    //           text: 'Download Artifacts',
    //           url: ARTIFACTS_URL,
    //         },
    //       ],
    //     },
    //   ],
    // };

    // try {
    //   const response = await fetch(SLACK_WEBHOOK_URL!, {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload),
    //   });

    //   if (!response.ok) {
    //     throw new Error(`Slack API responded with status: ${response.status}`);
    //   }
    //   console.log('Slack notification sent successfully');
    // } catch (error) {
    //   console.error('Error sending Slack notification:', error);
    // }
  }
}

export default SlackReporter;
