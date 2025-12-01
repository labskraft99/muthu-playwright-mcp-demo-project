import { Reporter, TestCase, TestResult, FullResult, Suite, FullConfig } from '@playwright/test/reporter';
import { SlackUtils, TestSummary, TestFailure } from './slack-utils';
import { TeamsUtils } from './teams-utils';

interface SlackReporterOptions {
  slackWebhookUrl?: string;
  teamsWebhookUrl?: string;
  environment?: string;
  projectName?: string;
  onlyOnFailure?: boolean;
  includeScreenshots?: boolean;
  maxFailuresToShow?: number;
  ciUrl?: string;
}

class SlackReporter implements Reporter {
  private options: SlackReporterOptions;
  private testResults: Map<string, TestResult> = new Map();
  private startTime: Date = new Date();
  private failures: TestFailure[] = [];
  private config?: FullConfig;

  constructor(options: SlackReporterOptions = {}) {
    this.options = {
      onlyOnFailure: false,
      includeScreenshots: true,
      maxFailuresToShow: 5,
      ...options
    };

    // Validate webhook URL if provided
    if (this.options.slackWebhookUrl && !SlackUtils.validateWebhookUrl(this.options.slackWebhookUrl)) {
      console.warn('⚠️ Invalid Slack webhook URL provided');
    }

    console.log('🎬 Slack Reporter initialized');
  }

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.startTime = new Date();
    
    const totalTests = suite.allTests().length;
    console.log(`🚀 Starting test run with ${totalTests} tests`);
    
    // Log environment info
    if (this.options.environment) {
      console.log(`📍 Environment: ${this.options.environment}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const testId = `${test.parent.title}_${test.title}`;
    this.testResults.set(testId, result);

    // Collect failure information
    if (result.status === 'failed' || result.status === 'timedOut') {
      const failure: TestFailure = {
        title: test.title,
        file: test.location.file,
        error: result.error?.message || 'Unknown error',
        duration: result.duration,
        screenshotPath: this.extractScreenshotPath(result)
      };
      
      this.failures.push(failure);
      console.log(`❌ Test failed: ${test.title}`);
    } else if (result.status === 'passed') {
      console.log(`✅ Test passed: ${test.title}`);
    }
  }

  async onEnd(result: FullResult): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    
    // Calculate test statistics
    const summary = this.calculateTestSummary(result, duration, endTime);
    
    console.log('\n📊 Test Summary:');
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}, Skipped: ${summary.skipped}`);
    console.log(`Duration: ${SlackUtils['formatDuration'](duration)}`);

    // Send to Slack and Teams if conditions are met
    await this.sendToSlack(summary);
    await this.sendToTeams(summary);
  }

  private calculateTestSummary(result: FullResult, duration: number, endTime: Date): TestSummary {
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let flaky = 0;

    for (const testResult of this.testResults.values()) {
      total++;
      
      switch (testResult.status) {
        case 'passed':
          passed++;
          break;
        case 'failed':
        case 'timedOut':
          failed++;
          break;
        case 'skipped':
          skipped++;
          break;
        case 'interrupted':
          skipped++;
          break;
      }

      // Check for flaky tests (tests that passed after retry)
      if (testResult.status === 'passed' && testResult.retry > 0) {
        flaky++;
      }
    }

    return {
      total,
      passed,
      failed,
      skipped,
      flaky,
      duration,
      startTime: this.startTime,
      endTime,
      failures: this.failures.slice(0, this.options.maxFailuresToShow || 5),
      projectName: this.options.projectName,
      ciUrl: this.options.ciUrl || process.env.CI_URL || process.env.GITHUB_SERVER_URL ? 
        `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : undefined,
      environment: this.options.environment
    };
  }

  private async sendToSlack(summary: TestSummary): Promise<void> {
    // Skip sending if configured to only send on failure and there are no failures
    if (this.options.onlyOnFailure && summary.failed === 0) {
      console.log('📝 Skipping Slack notification (no failures and onlyOnFailure=true)');
      return;
    }

    // Skip if no webhook URL is configured
    if (!this.options.slackWebhookUrl) {
      console.log('📝 Skipping Slack notification (no webhook URL configured)');
      return;
    }

    try {
      console.log('📤 Sending test results to Slack...');
      
      // Create and send Slack message
      const message = SlackUtils.createTestResultsMessage(summary);
      await SlackUtils.sendToSlack(this.options.slackWebhookUrl, message);
      
      console.log('✅ Successfully sent test results to Slack');
    } catch (error) {
      console.error('❌ Failed to send test results to Slack:', error);
      
      // Try sending a simple fallback message
      try {
        const simpleMessage = SlackUtils.createSimpleMessage(summary);
        await SlackUtils.sendToSlack(this.options.slackWebhookUrl, simpleMessage);
        console.log('✅ Sent simplified message to Slack as fallback');
      } catch (fallbackError) {
        console.error('❌ Fallback message also failed:', fallbackError);
      }
    }
  }

  private async sendToTeams(summary: TestSummary): Promise<void> {
    // Skip sending if configured to only send on failure and there are no failures
    if (this.options.onlyOnFailure && summary.failed === 0) {
      console.log('📝 Skipping Teams notification (no failures and onlyOnFailure=true)');
      return;
    }

    // Skip if no webhook URL is configured
    if (!this.options.teamsWebhookUrl) {
      console.log('📝 Skipping Teams notification (no webhook URL configured)');
      return;
    }

    try {
      console.log('📤 Sending test results to Teams...');
      
      // Create and send Teams message
      const message = TeamsUtils.createTestResultsMessage(summary);
      await TeamsUtils.sendToTeams(this.options.teamsWebhookUrl, message);
      
      console.log('✅ Successfully sent test results to Teams');
    } catch (error) {
      console.error('❌ Failed to send test results to Teams:', error);
      
      // Try sending a simple fallback message
      try {
        const simpleMessage = TeamsUtils.createSimpleMessage(summary);
        await TeamsUtils.sendToTeams(this.options.teamsWebhookUrl, simpleMessage);
        console.log('✅ Sent simplified message to Teams as fallback');
      } catch (fallbackError) {
        console.error('❌ Teams fallback message also failed:', fallbackError);
      }
    }
  }

  private extractScreenshotPath(result: TestResult): string | undefined {
    // Look for screenshot attachments
    const screenshots = result.attachments?.filter(
      attachment => attachment.name === 'screenshot' || attachment.path?.includes('screenshot')
    );
    
    return screenshots && screenshots.length > 0 ? screenshots[0].path : undefined;
  }

  printsToStdio(): boolean {
    return false;
  }
}

export default SlackReporter;