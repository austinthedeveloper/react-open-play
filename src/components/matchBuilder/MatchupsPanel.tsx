import { useEffect, useMemo, useState } from "react";
import MatchCard from "../MatchCard";
import type {
  MatchCard as MatchCardType,
  MatchTeam,
  MatchWinner,
  TeamMember,
} from "../../interfaces";
import "./MatchupsPanel.css";

export type MatchupsPanelProps = {
  matchRounds: MatchCardType[][];
  matchResults: Record<string, MatchWinner>;
  onSelectWinner: (matchId: string, winner: MatchWinner | null) => void;
  onOpenFullscreen: () => void;
  activeRound: number;
  onPreviousRound: () => void;
  onNextRound: () => void;
  resolveTeam: (team: MatchTeam) => [TeamMember, TeamMember];
  matchesCount: number;
  courtNumbers: number[];
};

export default function MatchupsPanel({
  matchRounds,
  matchResults,
  onSelectWinner,
  onOpenFullscreen,
  activeRound,
  onPreviousRound,
  onNextRound,
  resolveTeam,
  matchesCount,
  courtNumbers,
}: MatchupsPanelProps) {
  const [isCompactView, setIsCompactView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateVisibility = () => {
      setIsCompactView(window.innerHeight < 900 || window.innerWidth < 1650);
    };

    updateVisibility();
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  const roundsToRender = useMemo(() => {
    if (!isCompactView) {
      return matchRounds.map((roundMatches, roundIndex) => ({
        roundMatches,
        roundIndex,
      }));
    }
    return [
      {
        roundMatches: matchRounds[activeRound] ?? [],
        roundIndex: activeRound,
      },
    ];
  }, [activeRound, isCompactView, matchRounds]);

  return (
    <section className="table-panel">
      <div className="panel-header">
        <h2 className="panel-title">Matchups</h2>
        {!isCompactView ? (
          <button
            type="button"
            className="ghost-button"
            onClick={onOpenFullscreen}
            disabled={matchesCount === 0}
          >
            Fullscreen view
          </button>
        ) : null}
      </div>
      {isCompactView && matchesCount > 0 ? (
        <div className="round-nav">
          <div className="round-nav-label">
            Round {matchRounds.length === 0 ? 0 : activeRound + 1}
          </div>
          <div className="round-nav-actions">
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
          </div>
        </div>
      ) : null}
      {matchesCount === 0 ? (
        <p className="empty-state">No matchups yet.</p>
      ) : (
        <div className="matches-list">
          {roundsToRender.map(({ roundMatches, roundIndex }) => (
            <div
              key={`round-${roundIndex}`}
              className={!isCompactView ? "round-block" : undefined}
            >
              {!isCompactView ? (
                <div className="round-header">Round {roundIndex + 1}</div>
              ) : null}
              <div className="round-courts">
                {roundMatches.map((match, matchIndex) => (
                  <MatchCard
                    key={match.id}
                    courtIndex={courtNumbers[matchIndex] ?? matchIndex + 1}
                    matchIndex={match.index}
                    size="compact"
                    winner={matchResults[match.id] ?? null}
                    onSelectWinner={(winner) =>
                      onSelectWinner(match.id, winner)
                    }
                    teamA={resolveTeam(match.teams[0])}
                    teamB={resolveTeam(match.teams[1])}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
