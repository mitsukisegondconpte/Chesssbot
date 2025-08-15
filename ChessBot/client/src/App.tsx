import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Users from "@/pages/users";
import Games from "@/pages/games";
import Tournaments from "@/pages/tournaments";
import Rankings from "@/pages/rankings";
import Analytics from "@/pages/analytics";
import Notifications from "@/pages/notifications";
import Sidebar from "./components/layout/sidebar";
import Header from "./components/layout/header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/users" component={Users} />
      <Route path="/games" component={Games} />
      <Route path="/tournaments" component={Tournaments} />
      <Route path="/rankings" component={Rankings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/notifications" component={Notifications} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-chess-navy transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-6">
                <Router />
              </main>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
