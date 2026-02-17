"use client";

import { Suspense, useMemo } from "react";
import { IncidentBoard } from "@/components/board/IncidentBoard";
import { TeamScopeSelector } from "@/components/ui/team-scope-selector";
import { useTeamSelection } from "@/hooks/useTeamSelection";
import type { IncidentWithNames } from "@/modules/incident/incident.model";
import type { TeamScopeOption } from "@/types/domain";

export function TeamScopedIncidentBoard({
  incidents,
  teamOptions,
}: {
  incidents: IncidentWithNames[];
  teamOptions: TeamScopeOption[];
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
  teamOptions: TeamScopeOption[];
}) {
  const { selectedTeamId, selectedTeam, onSelectTeam } = useTeamSelection(teamOptions);

  const selectedIncidents = useMemo(() => {
    if (selectedTeamId === null) {
      return [];
    }
    return incidents.filter((incident) => incident.teamId === selectedTeamId);
  }, [incidents, selectedTeamId]);

  if (teamOptions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-muted">
          You are not assigned to any teams. Contact your administrator to be added to a team.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <TeamScopeSelector
        teamOptions={teamOptions}
        selectedTeamId={selectedTeamId}
        selectedTeam={selectedTeam}
        onSelectTeam={onSelectTeam}
      />

      <IncidentBoard initialIncidents={selectedIncidents} />
    </div>
  );
}
