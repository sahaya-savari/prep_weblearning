import {
  Home,
  BookOpen,
  MessageSquare,
  GraduationCap,
  BarChart3,
  Settings,
  Brain,
  FolderOpen,
  Sparkles,
  Bot,
  Zap,
  LayoutDashboard
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useAppContext } from "@/contexts/AppContext";
import { LoginModal } from "./LoginModal";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Practice", url: "/practice", icon: BookOpen },
  { title: "Study Chat", url: "/chat", icon: MessageSquare },
  { title: "Concept Breakdown", url: "/teach", icon: GraduationCap },
  { title: "Learn", url: "/learn", icon: Brain },
];

const toolItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Knowledge Base", url: "/knowledge", icon: FolderOpen },
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, signOut, loading } = useAuth();
  const { selectedAiModel, setSelectedAiModel } = useAppContext();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <>
      <Sidebar collapsible="icon" className="hidden md:flex">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary glow-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight">
                Prep<span className="text-gradient">Mind</span>
              </span>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Main
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="transition-all duration-200"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Tools
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {toolItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} className="transition-all duration-200">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 flex flex-col gap-3">
          {!collapsed && (
            <div className="flex rounded-lg bg-secondary/30 p-1 border border-border/50">
              <button
                onClick={() => setSelectedAiModel("gemini")}
                className={`flex-1 flex justify-center items-center gap-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                  selectedAiModel === "gemini" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                Gemini
              </button>
              <button
                onClick={() => setSelectedAiModel("ollama")}
                className={`flex-1 flex justify-center items-center gap-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                  selectedAiModel === "ollama" ? "bg-accent text-accent-foreground shadow-sm glow-secondary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Bot className="h-3 w-3" />
                Ollama
              </button>
            </div>
          )}

          {!collapsed && (
            <div className="rounded-lg bg-muted/50 p-3">
              {loading ? (
                <div className="flex items-center justify-center p-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : user ? (
                <div className="flex items-center gap-3">
                  <img 
                    src={user.user_metadata?.avatar_url || "https://ui-avatars.com/api/?name=" + (user.email || "U")} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full border border-border" 
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium leading-none mb-1">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground leading-none">
                      {user.email}
                    </p>
                  </div>
                  <button 
                    onClick={signOut}
                    className="text-[10px] text-destructive hover:underline p-1"
                    title="Sign out"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setLoginModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors shadow-lg glow-primary/20"
                >
                  <Zap className="h-4 w-4" />
                  Sign in or create account
                </button>
              )}
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
      <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
    </>
  );
}
