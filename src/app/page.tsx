import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Workflow, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const highlights = [
  {
    title: "Sprint Visibility",
    description: "Unified metrics, blockers, and sprint readiness in one snapshot.",
    icon: Workflow,
  },
  {
    title: "Enterprise Controls",
    description: "Role-based access and audit trails for regulated teams.",
    icon: ShieldCheck,
  },
  {
    title: "Fast Triage",
    description: "AI-ready workflows with templates and instant routing rules.",
    icon: Zap,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef5ff,transparent_55%),radial-gradient(circle_at_20%_20%,#fef2e2,transparent_45%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Modern Jira-inspired
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Jiraffe helps product teams move tickets with clarity and speed.
            </h1>
            <p className="mt-4 text-lg text-[color:var(--color-muted)]">
              A clean SaaS dashboard and ticket system built for high-velocity teams.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard">
                  Open Dashboard <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/tickets">Browse Tickets</Link>
              </Button>
            </div>
          </div>
          <Card className="bg-white/70 backdrop-blur">
            <CardContent className="space-y-4 p-6">
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Now shipping</p>
              <h2 className="text-2xl font-semibold">Ticket Operations Studio</h2>
              <p className="text-sm text-[color:var(--color-muted)]">
                Track SLA risk, manage boards, and launch sprint cadences without clutter.
              </p>
              <div className="space-y-3">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-3"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-[color:var(--color-muted)]">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
