import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const displayDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed
    .split(/\s+/)
    .map((word) => {
      const first = word.charAt(0).toUpperCase();
      const rest = word.slice(1).toLowerCase();
      return `${first}${rest}`;
    })
    .join(" ");
}

export function formatDisplayDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return displayDateFormatter.format(date);
}

export function formatDisplayDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return dateTimeFormatter.format(date);
}

export function formatIncidentCode(incidentId: number): string {
  const normalized = Number.isFinite(incidentId) ? Math.max(0, Math.trunc(incidentId)) : 0;
  return `JIR-${String(normalized).padStart(3, "0")}`;
}

export function includesIgnoreCase(value: string, query: string): boolean {
  return value.toLowerCase().includes(query);
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin === 1) return "1 minute ago";
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr === 1) return "1 hour ago";
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`;
  return formatDisplayDate(target);
}

export function formatDurationFromNow(date: Date | string): string {
  const target = date instanceof Date ? date : new Date(date);
  const diffMs = target.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const totalMinutes = Math.ceil(absMs / (60 * 1000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return `${diffMs >= 0 ? "in" : ""} ${parts.join(" ")}`.trim();
}
