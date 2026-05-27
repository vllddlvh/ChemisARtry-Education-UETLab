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
  const appMenuContentClassName =
    "w-56 rounded-3xl border border-border/50 bg-card/90 p-2 text-foreground shadow-soft backdrop-blur-xl";
  const appMenuItemClassName =
    "rounded-2xl px-3 py-2 text-sm font-medium transition-colors focus:bg-muted/70 focus:text-foreground";

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
          {showAppMenu && (
            <>
              <NavLink to="/learn" label="Học tập" active={activePath.startsWith("/learn")} />
              <NavLink to="/lab/sim" label="Phòng thí nghiệm" active={activePath.startsWith("/lab")} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="rounded-full px-3 gap-1 h-8 font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  >
                    Công cụ <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={appMenuContentClassName}>
                  <DropdownMenuItem asChild>
                    <Link to="/tools/periodic-table" className={appMenuItemClassName}>
                      Bảng tuần hoàn
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tools/explorer" className={appMenuItemClassName}>
                      Khám phá hợp chất
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tools/molecules" className={appMenuItemClassName}>
                      Thư viện phân tử
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/tools/reactions" className={appMenuItemClassName}>
                      Danh sách phản ứng
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <NavLink to="/progress" label="Tiến độ" active={activePath.startsWith("/progress")} />
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
              <DropdownMenuContent align="end" className={appMenuContentClassName}>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard" className={appMenuItemClassName}>
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/progress" className={appMenuItemClassName}>
                    Tiến độ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <DropdownMenuItem
                    onClick={() => supabase.auth.signOut()}
                    className="rounded-2xl px-3 py-2 text-sm font-medium text-red-500 transition-colors focus:bg-red-500/10 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className={appMenuItemClassName}>
                      Đăng nhập
                    </Link>
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
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
    >
      {label}
    </Link>
  );
}
