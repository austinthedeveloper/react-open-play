export type TeamMember = {
  name: string;
  color: string;
};

export type MatchCardProps = {
  courtIndex: number;
  matchIndex: number;
  teamA: [TeamMember, TeamMember];
  teamB: [TeamMember, TeamMember];
  size?: "full" | "compact";
  className?: string;
};
