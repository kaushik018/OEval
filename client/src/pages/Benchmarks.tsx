import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, Download, Pause } from "lucide-react";
import BenchmarkTestRunner from "@/components/BenchmarkTestRunner";

interface Application {
  id: string;
  name: string;
  url: string;
}

interface Benchmark {
  id: string;
  applicationId: string;
  type: string;
  duration: number;
  averageResponseTime: string;
  successRate: string;
  errorRate: string;
  status: string;
  startedAt: string;
  completedAt?: string;
}

export default function Benchmarks() {
  const [selectedApp, setSelectedApp] = useState("");
  const [testType, setTestType] = useState("response_time");
  const [duration, setDuration] = useState("60");
  const [runningTests, setRunningTests] = useState<string[]>([]);

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: benchmarks = [], refetch: refetchBenchmarks } = useQuery<Benchmark[]>({
    queryKey: ["/api/benchmarks"],
  });

  const handleRunBenchmark = async () => {
    if (!selectedApp) return;

    try {
      setRunningTests(prev => [...prev, selectedApp]);
      
      const response = await fetch("/api/benchmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: selectedApp,
          type: testType,
          duration: parseInt(duration),
          status: "running"
        }),
      });

      if (response.ok) {
        refetchBenchmarks();
        // Remove from running tests after a delay (simulate completion)
        setTimeout(() => {
          setRunningTests(prev => prev.filter(id => id !== selectedApp));
          refetchBenchmarks();
        }, parseInt(duration) * 1000);
      }
    } catch (error) {
      console.error("Failed to start benchmark:", error);
      setRunningTests(prev => prev.filter(id => id !== selectedApp));
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "running":
        return "default";
      case "completed":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTestTypeBadgeColor = (type: string) => {
    switch (type) {
      case "response_time":
        return "bg-blue-100 text-blue-800";
      case "load_test":
        return "bg-green-100 text-green-800";
      case "stress_test":
        return "bg-yellow-100 text-yellow-800";
      case "reliability_test":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="fade-in">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Benchmarks</h2>
            <p className="text-muted-foreground">Performance testing and monitoring</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Quick Benchmark Test */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Benchmark Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Application</label>
                <Select value={selectedApp} onValueChange={setSelectedApp} data-testid="select-benchmark-application">
                  <SelectTrigger>
                    <SelectValue placeholder="Choose application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Test Type</label>
                <Select value={testType} onValueChange={setTestType} data-testid="select-test-type">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="response_time">Response Time</SelectItem>
                    <SelectItem value="load_test">Load Test</SelectItem>
                    <SelectItem value="stress_test">Stress Test</SelectItem>
                    <SelectItem value="reliability_test">Reliability Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Duration</label>
                <Select value={duration} onValueChange={setDuration} data-testid="select-duration">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleRunBenchmark}
                disabled={!selectedApp || runningTests.includes(selectedApp)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-start-benchmark"
              >
                {runningTests.includes(selectedApp) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Benchmark
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Running Tests */}
        {runningTests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Running Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {runningTests.map((appId) => {
                  const app = applications.find(a => a.id === appId);
                  return (
                    <div key={appId} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div>
                          <p className="font-medium">{app?.name} - {formatTestType(testType)}</p>
                          <p className="text-sm text-blue-600">Running... Please wait</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-stop-test-${appId}`}
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {benchmarks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No benchmark tests have been run yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure and run your first benchmark test above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Application</th>
                      <th className="text-left p-4 font-medium text-sm">Test Type</th>
                      <th className="text-left p-4 font-medium text-sm">Avg Response</th>
                      <th className="text-left p-4 font-medium text-sm">Success Rate</th>
                      <th className="text-left p-4 font-medium text-sm">Duration</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Timestamp</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarks.map((benchmark) => {
                      const app = applications.find(a => a.id === benchmark.applicationId);
                      return (
                        <tr key={benchmark.id} className="border-b border-border" data-testid={`row-benchmark-${benchmark.id}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center font-bold">
                                {app?.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium">{app?.name}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={getTestTypeBadgeColor(benchmark.type)}>
                              {formatTestType(benchmark.type)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="font-medium">
                              {benchmark.averageResponseTime ? `${Math.round(parseFloat(benchmark.averageResponseTime))}ms` : 'N/A'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`font-medium ${parseFloat(benchmark.successRate || '0') > 95 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {benchmark.successRate ? `${parseFloat(benchmark.successRate).toFixed(1)}%` : 'N/A'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{benchmark.duration}s</span>
                          </td>
                          <td className="p-4">
                            <Badge variant={getStatusBadgeVariant(benchmark.status)}>
                              {benchmark.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <span className="text-sm text-muted-foreground">
                              {new Date(benchmark.startedAt).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-benchmark-${benchmark.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-download-benchmark-${benchmark.id}`}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
