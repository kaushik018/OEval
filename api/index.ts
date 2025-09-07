import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import { storage } from "../server/storage";
import { setupAuth, conditionalAuth } from "../server/replitAuth";
import { insertApplicationSchema, insertBenchmarkSchema } from "../shared/schema";
import { benchmarkService } from "../server/services/benchmarkService";
import { aiService } from "../server/services/aiService";
import { reliabilityService } from "../server/services/reliabilityService";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware for logging API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  console.error(err);
});

// Helper function to get user ID from authenticated request
async function getUserIdFromRequest(req: any): Promise<string | null> {
  try {
    const userEmail = req.user.claims.email;
    const user = await storage.getUserByEmail(userEmail);
    return user?.id || null;
  } catch (error) {
    console.error("Error getting user ID:", error);
    return null;
  }
}

// Initialize routes without creating a server
let appInitialized = false;

async function initializeApp() {
  if (!appInitialized) {
    // Auth middleware - only setup if environment variables are available
    let hasAuth = false;
    try {
      if (process.env.REPLIT_DOMAINS && process.env.DATABASE_URL) {
        await setupAuth(app);
        hasAuth = true;
      } else {
        console.log("Skipping Replit auth setup - environment variables not available");
      }
    } catch (error) {
      console.error("Error setting up auth:", error);
    }

    // Create a conditional auth middleware
    const conditionalAuth = (req: any, res: any, next: any) => {
      if (hasAuth) {
        return conditionalAuth(req, res, next);
      } else {
        // Mock user for development
        req.user = { claims: { email: 'demo@example.com' } };
        next();
      }
    };

    // Auth routes
    app.get('/api/auth/user', conditionalAuth, async (req: any, res) => {
      try {
        const userEmail = req.user.claims.email;
        const user = await storage.getUserByEmail(userEmail);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    });

    // Dashboard routes
    app.get('/api/dashboard/stats', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return res.status(404).json({ message: "User not found" });
        }
        const stats = await storage.getDashboardStats(userId);
        res.json(stats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
      }
    });

    // Application routes
    app.get('/api/applications', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return res.status(404).json({ message: "User not found" });
        }
        const applications = await storage.getApplicationsByUserId(userId);
        
        // Fetch latest metrics for each application
        const applicationsWithMetrics = await Promise.all(
          applications.map(async (app) => {
            const [performance, integration, reliability] = await Promise.all([
              storage.getLatestPerformanceMetrics(app.id),
              storage.getIntegrationAnalysis(app.id),
              storage.getLatestReliabilityMetrics(app.id)
            ]);
            
            return {
              ...app,
              performance,
              integration,
              reliability
            };
          })
        );
        
        res.json(applicationsWithMetrics);
      } catch (error) {
        console.error("Error fetching applications:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
      }
    });

    app.post('/api/applications', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return res.status(404).json({ message: "User not found" });
        }
        const data = insertApplicationSchema.parse({ ...req.body, userId });
        
        const application = await storage.createApplication(data);
        
        // Start AI analysis of documentation in background
        if (data.documentationUrl) {
          aiService.analyzeIntegrations(application.id, data.documentationUrl)
            .catch(err => console.error('AI analysis failed:', err));
        }
        
        // Start reliability monitoring
        reliabilityService.startMonitoring(application.id, data.url)
          .catch(err => console.error('Reliability monitoring failed:', err));
        
        res.json(application);
      } catch (error) {
        console.error("Error creating application:", error);
        res.status(400).json({ message: "Invalid application data" });
      }
    });

    app.get('/api/applications/:id', conditionalAuth, async (req: any, res) => {
      try {
        const application = await storage.getApplicationById(req.params.id);
        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }
        
        // Verify ownership
        const userId = await getUserIdFromRequest(req);
        if (!userId || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const [performance, integration, reliability] = await Promise.all([
          storage.getLatestPerformanceMetrics(application.id),
          storage.getIntegrationAnalysis(application.id),
          storage.getLatestReliabilityMetrics(application.id)
        ]);
        
        res.json({
          ...application,
          performance,
          integration,
          reliability
        });
      } catch (error) {
        console.error("Error fetching application:", error);
        res.status(500).json({ message: "Failed to fetch application" });
      }
    });

    app.delete('/api/applications/:id', conditionalAuth, async (req: any, res) => {
      try {
        const application = await storage.getApplicationById(req.params.id);
        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }
        
        // Verify ownership
        const userId = await getUserIdFromRequest(req);
        if (!userId || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        await storage.deleteApplication(req.params.id);
        res.json({ message: "Application deleted successfully" });
      } catch (error) {
        console.error("Error deleting application:", error);
        res.status(500).json({ message: "Failed to delete application" });
      }
    });

    // Benchmark routes
    app.get('/api/benchmarks', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return res.status(404).json({ message: "User not found" });
        }
        const benchmarks = await storage.getBenchmarksByUserId(userId);
        res.json(benchmarks);
      } catch (error) {
        console.error("Error fetching benchmarks:", error);
        res.status(500).json({ message: "Failed to fetch benchmarks" });
      }
    });

    app.post('/api/benchmarks', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return res.status(404).json({ message: "User not found" });
        }
        const data = insertBenchmarkSchema.parse({ ...req.body, userId });
        
        // Verify application ownership
        const application = await storage.getApplicationById(data.applicationId);
        if (!application || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const benchmark = await storage.createBenchmark(data);
        
        // Start benchmark test
        benchmarkService.runBenchmark(benchmark.id, application.url, data.type, data.duration)
          .catch(err => console.error('Benchmark failed:', err));
        
        res.json(benchmark);
      } catch (error) {
        console.error("Error creating benchmark:", error);
        res.status(400).json({ message: "Invalid benchmark data" });
      }
    });

    app.get('/api/benchmarks/application/:applicationId', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        const application = await storage.getApplicationById(req.params.applicationId);
        
        if (!application || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const benchmarks = await storage.getBenchmarksByApplicationId(req.params.applicationId);
        res.json(benchmarks);
      } catch (error) {
        console.error("Error fetching application benchmarks:", error);
        res.status(500).json({ message: "Failed to fetch benchmarks" });
      }
    });

    // Performance metrics routes
    app.get('/api/performance/:applicationId', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        const application = await storage.getApplicationById(req.params.applicationId);
        
        if (!application || application.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const metrics = await storage.getPerformanceMetricsHistory(req.params.applicationId);
        res.json(metrics);
      } catch (error) {
        console.error("Error fetching performance metrics:", error);
        res.status(500).json({ message: "Failed to fetch performance metrics" });
      }
    });

    // Export routes
    app.get('/api/export/applications', conditionalAuth, async (req: any, res) => {
      try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
          return res.status(404).json({ message: "User not found" });
        }
        const format = req.query.format || 'csv';
        
        const applications = await storage.getApplicationsByUserId(userId);
        
        if (format === 'csv') {
          const csvData = await generateCSVExport(applications, storage);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename="applications-export.csv"');
          res.send(csvData);
        } else {
          res.status(400).json({ message: "Unsupported export format" });
        }
      } catch (error) {
        console.error("Error exporting applications:", error);
        res.status(500).json({ message: "Failed to export applications" });
      }
    });

    appInitialized = true;
  }
  return app;
}

async function generateCSVExport(applications: any[], storage: any): Promise<string> {
  const headers = [
    'Name',
    'URL',
    'Category',
    'Status',
    'Performance Score',
    'Response Time (ms)',
    'Uptime (%)',
    'Error Rate (%)',
    'Integrations',
    'Documentation Quality',
    'Created At'
  ];
  
  const rows = await Promise.all(
    applications.map(async (app) => {
      const [performance, integration] = await Promise.all([
        storage.getLatestPerformanceMetrics(app.id),
        storage.getIntegrationAnalysis(app.id)
      ]);
      
      return [
        app.name,
        app.url,
        app.category,
        app.status,
        performance?.performanceScore || 'N/A',
        performance?.responseTime || 'N/A',
        performance?.uptime || 'N/A',
        performance?.errorRate || 'N/A',
        integration?.integrationCount || 'N/A',
        integration?.documentationQuality || 'N/A',
        app.createdAt?.toISOString() || 'N/A'
      ];
    })
  );
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
}

export default async function handler(req: Request, res: Response) {
  const app = await initializeApp();
  return app(req, res);
}
