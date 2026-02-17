"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import type { TeamScopeOption } from "@/types/domain";

export function TeamScopeSelector({
  teamOptions,
  selectedTeamId,
  selectedTeam,
  onSelectTeam,
}: {
  teamOptions: TeamScopeOption[];
  selectedTeamId: number | null;
  selectedTeam: TeamScopeOption | null;
  onSelectTeam: (teamId: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dropdown
        trigger={
          <div className="flex min-h-11 min-w-[240px] items-center gap-3 rounded-xl border border-border bg-white px-4 py-2 text-sm shadow-[0_12px_30px_-25px_rgba(15,23,42,0.6)]">
            <Building2 className="h-4 w-4 text-muted" />
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="text-[10px] uppercase tracking-[0.16em] text-muted">Team Scope</span>
              <span className="truncate font-medium text-foreground">
                {selectedTeam ? selectedTeam.name : "No team available"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted" />
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
              <span className="ml-auto text-xs text-muted">#{team.teamId}</span>
            </DropdownItem>
          ))
        )}
      </Dropdown>
      {selectedTeam ? <Badge variant="default">Team ID {selectedTeam.teamId}</Badge> : null}
    </div>
  );
}
