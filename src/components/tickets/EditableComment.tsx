"use client";

import { Loader2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError, ApiSuccess } from "@/types/api";

export function EditableComment({
  incidentId,
  initialComment,
}: {
  incidentId: string;
  initialComment: string | null;
}) {
  const [comment, setComment] = useState(initialComment ?? "");
  const [savedComment, setSavedComment] = useState(initialComment ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = comment !== savedComment;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      const payload = (await response.json()) as ApiSuccess<unknown> | ApiError;
      if (!response.ok || !payload.success) {
        setError(payload.success ? "Unable to save comment." : payload.error);
        setIsSaving(false);
        return;
      }

      setSavedComment(comment);
    } catch {
      setError("Unable to save comment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MessageSquare className="h-4 w-4" />
        Comment
      </div>
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Add a comment"
        className="min-h-[100px] bg-white"
      />
      <div className="flex items-center justify-between gap-3">
        {error ? <p className="text-sm text-red-600">{error}</p> : <div />}
        {isDirty ? (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
