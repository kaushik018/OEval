import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, BarChart, Clock, CheckCircle, Activity, Eye } from "lucide-react";
import { useState } from "react";
import AddApplicationModal from "@/components/AddApplicationModal";

interface DashboardStats {
  totalApplications: number;
  averageResponseTime: number;
  averageUptime: number;
  activeBenchmarks: number;
}

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

export default function Dashboard() {
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // Get recent applications (last 3)
  const recentApplications = applications.slice(0, 3);

  return (
    <>
      <div className="fade-in">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground">Overview of all software evaluations</p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-add-application"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Application
            </Button>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Applications</p>
                    <p className="text-2xl font-bold" data-testid="text-total-applications">
                      {stats?.totalApplications || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold" data-testid="text-average-response-time">
                      {stats ? Math.round(stats.averageResponseTime) : 0}ms
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Uptime</p>
                    <p className="text-2xl font-bold" data-testid="text-average-uptime">
                      {stats ? Number(stats.averageUptime).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Benchmarks</p>
                    <p className="text-2xl font-bold" data-testid="text-active-benchmarks">
                      {stats?.activeBenchmarks || 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {recentApplications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No applications added yet</p>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    variant="outline"
                    className="mt-4"
                    data-testid="button-add-first-application"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Application
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-medium text-sm">Application</th>
                        <th className="text-left p-4 font-medium text-sm">Performance Score</th>
                        <th className="text-left p-4 font-medium text-sm">Uptime</th>
                        <th className="text-left p-4 font-medium text-sm">Integrations</th>
                        <th className="text-left p-4 font-medium text-sm">Last Updated</th>
                        <th className="text-left p-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.map((app) => (
                        <tr key={app.id} className="border-b border-border" data-testid={`row-application-${app.id}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                                {app.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium" data-testid={`text-app-name-${app.id}`}>
                                  {app.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{app.url}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {app.performance ? (
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={app.performance.performanceScore} 
                                  className="w-16 h-2" 
                                />
                                <span className="text-sm font-medium">
                                  {app.performance.performanceScore}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="p-4">
                            {app.performance?.uptime ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                {Number(app.performance.uptime).toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="text-sm">
                              {app.integration?.integrationCount || 0} APIs
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">
                              {new Date(app.updatedAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <Button variant="ghost" size="sm" data-testid={`button-view-${app.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AddApplicationModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
    </>
  );
}
