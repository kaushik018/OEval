import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Application {
  id: string;
  name: string;
  url: string;
}

interface BenchmarkTestRunnerProps {
  applications: Application[];
}

interface RunningTest {
  id: string;
  applicationId: string;
  applicationName: string;
  type: string;
  duration: number;
  startTime: number;
  progress: number;
}

export default function BenchmarkTestRunner({ applications }: BenchmarkTestRunnerProps) {
  const [selectedApp, setSelectedApp] = useState("");
  const [testType, setTestType] = useState("response_time");
  const [duration, setDuration] = useState("60");
  const [runningTests, setRunningTests] = useState<RunningTest[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startBenchmarkMutation = useMutation({
    mutationFn: async (data: { applicationId: string; type: string; duration: number }) => {
      return await apiRequest("POST", "/api/benchmarks", data);
    },
    onSuccess: (data, variables) => {
      const app = applications.find(a => a.id === variables.applicationId);
      if (app) {
        const newTest: RunningTest = {
          id: Date.now().toString(),
          applicationId: variables.applicationId,
          applicationName: app.name,
          type: variables.type,
          duration: variables.duration,
          startTime: Date.now(),
          progress: 0
        };
        
        setRunningTests(prev => [...prev, newTest]);
        
        // Start progress tracking
        const interval = setInterval(() => {
          setRunningTests(prev => prev.map(test => {
            if (test.id === newTest.id) {
              const elapsed = (Date.now() - test.startTime) / 1000;
              const progress = Math.min((elapsed / test.duration) * 100, 100);
              return { ...test, progress };
            }
            return test;
          }));
        }, 1000);

        // Remove test when complete
        setTimeout(() => {
          clearInterval(interval);
          setRunningTests(prev => prev.filter(test => test.id !== newTest.id));
          queryClient.invalidateQueries({ queryKey: ["/api/benchmarks"] });
          toast({
            title: "Benchmark Complete",
            description: `${app.name} benchmark test completed successfully`,
          });
        }, variables.duration * 1000);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start benchmark test",
        variant: "destructive",
      });
    },
  });

  const handleStartBenchmark = () => {
    if (!selectedApp) {
      toast({
        title: "Selection Required",
        description: "Please select an application to test",
        variant: "destructive",
      });
      return;
    }

    // Check if app is already being tested
    const isAlreadyRunning = runningTests.some(test => test.applicationId === selectedApp);
    if (isAlreadyRunning) {
      toast({
        title: "Test Already Running",
        description: "This application is already being tested",
        variant: "destructive",
      });
      return;
    }

    startBenchmarkMutation.mutate({
      applicationId: selectedApp,
      type: testType,
      duration: parseInt(duration)
    });
  };

  const handleStopTest = (testId: string) => {
    setRunningTests(prev => prev.filter(test => test.id !== testId));
    toast({
      title: "Test Stopped",
      description: "Benchmark test was stopped manually",
    });
  };

  const formatTestType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDuration = (seconds: string) => {
    const num = parseInt(seconds);
    if (num >= 3600) return `${num / 3600} hour${num > 3600 ? 's' : ''}`;
    if (num >= 60) return `${num / 60} minute${num > 60 ? 's' : ''}`;
    return `${num} second${num > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
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
              onClick={handleStartBenchmark}
              disabled={!selectedApp || startBenchmarkMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-start-benchmark"
            >
              {startBenchmarkMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Starting...
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
        <Card>
          <CardHeader>
            <CardTitle>Running Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {runningTests.map((test) => (
                <div key={test.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div>
                        <p className="font-medium" data-testid={`text-running-test-${test.id}`}>
                          {test.applicationName} - {formatTestType(test.type)}
                        </p>
                        <p className="text-sm text-blue-600">
                          Running... {test.progress.toFixed(0)}% complete
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStopTest(test.id)}
                      className="text-red-600 hover:text-red-700"
                      data-testid={`button-stop-test-${test.id}`}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  </div>
                  <Progress value={test.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-blue-600 mt-2">
                    <span>Duration: {formatDuration(test.duration.toString())}</span>
                    <span>{Math.round((test.duration * test.progress) / 100)}s / {test.duration}s</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
