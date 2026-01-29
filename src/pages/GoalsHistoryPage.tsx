import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GoalsCatalog from "../components/goals/GoalsCatalog";
import GoalsControls from "../components/goals/GoalsControls";
import { goalsCatalogActions } from "../store/goalsCatalogSlice";
import { goalsActions } from "../store/goalsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { authService, type AuthUser } from "../services/authService";
import { goalsService } from "../services/goalsService";
import { goalSessionsService } from "../services/goalSessionsService";
import { generateGoalMatches, randomId } from "../utilities";
import type { GoalSession } from "../interfaces";
import "./MatchHistoryPage.css";

const formatTimestamp = (value: number) =>
  new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function GoalsHistoryPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"generate" | "manage">("generate");
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [token, setToken] = useState(() => authService.getToken());
  const [user, setUser] = useState<AuthUser | null>(null);

  const profile = useAppSelector((state) => state.goals.profile);
  const numMatches = useAppSelector((state) => state.goals.numMatches);
  const goalSessions = useAppSelector((state) => state.goals.goalSessions);
  const activeSessionId = useAppSelector(
    (state) => state.goals.activeSessionId
  );

  const orderedSessions = useMemo(() => {
    return [...goalSessions].sort((a, b) => b.createdAt - a.createdAt);
  }, [goalSessions]);

  const visibleSessions = useMemo(() => {
    if (!user) {
      return [];
    }
    return orderedSessions.filter(
      (session) => !session.ownerId || session.ownerId === user._id
    );
  }, [orderedSessions, user]);

  useEffect(() => {
    return authService.onTokenChange(setToken);
  }, []);

  useEffect(() => {
    let isActive = true;
    dispatch(goalsCatalogActions.setGoalsLoading(true));
    dispatch(goalsCatalogActions.setGoalsError(null));

    goalsService
      .listGlobal()
      .then((goals) => {
        if (!isActive) {
          return;
        }
        dispatch(goalsCatalogActions.setGlobalGoals(goals));
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Unable to load goals";
        dispatch(goalsCatalogActions.setGoalsError(message));
      })
      .finally(() => {
        if (isActive) {
          dispatch(goalsCatalogActions.setGoalsLoading(false));
        }
      });

    return () => {
      isActive = false;
    };
  }, [dispatch]);

  useEffect(() => {
    let isActive = true;

    if (!token) {
      dispatch(goalsCatalogActions.setUserGoals([]));
      setUser(null);
      return () => {
        isActive = false;
      };
    }

    authService
      .getProfile()
      .then((user) => {
        if (!isActive) {
          return;
        }
        setUser(user);
        return goalsService.listUser(user._id);
      })
      .then((goals) => {
        if (!isActive || !goals) {
          return;
        }
        dispatch(goalsCatalogActions.setUserGoals(goals));
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Unable to load goals";
        dispatch(goalsCatalogActions.setGoalsError(message));
        setUser(null);
      });

    return () => {
      isActive = false;
    };
  }, [dispatch, token]);

  useEffect(() => {
    let isActive = true;
    goalSessionsService
      .list()
      .then((sessions) => {
        if (isActive) {
          dispatch(goalsActions.setGoalSessions(sessions));
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load goal sessions";
        console.warn(message);
      });
    return () => {
      isActive = false;
    };
  }, [dispatch]);

  const handleLogin = () => {
    try {
      window.location.assign(authService.getGoogleLoginUrl());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start login";
      console.warn(message);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    const nextId = randomId();
    const nextMatches = generateGoalMatches(
      profile.defaultOpponentLevel,
      numMatches
    );
    const session: GoalSession = {
      id: nextId,
      createdAt: Date.now(),
      numMatches,
      ratingRange: profile.ratingRange,
      defaultOpponentLevel: profile.defaultOpponentLevel,
      matches: nextMatches,
    };
    try {
      const savedSession = await goalSessionsService.create(session);
      dispatch(goalsActions.setActiveGoalSession(savedSession));
      navigate(`/goals/${savedSession.id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save goal session";
      console.warn(message);
      dispatch(goalsActions.setActiveGoalSession(session));
      navigate(`/goals/${nextId}`);
    }
  };

  return (
    <div className="app-shell text-left">
      <header className="panel-hero">
        <div>
          <p className="eyebrow">Open Play Lab</p>
          <h1 className="hero-title">Goal Sessions</h1>
          <p className="hero-subtitle">
            Generate, manage, and revisit your saved goal sets.
          </p>
        </div>
      </header>

      <div className="tabs-pill" role="tablist" aria-label="Goals sections">
        <button
          type="button"
          role="tab"
          id="tab-pill-generate"
          aria-controls="tab-panel-generate"
          aria-selected={activeTab === "generate"}
          className={`tab-pill${activeTab === "generate" ? " is-active" : ""}`}
          onClick={() => setActiveTab("generate")}
        >
          Generating goals
        </button>
        <button
          type="button"
          role="tab"
          id="tab-pill-manage"
          aria-controls="tab-panel-manage"
          aria-selected={activeTab === "manage"}
          className={`tab-pill${activeTab === "manage" ? " is-active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          Management
        </button>
      </div>

      {activeTab === "generate" ? (
        <section
          role="tabpanel"
          id="tab-panel-generate"
          aria-labelledby="tab-pill-generate"
        >
          <GoalsControls
            numMatches={numMatches}
            ratingRange={profile.ratingRange}
            defaultOpponentLevel={profile.defaultOpponentLevel}
            isOpen={isControlsOpen}
            onToggleOpen={() => setIsControlsOpen((prev) => !prev)}
            onChangeNumMatches={(value) =>
              dispatch(goalsActions.setNumMatches(value))
            }
            onChangeRatingRange={(value) =>
              dispatch(goalsActions.setRatingRange(value))
            }
            onChangeOpponentLevel={(level) =>
              dispatch(goalsActions.setDefaultOpponentLevel(level))
            }
            onGenerate={handleGenerate}
          />
        </section>
      ) : (
        <section
          role="tabpanel"
          id="tab-panel-manage"
          aria-labelledby="tab-pill-manage"
        >
          <GoalsCatalog user={user} />
        </section>
      )}

      <main className="panel">
        {!user ? (
          <div className="empty-state history-empty">
            <p>Sign in to view and save goal sessions.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleLogin}
            >
              Sign in
            </button>
          </div>
        ) : visibleSessions.length === 0 ? (
          <div className="empty-state history-empty">
            <p>No goal sessions yet. Generate a set.</p>
            <button type="button" className="btn-primary" onClick={handleGenerate}>
              Generate goals
            </button>
          </div>
        ) : (
          <div className="history-list">
            {visibleSessions.map((session, index) => {
              const playedCount = session.matches.filter(
                (match) => match.played
              ).length;
              const completedCount = session.matches.filter(
                (match) => match.result === "yes"
              ).length;
              const isActive = session.id === activeSessionId;
              return (
                <article
                  key={session.id}
                  className={`history-card${isActive ? " is-active" : ""}`}
                >
                  <div className="history-card__meta">
                    <div className="history-card__title">
                      Goal Set {index + 1} • {session.ratingRange} •{" "}
                      {session.defaultOpponentLevel}
                    </div>
                    <div className="history-card__details">
                      {formatTimestamp(session.createdAt)} - {session.numMatches}{" "}
                      goals - {playedCount} played - {completedCount} completed
                    </div>
                  </div>
                  <div className="history-card__actions">
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => navigate(`/goals/${session.id}`)}
                    >
                      Open session
                    </button>
                    <button
                      type="button"
                      className="btn-ghost history-card__remove"
                      onClick={async () => {
                        try {
                          await goalSessionsService.remove(session.id);
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : "Unable to remove goal session";
                          console.warn(message);
                        } finally {
                          dispatch(goalsActions.removeGoalSession(session.id));
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
