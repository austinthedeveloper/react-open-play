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

  return (
    <main className="table-panel">
      {matches.length === 0 ? (
        <p className="empty-state">
          No matches yet. Click &quot;Generate goals&quot;.
        </p>
      ) : (
        <table className="goals-list">
          <thead>
            <tr>
              <th>#</th>
              <th>Goal</th>
              <th>Played?</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr
                key={match.id}
                className={match.played ? "row-played" : "row-default"}
              >
                <td className="index-cell">{match.index}</td>
                <td>{match.goalText}</td>
                <td>
                  <label className="inline-flex items-center gap-2">
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
                </td>
                <td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
