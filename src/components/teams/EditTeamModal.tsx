"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TeamForm } from "@/components/teams/TeamForm";
import { Modal } from "@/components/ui/modal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ApiError, ApiSuccess } from "@/types/api";

type TeamResponse = {
  id: string;
  teamId: number;
  teamCode: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: { userId: string; name: string; email: string; role: string }[];
};

type TeamPayload = {
  name: string;
  description: string | null;
  memberIds: string[];
  isActive: boolean;
};

async function fetchTeam(editId: string, signal: AbortSignal): Promise<TeamResponse> {
  const response = await fetch(`/api/teams/${editId}`, { method: "GET", signal });
  const payload = (await response.json()) as ApiSuccess<TeamResponse> | ApiError;
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? "Unable to load team." : payload.error);
  }
  return payload.data;
}

function useLoadTeam(editId: string | null, open: boolean) {
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !editId) {
      setTeam(null);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadTeam() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTeam(editId!, controller.signal);
        setTeam(data);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Unable to load team.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadTeam();
    return () => controller.abort();
  }, [open, editId]);

  return { team, loading, error };
}

export function EditTeamModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const editId = searchParams.get("edit");
  const open = Boolean(editId);

  const { team, loading, error } = useLoadTeam(editId, open);

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("edit");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const onSuccess = () => {
    router.refresh();
    close();
  };

  const onSubmit = async (payload: TeamPayload) => {
    if (!editId) {
      return;
    }
    const response = await fetch(`/api/teams/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiSuccess<TeamResponse> | ApiError;
    if (!response.ok || !data.success) {
      throw new Error(data.success ? "Unable to update team." : data.error);
    }
  };

  const initialMembers = useMemo(() => {
    return (team?.members ?? []).map((member) => ({
      id: member.userId,
      name: member.name,
      email: member.email,
    }));
  }, [team?.members]);

  return (
    <Modal open={open} onClose={close} title="Edit Team">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading team...
        </div>
      ) : null}
      {!loading && error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && team && !error ? (
        <TeamForm
          submitLabel="Save Changes"
          onSubmit={onSubmit}
          onSuccess={onSuccess}
          initialName={team.name}
          initialDescription={team.description ?? ""}
          initialMembers={initialMembers}
          initialIsActive={team.isActive}
        />
      ) : null}
    </Modal>
  );
}
