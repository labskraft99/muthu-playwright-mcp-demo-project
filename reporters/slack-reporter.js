const { sendSlackNotification, formatSlackMessage } = require('./slack-utils');

class SlackReporter {
  constructor(options = {}) {
    this.onlyOnFailure = process.env.ONLY_ON_FAILURE === 'true';
    this.projectName = process.env.PROJECT_NAME || 'Playwright Tests';
    this.environment = process.env.ENVIRONMENT || 'development';
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      failures: [],
      projectName: this.projectName,
      environment: this.environment
    };
    this.startTime = Date.now();
  }

  onBegin(config, suite) {
    console.log('🚀 Starting Playwright tests...');
    this.startTime = Date.now();
  }

  onTestEnd(test, result) {
    switch (result.status) {
      case 'passed':
        this.results.passed++;
        break;
      case 'failed':
        this.results.failed++;
        this.results.failures.push({
          title: test.title,
          error: result.error?.message || 'Unknown error',
          file: test.location?.file || 'Unknown file'
        });
        break;
      case 'skipped':
        this.results.skipped++;
        break;
    }
    this.results.total++;
  }

  async onEnd(result) {
    this.results.duration = Date.now() - this.startTime;
    
    console.log(`\n📊 Test Summary:`);
    console.log(`   Passed: ${this.results.passed}`);
    console.log(`   Failed: ${this.results.failed}`);
    console.log(`   Skipped: ${this.results.skipped}`);
    console.log(`   Total: ${this.results.total}`);
    console.log(`   Duration: ${Math.round(this.results.duration / 1000)}s`);

    // Send to Slack if configured and conditions are met
    if (this.shouldSendNotification()) {
      try {
        const message = formatSlackMessage(this.results);
        await sendSlackNotification(message);
      } catch (error) {
        console.error('❌ Failed to send Slack notification:', error.message);
      }
    }
  }

  shouldSendNotification() {
    if (!process.env.SLACK_WEBHOOK_URL) {
      return false;
    }
    
    if (this.onlyOnFailure && this.results.failed === 0) {
      console.log('ℹ️  No failures detected and ONLY_ON_FAILURE=true, skipping Slack notification');
      return false;
    }
    
    return true;
  }
}

module.exports = SlackReporter;