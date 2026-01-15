import {
  BALANCE_WEIGHT,
  OPPONENT_WEIGHT,
  PLAYER_COLORS,
  TEAMMATE_WEIGHT,
} from "../data";
import type {
  GenderOption,
  MatchCard as MatchCardType,
  MatchTeam,
  MatchWinner,
  PlayerProfile,
  PlayerStat,
} from "../interfaces";
import { getCombinations } from "./combinations";
import { pairKey } from "./pairKey";
import { randomId } from "./randomId";

export function buildDefaultPlayers(totalPlayers: number): PlayerProfile[] {
  return Array.from({ length: totalPlayers }, (_, index) => ({
    id: randomId(),
    name: `Player ${index + 1}`,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    gender: "" as GenderOption,
  }));
}

export function pickNextColor(players: PlayerProfile[], index: number) {
  const used = new Set(players.map((player) => player.color).filter(Boolean));
  const available = PLAYER_COLORS.filter((color) => !used.has(color));
  if (available.length > 0) {
    return available[0];
  }
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

function scorePairing(
  teams: [MatchTeam, MatchTeam],
  playCounts: Map<string, number>,
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
) {
  const [teamA, teamB] = teams;
  const players = [...teamA, ...teamB];
  const plays = players.map((playerId) => playCounts.get(playerId) ?? 0);
  const minPlays = Math.min(...plays);
  const maxPlays = Math.max(...plays);
  let score = plays.reduce((sum, value) => sum + value, 0);

  const teammateKeyA = pairKey(teamA[0], teamA[1]);
  const teammateKeyB = pairKey(teamB[0], teamB[1]);
  score += (teammateCounts.get(teammateKeyA) ?? 0) * TEAMMATE_WEIGHT;
  score += (teammateCounts.get(teammateKeyB) ?? 0) * TEAMMATE_WEIGHT;

  for (const playerId of teamA) {
    for (const opponentId of teamB) {
      score +=
        (opponentCounts.get(pairKey(playerId, opponentId)) ?? 0) *
        OPPONENT_WEIGHT;
    }
  }

  score += (maxPlays - minPlays) * BALANCE_WEIGHT;

  return score + Math.random() * 0.1;
}

function pickBestMatch(
  players: PlayerProfile[],
  playCounts: Map<string, number>,
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
) {
  const sorted = [...players].sort((a, b) => {
    const countDelta =
      (playCounts.get(a.id) ?? 0) - (playCounts.get(b.id) ?? 0);
    return countDelta || Math.random() - 0.5;
  });

  const candidatePool = sorted.slice(0, Math.min(sorted.length, 10));
  const combos = getCombinations(candidatePool, 4);
  let bestTeams: [MatchTeam, MatchTeam] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const combo of combos) {
    const [a, b, c, d] = combo.map((player) => player.id);
    const pairings: [MatchTeam, MatchTeam][] = [
      [
        [a, b],
        [c, d],
      ],
      [
        [a, c],
        [b, d],
      ],
      [
        [a, d],
        [b, c],
      ],
    ];

    for (const pairing of pairings) {
      const score = scorePairing(
        pairing,
        playCounts,
        teammateCounts,
        opponentCounts
      );
      if (score < bestScore) {
        bestScore = score;
        bestTeams = pairing;
      }
    }
  }

  return bestTeams;
}

function updateCounts(
  teams: [MatchTeam, MatchTeam],
  playCounts: Map<string, number>,
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
) {
  const [teamA, teamB] = teams;
  const players = [...teamA, ...teamB];

  for (const playerId of players) {
    playCounts.set(playerId, (playCounts.get(playerId) ?? 0) + 1);
  }

  teammateCounts.set(
    pairKey(teamA[0], teamA[1]),
    (teammateCounts.get(pairKey(teamA[0], teamA[1])) ?? 0) + 1
  );
  teammateCounts.set(
    pairKey(teamB[0], teamB[1]),
    (teammateCounts.get(pairKey(teamB[0], teamB[1])) ?? 0) + 1
  );

  for (const playerId of teamA) {
    for (const opponentId of teamB) {
      const key = pairKey(playerId, opponentId);
      opponentCounts.set(key, (opponentCounts.get(key) ?? 0) + 1);
    }
  }
}

export function buildSchedule(
  players: PlayerProfile[],
  numRounds: number,
  numCourts: number
) {
  const playCounts = new Map(players.map((player) => [player.id, 0]));
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const matches: MatchCardType[] = [];
  const courts = Math.max(
    1,
    Math.min(numCourts, Math.floor(players.length / 4))
  );

  for (let round = 0; round < numRounds; round += 1) {
    const usedThisRound = new Set<string>();
    let matchesBuilt = 0;

    for (let court = 0; court < courts; court += 1) {
      const availablePlayers = players.filter(
        (player) => !usedThisRound.has(player.id)
      );
      if (availablePlayers.length < 4) {
        break;
      }

      const teams = pickBestMatch(
        availablePlayers,
        playCounts,
        teammateCounts,
        opponentCounts
      );
      if (!teams) {
        return matches;
      }
      updateCounts(teams, playCounts, teammateCounts, opponentCounts);

      for (const playerId of [...teams[0], ...teams[1]]) {
        usedThisRound.add(playerId);
      }

      matches.push({
        id: randomId(),
        index: matches.length + 1,
        teams,
      });
      matchesBuilt += 1;
    }

    if (matchesBuilt === 0) {
      break;
    }
  }
  return matches;
}

export function buildStats(
  players: PlayerProfile[],
  matches: MatchCardType[],
  matchResults: Record<string, MatchWinner>
) {
  const playCounts = new Map(players.map((player) => [player.id, 0]));
  const winCounts = new Map(players.map((player) => [player.id, 0]));
  const lossCounts = new Map(players.map((player) => [player.id, 0]));
  for (const match of matches) {
    for (const playerId of [...match.teams[0], ...match.teams[1]]) {
      if (playCounts.has(playerId)) {
        playCounts.set(playerId, (playCounts.get(playerId) ?? 0) + 1);
      }
    }

    const winner = matchResults[match.id];
    if (!winner) {
      continue;
    }
    const winnerTeam = winner === "A" ? match.teams[0] : match.teams[1];
    const loserTeam = winner === "A" ? match.teams[1] : match.teams[0];
    for (const playerId of winnerTeam) {
      if (winCounts.has(playerId)) {
        winCounts.set(playerId, (winCounts.get(playerId) ?? 0) + 1);
      }
    }
    for (const playerId of loserTeam) {
      if (lossCounts.has(playerId)) {
        lossCounts.set(playerId, (lossCounts.get(playerId) ?? 0) + 1);
      }
    }
  }

  const stats: PlayerStat[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    gender: player.gender,
    playCount: playCounts.get(player.id) ?? 0,
    wins: winCounts.get(player.id) ?? 0,
    losses: lossCounts.get(player.id) ?? 0,
  }));

  stats.sort((a, b) => a.name.localeCompare(b.name));

  return stats;
}
