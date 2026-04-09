"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ApiError, ApiSuccess } from "@/types/api";

type IncidentResponse = { id: string };

export function IncidentAcknowledgeButton({
  incidentId,
  label = "Acknowledge",
  onAcknowledged,
  size = "sm",
}: {
  incidentId: string;
  label?: string;
  onAcknowledged?: () => void;
  size?: "sm" | "md" | "lg";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/acknowledge`, { method: "POST" });
      const payload = (await response.json()) as ApiSuccess<IncidentResponse> | ApiError;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to acknowledge ticket." : payload.error);
      }
      window.dispatchEvent(new CustomEvent("incident-inbox-refresh"));
      router.refresh();
      onAcknowledged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to acknowledge ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button type="button" size={size} onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {loading ? "Working..." : label}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
