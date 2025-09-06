import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Application {
  id: string;
  name: string;
  url: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  performance?: {
    performanceScore: number;
    responseTime: string;
    uptime: string;
  };
  integration?: {
    integrationCount: number;
  };
}

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this application? This action cannot be undone.")) {
      setIsDeleting(true);
      deleteApplicationMutation.mutate(application.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "testing":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "paused":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-application-${application.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
              {application.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold" data-testid={`text-app-name-${application.id}`}>
                {application.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-40">
                {new URL(application.url).hostname}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(application.status)} data-testid={`badge-status-${application.id}`}>
            {formatStatus(application.status)}
          </Badge>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Performance</span>
            <span className="text-sm font-medium" data-testid={`text-performance-${application.id}`}>
              {application.performance?.performanceScore || 'N/A'}/100
            </span>
          </div>
          {application.performance?.performanceScore && (
            <Progress 
              value={application.performance.performanceScore} 
              className="h-2"
            />
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Uptime</span>
            <span className="text-sm font-medium text-green-600" data-testid={`text-uptime-${application.id}`}>
              {application.performance?.uptime ? `${Number(application.performance.uptime).toFixed(1)}%` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Response Time</span>
            <span className="text-sm font-medium" data-testid={`text-response-time-${application.id}`}>
              {application.performance?.responseTime ? `${Math.round(parseFloat(application.performance.responseTime))}ms` : 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Integrations</span>
            <span className="text-sm font-medium" data-testid={`text-integrations-${application.id}`}>
              {application.integration?.integrationCount || 0} APIs
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" 
            size="sm"
            data-testid={`button-view-details-${application.id}`}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            data-testid={`button-run-test-${application.id}`}
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting || deleteApplicationMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid={`button-delete-${application.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
