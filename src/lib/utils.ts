import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const displayDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
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

export function formatIncidentCode(incidentId: number): string {
  const normalized = Number.isFinite(incidentId) ? Math.max(0, Math.trunc(incidentId)) : 0;
  return `JIR-${String(normalized).padStart(3, "0")}`;
}
