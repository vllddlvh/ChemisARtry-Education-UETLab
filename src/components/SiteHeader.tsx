import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SiteHeader() {
  const { user } = useAuth();
  const loc = useLocation();

  const activePath = loc.pathname;
  const isAppRoute =
    activePath.startsWith("/dashboard") ||
    activePath.startsWith("/learn") ||
    activePath.startsWith("/lab") ||
    activePath.startsWith("/tools") ||
    activePath.startsWith("/progress");
  const showAppMenu = user || isAppRoute;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-lg bg-background/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to={showAppMenu ? "/dashboard" : "/"}
          className="flex items-center gap-2 font-bold text-lg font-display shrink-0"
        >
          <span className="text-2xl">⚗️</span>
          <span>ChemisARtry</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {showAppMenu ? (
            <>
              <NavLink to="/learn" label="Học" active={activePath.startsWith("/learn")} />
              <NavLink to="/lab/sim" label="Thực hành" active={activePath.startsWith("/lab")} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full px-3 gap-1 hover:bg-muted font-normal h-8"
                  >
                    Tools <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 rounded-2xl">
                  <DropdownMenuItem asChild>
                    <Link to="/tools/periodic-table">📊 Bảng tuần hoàn</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tools/explorer">🔍 Compound Explorer</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tools/molecules">📋 Thư viện phân tử</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tools/reactions">⚗️ Danh sách phản ứng</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <NavLink to="/progress" label="Tiến độ" active={activePath.startsWith("/progress")} />
            </>
          ) : (
            <>
              <NavLink to="/" label="Tính năng" active={activePath === "/"} />
              <NavLink to="/learn" label="Lộ trình" active={activePath.startsWith("/learn")} />
            </>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {showAppMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[100px] truncate text-xs">
                    {user ? user.email?.split("@")[0] : "Khách"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/progress">Tiến độ</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem
                    onClick={() => supabase.auth.signOut()}
                    className="text-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth">Đăng nhập</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="rounded-full hidden sm:flex">
                <Link to="/auth">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-gradient-primary">
                <Link to="/dashboard">Thử miễn phí</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      {label}
    </Link>
  );
}
