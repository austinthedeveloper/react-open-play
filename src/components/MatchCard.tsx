type TeamMember = {
  name: string;
  color: string;
};

type MatchCardProps = {
  courtIndex: number;
  matchIndex: number;
  teamA: [TeamMember, TeamMember];
  teamB: [TeamMember, TeamMember];
  size?: "full" | "compact";
  className?: string;
};

export default function MatchCard({
  courtIndex,
  matchIndex,
  teamA,
  teamB,
  size = "full",
  className = "",
}: MatchCardProps) {
  return (
    <article
      className={`match-card match-card--${size} ${className}`.trim()}
    >
      <div className="match-index">
        Court {courtIndex} • Match {matchIndex}
      </div>
      <div className="match-teams">
        <div>
          <span className="team-label">Team A</span>
          <div className="team-names">
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamA[0].color }}
              />
              <span className="player-name">{teamA[0].name}</span>
            </span>
            <span className="team-separator">|</span>
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamA[1].color }}
              />
              <span className="player-name">{teamA[1].name}</span>
            </span>
          </div>
        </div>
        <div className="versus">vs</div>
        <div>
          <span className="team-label">Team B</span>
          <div className="team-names">
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamB[0].color }}
              />
              <span className="player-name">{teamB[0].name}</span>
            </span>
            <span className="team-separator">|</span>
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamB[1].color }}
              />
              <span className="player-name">{teamB[1].name}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
