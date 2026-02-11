"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CreateTicketForm } from "@/components/tickets/CreateTicketForm";
import { Modal } from "@/components/ui/modal";

export function CreateTicketModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const open = searchParams.get("create") === "true";
  const selectedTeamIdRaw = Number(searchParams.get("team"));
  const selectedTeamId = Number.isInteger(selectedTeamIdRaw) ? selectedTeamIdRaw : null;

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("create");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const onSuccess = () => {
    router.refresh();
    close();
  };

  return (
    <Modal open={open} onClose={close} title="Create Ticket">
      <CreateTicketForm onSuccess={onSuccess} selectedTeamId={selectedTeamId} />
    </Modal>
  );
}
