export type GenderOption = "" | "male" | "female";
export type MatchType = "round_robin";

export type PlayerProfile = {
  id: string;
  name: string;
  color?: string;
  gender?: GenderOption;
};

export type MatchTeam = [string, string];

export type MatchWinner = "A" | "B";

export type MatchResults = Record<string, MatchWinner>;

export type MatchSession = {
  id: string;
  createdAt: number;
  matchType: MatchType;
  players: PlayerProfile[];
  numMatches: number;
  numCourts: number;
  courtNumbers: number[];
  schedule: Schedule | null;
  matchResults: MatchResults;
  ownerId?: string | null;
  allowedUserIds?: string[];
};

export type MatchCard = {
  id: string;
  index: number;
  teams: [MatchTeam, MatchTeam];
};

export type Schedule = {
  matches: MatchCard[];
};

export type PlayerStat = {
  id: string;
  name: string;
  color?: string;
  gender?: GenderOption;
  playCount: number;
  wins: number;
  losses: number;
};
