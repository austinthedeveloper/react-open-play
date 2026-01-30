export type PlayerProfile = {
  id: string;
  playerId?: string;
  name: string;
  color?: string;
  gender?: string;
};

export type MatchCard = {
  id: string;
  index: number;
  teams: [string[], string[]];
};

export type Schedule = {
  matches: MatchCard[];
};

export class CreateMatchDto {
  sessionId: string;
  createdAt: number;
  matchType: string;
  players: PlayerProfile[];
  numMatches: number;
  numCourts: number;
  courtNumbers: number[];
  schedule: Schedule | null;
  matchResults: Record<string, string>;
  allowedUserIds?: string[];
}
