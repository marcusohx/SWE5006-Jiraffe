"use client";

import { CheckCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApiError, ApiSuccess } from "@/types/api";

type IncidentResponse = { id: string };

export function IncidentCloseButton({
  incidentId,
  onClosed,
}: {
  incidentId: string;
  onClosed?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Closed" }),
      });
      const payload = (await response.json()) as ApiSuccess<IncidentResponse> | ApiError;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to close ticket." : payload.error);
      }
      window.dispatchEvent(new CustomEvent("incident-inbox-refresh"));
      router.refresh();
      onClosed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to close ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button type="button" size="sm" variant="secondary" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
        {loading ? "Closing..." : "Close"}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
