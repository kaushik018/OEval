import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Application {
  id: string;
  name: string;
  url: string;
  category: string;
  status: string;
  performance?: {
    performanceScore: number;
    responseTime: string;
    uptime: string;
    errorRate: string;
  };
  integration?: {
    integrationCount: number;
    documentationQuality: string;
  };
  reliability?: {
    uptime: string;
  };
}

interface ComparisonCardProps {
  application: Application;
  index: number;
}

const cardColors = [
  "bg-blue-500",
  "bg-purple-500", 
  "bg-red-500"
];

export default function ComparisonCard({ application, index }: ComparisonCardProps) {
  const colorClass = cardColors[index] || "bg-gray-500";
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDocumentationQuality = (quality?: string) => {
    if (!quality) return "Unknown";
    return quality.charAt(0).toUpperCase() + quality.slice(1);
  };

  const getQualityColor = (quality?: string) => {
    switch (quality?.toLowerCase()) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card className="overflow-hidden" data-testid={`card-comparison-${application.id}`}>
      <div className={`${colorClass} text-white p-4`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white font-bold">
            {application.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold" data-testid={`text-comparison-name-${application.id}`}>
              {application.name}
            </h3>
            <p className="text-sm opacity-90">
              {new URL(application.url).hostname}
            </p>
          </div>
        </div>
      </div>
      
      <CardContent className="p-6 space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Performance Score</span>
            <span className={`font-bold text-lg ${getScoreColor(application.performance?.performanceScore || 0)}`}>
              {application.performance?.performanceScore || 0}/100
            </span>
          </div>
          <Progress 
            value={application.performance?.performanceScore || 0} 
            className="h-2"
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm">Response Time</span>
            <span className={`font-medium ${
              application.performance?.responseTime 
                ? (parseFloat(application.performance.responseTime) < 200 ? "text-green-600" : 
                   parseFloat(application.performance.responseTime) < 500 ? "text-yellow-600" : "text-red-600")
                : "text-gray-600"
            }`} data-testid={`text-response-time-${application.id}`}>
              {application.performance?.responseTime ? `${Math.round(parseFloat(application.performance.responseTime))}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm">Uptime</span>
            <span className="font-medium text-green-600" data-testid={`text-uptime-${application.id}`}>
              {application.performance?.uptime ? `${Number(application.performance.uptime).toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm">Error Rate</span>
            <span className={`font-medium ${
              application.performance?.errorRate 
                ? (parseFloat(application.performance.errorRate) < 1 ? "text-green-600" : 
                   parseFloat(application.performance.errorRate) < 5 ? "text-yellow-600" : "text-red-600")
                : "text-gray-600"
            }`} data-testid={`text-error-rate-${application.id}`}>
              {application.performance?.errorRate ? `${Number(application.performance.errorRate).toFixed(2)}%` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm">Integrations</span>
            <span className="font-medium" data-testid={`text-integrations-${application.id}`}>
              {application.integration?.integrationCount || 0} APIs
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm">Documentation</span>
            <span className={`font-medium ${getQualityColor(application.integration?.documentationQuality)}`} data-testid={`text-docs-quality-${application.id}`}>
              {formatDocumentationQuality(application.integration?.documentationQuality)}
            </span>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border">
          <Badge variant="outline" className="w-full justify-center">
            {application.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
