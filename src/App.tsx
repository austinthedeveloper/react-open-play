import { useState } from "react";

type OpponentLevel = "lower" | "same" | "higher";
type GoalResult = "pending" | "yes" | "partial" | "no";

interface MatchGoal {
  id: string;
  index: number; // 1..N
  opponentLevel: OpponentLevel;
  goalText: string;
  played: boolean;
  result: GoalResult;
}

interface Profile {
  ratingRange: string; // e.g. "3.0 – 3.5"
  defaultOpponentLevel: OpponentLevel;
}

const GOAL_TEMPLATES: Record<OpponentLevel, string[]> = {
  same: [
    "No backspin allowed this match.",
    "Every 3rd shot should be topspin.",
    "Serve only to backhands.",
    "Hit at least 3 dinks per rally before attacking.",
    "No lobs this match.",
    "Every return must land deep (past midcourt).",
    "Target big cross-court angles, avoid line shots.",
    "No backhand drives—only blocks or resets.",
    "Always recover to center after every wide ball.",
    "Call the target (middle, backhand, forehand) in your head before you hit.",
  ],
  lower: [
    "Focus on high topspin drives, avoid lazy floaters.",
    "Turn easy put-aways into controlled drops.",
    "Serve wide, then attack the middle on the next ball.",
    "Aim most balls to their backhand.",
    "Hit at least one topspin roll at the kitchen line per rally opportunity.",
    "Play longer rallies; avoid “crushing” winners on first chance.",
    "Work on deep, heavy third-shot drops.",
    "Mix in one lob per game in a smart situation.",
    "No body slams—place to open court instead.",
    "Practice soft hands: reset hard balls back to the kitchen.",
  ],
  higher: [
    "Play 90% of balls safely down the middle.",
    "No hero shots down the line.",
    "Return every serve deep, even if it means slower.",
    "If pulled wide, play a safe reset instead of a sharp angle.",
    "No low-percentage backhand rips—block or dink instead.",
    "Hit at least 3 dinks before attacking.",
    "If you’re off balance, never attack—reset only.",
    "Aim third shots to the middle player’s backhand.",
    "Take 20% power off every swing—prioritize consistency.",
    "Between every point, take one deep breath before serving/returning.",
  ],
};

const DEFAULT_PROFILE: Profile = {
  ratingRange: "3.0 – 3.5",
  defaultOpponentLevel: "same",
};

const NUM_MATCHES_DEFAULT = 10;

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
