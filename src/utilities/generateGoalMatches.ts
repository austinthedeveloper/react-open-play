import { GOAL_TEMPLATES } from "../data";
import type { MatchGoal, OpponentLevel } from "../interfaces";
import { randomId } from "./randomId";

export const generateGoalMatches = (
  level: OpponentLevel,
  count: number
): MatchGoal[] => {
  const templates = GOAL_TEMPLATES[level];
  return Array.from({ length: count }, (_, i) => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    return {
      id: randomId(),
      index: i + 1,
      opponentLevel: level,
      goalText: template,
      played: false,
      result: "pending",
    };
  });
};
