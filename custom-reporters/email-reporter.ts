import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import dotenv from 'dotenv';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

dotenv.config();

class EmailReporter implements Reporter {
  private testResults: string[] = [];
  private failedTests = 0;
  private passedTests = 0;
  private skippedTests = 0;
  private mg;

  constructor() {
    if (process.env.SEND_REPORT_EMAIL !== 'true') {
      return;
    }

    // Proceed with Mailgun setup if the environment variable is set
    const mailgun = new Mailgun(formData);
    this.mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY!,
    });
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (!this.mg) return; // Skip reporting if Mailgun is not initialized

    const status = result.status;
    let statusEmoji = '🟢';

    if (status === 'failed') {
      this.failedTests++;
      statusEmoji = '🔴';
    } else if (status === 'passed') {
      this.passedTests++;
    } else if (status === 'skipped') {
      this.skippedTests++;
      statusEmoji = '⚪';
    }

    this.testResults.push(`${statusEmoji} ${test.title} - ${status.toUpperCase()}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async onEnd(result: FullResult) {
    if (!this.mg) return; // Skip sending the email if Mailgun is not initialized

    const totalTests = this.passedTests + this.failedTests + this.skippedTests;

    const summary = `
      <h2>🚀 Playwright Test Report</h2>
      <p><strong>🟢 Passed:</strong> ${this.passedTests}</p>
      <p><strong>🔴 Failed:</strong> ${this.failedTests}</p>
      <p><strong>⚪ Skipped:</strong> ${this.skippedTests}</p>
      <p><strong>📊 Total:</strong> ${totalTests}</p>
      
      <h3>Test Details:</h3>
      <ul>
        ${this.testResults.map((testResult) => `<li>${testResult}</li>`).join('')}
      </ul>
    `;

    const zipFilePath = await this.zipReportFolder('playwright-report');
    await this.sendEmail(summary, zipFilePath);
  }

  private async sendEmail(reportContent: string, zipFilePath: string) {
    try {
      const attachmentBuffer = fs.readFileSync(zipFilePath);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emailOptions: any = {
        from: `Playwright Reporter <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        to: process.env.EMAIL_TO!,
        subject: 'Playwright Test Report',
        html: reportContent,
        attachment: [
          {
            filename: 'playwright-report.zip',
            data: attachmentBuffer,
          },
        ],
      };

      const response = await this.mg.messages.create(process.env.MAILGUN_DOMAIN!, emailOptions);

      console.log('📧 Test report sent successfully with attachment!', response);

      fs.unlinkSync(zipFilePath);
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }

  private async zipReportFolder(folderPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const zipFilePath = path.join(__dirname, 'playwright-report.zip');
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        console.log(`Zipped ${archive.pointer()} total bytes.`);
        resolve(zipFilePath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      archive.directory(folderPath, false);

      archive.finalize();
    });
  }
}

export default EmailReporter;
