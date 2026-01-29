import {
  BALANCE_WEIGHT,
  OPPONENT_WEIGHT,
  PLAYER_COLORS,
  TEAMMATE_WEIGHT,
} from "../data";
import type {
  GenderOption,
  MatchCard as MatchCardType,
  MatchResults,
  MatchTeam,
  MatchType,
  MatchWinner,
  PartnerPair,
  PlayerProfile,
  PlayerStat,
  Schedule,
} from "../interfaces";
import { getCombinations } from "./combinations";
import { pairKey } from "./pairKey";
import { randomId } from "./randomId";

export const BYE_PLAYER_ID = "__BYE__";
const BYE_TEAM: MatchTeam = [BYE_PLAYER_ID, BYE_PLAYER_ID];

export const validateMixedDoublesPairing = (
  players: PlayerProfile[],
  partnerPairs: PartnerPair[] = []
) => {
  const playerLookup = new Map(players.map((player) => [player.id, player]));
  const used = new Set<string>();

  for (const pair of partnerPairs) {
    const [first, second] = pair;
    if (!first || !second || first === second) {
      continue;
    }
    const firstPlayer = playerLookup.get(first);
    const secondPlayer = playerLookup.get(second);
    if (!firstPlayer || !secondPlayer) {
      continue;
    }
    const firstGender = firstPlayer.gender ?? "";
    const secondGender = secondPlayer.gender ?? "";
    if (!firstGender || !secondGender) {
      return "Set gender for all locked pairs in Mixed Doubles.";
    }
    if (firstGender === secondGender) {
      return "Mixed Doubles locked pairs must be one male and one female.";
    }
    used.add(first);
    used.add(second);
  }

  const remaining = players.filter((player) => !used.has(player.id));
  if (remaining.some((player) => !player.gender)) {
    return "Set gender for all remaining players so Mixed Doubles can auto-pair.";
  }

  const remainingMales = remaining.filter(
    (player) => player.gender === "male"
  );
  const remainingFemales = remaining.filter(
    (player) => player.gender === "female"
  );

  if (remainingMales.length !== remainingFemales.length) {
    return "Mixed Doubles needs an equal number of remaining males and females.";
  }

  return null;
};

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

export type BuildScheduleResult = {
  schedule: Schedule;
  matchResults: MatchResults;
};

export function buildRoundRobinSchedule(
  players: PlayerProfile[],
  numRounds: number,
  numCourts: number
) : Schedule {
  const playCounts = new Map(players.map((player) => [player.id, 0]));
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const matches: MatchCardType[] = [];
  const rounds: MatchCardType[][] = [];
  const courts = Math.max(
    1,
    Math.min(numCourts, Math.floor(players.length / 4))
  );

  for (let round = 0; round < numRounds; round += 1) {
    const usedThisRound = new Set<string>();
    let matchesBuilt = 0;
    const roundMatches: MatchCardType[] = [];

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
        return { matches, rounds };
      }
      updateCounts(teams, playCounts, teammateCounts, opponentCounts);

      for (const playerId of [...teams[0], ...teams[1]]) {
        usedThisRound.add(playerId);
      }

      const match: MatchCardType = {
        id: randomId(),
        index: matches.length + 1,
        teams,
      };
      matches.push(match);
      roundMatches.push(match);
      matchesBuilt += 1;
    }

    if (matchesBuilt === 0) {
      break;
    }
    rounds.push(roundMatches);
  }
  return { matches, rounds };
}

const isByeTeam = (team: MatchTeam) =>
  team.every((playerId) => playerId === BYE_PLAYER_ID);

const hasByePlayer = (team: MatchTeam) =>
  team.some((playerId) => playerId === BYE_PLAYER_ID);

const isPartialByeTeam = (team: MatchTeam) =>
  hasByePlayer(team) && !isByeTeam(team);

const resolveByeWinner = (teams: [MatchTeam, MatchTeam]): MatchWinner | null => {
  const [teamA, teamB] = teams;
  const teamAIsBye = isByeTeam(teamA);
  const teamBIsBye = isByeTeam(teamB);

  if (teamAIsBye && !teamBIsBye) {
    return "B";
  }
  if (teamBIsBye && !teamAIsBye) {
    return "A";
  }
  if (isPartialByeTeam(teamA) && !hasByePlayer(teamB)) {
    return "A";
  }
  if (isPartialByeTeam(teamB) && !hasByePlayer(teamA)) {
    return "B";
  }
  return null;
};

const buildTournamentTeams = (
  players: PlayerProfile[],
  partnerPairs: PartnerPair[] = [],
  preferMixed = false
) => {
  const playerLookup = new Map(players.map((player) => [player.id, player]));
  const used = new Set<string>();
  const lockedTeams: MatchTeam[] = [];

  for (const pair of partnerPairs) {
    const [first, second] = pair;
    if (!first || !second || first === second) {
      continue;
    }
    if (!playerLookup.has(first) || !playerLookup.has(second)) {
      continue;
    }
    if (used.has(first) || used.has(second)) {
      continue;
    }
    used.add(first);
    used.add(second);
    lockedTeams.push([first, second]);
  }

  const remainingPlayers = players.filter((player) => !used.has(player.id));
  const autoTeams: MatchTeam[] = [];

  if (preferMixed) {
    const males = remainingPlayers.filter((player) => player.gender === "male");
    const females = remainingPlayers.filter(
      (player) => player.gender === "female"
    );
    const unspecified = remainingPlayers.filter(
      (player) => !player.gender
    );

    while (males.length > 0 && females.length > 0) {
      const male = males.shift();
      const female = females.shift();
      if (!male || !female) {
        break;
      }
      autoTeams.push([male.id, female.id]);
    }

    const leftovers = [...males, ...females, ...unspecified];
    for (let i = 0; i < leftovers.length; i += 2) {
      const first = leftovers[i];
      const second = leftovers[i + 1];
      if (!first) {
        break;
      }
      if (second) {
        autoTeams.push([first.id, second.id]);
      } else {
        autoTeams.push([first.id, BYE_PLAYER_ID]);
      }
    }
  } else {
    for (let i = 0; i < remainingPlayers.length; i += 2) {
      const first = remainingPlayers[i];
      const second = remainingPlayers[i + 1];
      if (!first) {
        break;
      }
      if (second) {
        autoTeams.push([first.id, second.id]);
      } else {
        autoTeams.push([first.id, BYE_PLAYER_ID]);
      }
    }
  }

  return [...lockedTeams, ...autoTeams];
};

export function buildTournamentSchedule(
  players: PlayerProfile[],
  partnerPairs: PartnerPair[] = [],
  preferMixed = false
): BuildScheduleResult {
  const teams: MatchTeam[] = buildTournamentTeams(
    players,
    partnerPairs,
    preferMixed
  );

  teams.sort((a, b) => {
    if (hasByePlayer(a) === hasByePlayer(b)) {
      return 0;
    }
    return hasByePlayer(a) ? -1 : 1;
  });

  const bracketSize = Math.max(
    2,
    2 ** Math.ceil(Math.log2(Math.max(teams.length, 2)))
  );
  const byeCount = Math.max(0, bracketSize - teams.length);

  const seededTeams: MatchTeam[] = [];
  let byeLeft = byeCount;
  for (const team of teams) {
    seededTeams.push(team);
    if (byeLeft > 0) {
      seededTeams.push(BYE_TEAM);
      byeLeft -= 1;
    }
  }
  while (seededTeams.length < bracketSize) {
    seededTeams.push(BYE_TEAM);
  }

  const matches: MatchCardType[] = [];
  const rounds: MatchCardType[][] = [];
  const matchResults: MatchResults = {};

  const roundOne: MatchCardType[] = [];
  for (let i = 0; i < seededTeams.length; i += 2) {
    const teamsPair: [MatchTeam, MatchTeam] = [
      seededTeams[i],
      seededTeams[i + 1] ?? BYE_TEAM,
    ];
    const match: MatchCardType = {
      id: randomId(),
      index: matches.length + 1,
      teams: teamsPair,
    };
    const byeWinner = resolveByeWinner(teamsPair);
    if (byeWinner) {
      matchResults[match.id] = byeWinner;
    }
    matches.push(match);
    roundOne.push(match);
  }
  rounds.push(roundOne);

  const totalRounds = Math.log2(bracketSize);
  let previousRound = roundOne;
  for (let round = 1; round < totalRounds; round += 1) {
    const nextRound: MatchCardType[] = [];
    for (let i = 0; i < previousRound.length; i += 2) {
      const sourceA = previousRound[i];
      const sourceB = previousRound[i + 1];
      const match: MatchCardType = {
        id: randomId(),
        index: matches.length + 1,
        teams: [
          ["", ""],
          ["", ""],
        ],
        sourceMatchIds: [sourceA?.id ?? null, sourceB?.id ?? null],
      };
      matches.push(match);
      nextRound.push(match);
    }
    rounds.push(nextRound);
    previousRound = nextRound;
  }

  return { schedule: { matches, rounds }, matchResults };
}

export function resolveMatchTeam(
  match: MatchCardType,
  teamIndex: 0 | 1,
  matchLookup: Map<string, MatchCardType>,
  matchResults: MatchResults
): MatchTeam | null {
  const sourceId = match.sourceMatchIds?.[teamIndex];
  if (!sourceId) {
    return match.teams[teamIndex];
  }
  const sourceMatch = matchLookup.get(sourceId);
  if (!sourceMatch) {
    return null;
  }
  const winner = matchResults[sourceId];
  if (!winner) {
    return null;
  }
  const winnerIndex = winner === "A" ? 0 : 1;
  return resolveMatchTeam(sourceMatch, winnerIndex, matchLookup, matchResults);
}

export function resolveScheduleMatches(
  schedule: Schedule,
  matchResults: MatchResults
): MatchCardType[] {
  const matchLookup = new Map(
    schedule.matches.map((match) => [match.id, match])
  );

  return schedule.matches.map((match) => {
    const teamA =
      resolveMatchTeam(match, 0, matchLookup, matchResults) ?? match.teams[0];
    const teamB =
      resolveMatchTeam(match, 1, matchLookup, matchResults) ?? match.teams[1];
    return {
      ...match,
      teams: [teamA, teamB],
    };
  });
}

export function buildSchedule(
  players: PlayerProfile[],
  numRounds: number,
  numCourts: number,
  matchType: MatchType,
  partnerPairs: PartnerPair[] = []
): BuildScheduleResult {
  if (matchType === "tournament" || matchType === "mixed_doubles") {
    return buildTournamentSchedule(
      players,
      partnerPairs,
      matchType === "mixed_doubles"
    );
  }
  return {
    schedule: buildRoundRobinSchedule(players, numRounds, numCourts),
    matchResults: {},
  };
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
