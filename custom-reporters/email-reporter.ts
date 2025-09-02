import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import Mailgun from 'mailgun.js';
import * as FormData from 'form-data';

interface TestInfo {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'interrupted' | 'timedOut';
  duration: number;
  error?: string;
  projectName?: string;
}

/**
 * Email reporter that sends detailed test results via Mailgun.
 * Sends emails when SEND_REPORT_EMAIL is "true" and Mailgun is properly configured.
 * Falls back to console logging if environment variables are missing.
 */
class EmailReporter implements Reporter {
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

    this.testResults.push(testInfo);

    if (result.status === 'passed') this.passed += 1;
    else if (result.status === 'failed') this.failed += 1;
    else if (result.status === 'skipped') this.skipped += 1;
  }

  async onEnd(result: FullResult): Promise<void> {
    const summary = `passed=${this.passed}, failed=${this.failed}, skipped=${this.skipped}`;
    
    // Check if email reporting is enabled
    const sendReportEmail = process.env.SEND_REPORT_EMAIL === 'true';
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const emailTo = process.env.EMAIL_TO;

    if (!sendReportEmail) {
      console.log(`[EmailReporter] Email reporting disabled. Completed run: ${summary}`);
      return;
    }

    if (!mailgunApiKey || !mailgunDomain || !emailTo) {
      console.warn('[EmailReporter] Mailgun configuration incomplete. Required: MAILGUN_API_KEY, MAILGUN_DOMAIN, EMAIL_TO');
      console.log(`[EmailReporter] Completed run: ${summary}`);
      return;
    }

    try {
      await this.sendEmailReport(mailgunApiKey, mailgunDomain, emailTo, result);
      console.log(`[EmailReporter] Email report sent successfully to ${emailTo}. ${summary}`);
    } catch (error) {
      console.error('[EmailReporter] Failed to send email report:', error);
      console.log(`[EmailReporter] Completed run: ${summary}`);
    }
  }

  private async sendEmailReport(
    apiKey: string, 
    domain: string, 
    to: string, 
    result: FullResult
  ): Promise<void> {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: apiKey });

    const total = this.passed + this.failed + this.skipped;
    const status = this.failed > 0 ? 'FAILED' : 'PASSED';
    const githubRepo = process.env.GITHUB_REPOSITORY || 'unknown';
    const githubRunId = process.env.GITHUB_RUN_ID || 'unknown';
    const githubServerUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';
    
    const runUrl = githubRunId !== 'unknown' 
      ? `${githubServerUrl}/${githubRepo}/actions/runs/${githubRunId}`
      : undefined;

    const subject = `Playwright Test Results - ${status} (${this.passed}/${total} passed)`;
    const htmlBody = this.generateHtmlReport(result, runUrl, githubRepo);

    const messageData = {
      from: `Playwright Tests <noreply@${domain}>`,
      to: to,
      subject: subject,
      html: htmlBody,
    };

    await mg.messages.create(domain, messageData);
  }

  private generateHtmlReport(result: FullResult, runUrl?: string, githubRepo?: string): string {
    const total = this.passed + this.failed + this.skipped;
    const status = this.failed > 0 ? 'FAILED' : 'PASSED';
    const statusColor = this.failed > 0 ? '#dc3545' : '#28a745';
    const duration = Math.round((result.duration || 0) / 1000);

    const passedTests = this.testResults.filter(t => t.status === 'passed');
    const failedTests = this.testResults.filter(t => t.status === 'failed');
    const skippedTests = this.testResults.filter(t => t.status === 'skipped');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Playwright Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { background-color: ${statusColor}; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .summary-card { background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #666; }
        .summary-card .number { font-size: 2em; font-weight: bold; color: #333; }
        .test-section { margin-bottom: 30px; }
        .test-section h2 { color: #333; border-bottom: 2px solid #dee2e6; padding-bottom: 5px; }
        .test-item { background-color: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #ccc; }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        .test-item.skipped { border-left-color: #ffc107; }
        .test-title { font-weight: bold; margin-bottom: 5px; }
        .test-meta { color: #666; font-size: 0.9em; margin-bottom: 10px; }
        .test-error { background-color: #fff5f5; border: 1px solid #fed7d7; padding: 10px; border-radius: 3px; color: #c53030; font-family: monospace; font-size: 0.85em; white-space: pre-wrap; }
        .github-link { display: inline-block; background-color: #0366d6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .github-link:hover { background-color: #0256c9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Playwright Test Report - ${status}</h1>
        <p>${githubRepo ? `Repository: ${githubRepo}` : 'Test Results'}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="number">${total}</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div class="number" style="color: #28a745;">${this.passed}</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div class="number" style="color: #dc3545;">${this.failed}</div>
        </div>
        <div class="summary-card">
            <h3>Skipped</h3>
            <div class="number" style="color: #ffc107;">${this.skipped}</div>
        </div>
        <div class="summary-card">
            <h3>Duration</h3>
            <div class="number">${duration}s</div>
        </div>
    </div>

    ${failedTests.length > 0 ? `
    <div class="test-section">
        <h2>Failed Tests (${failedTests.length})</h2>
        ${failedTests.map(test => `
        <div class="test-item failed">
            <div class="test-title">${test.title}</div>
            <div class="test-meta">
                ${test.projectName ? `Project: ${test.projectName} | ` : ''}Duration: ${Math.round(test.duration)}ms
            </div>
            ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${passedTests.length > 0 ? `
    <div class="test-section">
        <h2>Passed Tests (${passedTests.length})</h2>
        ${passedTests.map(test => `
        <div class="test-item passed">
            <div class="test-title">${test.title}</div>
            <div class="test-meta">
                ${test.projectName ? `Project: ${test.projectName} | ` : ''}Duration: ${Math.round(test.duration)}ms
            </div>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${skippedTests.length > 0 ? `
    <div class="test-section">
        <h2>Skipped Tests (${skippedTests.length})</h2>
        ${skippedTests.map(test => `
        <div class="test-item skipped">
            <div class="test-title">${test.title}</div>
            <div class="test-meta">
                ${test.projectName ? `Project: ${test.projectName}` : ''}
            </div>
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${runUrl ? `<a href="${runUrl}" class="github-link">View GitHub Actions Run</a>` : ''}
</body>
</html>`;
  }
}

export default EmailReporter;