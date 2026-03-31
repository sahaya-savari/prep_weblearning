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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
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

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Practice", url: "/practice", icon: BookOpen },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Teach", url: "/teach", icon: GraduationCap },
  { title: "Learn", url: "/learn", icon: Brain },
];

const toolItems = [
  { title: "Knowledge Base", url: "/knowledge", icon: FolderOpen },
  { title: "Progress", url: "/progress", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
];

import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user, loginWithGoogle, signOut, loading } = useAuth();
  
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
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

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="rounded-lg bg-muted/50 p-3">
            {loading ? (
              <div className="flex items-center justify-center p-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <img 
                  src={user.user_metadata.avatar_url || "https://ui-avatars.com/api/?name=" + (user.email || "U")} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full border border-border" 
                />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium leading-none mb-1">
                    {user.user_metadata.full_name || user.email?.split("@")[0]}
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
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-black px-3 py-2 text-sm font-medium hover:bg-gray-100 transition-colors"
                title="Sign in to save your learning progress"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.81002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.185 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
