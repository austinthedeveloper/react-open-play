import { useEffect, useState } from "react";
import { DEFAULT_PROFILE, GOAL_TEMPLATES, NUM_MATCHES_DEFAULT } from "../data";
import type { GoalResult, MatchGoal, OpponentLevel, Profile } from "../interfaces";
import { randomId } from "../utilities";
import GoalsControls from "../components/goals/GoalsControls";
import GoalsHero from "../components/goals/GoalsHero";
import GoalsList from "../components/goals/GoalsList";

const STORAGE_KEY = "pickle-goals:goals-page";
const opponentLevels: OpponentLevel[] = ["lower", "same", "higher"];
const isOpponentLevel = (value: unknown): value is OpponentLevel =>
  opponentLevels.includes(value as OpponentLevel);

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
  const [matches, setMatches] = useState<MatchGoal[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const completedCount = matches.filter((m) => m.result === "yes").length;
  const playedCount = matches.filter((m) => m.played).length;

  const regenerate = () => {
    setMatches(generateMatches(profile.defaultOpponentLevel, numMatches));
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setMatches(
          generateMatches(profile.defaultOpponentLevel, NUM_MATCHES_DEFAULT)
        );
        return;
      }
      const parsed = JSON.parse(stored) as {
        matches?: MatchGoal[];
        numMatches?: number;
        defaultOpponentLevel?: OpponentLevel;
      };
      if (Array.isArray(parsed.matches)) {
        setMatches(parsed.matches);
      } else {
        setMatches(
          generateMatches(profile.defaultOpponentLevel, NUM_MATCHES_DEFAULT)
        );
      }
      if (typeof parsed.numMatches === "number") {
        setNumMatches(parsed.numMatches);
      }
      const storedLevel = parsed.defaultOpponentLevel;
      if (isOpponentLevel(storedLevel)) {
        setProfile((current) => ({
          ...current,
          defaultOpponentLevel: storedLevel,
        }));
      }
    } catch {
      setMatches(
        generateMatches(profile.defaultOpponentLevel, NUM_MATCHES_DEFAULT)
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (!isLoaded) {
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        matches,
        numMatches,
        defaultOpponentLevel: profile.defaultOpponentLevel,
      })
    );
  }, [matches, numMatches, profile.defaultOpponentLevel, isLoaded]);

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
