import { useEffect, useState } from "react";
import GoalsCatalog from "../components/goals/GoalsCatalog";
import { goalsCatalogActions } from "../store/goalsCatalogSlice";
import { goalsActions } from "../store/goalsSlice";
import { authService, type AuthUser } from "../services/authService";
import { goalsService } from "../services/goalsService";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import GoalsControls from "../components/goals/GoalsControls";
import GoalsHero from "../components/goals/GoalsHero";
import GoalsList from "../components/goals/GoalsList";

export default function GoalsPage() {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<"generate" | "manage">("generate");
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [token, setToken] = useState(() => authService.getToken());
  const [user, setUser] = useState<AuthUser | null>(null);
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

  return (
    <div className="app-shell text-left">
      <GoalsHero
        profile={profile}
        playedCount={playedCount}
        completedCount={completedCount}
        totalMatches={matches.length}
      />

      <div className="goals-tabs" role="tablist" aria-label="Goals sections">
        <button
          type="button"
          role="tab"
          id="goals-tab-generate"
          aria-controls="goals-tabpanel-generate"
          aria-selected={activeTab === "generate"}
          className={`goals-tab${activeTab === "generate" ? " is-active" : ""}`}
          onClick={() => setActiveTab("generate")}
        >
          Generating goals
        </button>
        <button
          type="button"
          role="tab"
          id="goals-tab-manage"
          aria-controls="goals-tabpanel-manage"
          aria-selected={activeTab === "manage"}
          className={`goals-tab${activeTab === "manage" ? " is-active" : ""}`}
          onClick={() => setActiveTab("manage")}
        >
          Management
        </button>
      </div>

      {activeTab === "generate" ? (
        <section
          role="tabpanel"
          id="goals-tabpanel-generate"
          aria-labelledby="goals-tab-generate"
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
            onGenerate={regenerate}
          />
          <GoalsList />
        </section>
      ) : (
        <section
          role="tabpanel"
          id="goals-tabpanel-manage"
          aria-labelledby="goals-tab-manage"
        >
          <GoalsCatalog user={user} />
        </section>
      )}
    </div>
  );
}
