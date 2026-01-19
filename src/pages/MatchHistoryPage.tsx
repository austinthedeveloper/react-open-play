import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { matchBuilderActions } from "../store/matchBuilderSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import "./MatchHistoryPage.css";

const formatTimestamp = (value: number) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function MatchHistoryPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const matchHistory = useAppSelector(
    (state) => state.matchBuilder.matchHistory
  );
  const activeMatchId = useAppSelector(
    (state) => state.matchBuilder.activeMatchId
  );
  const orderedHistory = useMemo(() => {
    return [...matchHistory].sort((a, b) => b.createdAt - a.createdAt);
  }, [matchHistory]);

  return (
    <div className="app-shell text-left">
      <main className="table-panel">
        <h2 className="panel-title">Match History</h2>
        <p className="panel-subtitle">
          Load a previous generation and review its matchups.
        </p>
        {orderedHistory.length === 0 ? (
          <p className="empty-state">No matches yet. Generate a schedule.</p>
        ) : (
          <div className="history-list">
            {orderedHistory.map((session, index) => {
              const matchesCount = session.schedule?.matches.length ?? 0;
              const courtsCount = session.numCourts;

              const isActive = session.id === activeMatchId;
              return (
                <article
                  key={session.id}
                  className={`history-card${isActive ? " is-active" : ""}`}
                >
                  <div className="history-card__meta">
                    <div className="history-card__title">
                      Match Set {index + 1}
                    </div>
                    <div className="history-card__details">
                      {formatTimestamp(session.createdAt)} -{" "}
                      {session.players.length} players - {matchesCount} matches
                      - {courtsCount} courts
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      dispatch(
                        matchBuilderActions.loadMatchSession(session.id)
                      );
                      navigate("/match-builder");
                    }}
                  >
                    Load match
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
