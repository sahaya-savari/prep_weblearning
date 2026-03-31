import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { PageTransition } from "@/components/PageTransition";
import { Sparkles } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        <AnimatedBackground />

        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Desktop header */}
          <header className="h-14 hidden md:flex items-center border-b border-border/40 px-4 glass-strong">
            <SidebarTrigger />
          </header>

          {/* Mobile header */}
          <header className="h-14 flex md:hidden items-center justify-between border-b border-border/40 px-4 glass-strong">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary glow-primary">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight">
                Prep<span className="text-gradient">Mind</span>
              </span>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6 pb-24 md:pb-6">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
