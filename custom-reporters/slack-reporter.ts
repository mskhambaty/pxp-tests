import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Minimal Slack reporter stub.  The real test suite posts a summary to a
 * Slack webhook.  This stub logs the summary to stdout to avoid runtime
 * failures if the webhook secret is missing.
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

  async onEnd(_: FullResult): Promise<void> {
    console.log(
      `[SlackReporter] Completed run: passed=${this.passed}, failed=${this.failed}, skipped=${this.skipped}`,
    );
  }
}

export default SlackReporter;