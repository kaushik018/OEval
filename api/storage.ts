import {
  users,
  applications,
  benchmarks,
  performanceMetrics,
  integrationAnalysis,
  reliabilityMetrics,
  type User,
  type UpsertUser,
  type Application,
  type InsertApplication,
  type Benchmark,
  type InsertBenchmark,
  type PerformanceMetrics,
  type InsertPerformanceMetrics,
  type IntegrationAnalysis,
  type InsertIntegrationAnalysis,
  type ReliabilityMetrics,
  type InsertReliabilityMetrics
} from "../../shared/schema";
import { db } from "../server/db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplicationsByUserId(userId: string): Promise<Application[]>;
  getApplicationById(id: string): Promise<Application | undefined>;
  updateApplicationStatus(id: string, status: string): Promise<void>;
  deleteApplication(id: string): Promise<void>;
  
  // Benchmark operations
  createBenchmark(benchmark: InsertBenchmark): Promise<Benchmark>;
  getBenchmarkById(id: string): Promise<Benchmark | undefined>;
  getBenchmarksByApplicationId(applicationId: string): Promise<Benchmark[]>;
  getBenchmarksByUserId(userId: string): Promise<Benchmark[]>;
  updateBenchmark(id: string, data: Partial<Benchmark>): Promise<void>;
  
  // Performance metrics operations
  createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics>;
  getLatestPerformanceMetrics(applicationId: string): Promise<PerformanceMetrics | undefined>;
  getPerformanceMetricsHistory(applicationId: string): Promise<PerformanceMetrics[]>;
  
  // Integration analysis operations
  upsertIntegrationAnalysis(analysis: InsertIntegrationAnalysis): Promise<IntegrationAnalysis>;
  getIntegrationAnalysis(applicationId: string): Promise<IntegrationAnalysis | undefined>;
  
  // Reliability metrics operations
  createReliabilityMetrics(metrics: InsertReliabilityMetrics): Promise<ReliabilityMetrics>;
  getLatestReliabilityMetrics(applicationId: string): Promise<ReliabilityMetrics | undefined>;
  getReliabilityMetricsHistory(applicationId: string): Promise<ReliabilityMetrics[]>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<{
    totalApplications: number;
    averageResponseTime: number;
    averageUptime: number;
    activeBenchmarks: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Application operations
  async createApplication(application: InsertApplication): Promise<Application> {
    const [app] = await db
      .insert(applications)
      .values(application)
      .returning();
    return app;
  }

  async getApplicationsByUserId(userId: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt));
  }

  async getApplicationById(id: string): Promise<Application | undefined> {
    const [app] = await db.select().from(applications).where(eq(applications.id, id));
    return app;
  }

  async updateApplicationStatus(id: string, status: string): Promise<void> {
    await db
      .update(applications)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(applications.id, id));
  }

  async deleteApplication(id: string): Promise<void> {
    await db.delete(applications).where(eq(applications.id, id));
  }

  // Benchmark operations
  async createBenchmark(benchmark: InsertBenchmark): Promise<Benchmark> {
    const [result] = await db
      .insert(benchmarks)
      .values(benchmark)
      .returning();
    return result;
  }

  async getBenchmarksByApplicationId(applicationId: string): Promise<Benchmark[]> {
    return await db
      .select()
      .from(benchmarks)
      .where(eq(benchmarks.applicationId, applicationId))
      .orderBy(desc(benchmarks.startedAt));
  }

  async getBenchmarksByUserId(userId: string): Promise<Benchmark[]> {
    return await db
      .select()
      .from(benchmarks)
      .where(eq(benchmarks.userId, userId))
      .orderBy(desc(benchmarks.startedAt));
  }

  async getBenchmarkById(id: string): Promise<Benchmark | undefined> {
    const [benchmark] = await db.select().from(benchmarks).where(eq(benchmarks.id, id));
    return benchmark;
  }

  async updateBenchmark(id: string, data: Partial<Benchmark>): Promise<void> {
    // Only update if there are actual values to set
    if (Object.keys(data).length === 0) {
      return;
    }
    await db
      .update(benchmarks)
      .set(data)
      .where(eq(benchmarks.id, id));
  }

  // Performance metrics operations
  async createPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const [result] = await db
      .insert(performanceMetrics)
      .values(metrics)
      .returning();
    return result;
  }

  async getLatestPerformanceMetrics(applicationId: string): Promise<PerformanceMetrics | undefined> {
    const [result] = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.applicationId, applicationId))
      .orderBy(desc(performanceMetrics.recordedAt))
      .limit(1);
    return result;
  }

  async getPerformanceMetricsHistory(applicationId: string): Promise<PerformanceMetrics[]> {
    return await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.applicationId, applicationId))
      .orderBy(desc(performanceMetrics.recordedAt));
  }

  // Integration analysis operations
  async upsertIntegrationAnalysis(analysis: InsertIntegrationAnalysis): Promise<IntegrationAnalysis> {
    const [result] = await db
      .insert(integrationAnalysis)
      .values(analysis)
      .onConflictDoUpdate({
        target: integrationAnalysis.applicationId,
        set: {
          ...analysis,
          lastAnalyzedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getIntegrationAnalysis(applicationId: string): Promise<IntegrationAnalysis | undefined> {
    const [result] = await db
      .select()
      .from(integrationAnalysis)
      .where(eq(integrationAnalysis.applicationId, applicationId));
    return result;
  }

  // Reliability metrics operations
  async createReliabilityMetrics(metrics: InsertReliabilityMetrics): Promise<ReliabilityMetrics> {
    const [result] = await db
      .insert(reliabilityMetrics)
      .values(metrics)
      .returning();
    return result;
  }

  async getLatestReliabilityMetrics(applicationId: string): Promise<ReliabilityMetrics | undefined> {
    const [result] = await db
      .select()
      .from(reliabilityMetrics)
      .where(eq(reliabilityMetrics.applicationId, applicationId))
      .orderBy(desc(reliabilityMetrics.recordedAt))
      .limit(1);
    return result;
  }

  async getReliabilityMetricsHistory(applicationId: string): Promise<ReliabilityMetrics[]> {
    return await db
      .select()
      .from(reliabilityMetrics)
      .where(eq(reliabilityMetrics.applicationId, applicationId))
      .orderBy(desc(reliabilityMetrics.recordedAt));
  }

  // Dashboard operations
  async getDashboardStats(userId: string): Promise<{
    totalApplications: number;
    averageResponseTime: number;
    averageUptime: number;
    activeBenchmarks: number;
  }> {
    // Get total applications
    const [appCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(eq(applications.userId, userId));

    // Get average response time from latest performance metrics
    const [avgResponse] = await db
      .select({ avg: sql<number>`avg(${performanceMetrics.responseTime})` })
      .from(performanceMetrics)
      .innerJoin(applications, eq(applications.id, performanceMetrics.applicationId))
      .where(eq(applications.userId, userId));

    // Get average uptime from latest performance metrics
    const [avgUptime] = await db
      .select({ avg: sql<number>`avg(${performanceMetrics.uptime})` })
      .from(performanceMetrics)
      .innerJoin(applications, eq(applications.id, performanceMetrics.applicationId))
      .where(eq(applications.userId, userId));

    // Get active benchmarks count
    const [activeBenchmarks] = await db
      .select({ count: sql<number>`count(*)` })
      .from(benchmarks)
      .where(and(
        eq(benchmarks.userId, userId),
        eq(benchmarks.status, 'running')
      ));

    return {
      totalApplications: appCount.count || 0,
      averageResponseTime: avgResponse.avg || 0,
      averageUptime: avgUptime.avg || 0,
      activeBenchmarks: activeBenchmarks.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
