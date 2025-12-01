1. Goal:
Automatically send Playwright test results (summary + failures + optional screenshots) to Slack using a custom reporter.
2. High-Level Architecture:-
Playwright → Custom Reporter → Build Summary → Slack/Teams
3. Key Reporter Hooks
onBegin – start info
onTestEnd – capture each test’s result
onEnd – send summary
4. Minimal Reporter Pattern
onTestEnd: collect results
onEnd: build summary + send to Slack/Teams
5. Slack: Quick Messaging
Slack Webhook (simple JSON, no file upload)
Slack Bot Token (allows screenshot upload)
6. Teams Messaging
Use MessageCard via Teams Webhook.
7. Summary Should Include
Total, Passed, Failed, Skipped, Flaky, Duration, Top Failures, CI link, Screenshot links.
8. Best Practices
Post only on main, avoid noise, short errors, env vars for secrets, retry on network errors.
9. Config Example reporter:
[
['list'],
['./reporters/slack-reporter.ts', { slackWebhookUrl: SLACK_WEBHOOK, teamsWebhookUrl:
TEAMS_WEBHOOK }]
]
10. Troubleshooting
Slack 400 = JSON issue
Teams card invalid = schema issue
No files = need bot token
11. Add-Ons
Screenshot upload, threading, CI re-run button, flaky report.
12. Build Steps
Create webhook → Write reporter → Hook config → Capture results → Post summary →
Push to CI.