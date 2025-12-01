# Playwright Slack Reporter Setup Guide

This guide will help you set up Slack webhook integration for your Playwright test results.

## Prerequisites

- A Slack workspace where you have permission to create webhooks
- Playwright project set up and configured

## Step 1: Create a Slack Webhook

### Method 1: Using Slack Apps (Recommended)

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter an app name (e.g., "Playwright Test Reporter")
5. Select your workspace
6. Click **"Create App"**

#### Configure Incoming Webhooks:
1. In your app settings, go to **"Incoming Webhooks"**
2. Turn on **"Activate Incoming Webhooks"**
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want test results posted
5. Click **"Allow"**
6. Copy the webhook URL (starts with `https://hooks.slack.com/services/...`)

### Method 2: Legacy Webhook (Simple)

1. Go to [https://my.slack.com/services/new/incoming-webhook/](https://my.slack.com/services/new/incoming-webhook/)
2. Select a channel for notifications
3. Click **"Add Incoming WebHooks Integration"**
4. Copy the webhook URL

## Step 2: Configure Environment Variables

Update your `.env` file:

\`\`\`env
# Replace with your actual Slack webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Optional: Configure when to send notifications
ONLY_ON_FAILURE=false  # Set to 'true' to only notify on test failures
ENVIRONMENT=development  # or 'staging', 'production', etc.
PROJECT_NAME=Your Project Name

# Optional: Teams integration
TEAMS_WEBHOOK_URL=https://your-org.webhook.office.com/webhookb2/YOUR-TEAMS-WEBHOOK
\`\`\`

## Step 3: Test Your Integration

Run your tests to see the reporter in action:

\`\`\`bash
npm test
\`\`\`

Or run a specific test file:

\`\`\`bash
npx playwright test tests/login.spec.ts
\`\`\`

## Step 4: Customize Notifications

### Configuration Options

The reporter supports several configuration options in `playwright.config.ts`:

\`\`\`typescript
['./reporters/slack-reporter.ts', {
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  environment: 'staging',           // Environment label
  projectName: 'My App Tests',      // Project name in notifications
  onlyOnFailure: false,            // Only send when tests fail
  includeScreenshots: true,        // Include screenshot info
  maxFailuresToShow: 5,           // Max failed tests to show in detail
  ciUrl: process.env.CI_URL       // Link to CI build
}]
\`\`\`

### Environment-Specific Configuration

For different environments, you can create separate configuration files or use environment variables:

\`\`\`bash
# Development
ENVIRONMENT=development SLACK_WEBHOOK_URL=dev-webhook npm test

# Production
ENVIRONMENT=production ONLY_ON_FAILURE=true SLACK_WEBHOOK_URL=prod-webhook npm test
\`\`\`

## Step 5: CI/CD Integration

### GitHub Actions Example

\`\`\`yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - name: Install dependencies
      run: npm ci
    - name: Install Playwright
      run: npx playwright install --with-deps
    - name: Run tests
      run: npm test
      env:
        SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
        ENVIRONMENT: CI
        CI_URL: \${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}
\`\`\`

Don't forget to add `SLACK_WEBHOOK_URL` to your GitHub repository secrets!

## Teams Integration (Optional)

To set up Microsoft Teams integration:

1. In Teams, go to the channel where you want notifications
2. Click the "..." menu → **"Connectors"**
3. Find **"Incoming Webhook"** and click **"Add"**
4. Configure the webhook and copy the URL
5. Add it to your `.env` file as `TEAMS_WEBHOOK_URL`

## Troubleshooting

### Common Issues

**❌ Webhook URL Invalid**
- Make sure the URL starts with `https://hooks.slack.com/services/`
- Verify the webhook is still active in your Slack app settings

**❌ Tests Run But No Notification**
- Check that `SLACK_WEBHOOK_URL` is set in your environment
- If `ONLY_ON_FAILURE=true`, notifications only send when tests fail
- Check console output for error messages

**❌ Message Format Issues**
- The reporter includes fallback to simple messages if rich formatting fails
- Check Slack channel for any error messages from the webhook

**❌ Rate Limiting**
- Slack webhooks have rate limits
- The reporter includes retry logic with exponential backoff

### Debug Mode

To see detailed logging, check the console output when running tests. The reporter logs all steps including:
- ✅ Successful notifications
- ❌ Failed attempts and errors  
- 📝 Skipped notifications and reasons

## Sample Notification

Here's what a typical notification looks like:

> **✅ Playwright Test Results - SauceDemo Tests**
> 
> **Total:** 8 | **Passed:** 7 | **Failed:** 1 | **Skipped:** 0  
> **Duration:** 2m 34s | **Environment:** STAGING
> 
> **Failed Tests:**
> • Login with invalid credentials  
>   📁 `login.spec.ts`  
>   ⚠️ Epic sadface: Username and password do not match...
> 
> [View Full Report](https://github.com/your-org/repo/actions/runs/123456)

## Security Notes

- **Never commit webhook URLs to your repository**
- Use environment variables or CI secrets
- Consider using separate webhooks for different environments
- Webhook URLs provide write access to your Slack channel

## Next Steps

- Set up different webhook URLs for different environments
- Configure screenshot uploads (requires Slack Bot Token)
- Add custom message formatting for your team's needs
- Set up thread replies for detailed failure information