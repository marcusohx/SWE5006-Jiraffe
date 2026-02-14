"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { Suspense, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IncidentBoard } from "@/components/board/IncidentBoard";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { getLastSelectedTeamId, saveSelectedTeamId } from "@/lib/team-persistence";
import type { IncidentWithNames } from "@/modules/incident/incident.model";

export type TeamOption = {
  teamId: number;
  name: string;
};

export function TeamScopedIncidentBoard({
  incidents,
  teamOptions,
}: {
  incidents: IncidentWithNames[];
  teamOptions: TeamOption[];
}) {
  return (
    <Suspense fallback={null}>
      <TeamScopedIncidentBoardContent incidents={incidents} teamOptions={teamOptions} />
    </Suspense>
  );
}

function TeamScopedIncidentBoardContent({
  incidents,
  teamOptions,
}: {
  incidents: IncidentWithNames[];
  teamOptions: TeamOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedTeamId = useMemo(() => {
    // Priority 1: URL query parameter
    const queryTeam = searchParams.get("team");
    const parsedTeamId = queryTeam ? Number.parseInt(queryTeam, 10) : Number.NaN;
    if (Number.isInteger(parsedTeamId) && teamOptions.some((team) => team.teamId === parsedTeamId)) {
      return parsedTeamId;
    }

    // Priority 2: Last selected team from localStorage
    const lastSelectedTeamId = getLastSelectedTeamId();
    if (lastSelectedTeamId !== null && teamOptions.some((team) => team.teamId === lastSelectedTeamId)) {
      return lastSelectedTeamId;
    }

    // Priority 3: First team as fallback
    return teamOptions[0]?.teamId ?? null;
  }, [teamOptions, searchParams]);

  useEffect(() => {
    if (selectedTeamId === null) {
      return;
    }
    if (searchParams.get("team") === String(selectedTeamId)) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("team", String(selectedTeamId));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [selectedTeamId, searchParams, router, pathname]);

  useEffect(() => {
    if (selectedTeamId !== null) {
      saveSelectedTeamId(selectedTeamId);
    }
  }, [selectedTeamId]);

  const onSelectTeam = (teamId: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("team", String(teamId));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const selectedTeam = useMemo(() => {
    return teamOptions.find((team) => team.teamId === selectedTeamId) ?? null;
  }, [teamOptions, selectedTeamId]);

  const selectedIncidents = useMemo(() => {
    if (selectedTeamId === null) {
      return [];
    }
    return incidents.filter((incident) => incident.teamId === selectedTeamId);
  }, [incidents, selectedTeamId]);

  if (teamOptions.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--color-border)] bg-white p-8 text-center shadow-sm">
        <p className="text-[color:var(--color-muted)]">
          You are not assigned to any teams. Contact your administrator to be added to a team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Dropdown
          trigger={
            <div className="flex min-h-11 min-w-[240px] items-center gap-3 rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2 text-sm shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
              <Building2 className="h-4 w-4 text-[color:var(--color-muted)]" />
              <div className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">Team Scope</span>
                <span className="truncate font-medium text-[color:var(--color-foreground)]">
                  {selectedTeam ? selectedTeam.name : "No team available"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-[color:var(--color-muted)]" />
            </div>
          }
        >
          {teamOptions.length === 0 ? (
            <DropdownItem disabled>No teams assigned</DropdownItem>
          ) : (
            teamOptions.map((team) => (
              <DropdownItem
                key={team.teamId}
                selected={team.teamId === selectedTeamId}
                onClick={() => onSelectTeam(team.teamId)}
              >
                <span className="mr-2 inline-flex h-5 w-5 items-center justify-center">
                  {team.teamId === selectedTeamId ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
                <span>{team.name}</span>
                <span className="ml-auto text-xs text-[color:var(--color-muted)]">#{team.teamId}</span>
              </DropdownItem>
            ))
          )}
        </Dropdown>
        {selectedTeam ? <Badge variant="default">Team ID {selectedTeam.teamId}</Badge> : null}
      </div>

      <IncidentBoard initialIncidents={selectedIncidents} />
    </div>
  );
}
