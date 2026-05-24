import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Home, FlaskConical, Atom, Sparkles, BarChart2, LogOut } from "lucide-react";

export default function DashboardSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <aside className="w-[260px] border-r border-border/50 bg-background/50 backdrop-blur-xl flex flex-col z-10 shrink-0">
      <div className="p-6 pb-8">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 font-display font-bold text-xl hover:opacity-80 transition-opacity"
        >
          <span className="text-3xl">⚗️</span>
          <span>ChemisARtry</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        <SidebarItem
          icon={<Home className="size-6" />}
          label="Học tập"
          active={location.pathname === "/dashboard"}
          to="/dashboard"
        />
        <SidebarItem
          icon={<FlaskConical className="size-6" />}
          label="Phòng thí nghiệm"
          active={location.pathname.includes("/lab")}
          to="/lab/sim"
        />
        <SidebarItem
          icon={<Atom className="size-6" />}
          label="Bảng tuần hoàn"
          active={location.pathname.includes("/tools/periodic-table")}
          to="/tools/periodic-table"
        />
        <SidebarItem
          icon={<Sparkles className="size-6" />}
          label="Tìm kiếm"
          active={location.pathname.includes("/tools/explorer")}
          to="/tools/explorer"
        />
        <SidebarItem
          icon={<BarChart2 className="size-6" />}
          label="Báo cáo"
          active={location.pathname.includes("/progress")}
          to="/progress"
        />
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-muted-foreground hover:bg-muted/50 hover:text-foreground font-bold transition-colors"
        >
          <LogOut className="size-6" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${active ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_20px_rgba(45,212,191,0.1)]" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
    >
      {icon}
      <span className="text-[15px]">{label}</span>
    </Link>
  );
}
