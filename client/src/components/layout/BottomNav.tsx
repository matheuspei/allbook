import { Link, useLocation } from "wouter";
import { Home, Bookmark, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { name: "Início", path: "/", icon: Home },
    { name: "Biblioteca", path: "/library", icon: Bookmark },
    { name: "Descobrir", path: "/discover", icon: Sparkles },
    { name: "Minha AllBook", path: "/profile", icon: User },
  ];

  return (
    <div
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.85))' }}
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              data-testid={`nav-${item.path.replace("/", "") || "home"}`}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200",
                isActive
                  ? "text-white"
                  : "text-white/50 hover:text-white/70"
              )}
            >
              <div className="relative">
                {isActive && (
                  <div className="absolute -inset-1.5 rounded-full bg-primary/20 blur-sm" />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-all duration-200",
                    isActive && "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] leading-none transition-all duration-200",
                  isActive ? "font-semibold text-primary" : "font-medium"
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
