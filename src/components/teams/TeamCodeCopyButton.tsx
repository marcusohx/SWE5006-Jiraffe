"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TeamCodeCopyButton({ teamCode }: { teamCode: string }) {
  const [copied, setCopied] = useState(false);
  const value = teamCode || "N/A";

  const onCopy = async () => {
    if (!teamCode) {
      return;
    }
    try {
      await navigator.clipboard.writeText(teamCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={onCopy}
      aria-label={teamCode ? `Copy team code ${teamCode}` : "Team code unavailable"}
      className="h-8 rounded-lg px-2 text-xs font-semibold"
      disabled={!teamCode}
    >
      <span>{value}</span>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}
