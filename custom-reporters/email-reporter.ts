import type { FullResult, Reporter, TestCase, TestError, TestResult } from '@playwright/test/reporter';

/**
 * Minimal email reporter stub.  This implementation collects test results
 * and logs a summary to stdout.  In the real test suite this would send
 * an email via Mailgun or another service using secrets.  Here we simply
 * implement the interface to avoid Playwright errors.
 */
class EmailReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;

  onTestEnd(_: TestCase, result: TestResult): void {
    if (result.status === 'passed') this.passed += 1;
    else if (result.status === 'failed') this.failed += 1;
    else if (result.status === 'skipped') this.skipped += 1;
  }

  async onEnd(_: FullResult): Promise<void> {
    // In a real implementation you'd send an email here.  For now, log.
    console.log(
      `[EmailReporter] Completed run: passed=${this.passed}, failed=${this.failed}, skipped=${this.skipped}`,
    );
  }
}

export default EmailReporter;