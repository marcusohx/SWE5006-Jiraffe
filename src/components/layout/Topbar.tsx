"use client";

import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-4">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
          <Input className="pl-9" placeholder="Search tickets, boards, people" />
        </div>
        <Button variant="secondary" size="sm">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
        <div className="flex items-center gap-3 rounded-full border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-surface-muted)] text-xs font-semibold">
            JL
          </div>
          <div className="leading-tight">
            <p className="font-medium">Jules Layton</p>
            <p className="text-xs text-[color:var(--color-muted)]">Lead PM</p>
          </div>
        </div>
      </div>
    </header>
  );
}
