import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Budget from "@/pages/Budget";
import Expenses from "@/pages/Expenses";
import Accounts from "@/pages/Accounts";
import Reports from "@/pages/Reports";
import Goals from "@/pages/Goals";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useFinance();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      forcedTheme={settings.darkMode ? "dark" : "light"}
      enableSystem={false}
    >
      {children}
    </ThemeProvider>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/budget" component={Budget} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/reports" component={Reports} />
        <Route path="/goals" component={Goals} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <FinanceProvider>
      <ThemeWrapper>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
          <Sonner position="top-right" />
        </TooltipProvider>
      </ThemeWrapper>
    </FinanceProvider>
  );
}

export default App;
