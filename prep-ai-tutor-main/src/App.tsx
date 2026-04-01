import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Chat from "./pages/Chat";
import Teach from "./pages/Teach";
import Learn from "./pages/Learn";
import KnowledgeBase from "./pages/KnowledgeBase";
import Progress from "./pages/Progress";
import Dashboard from "./pages/Dashboard";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import { useState } from "react";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();
  const [guest, setGuest] = useState(() => sessionStorage.getItem("pm_guest") === "1");

  const handleGuest = () => {
    sessionStorage.setItem("pm_guest", "1");
    setGuest(true);
  };

  // While Supabase checks session — show nothing (avoids flash)
  if (loading) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "hsl(225 25% 5%)"
      }}>
        <div style={{
          width: 36, height: 36,
          border: "3px solid hsl(190 90% 50% / 0.2)",
          borderTop: "3px solid hsl(190 90% 50%)",
          borderRadius: "50%",
          animation: "login-spin 0.7s linear infinite"
        }} />
      </div>
    );
  }

  // Not logged in and not guest → show login
  if (!user && !guest) {
    return <LoginPage onGuest={handleGuest} />;
  }

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/teach" element={<Teach />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
