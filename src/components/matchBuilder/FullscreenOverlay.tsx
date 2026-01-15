import type { RefObject } from "react";
import type {
  MatchCard as MatchCardType,
  MatchTeam,
  MatchWinner,
  PlayerStat,
  TeamMember,
} from "../../interfaces";
import { shortenName } from "../../utilities";
import MatchCard from "../MatchCard";
import "./FullscreenOverlay.css";

export type FullscreenOverlayProps = {
  isOpen: boolean;
  fullscreenRef: RefObject<HTMLDivElement | null>;
  activeRound: number;
  matchRounds: MatchCardType[][];
  matchResults: Record<string, MatchWinner>;
  statsByWins: PlayerStat[];
  onSelectWinner: (matchId: string, winner: MatchWinner | null) => void;
  onPreviousRound: () => void;
  onNextRound: () => void;
  onClose: () => void;
  resolveTeam: (team: MatchTeam) => [TeamMember, TeamMember];
};

export default function FullscreenOverlay({
  isOpen,
  fullscreenRef,
  activeRound,
  matchRounds,
  matchResults,
  statsByWins,
  onSelectWinner,
  onPreviousRound,
  onNextRound,
  onClose,
  resolveTeam,
}: FullscreenOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="match-fullscreen" ref={fullscreenRef}>
      <div className="match-fullscreen-backdrop" />
      <div className="match-fullscreen-frame">
        <header className="match-fullscreen-header">
          <div>
            <div className="fullscreen-eyebrow">Round</div>
            <h2 className="fullscreen-title">
              {matchRounds.length === 0 ? 0 : activeRound + 1}
            </h2>
          </div>
          <div className="fullscreen-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={onPreviousRound}
              disabled={activeRound <= 0}
            >
              Previous round
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={onNextRound}
              disabled={activeRound >= matchRounds.length - 1}
            >
              Next round
            </button>
            <button type="button" className="glow-button" onClick={onClose}>
              Exit fullscreen
            </button>
          </div>
        </header>
        <div className="fullscreen-body">
          <section className="fullscreen-round">
            {matchRounds[activeRound]?.map((match, matchIndex) => (
              <MatchCard
                key={match.id}
                courtIndex={matchIndex + 1}
                matchIndex={match.index}
                size="full"
                winner={matchResults[match.id] ?? null}
                onSelectWinner={(winner) => onSelectWinner(match.id, winner)}
                teamA={resolveTeam(match.teams[0])}
                teamB={resolveTeam(match.teams[1])}
              />
            ))}
          </section>
          <aside className="fullscreen-sidebar">
            <h3 className="fullscreen-sidebar-title">Wins</h3>
            <div className="fullscreen-player-list">
              {statsByWins.map((player) => (
                <div key={player.id} className="fullscreen-player-row">
                  <span
                    className="stat-dot"
                    style={{ backgroundColor: player.color || "transparent" }}
                  />
                  <span className="fullscreen-player-name">
                    {shortenName(player.name)}
                  </span>
                  <span className="fullscreen-player-wins">{player.wins}W</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
