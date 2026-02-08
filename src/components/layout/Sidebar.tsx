"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, KanbanSquare, Settings, Ticket, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Ticket },
  { label: "Board", href: "/board", icon: KanbanSquare },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-8 lg:flex">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--color-accent)] text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="leading-none">Jiraffe</p>
          <p className="text-xs text-[color:var(--color-muted)]">Product Ops</p>
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
                  ? "bg-[color:var(--color-surface-muted)] text-[color:var(--color-foreground)]"
                  : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-muted)]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-4">
        <p className="text-xs uppercase text-[color:var(--color-muted)]">Sprint Health</p>
        <p className="mt-2 text-2xl font-semibold">86%</p>
        <p className="text-xs text-[color:var(--color-muted)]">On-track deliverables</p>
      </div>
    </aside>
  );
}
