export type GenderOption = "" | "male" | "female";
export type MatchType =
  | "round_robin"
  | "round_robin_fixed"
  | "tournament"
  | "mixed_doubles";

export type PlayerProfile = {
  id: string;
  playerId?: string;
  name: string;
  color?: string;
  gender?: GenderOption;
};

export type MatchTeam = [string, string];
export type PartnerPair = [string, string];

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
  partnerPairs?: PartnerPair[];
  ownerId?: string | null;
  allowedUserIds?: string[];
};

export type MatchCard = {
  id: string;
  index: number;
  teams: [MatchTeam, MatchTeam];
  sourceMatchIds?: [string | null, string | null];
};

export type Schedule = {
  matches: MatchCard[];
  rounds?: MatchCard[][];
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
