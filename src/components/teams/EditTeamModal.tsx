"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { TeamForm } from "@/components/teams/TeamForm";
import { Modal } from "@/components/ui/modal";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ApiSuccess<T> = { success: true; data: T };

type TeamResponse = {
  id: string;
  teamId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: { userId: string; name: string; email: string; role: string }[];
};

type ApiError = { success: false; error: string };

type TeamPayload = {
  name: string;
  description: string | null;
  memberIds: string[];
  isActive: boolean;
};

export function EditTeamModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const editId = searchParams.get("edit");
  const open = Boolean(editId);

  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !editId) {
      setTeam(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const loadTeam = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/teams/${editId}`, { method: "GET" });
        const payload = (await response.json()) as ApiSuccess<TeamResponse> | ApiError;
        if (!response.ok || !payload.success) {
          throw new Error(payload.success ? "Unable to load team." : payload.error);
        }
        if (isMounted) {
          setTeam(payload.data);
        }
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : "Unable to load team.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTeam();

    return () => {
      isMounted = false;
    };
  }, [open, editId]);

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
        <div className="flex items-center gap-2 text-sm text-[color:var(--color-muted)]">
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
