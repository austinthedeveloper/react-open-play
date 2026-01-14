export type TeamMember = {
  name: string;
  color: string;
};

export type MatchCardProps = {
  courtIndex: number;
  matchIndex: number;
  teamA: [TeamMember, TeamMember];
  teamB: [TeamMember, TeamMember];
  winner?: "A" | "B" | null;
  onSelectWinner?: (winner: "A" | "B" | null) => void;
  size?: "full" | "compact";
  className?: string;
};
