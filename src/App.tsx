import { useState } from "react";
import { DEFAULT_PROFILE, GOAL_TEMPLATES, NUM_MATCHES_DEFAULT } from "./data";
import type {
  GoalResult,
  MatchGoal,
  OpponentLevel,
  Profile,
} from "./interfaces";

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

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

export function App() {
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
    <div
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "1rem",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1>Open Play Goals</h1>
        <p style={{ margin: 0, color: "#555" }}>
          Profile: <strong>{profile.ratingRange}</strong> &middot; Default
          opponent level:{" "}
          <strong style={{ textTransform: "capitalize" }}>
            {profile.defaultOpponentLevel}
          </strong>
        </p>

        <div
          style={{
            marginTop: "0.75rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <label>
            Matches this session:{" "}
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
              style={{ width: 60 }}
            />
          </label>

          <label>
            Opponent level:{" "}
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

          <button type="button" onClick={regenerate}>
            Generate goals
          </button>
        </div>

        <div
          style={{
            marginTop: "0.75rem",
            fontSize: "0.9rem",
            color: "#444",
          }}
        >
          <span>
            Played: <strong>{playedCount}</strong> / {matches.length}
          </span>
          {" · "}
          <span>
            Goals completed: <strong>{completedCount}</strong>
          </span>
        </div>
      </header>

      <main>
        {matches.length === 0 ? (
          <p>No matches yet. Click &quot;Generate goals&quot;.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.95rem",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.5rem",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.5rem",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  Goal
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.5rem",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  Played?
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0.5rem",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr
                  key={match.id}
                  style={{
                    backgroundColor: match.played ? "#f8fff8" : "transparent",
                  }}
                >
                  <td
                    style={{
                      padding: "0.5rem",
                      verticalAlign: "top",
                      width: "2rem",
                    }}
                  >
                    {match.index}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem",
                      verticalAlign: "top",
                    }}
                  >
                    {match.goalText}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem",
                      verticalAlign: "top",
                    }}
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={match.played}
                        onChange={(e) =>
                          updateMatch(match.id, {
                            played: e.target.checked,
                          })
                        }
                      />{" "}
                      Played
                    </label>
                  </td>
                  <td
                    style={{
                      padding: "0.5rem",
                      verticalAlign: "top",
                    }}
                  >
                    <select
                      value={match.result}
                      onChange={(e) =>
                        updateMatch(match.id, {
                          result: e.target.value as GoalResult,
                          played: true, // auto-mark as played if they set a result
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

export default App;
