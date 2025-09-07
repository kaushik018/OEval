import { storage } from "../storage";

interface UptimeResult {
  uptime: number;
  responseTime: number;
  isOnline: boolean;
  statusCode?: number;
}

class ReliabilityService {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  async startMonitoring(applicationId: string, url: string): Promise<void> {
    // Stop existing monitoring if any
    this.stopMonitoring(applicationId);

    // Start new monitoring with 5-minute intervals
    const interval = setInterval(async () => {
      await this.checkReliability(applicationId, url);
    }, 5 * 60 * 1000); // 5 minutes

    this.monitoringIntervals.set(applicationId, interval);

    // Run initial check immediately
    await this.checkReliability(applicationId, url);
  }

  stopMonitoring(applicationId: string): void {
    const interval = this.monitoringIntervals.get(applicationId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(applicationId);
    }
  }

  private async checkReliability(applicationId: string, url: string): Promise<void> {
    try {
      const result = await this.performUptimeCheck(url);
      
      // Store reliability metrics
      await storage.createReliabilityMetrics({
        applicationId,
        uptime: result.uptime.toString(),
        slaCompliance: this.calculateSLACompliance(result).toString(),
        outageCount: result.isOnline ? 0 : 1,
        mttr: (result.isOnline ? 0 : 1).toString() // Simplified MTTR calculation
      });

      // Also store as performance metrics for dashboard
      await storage.createPerformanceMetrics({
        applicationId,
        responseTime: result.responseTime.toString(),
        uptime: result.uptime.toString(),
        errorRate: result.isOnline ? "0" : "100",
        performanceScore: this.calculatePerformanceScore(result)
      });

    } catch (error) {
      console.error(`Reliability check failed for application ${applicationId}:`, error);
      
      // Store failure metrics
      await storage.createReliabilityMetrics({
        applicationId,
        uptime: "0",
        slaCompliance: "0",
        outageCount: 1,
        mttr: "1"
      });
    }
  }

  private async performUptimeCheck(url: string): Promise<UptimeResult> {
    try {
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD to minimize data transfer
        headers: {
          'User-Agent': 'ObjectiveEval-Uptime-Monitor/1.0'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      const isOnline = response.ok;

      return {
        uptime: isOnline ? 100 : 0,
        responseTime,
        isOnline,
        statusCode: response.status
      };

    } catch (error) {
      console.error('Uptime check failed:', error);
      return {
        uptime: 0,
        responseTime: 0,
        isOnline: false
      };
    }
  }

  private calculateSLACompliance(result: UptimeResult): number {
    // Simple SLA calculation based on response time and availability
    let compliance = 100;

    if (!result.isOnline) {
      compliance = 0;
    } else {
      // Deduct points for slow response times
      if (result.responseTime > 5000) {
        compliance -= 50;
      } else if (result.responseTime > 2000) {
        compliance -= 25;
      } else if (result.responseTime > 1000) {
        compliance -= 10;
      }
    }

    return Math.max(0, Math.min(100, compliance));
  }

  private calculatePerformanceScore(result: UptimeResult): number {
    if (!result.isOnline) {
      return 0;
    }

    let score = 100;

    // Deduct points for slow response times
    if (result.responseTime > 3000) {
      score -= 40;
    } else if (result.responseTime > 1000) {
      score -= 20;
    } else if (result.responseTime > 500) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  async fetchStatusPageMetrics(statusPageUrl: string): Promise<any> {
    try {
      // This would integrate with various status page APIs
      // For now, we'll return a basic structure
      const response = await fetch(statusPageUrl, {
        headers: {
          'User-Agent': 'ObjectiveEval-Status-Monitor/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Status page fetch failed: ${response.status}`);
      }

      const content = await response.text();
      
      // In a real implementation, this would parse different status page formats
      // (StatusPage.io, custom pages, etc.)
      return this.parseStatusPageContent(content);

    } catch (error) {
      console.error('Status page fetch failed:', error);
      return null;
    }
  }

  private parseStatusPageContent(content: string): any {
    // This is a simplified parser
    // In production, you'd want parsers for different status page providers
    
    const uptimeMatch = content.match(/uptime[:\s]+(\d+\.?\d*)%/i);
    const incidentMatch = content.match(/incidents?[:\s]+(\d+)/i);
    
    return {
      uptime: uptimeMatch ? parseFloat(uptimeMatch[1]) : null,
      incidents: incidentMatch ? parseInt(incidentMatch[1]) : null,
      lastUpdated: new Date()
    };
  }
}

export const reliabilityService = new ReliabilityService();
