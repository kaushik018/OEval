import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";
import ComparisonCard from "@/components/ComparisonCard";

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

export default function Compare() {
  const [selectedApps, setSelectedApps] = useState<string[]>(['', '', '']);

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const handleAppSelection = (index: number, appId: string) => {
    const newSelection = [...selectedApps];
    newSelection[index] = appId;
    setSelectedApps(newSelection);
  };

  const getSelectedApplications = () => {
    return selectedApps
      .filter(id => id !== '')
      .map(id => applications.find(app => app.id === id))
      .filter(Boolean) as Application[];
  };

  const handleExportComparison = async () => {
    const selectedApplications = getSelectedApplications();
    if (selectedApplications.length === 0) return;

    try {
      const response = await fetch('/api/export/applications?format=csv', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'comparison-export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const selectedApplications = getSelectedApplications();

  return (
    <div className="fade-in">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Compare Applications</h2>
            <p className="text-muted-foreground">Side-by-side application comparison</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Application Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Applications to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Application 1</label>
                <Select 
                  value={selectedApps[0]} 
                  onValueChange={(value) => handleAppSelection(0, value)}
                  data-testid="select-app-1"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem 
                        key={app.id} 
                        value={app.id}
                        disabled={selectedApps.includes(app.id)}
                      >
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Application 2</label>
                <Select 
                  value={selectedApps[1]} 
                  onValueChange={(value) => handleAppSelection(1, value)}
                  data-testid="select-app-2"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select application..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app) => (
                      <SelectItem 
                        key={app.id} 
                        value={app.id}
                        disabled={selectedApps.includes(app.id)}
                      >
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Application 3 (Optional)</label>
                <Select 
                  value={selectedApps[2]} 
                  onValueChange={(value) => handleAppSelection(2, value)}
                  data-testid="select-app-3"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select application..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {applications.map((app) => (
                      <SelectItem 
                        key={app.id} 
                        value={app.id}
                        disabled={selectedApps.includes(app.id)}
                      >
                        {app.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {selectedApplications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">
              Select applications above to start comparing
            </p>
            {applications.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to add applications first before you can compare them
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {selectedApplications.map((app, index) => (
                <ComparisonCard 
                  key={app.id} 
                  application={app} 
                  index={index}
                />
              ))}
            </div>

            {/* Export Options */}
            <div className="flex justify-end">
              <Button
                onClick={handleExportComparison}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-export-comparison"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Comparison
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
