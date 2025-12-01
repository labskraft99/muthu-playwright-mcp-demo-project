import { TestSummary } from './slack-utils';

export interface TeamsMessage {
  '@type': string;
  '@context': string;
  summary: string;
  themeColor: string;
  sections: TeamsSection[];
  potentialAction?: TeamsAction[];
}

export interface TeamsSection {
  activityTitle: string;
  activitySubtitle?: string;
  activityImage?: string;
  facts: TeamsFact[];
  markdown: boolean;
}

export interface TeamsFact {
  name: string;
  value: string;
}

export interface TeamsAction {
  '@type': string;
  name: string;
  targets: Array<{
    os: string;
    uri: string;
  }>;
}

export class TeamsUtils {
  private static readonly COLORS = {
    SUCCESS: '#36a64f',
    FAILURE: '#ff0000',
    WARNING: '#ffaa00',
    INFO: '#2196f3'
  };

  /**
   * Send message to Teams webhook
   */
  static async sendToTeams(webhookUrl: string, message: TeamsMessage): Promise<void> {
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
          const responseText = await response.text();
          throw new Error(`Teams API error: ${response.status} ${response.statusText} - ${responseText}`);
        }

        console.log('✅ Successfully sent message to Teams');
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Teams attempt ${attempt}/${maxRetries} failed: ${error}`);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to send Teams message after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Create a comprehensive test results message for Teams
   */
  static createTestResultsMessage(summary: TestSummary): TeamsMessage {
    const { total, passed, failed, skipped, flaky, duration, failures, projectName, ciUrl, environment } = summary;
    
    // Determine overall status and color
    const color = failed > 0 ? this.COLORS.FAILURE : this.COLORS.SUCCESS;
    const emoji = failed > 0 ? '❌' : '✅';
    
    // Format duration
    const durationFormatted = this.formatDuration(duration);
    
    const activityTitle = `${emoji} Playwright Test Results${projectName ? ` - ${projectName}` : ''}`;
    const activitySubtitle = `${passed}/${total} tests passed`;

    // Create main facts section
    const facts: TeamsFact[] = [
      { name: 'Total Tests', value: total.toString() },
      { name: 'Passed', value: passed.toString() },
      { name: 'Failed', value: failed.toString() },
      { name: 'Skipped', value: skipped.toString() },
      { name: 'Duration', value: durationFormatted }
    ];

    if (flaky > 0) {
      facts.push({ name: 'Flaky', value: flaky.toString() });
    }

    if (environment) {
      facts.push({ name: 'Environment', value: environment });
    }

    const sections: TeamsSection[] = [
      {
        activityTitle,
        activitySubtitle,
        facts,
        markdown: true
      }
    ];

    // Add failure details if there are any
    if (failed > 0 && failures.length > 0) {
      const failureFacts: TeamsFact[] = [];
      
      // Show top failures (limit to 5 for readability)
      const topFailures = failures.slice(0, 5);
      
      topFailures.forEach((failure, index) => {
        const fileName = failure.file.split('/').pop() || failure.file;
        let errorMsg = failure.error.replace(/\n/g, ' ').trim();
        
        // Truncate long error messages
        const maxErrorLength = 150;
        if (errorMsg.length > maxErrorLength) {
          errorMsg = errorMsg.substring(0, maxErrorLength) + '...';
        }
        
        failureFacts.push({
          name: `${index + 1}. ${failure.title}`,
          value: `**File:** ${fileName}  \n**Error:** ${errorMsg}`
        });
      });

      sections.push({
        activityTitle: 'Failed Tests',
        facts: failureFacts,
        markdown: true
      });

      // If there are more failures, add a note
      if (failures.length > 5) {
        sections.push({
          activityTitle: 'Additional Failures',
          facts: [
            {
              name: 'More failures',
              value: `... and ${failures.length - 5} more failures. Check the full report for details.`
            }
          ],
          markdown: true
        });
      }
    }

    // Create potential actions
    const potentialAction: TeamsAction[] = [];
    
    if (ciUrl) {
      potentialAction.push({
        '@type': 'OpenUri',
        name: 'View Full Report',
        targets: [
          {
            os: 'default',
            uri: ciUrl
          }
        ]
      });
    }

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Playwright Tests: ${passed}/${total} passed`,
      themeColor: color,
      sections,
      potentialAction: potentialAction.length > 0 ? potentialAction : undefined
    };
  }

  /**
   * Create a simple message for Teams
   */
  static createSimpleMessage(summary: TestSummary): TeamsMessage {
    const { total, passed, failed, skipped, duration, projectName } = summary;
    const emoji = failed > 0 ? '❌' : '✅';
    const color = failed > 0 ? this.COLORS.FAILURE : this.COLORS.SUCCESS;
    const durationFormatted = this.formatDuration(duration);

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Playwright Tests: ${passed}/${total} passed`,
      themeColor: color,
      sections: [
        {
          activityTitle: `${emoji} Playwright Test Results${projectName ? ` - ${projectName}` : ''}`,
          facts: [
            { name: 'Passed', value: passed.toString() },
            { name: 'Failed', value: failed.toString() },
            { name: 'Total', value: total.toString() },
            { name: 'Duration', value: durationFormatted }
          ],
          markdown: false
        }
      ]
    };
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
   * Validate Teams webhook URL
   */
  static validateWebhookUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.includes('webhook.office.com') || parsedUrl.hostname.includes('outlook.office.com');
    } catch {
      return false;
    }
  }
}