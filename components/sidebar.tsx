"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Kanban,
  Settings,
  LogOut,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Applications", href: "/applications", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Kanban },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleLabel = user.role?.replace(/_/g, " ") ?? "User";

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0c0c0c] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#c9a84c] flex items-center justify-center shrink-0">
            <span className="text-black text-xs font-black">A</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wide leading-none">Aston VIP</p>
            <p className="text-[#c9a84c]/60 text-[10px] tracking-widest uppercase mt-0.5">Recruit</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-white/[0.08] text-white"
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <Icon className={cn("h-[15px] w-[15px] shrink-0 transition-colors", isActive ? "text-[#c9a84c]" : "text-current")} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3 text-zinc-600" />}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#c9a84c]/40 to-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center shrink-0">
            <span className="text-[#c9a84c] text-[11px] font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-zinc-200 truncate leading-none">{user.name ?? "Unknown"}</p>
            <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{roleLabel}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
