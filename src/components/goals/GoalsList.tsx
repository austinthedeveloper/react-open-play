import type { GoalResult, MatchGoal } from "../../interfaces";
import { goalsActions } from "../../store/goalsSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import "./GoalsList.css";

type GoalsListProps = {
  onUpdateMatch?: (id: string, patch: Partial<MatchGoal>) => void;
};

export default function GoalsList({ onUpdateMatch }: GoalsListProps) {
  const dispatch = useAppDispatch();
  const matches = useAppSelector((state) => state.goals.matches);

  const updateMatch =
    onUpdateMatch ??
    ((id: string, patch: Partial<MatchGoal>) => {
      dispatch(goalsActions.updateMatch({ id, patch }));
    });

  const resultLabels: Record<GoalResult, string> = {
    pending: "Pending",
    yes: "Yes",
    partial: "Partially",
    no: "No",
  };

  return (
    <main className="panel">
      <header className="goals-list__header">
        <h2 className="panel-title">Match Goals</h2>
        <p className="panel-subtitle">
          Generated goals tied to your current match session.
        </p>
      </header>
      {matches.length === 0 ? (
        <p className="empty-state">
          No matches yet. Click &quot;Generate goals&quot;.
        </p>
      ) : (
        <div className="goals-list">
          {matches.map((match) => (
            <article
              key={match.id}
              className={`goals-card ${match.played ? "is-played" : ""}`.trim()}
            >
              <header className="goals-card__header">
                <span className="goals-card__index">
                  Match {match.index}
                </span>
                <span
                  className={`goals-card__status ${
                    match.result !== "pending" ? "is-set" : ""
                  }`.trim()}
                >
                  {resultLabels[match.result]}
                </span>
              </header>
              <p className="goals-card__goal">{match.goalText}</p>
              <div className="goals-card__controls">
                <label className="goals-card__switch">
                  <input
                    type="checkbox"
                    checked={match.played}
                    onChange={(e) =>
                      updateMatch(match.id, {
                        played: e.target.checked,
                      })
                    }
                  />
                  <span className="goals-card__switch-track">
                    <span className="goals-card__switch-thumb" />
                  </span>
                  <span className="goals-card__switch-label">Played</span>
                </label>
                <select
                  value={match.result}
                  onChange={(e) =>
                    updateMatch(match.id, {
                      result: e.target.value as GoalResult,
                      played: true,
                    })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="yes">Yes</option>
                  <option value="partial">Partially</option>
                  <option value="no">No</option>
                </select>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
