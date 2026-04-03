import { useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CRM from "@/pages/CRM";
import CustomerDetail from "@/pages/CustomerDetail";
import Finances from "@/pages/Finances";
import Pipeline from "@/pages/Pipeline";
import Tasks from "@/pages/Tasks";
import CalendarView from "@/pages/CalendarView";
import Agents from "@/pages/Agents";
import Invoices from "@/pages/Invoices";
import Projects from "@/pages/Projects";
import Mail from "@/pages/Mail";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [loggedIn, setLoggedIn] = useState(() => {
    return sessionStorage.getItem('sc_auth') === 'true';
  });

  const handleLogin = () => {
    sessionStorage.setItem('sc_auth', 'true');
    setLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('sc_auth');
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Login onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crm" element={<CRM />} />
              <Route path="/crm/:id" element={<CustomerDetail />} />
              <Route path="/finanzen" element={<Finances />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/aufgaben" element={<Tasks />} />
              <Route path="/kalender" element={<CalendarView />} />
              <Route path="/agents" element={<Agents />} />
              <Route path="/rechnungen" element={<Invoices />} />
              <Route path="/projekte" element={<Projects />} />
              <Route path="/mail" element={<Mail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
