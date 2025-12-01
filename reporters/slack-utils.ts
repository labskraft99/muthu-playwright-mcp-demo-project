export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: any[];
}

export interface SlackAttachment {
  color: string;
  fields: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  failures: TestFailure[];
  projectName?: string;
  ciUrl?: string;
  environment?: string;
}

export interface TestFailure {
  title: string;
  file: string;
  error: string;
  duration: number;
  screenshotPath?: string;
}

export class SlackUtils {
  private static readonly COLORS = {
    SUCCESS: '#36a64f',
    FAILURE: '#ff0000',
    WARNING: '#ffaa00',
    INFO: '#2196f3'
  };

  /**
   * Send message to Slack webhook
   */
  static async sendToSlack(webhookUrl: string, message: SlackMessage): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (!response.ok) {
          throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
        }

        console.log('✅ Successfully sent message to Slack');
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed: ${error}`);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to send Slack message after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Create a comprehensive test results message for Slack
   */
  static createTestResultsMessage(summary: TestSummary): SlackMessage {
    const { total, passed, failed, skipped, flaky, duration, failures, projectName, ciUrl, environment } = summary;
    
    // Determine overall status and color
    const overallStatus = failed > 0 ? 'FAILED' : passed > 0 ? 'PASSED' : 'NO_TESTS';
    const color = failed > 0 ? this.COLORS.FAILURE : this.COLORS.SUCCESS;
    const emoji = failed > 0 ? '❌' : '✅';
    
    // Format duration
    const durationFormatted = this.formatDuration(duration);
    
    // Create header
    const headerText = `${emoji} *Playwright Test Results${projectName ? ` - ${projectName}` : ''}*`;
    
    // Create summary fields
    const summaryFields = [
      {
        type: 'mrkdwn',
        text: `*Total:* ${total}`
      },
      {
        type: 'mrkdwn',
        text: `*Passed:* ${passed}`
      },
      {
        type: 'mrkdwn',
        text: `*Failed:* ${failed}`
      },
      {
        type: 'mrkdwn',
        text: `*Skipped:* ${skipped}`
      },
      {
        type: 'mrkdwn',
        text: `*Duration:* ${durationFormatted}`
      }
    ];

    if (flaky > 0) {
      summaryFields.push({
        type: 'mrkdwn',
        text: `*Flaky:* ${flaky}`
      });
    }

    if (environment) {
      summaryFields.push({
        type: 'mrkdwn',
        text: `*Environment:* ${environment}`
      });
    }

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: headerText.replace(/\*/g, '').replace(emoji, '').trim()
        }
      },
      {
        type: 'section',
        fields: summaryFields
      }
    ];

    // Add CI link if available
    if (ciUrl) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<${ciUrl}|View Full Report>`
        }
      });
    }

    // Add failure details if there are any
    if (failed > 0 && failures.length > 0) {
      blocks.push({
        type: 'divider'
      } as SlackBlock);

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Failed Tests:*'
        }
      });

      // Show top failures (limit to 5 to avoid message being too long)
      const topFailures = failures.slice(0, 5);
      
      for (const failure of topFailures) {
        const failureText = this.formatTestFailure(failure);
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: failureText
          }
        });
      }

      // If there are more failures, show count
      if (failures.length > 5) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `_... and ${failures.length - 5} more failures_`
          }
        });
      }
    }

    // Add timestamp
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Report generated at ${summary.endTime.toLocaleString()}`
        }
      ]
    });

    return {
      blocks,
      text: `${emoji} Playwright Tests ${overallStatus}: ${passed}/${total} passed`
    };
  }

  /**
   * Create a simple text-only message (fallback)
   */
  static createSimpleMessage(summary: TestSummary): SlackMessage {
    const { total, passed, failed, skipped, duration, projectName } = summary;
    const emoji = failed > 0 ? '❌' : '✅';
    const status = failed > 0 ? 'FAILED' : 'PASSED';
    const durationFormatted = this.formatDuration(duration);
    
    let text = `${emoji} *Playwright Tests ${status}${projectName ? ` - ${projectName}` : ''}*\n`;
    text += `• Total: ${total} | Passed: ${passed} | Failed: ${failed}`;
    
    if (skipped > 0) {
      text += ` | Skipped: ${skipped}`;
    }
    
    text += `\n• Duration: ${durationFormatted}`;

    return { text };
  }

  /**
   * Format test failure for Slack display
   */
  private static formatTestFailure(failure: TestFailure): string {
    const fileName = failure.file.split('/').pop() || failure.file;
    let text = `• *${failure.title}*\n`;
    text += `  📁 \`${fileName}\`\n`;
    
    // Truncate long error messages
    const maxErrorLength = 200;
    let errorMsg = failure.error.replace(/\n/g, ' ').trim();
    if (errorMsg.length > maxErrorLength) {
      errorMsg = errorMsg.substring(0, maxErrorLength) + '...';
    }
    
    text += `  ⚠️ ${errorMsg}`;
    
    if (failure.screenshotPath) {
      text += `\n  📸 Screenshot available`;
    }
    
    return text;
  }

  /**
   * Format duration in human readable format
   */
  private static formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${duration}ms`;
    }
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Validate Slack webhook URL
   */
  static validateWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === 'hooks.slack.com' && parsedUrl.pathname.includes('/services/');
    } catch {
      return false;
    }
  }

  /**
   * Get status emoji based on test results
   */
  static getStatusEmoji(passed: number, failed: number, skipped: number): string {
    if (failed > 0) return '❌';
    if (skipped > 0 && passed === 0) return '⏭️';
    if (passed > 0) return '✅';
    return '⚪';
  }

  /**
   * Create environment-specific message prefix
   */
  static getEnvironmentPrefix(environment?: string): string {
    if (!environment) return '';
    
    const envEmojis: Record<string, string> = {
      'production': '🚀',
      'staging': '🎭',
      'development': '🔧',
      'testing': '🧪',
      'qa': '🔍'
    };
    
    const emoji = envEmojis[environment.toLowerCase()] || '🏷️';
    return `${emoji} ${environment.toUpperCase()} `;
  }
}