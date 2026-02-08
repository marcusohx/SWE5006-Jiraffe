import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">Settings</p>
        <h1 className="mt-2 text-3xl font-semibold">Workspace Settings</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workspace Profile</CardTitle>
            <CardDescription>Manage how your workspace appears to teammates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Workspace Name</p>
              <Input defaultValue="Jiraffe Product Ops" />
            </div>
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Primary Domain</p>
              <Input defaultValue="jiraffe.io" />
            </div>
            <Button variant="secondary">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Control what triggers a ping.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">SLA risk alerts</p>
                <p className="text-xs text-[color:var(--color-muted)]">Notify the on-call owner.</p>
              </div>
              <Switch checked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Weekly metrics digest</p>
                <p className="text-xs text-[color:var(--color-muted)]">Send summary every Monday.</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
