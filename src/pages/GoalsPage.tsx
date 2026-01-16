import { useState } from "react";
import { DEFAULT_PROFILE, GOAL_TEMPLATES, NUM_MATCHES_DEFAULT } from "../data";
import type { GoalResult, MatchGoal, OpponentLevel, Profile } from "../interfaces";
import { randomId } from "../utilities";
import GoalsControls from "../components/goals/GoalsControls";
import GoalsHero from "../components/goals/GoalsHero";
import GoalsList from "../components/goals/GoalsList";

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
        defaultOpponentLevel={profile.defaultOpponentLevel}
        onChangeNumMatches={setNumMatches}
        onChangeOpponentLevel={(level) =>
          setProfile((current) => ({
            ...current,
            defaultOpponentLevel: level,
          }))
        }
        onGenerate={regenerate}
      />

      <GoalsList matches={matches} setMatches={setMatches} />
    </div>
  );
}
