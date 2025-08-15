import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Simple reporter that prefixes test names with an incrementing index when
 * logging to the console.  This mirrors the real numbered reporter used in
 * the original repository but does not write to files.
 */
class NumberedReporter implements Reporter {
  private counter = 1;
  onTestEnd(test: TestCase, result: TestResult): void {
    const status = result.status.toUpperCase();
    console.log(`[${this.counter}] ${test.title} - ${status}`);
    this.counter += 1;
  }
}

export default NumberedReporter;