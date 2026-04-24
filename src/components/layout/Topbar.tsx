"use client";

import { signOut, useSession } from "next-auth/react";
import { Search, Filter, LogOut } from "lucide-react";
import { IncidentNotificationBell } from "@/components/tickets/IncidentNotificationBell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateTicketButton } from "@/components/tickets/CreateTicketButton";

export function Topbar() {
  const { data: session } = useSession();
  const name = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "";
  const role = session?.user?.role
    ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)
    : "";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search tickets, boards, people" />
        </div>
        <Button variant="secondary" size="sm">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <IncidentNotificationBell />
        <CreateTicketButton label="New Ticket" />
        <Button
          variant="secondary"
          size="sm"
          className="group transition hover:-translate-y-0.5 hover:border-accent hover:bg-accent-soft"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          <span className="relative">
            Sign out
            <span className="absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-accent transition-all duration-300 group-hover:w-full" />
          </span>
        </Button>
        <div className="flex items-center gap-3 rounded-full border border-border bg-white px-3 py-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
