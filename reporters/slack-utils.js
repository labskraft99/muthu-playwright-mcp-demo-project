const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Send notification to Slack webhook
 * @param {Object} message - Slack message object
 */
async function sendSlackNotification(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('⚠️  SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    return;
  }

  const url = new URL(webhookUrl);
  const postData = JSON.stringify(message);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    rejectUnauthorized: false // Handle SSL certificate issues
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Slack notification sent successfully');
          resolve(data);
        } else {
          console.error(`❌ Slack notification failed: ${res.statusCode} ${res.statusMessage}`);
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error sending Slack notification:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Format test results for Slack
 * @param {Object} results - Test results object
 * @returns {Object} Slack message object
 */
function formatSlackMessage(results) {
  const { 
    passed, 
    failed, 
    skipped, 
    total, 
    duration, 
    projectName, 
    environment,
    failures = []
  } = results;

  const emoji = failed > 0 ? '❌' : '✅';
  const status = failed > 0 ? 'FAILED' : 'PASSED';
  const color = failed > 0 ? '#FF0000' : '#36A64F';

  let message = {
    text: `${emoji} Test Results: ${status}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${emoji} ${projectName || 'Playwright'} Test Results`
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Status:* ${status}`
          },
          {
            type: "mrkdwn", 
            text: `*Environment:* ${environment || 'N/A'}`
          },
          {
            type: "mrkdwn",
            text: `*Duration:* ${Math.round(duration / 1000)}s`
          },
          {
            type: "mrkdwn",
            text: `*Browser:* Chrome`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Total Tests:* ${total}`
          },
          {
            type: "mrkdwn",
            text: `*Passed:* ${passed} ✅`
          },
          {
            type: "mrkdwn", 
            text: `*Failed:* ${failed} ❌`
          },
          {
            type: "mrkdwn",
            text: `*Skipped:* ${skipped} ⏭️`
          }
        ]
      }
    ]
  };

  // Add failure details if there are any failures
  if (failures.length > 0) {
    const maxFailuresToShow = parseInt(process.env.MAX_FAILURES_TO_SHOW) || 5;
    const failuresToShow = failures.slice(0, maxFailuresToShow);
    
    message.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Failed Tests (${failuresToShow.length}/${failures.length}):*`
      }
    });

    failuresToShow.forEach((failure, index) => {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn", 
          text: `${index + 1}. *${failure.title}*\n\`\`\`${failure.error}\`\`\``
        }
      });
    });

    if (failures.length > maxFailuresToShow) {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `_... and ${failures.length - maxFailuresToShow} more failures_`
        }
      });
    }
  }

  return message;
}

module.exports = {
  sendSlackNotification,
  formatSlackMessage
};