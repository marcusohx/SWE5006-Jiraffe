"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiError, ApiSuccess } from "@/types/api";

export function EditableTicketDetails({
  incidentId,
  initialTitle,
  initialDescription,
}: {
  incidentId: string;
  initialTitle: string;
  initialDescription: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [savedDescription, setSavedDescription] = useState(initialDescription);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(() => {
    return title !== savedTitle || description !== savedDescription;
  }, [title, savedTitle, description, savedDescription]);

  const canSave = useMemo(() => {
    return Boolean(!isSaving && isDirty && title.trim() && description.trim());
  }, [isSaving, isDirty, title, description]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setError(null);

    const nextTitle = title.trim();
    const nextDescription = description.trim();

    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: nextTitle,
          description: nextDescription,
        }),
      });

      const payload = (await response.json()) as ApiSuccess<unknown> | ApiError;
      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to update ticket details." : payload.error);
      }

      setTitle(nextTitle);
      setDescription(nextDescription);
      setSavedTitle(nextTitle);
      setSavedDescription(nextDescription);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update ticket details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <label className="block text-xs uppercase text-muted">
        Ticket Name
        <Input
          className="mt-2"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ticket title"
          required
        />
      </label>

      <label className="block text-xs uppercase text-muted">
        Description
        <Textarea
          className="mt-2 min-h-[120px]"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe the issue"
          required
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        {error ? <p className="text-sm text-red-600">{error}</p> : <div />}
        {isDirty ? (
          <Button type="submit" size="sm" disabled={!canSave}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
