import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, Calendar, Trash2 } from "lucide-react";

export default function Reports() {
  const [exportType, setExportType] = useState("all_applications");
  const [format, setFormat] = useState("csv");
  const [frequency, setFrequency] = useState("weekly");
  const [emails, setEmails] = useState("");

  const handleQuickExport = async () => {
    try {
      const response = await fetch(`/api/export/applications?format=${format}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${exportType}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const mockDownloads = [
    {
      id: 1,
      name: "All Applications Summary - December 2024",
      type: "Summary",
      format: "CSV",
      generated: "2 hours ago",
      size: "156 KB"
    },
    {
      id: 2,
      name: "Application Comparison Report",
      type: "Comparison",
      format: "CSV",
      generated: "1 day ago",
      size: "89 KB"
    },
    {
      id: 3,
      name: "Benchmark History Export",
      type: "Benchmarks",
      format: "CSV",
      generated: "3 days ago",
      size: "234 KB"
    }
  ];

  return (
    <div className="fade-in">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Reports & Export</h2>
            <p className="text-muted-foreground">Generate and download evaluation reports</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Export Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Quick Export */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Export Type</label>
                <Select value={exportType} onValueChange={setExportType} data-testid="select-export-type">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_applications">All Applications Summary</SelectItem>
                    <SelectItem value="individual_app">Individual Application Report</SelectItem>
                    <SelectItem value="comparison">Comparison Report</SelectItem>
                    <SelectItem value="benchmark_history">Benchmark History</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Format</label>
                <RadioGroup value={format} onValueChange={setFormat} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" data-testid="radio-csv" />
                    <Label htmlFor="csv">CSV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" data-testid="radio-pdf" />
                    <Label htmlFor="pdf">PDF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" data-testid="radio-json" />
                    <Label htmlFor="json">JSON</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button 
                onClick={handleQuickExport} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-generate-export"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate & Download
              </Button>
            </CardContent>
          </Card>

          {/* Scheduled Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Frequency</label>
                <Select value={frequency} onValueChange={setFrequency} data-testid="select-frequency">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Recipients</label>
                <Input
                  type="email"
                  placeholder="Enter email addresses..."
                  value={emails}
                  onChange={(e) => setEmails(e.target.value)}
                  data-testid="input-email-recipients"
                />
              </div>
              <Button 
                variant="secondary" 
                className="w-full hover:bg-secondary/80"
                data-testid="button-setup-schedule"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Setup Schedule
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Downloads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            {mockDownloads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No reports have been generated yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use the export options above to generate your first report
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium text-sm">Report Name</th>
                      <th className="text-left p-4 font-medium text-sm">Type</th>
                      <th className="text-left p-4 font-medium text-sm">Format</th>
                      <th className="text-left p-4 font-medium text-sm">Generated</th>
                      <th className="text-left p-4 font-medium text-sm">Size</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDownloads.map((download) => (
                      <tr key={download.id} className="border-b border-border" data-testid={`row-download-${download.id}`}>
                        <td className="p-4">
                          <span className="font-medium">{download.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {download.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{download.format}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{download.generated}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{download.size}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-download-${download.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-delete-${download.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
  );
}
