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
  resolveTeam: (team: MatchTeam) => [TeamMember, TeamMember];
  matchesCount: number;
  courtNumbers: number[];
};

export default function MatchupsPanel({
  matchRounds,
  matchResults,
  onSelectWinner,
  onOpenFullscreen,
  resolveTeam,
  matchesCount,
  courtNumbers,
}: MatchupsPanelProps) {
  return (
    <section className="table-panel">
      <div className="panel-header">
        <h2 className="panel-title">Matchups</h2>
        <button
          type="button"
          className="ghost-button"
          onClick={onOpenFullscreen}
          disabled={matchesCount === 0}
        >
          Fullscreen view
        </button>
      </div>
      {matchesCount === 0 ? (
        <p className="empty-state">No matchups yet.</p>
      ) : (
        <div className="matches-list">
          {matchRounds.map((roundMatches, roundIndex) => (
            <div key={`round-${roundIndex}`} className="round-block">
              <div className="round-header">Round {roundIndex + 1}</div>
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
