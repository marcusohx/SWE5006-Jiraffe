import { ArrowLeft, Calendar, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { tickets } from "@/lib/mock-data";

const statusVariant = {
  Backlog: "default",
  "In Progress": "info",
  Review: "warning",
  Done: "success",
} as const;

const priorityVariant = {
  Low: "default",
  Medium: "info",
  High: "warning",
  Critical: "danger",
} as const;

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = tickets.find((item) => item.id === params.id) ?? tickets[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/tickets" className="text-[color:var(--color-muted)]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm text-[color:var(--color-muted)]">Ticket Details</p>
            <h1 className="text-3xl font-semibold">{ticket.title}</h1>
          </div>
        </div>
        <Button>Assign to me</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[color:var(--color-muted)]">{ticket.summary}</p>
            <div className="flex flex-wrap gap-2">
              {ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[color:var(--color-surface-muted)] px-2 py-1 text-xs font-semibold text-[color:var(--color-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="grid gap-2 text-sm text-[color:var(--color-muted)]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Updated {ticket.updatedAt}
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Reporter: {ticket.reporter}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Status</p>
              <Badge variant={statusVariant[ticket.status]}>{ticket.status}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Priority</p>
              <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
            </div>
            <div>
              <p className="text-xs uppercase text-[color:var(--color-muted)]">Assignee</p>
              <p className="text-sm font-medium">{ticket.assignee}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Add a status update or context for the team." />
          <div className="flex justify-end">
            <Button variant="secondary">Post Update</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
