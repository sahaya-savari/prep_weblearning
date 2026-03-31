import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Home from "./pages/Home";
import Practice from "./pages/Practice";
import Chat from "./pages/Chat";
import Teach from "./pages/Teach";
import Learn from "./pages/Learn";
import KnowledgeBase from "./pages/KnowledgeBase";
import Progress from "./pages/Progress";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
