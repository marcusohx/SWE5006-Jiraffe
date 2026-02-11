"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CreateTicketButton({ label }: { label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = new URLSearchParams(searchParams.toString());
  params.set("create", "true");
  const query = params.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <Button size="sm" asChild>
      <Link href={href}>
        <Plus className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
