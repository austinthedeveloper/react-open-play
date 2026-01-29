import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GoalsHero from "../components/goals/GoalsHero";
import GoalsList from "../components/goals/GoalsList";
import { goalsActions } from "../store/goalsSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { goalSessionsService } from "../services/goalSessionsService";
import type { GoalSession, MatchGoal } from "../interfaces";

export default function GoalsSessionPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const profile = useAppSelector((state) => state.goals.profile);
  const numMatches = useAppSelector((state) => state.goals.numMatches);
  const matches = useAppSelector((state) => state.goals.matches);
  const goalSessions = useAppSelector((state) => state.goals.goalSessions);
  const activeSessionId = useAppSelector(
    (state) => state.goals.activeSessionId
  );

  const completedCount = matches.filter((m) => m.result === "yes").length;
  const playedCount = matches.filter((m) => m.played).length;

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    if (activeSessionId === id) {
      return;
    }
    const existing = goalSessions.find((session) => session.id === id);
    if (existing) {
      dispatch(goalsActions.setActiveGoalSession(existing));
      return;
    }
    let isActive = true;
    goalSessionsService
      .get(id)
      .then((session) => {
        if (!isActive) {
          return;
        }
        dispatch(goalsActions.setActiveGoalSession(session));
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load goal session";
        console.warn(message);
      });
    return () => {
      isActive = false;
    };
  }, [activeSessionId, dispatch, goalSessions, id, navigate]);

  useEffect(() => {
    if (!activeSessionId) {
      return;
    }
    const patch: Partial<GoalSession> = {
      matches,
      numMatches,
      ratingRange: profile.ratingRange,
      defaultOpponentLevel: profile.defaultOpponentLevel,
    };
    goalSessionsService.update(activeSessionId, patch).catch((error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save goal session updates";
      console.warn(message);
    });
  }, [
    activeSessionId,
    matches,
    numMatches,
    profile.defaultOpponentLevel,
    profile.ratingRange,
  ]);

  const handleUpdateMatch = (matchId: string, patch: Partial<MatchGoal>) => {
    dispatch(goalsActions.updateMatch({ id: matchId, patch }));
  };

  return (
    <div className="app-shell text-left">
      <button
        type="button"
        className="ghost-button"
        onClick={() => navigate("/")}
      >
        Back to sessions
      </button>

      <GoalsHero
        profile={profile}
        playedCount={playedCount}
        completedCount={completedCount}
        totalMatches={matches.length}
      />

      <GoalsList onUpdateMatch={handleUpdateMatch} />
    </div>
  );
}
