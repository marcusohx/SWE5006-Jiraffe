export type TeamScopeOption = { teamId: number; name: string };

export type UserOption = { id: string; name: string; email: string };

export type TeamOptionWithMembers = {
  teamId: number;
  name: string;
  members: { userId: string; name: string; email: string; role: string }[];
};
