import { useEffect, useState } from "react";
import { goalsCatalogActions } from "../store/goalsCatalogSlice";
import { goalsActions } from "../store/goalsSlice";
import { authService } from "../services/authService";
import { goalsService } from "../services/goalsService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import GoalsControls from "../components/goals/GoalsControls";
import GoalsHero from "../components/goals/GoalsHero";
import GoalsList from "../components/goals/GoalsList";

export default function GoalsPage() {
  const dispatch = useAppDispatch();
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [token, setToken] = useState(() => authService.getToken());
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const profile = useAppSelector((state) => state.goals.profile);
  const numMatches = useAppSelector((state) => state.goals.numMatches);
  const matches = useAppSelector((state) => state.goals.matches);

  const completedCount = matches.filter((m) => m.result === "yes").length;
  const playedCount = matches.filter((m) => m.played).length;

  const regenerate = () => {
    dispatch(goalsActions.regenerateMatches());
  };

  useEffect(() => {
    return authService.onTokenChange(setToken);
  }, []);

  useEffect(() => {
    if (!apiBaseUrl) {
      console.warn("Missing VITE_API_BASE_URL");
      return;
    }

    let isActive = true;
    const controller = new AbortController();

    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const body = await response.text();

        if (!response.ok) {
          throw new Error(body || response.statusText);
        }

        if (isActive) {
          console.log("Health check OK:", body || "Healthy");
        }
      } catch (error) {
        if (!isActive) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Health check failed";
        console.error("Health check failed:", message);
      }
    };

    checkHealth();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [apiBaseUrl]);

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
      });

    return () => {
      isActive = false;
    };
  }, [dispatch, token]);

  return (
    <div className="app-shell text-left">
      <GoalsHero
        profile={profile}
        playedCount={playedCount}
        completedCount={completedCount}
        totalMatches={matches.length}
      />

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
        onGenerate={regenerate}
      />

      <GoalsList />
    </div>
  );
}
