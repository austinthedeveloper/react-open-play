import type { Dispatch, SetStateAction } from "react";
import type { GoalResult, MatchGoal } from "../../interfaces";
import "./GoalsList.css";

type GoalsListProps = {
  matches: MatchGoal[];
  setMatches: Dispatch<SetStateAction<MatchGoal[]>>;
};

export default function GoalsList({ matches, setMatches }: GoalsListProps) {
  const updateMatch = (id: string, patch: Partial<MatchGoal>) => {
    setMatches((prev) =>
      prev.map((match) => (match.id === id ? { ...match, ...patch } : match))
    );
  };

  const resultLabels: Record<GoalResult, string> = {
    pending: "Pending",
    yes: "Yes",
    partial: "Partially",
    no: "No",
  };

  return (
    <main className="table-panel">
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
                <label className="goals-card__toggle">
                  <input
                    type="checkbox"
                    checked={match.played}
                    onChange={(e) =>
                      updateMatch(match.id, {
                        played: e.target.checked,
                      })
                    }
                  />
                  Played
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
