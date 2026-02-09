"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TeamForm } from "@/components/teams/TeamForm";
import { Modal } from "@/components/ui/modal";

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

export function CreateTeamModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const open = searchParams.get("createTeam") === "true";

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("createTeam");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const onSuccess = () => {
    router.refresh();
    close();
  };

  const onSubmit = async (payload: TeamPayload) => {
    const response = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ApiSuccess<TeamResponse> | ApiError;
    if (!response.ok || !data.success) {
      throw new Error(data.success ? "Unable to create team." : data.error);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Create Team">
      <TeamForm
        submitLabel="Create Team"
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        showAutoIdNotice
      />
    </Modal>
  );
}
