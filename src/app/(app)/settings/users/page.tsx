import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { UserRolesTable } from "@/components/users/UserRolesTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/modules/auth/auth.options";
import { listUsers } from "@/modules/user/user.service";

export default async function UserSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== "admin") redirect("/settings");

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">User Roles</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRolesTable users={users} currentUserId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
