import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Application status enum
export const applicationStatusEnum = pgEnum('application_status', ['active', 'testing', 'error', 'paused']);

// Applications table
export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  url: text("url").notNull(),
  category: varchar("category").notNull(),
  documentationUrl: text("documentation_url"),
  status: applicationStatusEnum("status").default('active'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Benchmark test types enum
export const benchmarkTypeEnum = pgEnum('benchmark_type', ['response_time', 'load_test', 'stress_test', 'reliability_test']);

// Benchmarks table
export const benchmarks = pgTable("benchmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: benchmarkTypeEnum("type").notNull(),
  duration: integer("duration").notNull(), // in seconds
  averageResponseTime: decimal("average_response_time", { precision: 10, scale: 2 }),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }),
  totalRequests: integer("total_requests"),
  successfulRequests: integer("successful_requests"),
  failedRequests: integer("failed_requests"),
  status: varchar("status").default('completed'), // running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Performance metrics table
export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  responseTime: decimal("response_time", { precision: 10, scale: 2 }),
  uptime: decimal("uptime", { precision: 5, scale: 2 }),
  errorRate: decimal("error_rate", { precision: 5, scale: 2 }),
  performanceScore: integer("performance_score"),
  recordedAt: timestamp("recorded_at").defaultNow(),
});

// Integration analysis table
export const integrationAnalysis = pgTable("integration_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  supportedPlatforms: text("supported_platforms").array(),
  supportedApis: text("supported_apis").array(),
  integrationCount: integer("integration_count").default(0),
  documentationQuality: varchar("documentation_quality"), // excellent, good, fair, poor
  lastAnalyzedAt: timestamp("last_analyzed_at").defaultNow(),
});

// Reliability metrics table
export const reliabilityMetrics = pgTable("reliability_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  uptime: decimal("uptime", { precision: 5, scale: 2 }),
  slaCompliance: decimal("sla_compliance", { precision: 5, scale: 2 }),
  outageCount: integer("outage_count").default(0),
  mttr: decimal("mttr", { precision: 10, scale: 2 }), // Mean Time To Recovery in hours
  recordedAt: timestamp("recorded_at").defaultNow(),
});


// Relations
export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  benchmarks: many(benchmarks),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, {
    fields: [applications.userId],
    references: [users.id],
  }),
  benchmarks: many(benchmarks),
  performanceMetrics: many(performanceMetrics),
  integrationAnalysis: one(integrationAnalysis),
  reliabilityMetrics: many(reliabilityMetrics),
}));

export const benchmarksRelations = relations(benchmarks, ({ one }) => ({
  application: one(applications, {
    fields: [benchmarks.applicationId],
    references: [applications.id],
  }),
  user: one(users, {
    fields: [benchmarks.userId],
    references: [users.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  application: one(applications, {
    fields: [performanceMetrics.applicationId],
    references: [applications.id],
  }),
}));

export const integrationAnalysisRelations = relations(integrationAnalysis, ({ one }) => ({
  application: one(applications, {
    fields: [integrationAnalysis.applicationId],
    references: [applications.id],
  }),
}));

export const reliabilityMetricsRelations = relations(reliabilityMetrics, ({ one }) => ({
  application: one(applications, {
    fields: [reliabilityMetrics.applicationId],
    references: [applications.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBenchmarkSchema = createInsertSchema(benchmarks).omit({ id: true, startedAt: true, completedAt: true });
export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).omit({ id: true, recordedAt: true });
export const insertIntegrationAnalysisSchema = createInsertSchema(integrationAnalysis).omit({ id: true, lastAnalyzedAt: true });
export const insertReliabilityMetricsSchema = createInsertSchema(reliabilityMetrics).omit({ id: true, recordedAt: true });

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertBenchmark = z.infer<typeof insertBenchmarkSchema>;
export type Benchmark = typeof benchmarks.$inferSelect;
export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
export type InsertIntegrationAnalysis = z.infer<typeof insertIntegrationAnalysisSchema>;
export type IntegrationAnalysis = typeof integrationAnalysis.$inferSelect;
export type InsertReliabilityMetrics = z.infer<typeof insertReliabilityMetricsSchema>;
export type ReliabilityMetrics = typeof reliabilityMetrics.$inferSelect;
