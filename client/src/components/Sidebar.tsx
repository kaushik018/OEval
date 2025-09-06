import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Layers, 
  Activity, 
  Scale, 
  FileText, 
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Applications", href: "/applications", icon: Layers },
    { name: "Benchmarks", href: "/benchmarks", icon: Activity },
    { name: "Compare", href: "/compare", icon: Scale },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.email) {
      return user.email;
    }
    return "User";
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">ObjectiveEval</h1>
        <p className="text-sm text-muted-foreground mt-1">Software Evaluation</p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary text-foreground"
                  )} data-testid={`nav-${item.name.toLowerCase()}`}>
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
            {getInitials(user)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {getDisplayName(user)}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">
              {(user as any)?.email || ""}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
