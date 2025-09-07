import OpenAI from "openai";
import { storage } from "../../server/storage.js";
import { users, applications, benchmarks, performanceMetrics, integrationAnalysis, reliabilityMetrics } from "../../server/shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

interface IntegrationAnalysisResult {
  supportedPlatforms: string[];
  supportedApis: string[];
  integrationCount: number;
  documentationQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

class AIService {
  async analyzeIntegrations(applicationId: string, documentationUrl: string): Promise<void> {
    try {
      // Fetch documentation content
      const docContent = await this.fetchDocumentationContent(documentationUrl);
      
      if (!docContent) {
        console.warn(`Could not fetch documentation content for ${documentationUrl}`);
        return;
      }

      // Analyze with OpenAI
      const analysis = await this.performIntegrationAnalysis(docContent);
      
      // Store results
      await storage.upsertIntegrationAnalysis({
        applicationId,
        supportedPlatforms: analysis.supportedPlatforms,
        supportedApis: analysis.supportedApis,
        integrationCount: analysis.integrationCount,
        documentationQuality: analysis.documentationQuality
      });

    } catch (error) {
      console.error('AI integration analysis failed:', error);
      
      // Store empty analysis to indicate attempt was made
      await storage.upsertIntegrationAnalysis({
        applicationId,
        supportedPlatforms: [],
        supportedApis: [],
        integrationCount: 0,
        documentationQuality: 'poor'
      });
    }
  }

  private async fetchDocumentationContent(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ObjectiveEval-AI-Analyzer/1.0'
        },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documentation: ${response.status}`);
      }

      const content = await response.text();
      
      // Extract text content from HTML if needed
      const textContent = this.extractTextFromHTML(content);
      
      // Limit content length to avoid token limits
      return textContent.substring(0, 50000); // ~50k characters
      
    } catch (error) {
      console.error('Error fetching documentation:', error);
      return null;
    }
  }

  private extractTextFromHTML(html: string): string {
    // Simple HTML tag removal - in production, you'd want a proper HTML parser
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async performIntegrationAnalysis(content: string): Promise<IntegrationAnalysisResult> {
    const prompt = `
Analyze the following API/software documentation and extract integration information. 
Focus only on factual, objective data that can be measured.

Documentation content:
${content}

Please analyze and respond with JSON in this exact format:
{
  "supportedPlatforms": ["platform1", "platform2", ...],
  "supportedApis": ["api1", "api2", ...],
  "integrationCount": number,
  "documentationQuality": "excellent" | "good" | "fair" | "poor"
}

Guidelines:
- supportedPlatforms: List platforms, frameworks, or environments mentioned (e.g., "Node.js", "Python", "REST", "GraphQL", "iOS", "Android", "Web")
- supportedApis: List specific APIs, protocols, or integration methods mentioned (e.g., "REST API", "WebSocket", "OAuth2", "Stripe Connect", "Webhook")
- integrationCount: Total number of distinct integration methods/platforms found
- documentationQuality: Rate based on completeness, code examples, and clarity:
  - "excellent": Comprehensive docs with multiple examples, clear structure
  - "good": Good coverage with some examples
  - "fair": Basic documentation with limited examples  
  - "poor": Incomplete or unclear documentation

Only include factual information explicitly mentioned in the documentation.
`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are an expert software integration analyst. Analyze documentation and extract only factual, objective integration capabilities."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for consistent, factual analysis
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      // Validate and sanitize the result
      return {
        supportedPlatforms: Array.isArray(result.supportedPlatforms) ? result.supportedPlatforms.slice(0, 50) : [],
        supportedApis: Array.isArray(result.supportedApis) ? result.supportedApis.slice(0, 50) : [],
        integrationCount: typeof result.integrationCount === 'number' ? Math.min(result.integrationCount, 1000) : 0,
        documentationQuality: ['excellent', 'good', 'fair', 'poor'].includes(result.documentationQuality) 
          ? result.documentationQuality 
          : 'poor'
      };

    } catch (error) {
      console.error('OpenAI analysis failed:', error);
      throw new Error('Failed to analyze documentation with AI');
    }
  }

  async validateBenchmarkData(benchmarkResults: any[]): Promise<any[]> {
    // Use AI to detect anomalies in benchmark data
    try {
      const prompt = `
Analyze the following benchmark test results and flag any anomalies or inconsistencies.
Look for outliers, impossible values, or suspicious patterns.

Benchmark data:
${JSON.stringify(benchmarkResults, null, 2)}

Respond with JSON in this format:
{
  "validResults": [...], // Clean results with anomalies removed
  "anomalies": [...], // List of detected anomalies with explanations
  "overallQuality": "excellent" | "good" | "fair" | "poor"
}

Flag results that are:
- Response times that are impossibly fast (<1ms) or slow (>60s)
- Success rates over 100% or under 0%
- Results that vary wildly from the average without explanation
- Inconsistent patterns that suggest measurement errors
`;

      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a data quality expert specializing in performance benchmark validation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.validResults || benchmarkResults;

    } catch (error) {
      console.error('Benchmark validation failed:', error);
      return benchmarkResults; // Return original data if validation fails
    }
  }
}

export const aiService = new AIService();
