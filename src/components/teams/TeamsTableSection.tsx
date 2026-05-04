"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteTeamConfirmModal } from "@/components/teams/DeleteTeamConfirmModal";
import { TeamCodeCopyButton } from "@/components/teams/TeamCodeCopyButton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate } from "@/lib/utils";
import type { TeamWithMembers } from "@/modules/team/team.model";
import type { ApiError, ApiSuccess } from "@/types/api";

export function TeamsTableSection({
  initialRows,
  canManage,
}: {
  initialRows: TeamWithMembers[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<TeamWithMembers[]>(initialRows);

  const [teamToDelete, setTeamToDelete] = useState<TeamWithMembers | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setRows(initialRows));
  }, [initialRows]);

  const onConfirmDelete = async () => {
    if (!teamToDelete) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/teams/${teamToDelete.id}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiSuccess<{ deleted: boolean }> | ApiError;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to delete team." : payload.error);
      }

      setRows((prev) => prev.filter((row) => row.id !== teamToDelete.id));
      setTeamToDelete(null);
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Unable to delete team.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team</TableHead>
            <TableHead>Team Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((team) => (
            <TableRow key={team.id}>
              <TableCell>
                <p className="font-semibold text-foreground">{team.name}</p>
                <p className="mt-1 text-xs text-muted">Team ID: {team.teamId}</p>
              </TableCell>
              <TableCell>
                <TeamCodeCopyButton teamCode={team.teamCode} />
              </TableCell>
              <TableCell className="text-muted">
                {team.description ?? "No description"}
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    team.isActive
                      ? "bg-accent-soft text-accent"
                      : "bg-surface-muted text-muted"
                  }`}
                >
                  {team.isActive ? "Active" : "Inactive"}
                </span>
              </TableCell>
              <TableCell>
                <p className="text-sm font-medium">{team.members.length} members</p>
                <p className="mt-1 text-xs text-muted">
                  {team.members.length
                    ? team.members.map((member) => member.name).join(", ")
                    : "No members"}
                </p>
              </TableCell>
              <TableCell className="text-muted">
                {formatDisplayDate(team.createdAt)}
              </TableCell>
              <TableCell className="text-muted">
                {formatDisplayDate(team.updatedAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/teams/${team.id}`} aria-label={`View ${team.name}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`?edit=${team.id}`} aria-label={`Edit ${team.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  {canManage ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setDeleteError(null);
                          setTeamToDelete(team);
                        }}
                        aria-label={`Delete ${team.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteTeamConfirmModal
        open={canManage && Boolean(teamToDelete)}
        team={teamToDelete}
        onClose={() => {
          if (!isDeleting) {
            setTeamToDelete(null);
            setDeleteError(null);
          }
        }}
        onConfirm={onConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
