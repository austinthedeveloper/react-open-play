import type { MatchCardProps } from "../interfaces";
import { shortenName } from "../utilities";

export default function MatchCard({
  courtIndex,
  matchIndex,
  teamA,
  teamB,
  winner = null,
  onSelectWinner,
  size = "full",
  className = "",
}: MatchCardProps) {
  const handleSelect = (team: "A" | "B") => {
    if (!onSelectWinner) {
      return;
    }
    onSelectWinner(winner === team ? null : team);
  };

  const maxNameLength = size === "compact" ? 10 : 12;

  return (
    <article
      className={`match-card match-card--${size} ${className}`.trim()}
    >
      <div className="match-index">
        Court {courtIndex} • Match {matchIndex}
      </div>
      <div className="match-teams">
        <button
          type="button"
          className={`team-block ${
            winner === "A"
              ? "team-block--winner"
              : winner
                ? "team-block--loser"
                : ""
          }`.trim()}
          onClick={() => handleSelect("A")}
          aria-pressed={winner === "A"}
          aria-label="Team A wins"
        >
          <span className="team-label">Team A</span>
          <span className="team-names">
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamA[0].color }}
              />
              <span className="player-name">
                {shortenName(teamA[0].name, maxNameLength)}
              </span>
            </span>
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamA[1].color }}
              />
              <span className="player-name">
                {shortenName(teamA[1].name, maxNameLength)}
              </span>
            </span>
          </span>
        </button>
        <div className="versus">vs</div>
        <button
          type="button"
          className={`team-block ${
            winner === "B"
              ? "team-block--winner"
              : winner
                ? "team-block--loser"
                : ""
          }`.trim()}
          onClick={() => handleSelect("B")}
          aria-pressed={winner === "B"}
          aria-label="Team B wins"
        >
          <span className="team-label">Team B</span>
          <span className="team-names">
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamB[0].color }}
              />
              <span className="player-name">
                {shortenName(teamB[0].name, maxNameLength)}
              </span>
            </span>
            <span className="player-chip">
              <span
                className="player-dot"
                style={{ backgroundColor: teamB[1].color }}
              />
              <span className="player-name">
                {shortenName(teamB[1].name, maxNameLength)}
              </span>
            </span>
          </span>
        </button>
      </div>
    </article>
  );
}
