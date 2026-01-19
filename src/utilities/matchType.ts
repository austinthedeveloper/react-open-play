import { MATCH_TYPES } from "../data";
import type { MatchType } from "../interfaces";

export function getMatchType(type: MatchType = "round_robin"): string {
  const match = MATCH_TYPES.find((obj) => obj.value === type);
  return match ? match.label : "";
}
