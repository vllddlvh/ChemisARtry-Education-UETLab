import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const nav = [
  { to: "/", label: "Home" },
  { to: "/lab", label: "AR Lab" },
  { to: "/periodic-table", label: "Periodic" },
  { to: "/molecules", label: "Molecules" },
  { to: "/reactions", label: "Reactions" },
  { to: "/progress", label: "Progress" },
] as const;

export default function SiteHeader() {
  const { user } = useAuth();
  const loc = useLocation();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-lg bg-background/70 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg font-display shrink-0">
          <span className="text-2xl">🧬</span>
          <span>MoleLab<span className="text-primary">AR</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => {
            const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</span>
              <Button size="sm" variant="ghost" className="rounded-full" onClick={() => supabase.auth.signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full bg-gradient-primary">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
      {/* mobile nav */}
      <nav className="md:hidden flex gap-1 px-3 pb-2 overflow-x-auto">
        {nav.map((n) => {
          const active = loc.pathname === n.to || (n.to !== "/" && loc.pathname.startsWith(n.to));
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition ${
                active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
