import { Reporter, TestCase } from '@playwright/test/reporter';

class NumberedReporter implements Reporter {
  private testCounter = 0;
  private testTitleMap = new Map<string, number>();

  onTestBegin(test: TestCase) {
    const testTitle = test.title;
    if (!this.testTitleMap.has(testTitle)) {
      this.testCounter++;
      this.testTitleMap.set(testTitle, this.testCounter);
    }
    const testNumber = this.testTitleMap.get(testTitle);
    const projectName = test.parent?.project()?.name || 'Unknown Project';
    const projectPrefix = projectName === 'Mobile' ? 'M' : 'D';
    test.title = `${testNumber}-${projectPrefix}. ${test.title}`;
  }
}

export default NumberedReporter;
