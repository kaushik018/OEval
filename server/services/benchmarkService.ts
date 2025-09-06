import { storage } from "../storage";

interface BenchmarkResult {
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

class BenchmarkService {
  async runBenchmark(
    benchmarkId: string, 
    url: string, 
    type: string, 
    duration: number
  ): Promise<void> {
    try {
      // Update benchmark status to running
      await storage.updateBenchmark(benchmarkId, { 
        status: 'running',
        startedAt: new Date()
      });

      let result: BenchmarkResult;
      
      switch (type) {
        case 'response_time':
          result = await this.runResponseTimeTest(url, duration);
          break;
        case 'load_test':
          result = await this.runLoadTest(url, duration);
          break;
        case 'stress_test':
          result = await this.runStressTest(url, duration);
          break;
        case 'reliability_test':
          result = await this.runReliabilityTest(url, duration);
          break;
        default:
          throw new Error(`Unknown benchmark type: ${type}`);
      }

      // Update benchmark with results
      await storage.updateBenchmark(benchmarkId, {
        averageResponseTime: result.averageResponseTime.toString(),
        successRate: result.successRate.toString(),
        errorRate: result.errorRate.toString(),
        totalRequests: result.totalRequests,
        successfulRequests: result.successfulRequests,
        failedRequests: result.failedRequests,
        status: 'completed',
        completedAt: new Date()
      });

      // Get the benchmark to access applicationId for performance metrics
      const benchmark = await storage.getBenchmarkById(benchmarkId);
      if (benchmark) {
        const performanceScore = this.calculatePerformanceScore(result);
        
        // Create performance metrics record
        await storage.createPerformanceMetrics({
          applicationId: benchmark.applicationId,
          responseTime: result.averageResponseTime.toString(),
          uptime: result.successRate.toString(),
          errorRate: result.errorRate.toString(),
          performanceScore: performanceScore
        });
      }
      
    } catch (error) {
      console.error('Benchmark test failed:', error);
      await storage.updateBenchmark(benchmarkId, { 
        status: 'failed',
        completedAt: new Date()
      });
    }
  }

  private async runResponseTimeTest(url: string, duration: number): Promise<BenchmarkResult> {
    const responses: number[] = [];
    let successCount = 0;
    let failCount = 0;
    
    const endTime = Date.now() + (duration * 1000);
    const minimumRequests = 5; // Ensure we make at least 5 requests
    let requestCount = 0;
    
    while (Date.now() < endTime || requestCount < minimumRequests) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'ObjectiveEval-Benchmark/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        const responseTime = Date.now() - startTime;
        requestCount++;
        
        if (response.ok) {
          responses.push(responseTime);
          successCount++;
        } else {
          failCount++;
        }
        
        // Adaptive delay based on response time
        const delay = Math.min(200, Math.max(50, responseTime * 0.1));
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        failCount++;
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Break if we've been testing for too long (safety measure)
      if (requestCount > 100) break;
    }

    const totalRequests = successCount + failCount;
    const averageResponseTime = responses.length > 0 
      ? Math.round(responses.reduce((a, b) => a + b, 0) / responses.length)
      : 0;

    return {
      averageResponseTime,
      successRate: totalRequests > 0 ? Math.round((successCount / totalRequests) * 100 * 100) / 100 : 0,
      errorRate: totalRequests > 0 ? Math.round((failCount / totalRequests) * 100 * 100) / 100 : 0,
      totalRequests,
      successfulRequests: successCount,
      failedRequests: failCount
    };
  }

  private async runLoadTest(url: string, duration: number): Promise<BenchmarkResult> {
    const concurrentRequests = 10;
    const responses: number[] = [];
    let successCount = 0;
    let failCount = 0;
    
    const endTime = Date.now() + (duration * 1000);
    
    const makeRequest = async (): Promise<void> => {
      while (Date.now() < endTime) {
        try {
          const startTime = Date.now();
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'User-Agent': 'ObjectiveEval-LoadTest/1.0'
            },
            signal: AbortSignal.timeout(10000)
          });
          
          const responseTime = Date.now() - startTime;
          
          if (response.ok) {
            responses.push(responseTime);
            successCount++;
          } else {
            failCount++;
          }
          
          // Small delay to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          failCount++;
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };

    // Run concurrent requests
    const promises = Array(concurrentRequests).fill(null).map(() => makeRequest());
    await Promise.all(promises);

    const totalRequests = successCount + failCount;
    const averageResponseTime = responses.length > 0 
      ? responses.reduce((a, b) => a + b, 0) / responses.length 
      : 0;

    return {
      averageResponseTime,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
      totalRequests,
      successfulRequests: successCount,
      failedRequests: failCount
    };
  }

  private async runStressTest(url: string, duration: number): Promise<BenchmarkResult> {
    // Gradually increase load
    const maxConcurrency = 50;
    const responses: number[] = [];
    let successCount = 0;
    let failCount = 0;
    
    const testDuration = duration * 1000;
    const rampUpTime = testDuration * 0.3; // 30% for ramp up
    const sustainTime = testDuration * 0.4; // 40% for sustain
    const rampDownTime = testDuration * 0.3; // 30% for ramp down
    
    const startTime = Date.now();
    
    const makeRequest = async (): Promise<void> => {
      try {
        const requestStart = Date.now();
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'ObjectiveEval-StressTest/1.0'
          },
          signal: AbortSignal.timeout(15000)
        });
        
        const responseTime = Date.now() - requestStart;
        
        if (response.ok) {
          responses.push(responseTime);
          successCount++;
        } else {
          failCount++;
        }
        
      } catch (error) {
        failCount++;
      }
    };

    // Simplified stress test - run with increasing concurrency
    for (let phase = 0; phase < 3; phase++) {
      const phaseDuration = testDuration / 3;
      const phaseEndTime = Date.now() + phaseDuration;
      const concurrency = Math.min(5 * (phase + 1), maxConcurrency);
      
      const phasePromises: Promise<void>[] = [];
      
      for (let i = 0; i < concurrency; i++) {
        const workerPromise = (async () => {
          while (Date.now() < phaseEndTime) {
            await makeRequest();
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        })();
        phasePromises.push(workerPromise);
      }
      
      await Promise.all(phasePromises);
    }

    const totalRequests = successCount + failCount;
    const averageResponseTime = responses.length > 0 
      ? responses.reduce((a, b) => a + b, 0) / responses.length 
      : 0;

    return {
      averageResponseTime,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
      totalRequests,
      successfulRequests: successCount,
      failedRequests: failCount
    };
  }

  private async runReliabilityTest(url: string, duration: number): Promise<BenchmarkResult> {
    // Long-running test with consistent intervals
    const responses: number[] = [];
    let successCount = 0;
    let failCount = 0;
    
    const endTime = Date.now() + (duration * 1000);
    const interval = 5000; // 5 seconds between requests
    
    while (Date.now() < endTime) {
      try {
        const startTime = Date.now();
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': 'ObjectiveEval-ReliabilityTest/1.0'
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          responses.push(responseTime);
          successCount++;
        } else {
          failCount++;
        }
        
      } catch (error) {
        failCount++;
      }
      
      // Wait for the interval
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    const totalRequests = successCount + failCount;
    const averageResponseTime = responses.length > 0 
      ? responses.reduce((a, b) => a + b, 0) / responses.length 
      : 0;

    return {
      averageResponseTime,
      successRate: totalRequests > 0 ? (successCount / totalRequests) * 100 : 0,
      errorRate: totalRequests > 0 ? (failCount / totalRequests) * 100 : 0,
      totalRequests,
      successfulRequests: successCount,
      failedRequests: failCount
    };
  }

  private calculatePerformanceScore(result: BenchmarkResult): number {
    // Calculate a performance score based on response time and success rate
    let score = 100;
    
    // Deduct points for slow response times
    if (result.averageResponseTime > 1000) {
      score -= 30;
    } else if (result.averageResponseTime > 500) {
      score -= 20;
    } else if (result.averageResponseTime > 200) {
      score -= 10;
    }
    
    // Deduct points for high error rate
    if (result.errorRate > 5) {
      score -= 40;
    } else if (result.errorRate > 1) {
      score -= 20;
    } else if (result.errorRate > 0.1) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}

export const benchmarkService = new BenchmarkService();
