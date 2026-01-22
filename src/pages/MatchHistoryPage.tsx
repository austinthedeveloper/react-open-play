import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { matchBuilderActions } from "../store/matchBuilderSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import "./MatchHistoryPage.css";
import { getMatchType } from "../utilities";
import { matchesService } from "../services/matchesService";

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

  useEffect(() => {
    let isActive = true;
    matchesService
      .list()
      .then((sessions) => {
        if (isActive) {
          dispatch(matchBuilderActions.setMatchHistory(sessions));
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load match history";
        console.warn(message);
      });
    return () => {
      isActive = false;
    };
  }, [dispatch]);

  return (
    <div className="app-shell text-left">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Match Builder Lab</p>
          <h1 className="hero-title">Match History</h1>
          <p className="hero-subtitle">
            Review previous generations and reopen any saved schedule.
          </p>
        </div>
      </header>

      <main className="table-panel">
        {orderedHistory.length === 0 ? (
          <div className="empty-state history-empty">
            <p>No matches yet. Generate a schedule.</p>
            <button
              type="button"
              className="glow-button"
              onClick={() => navigate("/match-builder")}
            >
              Build a match
            </button>
          </div>
        ) : (
          <div className="history-list">
            {orderedHistory.map((session, index) => {
              const matchesCount = session.schedule?.matches.length ?? 0;
              const courtsCount = session.numCourts;
              const matchType = getMatchType(session.matchType);

              const isActive = session.id === activeMatchId;
              return (
                <article
                  key={session.id}
                  className={`history-card${isActive ? " is-active" : ""}`}
                >
                  <div className="history-card__meta">
                    <div className="history-card__title">
                      Match Set {index + 1}: {matchType}
                    </div>
                    <div className="history-card__details">
                      {formatTimestamp(session.createdAt)} -{" "}
                      {session.players.length} players - {matchesCount} matches
                      - {courtsCount} courts
                    </div>
                  </div>
                  <div className="history-card__actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => navigate(`/match-builder/${session.id}`)}
                    >
                      Load match
                    </button>
                    <button
                      type="button"
                      className="ghost-button history-card__remove"
                      onClick={async () => {
                        try {
                          await matchesService.remove(session.id);
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : "Unable to remove match";
                          console.warn(message);
                        } finally {
                          dispatch(
                            matchBuilderActions.removeMatchSession(session.id)
                          );
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
