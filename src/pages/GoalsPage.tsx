import { useState } from "react";
import { DEFAULT_PROFILE, GOAL_TEMPLATES, NUM_MATCHES_DEFAULT } from "../data";
import type {
  GoalResult,
  MatchGoal,
  OpponentLevel,
  Profile,
} from "../interfaces";
import { randomId } from "../utilities";

function generateMatches(level: OpponentLevel, count: number): MatchGoal[] {
  const templates = GOAL_TEMPLATES[level];
  return Array.from({ length: count }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      id: randomId(),
      index: i + 1,
      opponentLevel: level,
      goalText: template,
      played: false,
      result: "pending" as GoalResult,
    };
  });
}

export default function GoalsPage() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [numMatches, setNumMatches] = useState(NUM_MATCHES_DEFAULT);
  const [matches, setMatches] = useState<MatchGoal[]>(
    generateMatches(profile.defaultOpponentLevel, NUM_MATCHES_DEFAULT)
  );

  const completedCount = matches.filter((m) => m.result === "yes").length;
  const playedCount = matches.filter((m) => m.played).length;

  const regenerate = () => {
    setMatches(generateMatches(profile.defaultOpponentLevel, numMatches));
  };

  const updateMatch = (id: string, patch: Partial<MatchGoal>) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  };

  return (
    <div className="app-shell text-left">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Open Play Lab</p>
          <h1 className="hero-title">Open Play Goals</h1>
          <p className="hero-subtitle">
            Profile: <strong>{profile.ratingRange}</strong> &middot; Default
            opponent level:{" "}
            <strong className="capitalize">{profile.defaultOpponentLevel}</strong>
          </p>
        </div>

        <div className="hero-stats">
          <div>
            <span className="stat-label">Played</span>
            <span className="stat-value">
              {playedCount} / {matches.length}
            </span>
          </div>
          <div>
            <span className="stat-label">Goals completed</span>
            <span className="stat-value">{completedCount}</span>
          </div>
        </div>
      </header>

      <section className="controls-panel">
        <label className="control">
          <span>Matches this session</span>
          <input
            type="number"
            min={1}
            max={20}
            value={numMatches}
            onChange={(e) =>
              setNumMatches(
                Math.min(20, Math.max(1, Number(e.target.value) || 1))
              )
            }
          />
        </label>

        <label className="control">
          <span>Opponent level</span>
          <select
            value={profile.defaultOpponentLevel}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                defaultOpponentLevel: e.target.value as OpponentLevel,
              }))
            }
          >
            <option value="lower">Lower</option>
            <option value="same">Same</option>
            <option value="higher">Higher</option>
          </select>
        </label>

        <button type="button" onClick={regenerate} className="glow-button">
          Generate goals
        </button>
      </section>

      <main className="table-panel">
        {matches.length === 0 ? (
          <p className="empty-state">
            No matches yet. Click &quot;Generate goals&quot;.
          </p>
        ) : (
          <table className="goals-table">
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
    </div>
  );
}
