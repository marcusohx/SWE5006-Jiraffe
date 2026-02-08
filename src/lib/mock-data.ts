export type TicketStatus = "Backlog" | "In Progress" | "Review" | "Done";
export type TicketPriority = "Low" | "Medium" | "High" | "Critical";

export interface Ticket {
  id: string;
  title: string;
  summary: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: string;
  reporter: string;
  updatedAt: string;
  tags: string[];
}

export const dashboardMetrics = [
  { label: "Open Tickets", value: "128", trend: "+12%" },
  { label: "Avg. Resolution", value: "2.4d", trend: "-8%" },
  { label: "SLA Met", value: "94%", trend: "+3%" },
  { label: "Active Sprints", value: "3", trend: "Stable" },
];

export const tickets: Ticket[] = [
  {
    id: "JRF-201",
    title: "Unify workspace permissions for external collaborators",
    summary: "Introduce scoped access roles and default org policy templates.",
    status: "In Progress",
    priority: "High",
    assignee: "Maya Chen",
    reporter: "Jules Layton",
    updatedAt: "2 hours ago",
    tags: ["Security", "Enterprise"],
  },
  {
    id: "JRF-198",
    title: "Improve ticket creation flow with templates",
    summary: "Add reusable templates and inline guidance for ticket fields.",
    status: "Backlog",
    priority: "Medium",
    assignee: "Noah Rivers",
    reporter: "Erin Wolfe",
    updatedAt: "Yesterday",
    tags: ["UX", "Onboarding"],
  },
  {
    id: "JRF-195",
    title: "SLA breach alerting on critical incidents",
    summary: "Alert oncall rotation when SLA threshold is at risk.",
    status: "Review",
    priority: "Critical",
    assignee: "Lea Patel",
    reporter: "Ops Bot",
    updatedAt: "3 days ago",
    tags: ["Reliability", "Automation"],
  },
  {
    id: "JRF-190",
    title: "Ticket analytics export to CSV",
    summary: "Support on-demand export for custom reports.",
    status: "Done",
    priority: "Low",
    assignee: "Ava Brooks",
    reporter: "Chris Dale",
    updatedAt: "Last week",
    tags: ["Analytics"],
  },
  {
    id: "JRF-189",
    title: "Bulk edit for status + assignee",
    summary: "Allow multi-select updates in table view.",
    status: "In Progress",
    priority: "High",
    assignee: "Rohan Gupta",
    reporter: "Sasha Lin",
    updatedAt: "Last week",
    tags: ["Productivity", "Tables"],
  },
];

export const boardColumns: Record<TicketStatus, Ticket[]> = {
  Backlog: [tickets[1]],
  "In Progress": [tickets[0], tickets[4]],
  Review: [tickets[2]],
  Done: [tickets[3]],
};

export const activityFeed = [
  {
    title: "Maya Chen moved JRF-201 to In Progress",
    time: "12 minutes ago",
  },
  {
    title: "Ops Bot posted an incident report for JRF-195",
    time: "2 hours ago",
  },
  {
    title: "Ava Brooks closed JRF-190",
    time: "Yesterday",
  },
];
