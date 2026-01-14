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

// test
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
    <div className="text-left">
      <header className="mb-6">
        <h1 className="text-[3.2em] leading-[1.1]">Open Play Goals</h1>
        <p className="m-0 text-[#555]">
          Profile: <strong>{profile.ratingRange}</strong> &middot; Default
          opponent level:{" "}
          <strong className="capitalize">
            {profile.defaultOpponentLevel}
          </strong>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
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
              className="w-[60px]"
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

          <button
            type="button"
            onClick={regenerate}
            className="cursor-pointer rounded-lg border border-transparent bg-[#1a1a1a] px-5 py-2 text-base font-medium text-white transition-colors hover:border-[#646cff] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#646cff]"
          >
            Generate goals
          </button>
        </div>

        <div className="mt-3 text-[0.9rem] text-[#444]">
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
          <table className="w-full border-collapse text-[0.95rem]">
            <thead>
              <tr>
                <th className="border-b border-[#ccc] p-2 text-left">
                  #
                </th>
                <th className="border-b border-[#ccc] p-2 text-left">
                  Goal
                </th>
                <th className="border-b border-[#ccc] p-2 text-left">
                  Played?
                </th>
                <th className="border-b border-[#ccc] p-2 text-left">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr
                  key={match.id}
                  className={
                    match.played ? "bg-[#f8fff8] text-[#1b2a16]" : ""
                  }
                >
                  <td className="w-8 p-2 align-top">
                    {match.index}
                  </td>
                  <td className="p-2 align-top">
                    {match.goalText}
                  </td>
                  <td className="p-2 align-top">
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
                  <td className="p-2 align-top">
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
