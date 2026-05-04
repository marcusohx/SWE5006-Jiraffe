"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlarmClock, KanbanSquare, LayoutDashboard, Settings, Sparkles, Ticket, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "SLA Rules", href: "/sla-rules", icon: AlarmClock },
  { label: "Teams", href: "/teams", icon: Users },
  { label: "Board", href: "/board", icon: KanbanSquare },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-border bg-surface px-6 py-8 lg:flex">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="leading-none">Jiraffe</p>
          <p className="text-xs text-muted">Product Ops</p>
        </div>
      </div>

      <nav className="mt-10 flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-surface-muted text-foreground"
                  : "text-muted hover:bg-surface-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-border bg-white p-4">
        <p className="text-xs uppercase text-muted">Sprint Health</p>
        <p className="mt-2 text-2xl font-semibold">86%</p>
        <p className="text-xs text-muted">On-track deliverables</p>
      </div>
    </aside>
  );
}
