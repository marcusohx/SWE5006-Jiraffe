"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getLastSelectedTeamId, saveSelectedTeamId } from "@/lib/team-persistence";
import type { TeamScopeOption } from "@/types/domain";

export function useTeamSelection(teamOptions: TeamScopeOption[]) {
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

  return { selectedTeamId, selectedTeam, onSelectTeam };
}
