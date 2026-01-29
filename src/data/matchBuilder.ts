export const DEFAULT_PLAYERS = 8;
export const DEFAULT_MATCHES = 6;
export const DEFAULT_COURTS = 2;
export const MAX_PLAYERS = 24;
export const MAX_MATCHES = 20;
export const MATCH_TYPES = [
  { value: "round_robin", label: "Open Play" },
  { value: "round_robin_fixed", label: "Round Robin" },
  { value: "tournament", label: "Tournament" },
  { value: "mixed_doubles", label: "Mixed Doubles" },
] as const;
export const DEFAULT_MATCH_TYPE = MATCH_TYPES[0].value;

export const TEAMMATE_WEIGHT = 5;
export const OPPONENT_WEIGHT = 2;
export const BALANCE_WEIGHT = 1.5;

export const STORAGE_KEY = "matchBuilderState";

export const PLAYER_COLORS = [
  "#4CF3FF",
  "#F2A6FF",
  "#FFB86B",
  "#7EE787",
  "#FFD166",
  "#FF6B6B",
  "#5BC0EB",
  "#9D4EDD",
  "#F72585",
  "#FF9F1C",
  "#2EC4B6",
  "#E9C46A",
  "#06D6A0",
  "#EF476F",
  "#A0C4FF",
  "#BDB2FF",
  "#FFC6FF",
  "#CAFFBF",
  "#FDFFB6",
  "#83C5BE",
];
