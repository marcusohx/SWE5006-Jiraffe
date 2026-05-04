"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import type { User, UserRole } from "@/modules/user/user.model";
import type { ApiError, ApiSuccess } from "@/types/api";

export function UserRolesTable({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(users);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateRole = async (userId: string, role: UserRole) => {
    setPendingUserId(userId);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = (await response.json()) as ApiSuccess<User> | ApiError;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Unable to update role." : payload.error);
      }

      setRows((prev) => prev.map((user) => (user.id === userId ? payload.data : user)));
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update role.");
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Change Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((user) => {
            const isBusy = pendingUserId === user.id || isPending;
            const isCurrentUser = user.id === currentUserId;
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="mt-1 text-xs text-muted">{user.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "info" : "default"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted">
                  {formatDisplayDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={user.role === "user" ? "secondary" : "ghost"}
                      disabled={isBusy || isCurrentUser || user.role === "user"}
                      onClick={() => updateRole(user.id, "user")}
                    >
                      <UserRound className="h-4 w-4" />
                      User
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={user.role === "admin" ? "secondary" : "ghost"}
                      disabled={isBusy || isCurrentUser || user.role === "admin"}
                      onClick={() => updateRole(user.id, "admin")}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </Button>
                  </div>
                  {isCurrentUser ? (
                    <p className="mt-2 text-right text-xs text-muted">Current session</p>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
