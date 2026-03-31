import { NavLink } from "@/components/NavLink";
import { Home, BookOpen, MessageSquare, GraduationCap, Brain, FolderOpen, BarChart3, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Practice", url: "/practice", icon: BookOpen },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Learn", url: "/learn", icon: Brain },
  { title: "More", url: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-border/50">
      <div className="flex items-center justify-around py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = isActive(item.url);
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors"
              activeClassName=""
            >
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                active ? "bg-primary/15 glow-primary" : ""
              }`}>
                <item.icon className={`h-5 w-5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`} />
              </div>
              <span className={`text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}>
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
