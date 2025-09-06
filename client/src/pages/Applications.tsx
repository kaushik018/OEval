import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import AddApplicationModal from "@/components/AddApplicationModal";
import ApplicationCard from "@/components/ApplicationCard";

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

export default function Applications() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  // Filter applications based on search and filters
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || app.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      <div className="fade-in">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Applications</h2>
              <p className="text-muted-foreground">Manage and monitor your software applications</p>
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
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-applications"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48" data-testid="select-category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Payment Processing">Payment Processing</SelectItem>
                <SelectItem value="Communication">Communication</SelectItem>
                <SelectItem value="Analytics">Analytics</SelectItem>
                <SelectItem value="Storage">Storage</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Applications Grid */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              {applications.length === 0 ? (
                <div>
                  <p className="text-muted-foreground text-lg mb-4">No applications added yet</p>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-add-first-application"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Application
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-lg">No applications match your filters</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApplications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddApplicationModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
    </>
  );
}
