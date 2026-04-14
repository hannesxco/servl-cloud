import { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CloudStoreProvider, useCloudStore } from "@/lib/cloud-store";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CRM from "@/pages/CRM";
import CustomerDetail from "@/pages/CustomerDetail";
import Pipeline from "@/pages/Pipeline";
import Tasks from "@/pages/Tasks";
import CalendarView from "@/pages/CalendarView";
import Expenses from "@/pages/Expenses";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AppContent() {
  const [loggedIn, setLoggedIn] = useState(() => {
    return sessionStorage.getItem('sc_auth') === 'true';
  });
  const { loading } = useCloudStore();

  const handleLogin = () => {
    sessionStorage.setItem('sc_auth', 'true');
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sc_auth');
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Daten werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/crm" element={<CRM />} />
          <Route path="/crm/:id" element={<CustomerDetail />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/aufgaben" element={<Tasks />} />
          <Route path="/kalender" element={<CalendarView />} />
          <Route path="/ausgaben" element={<Expenses />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <CloudStoreProvider>
          <AppContent />
        </CloudStoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
