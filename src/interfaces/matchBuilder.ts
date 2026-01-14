export type GenderOption = "" | "male" | "female";

export type PlayerProfile = {
  id: string;
  name: string;
  color?: string;
  gender?: GenderOption;
};

export type MatchTeam = [string, string];

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
};
