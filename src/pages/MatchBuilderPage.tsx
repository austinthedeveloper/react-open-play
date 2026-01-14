import { useMemo, useState } from "react";

const DEFAULT_PLAYERS = 8;
const DEFAULT_MATCHES = 6;
const MAX_PLAYERS = 24;
const MAX_MATCHES = 20;

const TEAMMATE_WEIGHT = 5;
const OPPONENT_WEIGHT = 2;
const BALANCE_WEIGHT = 1.5;

type MatchTeam = [string, string];

type MatchCard = {
  id: string;
  index: number;
  teams: [MatchTeam, MatchTeam];
};

type PlayerStat = {
  name: string;
  playCount: number;
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function getCombinations<T>(items: T[], size: number): T[][] {
  const results: T[][] = [];
  const combo: T[] = [];

  const walk = (start: number, depth: number) => {
    if (depth === size) {
      results.push([...combo]);
      return;
    }

    for (let i = start; i <= items.length - (size - depth); i += 1) {
      combo.push(items[i]);
      walk(i + 1, depth + 1);
      combo.pop();
    }
  };

  walk(0, 0);
  return results;
}

function scorePairing(
  teams: [MatchTeam, MatchTeam],
  playCounts: Map<string, number>,
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
) {
  const [teamA, teamB] = teams;
  const players = [...teamA, ...teamB];
  const plays = players.map((p) => playCounts.get(p) ?? 0);
  const minPlays = Math.min(...plays);
  const maxPlays = Math.max(...plays);
  let score = plays.reduce((sum, value) => sum + value, 0);

  const teammateKeyA = pairKey(teamA[0], teamA[1]);
  const teammateKeyB = pairKey(teamB[0], teamB[1]);
  score += (teammateCounts.get(teammateKeyA) ?? 0) * TEAMMATE_WEIGHT;
  score += (teammateCounts.get(teammateKeyB) ?? 0) * TEAMMATE_WEIGHT;

  for (const player of teamA) {
    for (const opponent of teamB) {
      score += (opponentCounts.get(pairKey(player, opponent)) ?? 0) * OPPONENT_WEIGHT;
    }
  }

  score += (maxPlays - minPlays) * BALANCE_WEIGHT;

  return score + Math.random() * 0.1;
}

function pickBestMatch(
  players: string[],
  playCounts: Map<string, number>,
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
) {
  const sorted = [...players].sort((a, b) => {
    const countDelta = (playCounts.get(a) ?? 0) - (playCounts.get(b) ?? 0);
    return countDelta || Math.random() - 0.5;
  });

  const candidatePool = sorted.slice(0, Math.min(sorted.length, 10));
  const combos = getCombinations(candidatePool, 4);
  let bestTeams: [MatchTeam, MatchTeam] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const combo of combos) {
    const [a, b, c, d] = combo;
    const pairings: [MatchTeam, MatchTeam][] = [
      [[a, b], [c, d]],
      [[a, c], [b, d]],
      [[a, d], [b, c]],
    ];

    for (const pairing of pairings) {
      const score = scorePairing(pairing, playCounts, teammateCounts, opponentCounts);
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

  for (const player of players) {
    playCounts.set(player, (playCounts.get(player) ?? 0) + 1);
  }

  teammateCounts.set(
    pairKey(teamA[0], teamA[1]),
    (teammateCounts.get(pairKey(teamA[0], teamA[1])) ?? 0) + 1
  );
  teammateCounts.set(
    pairKey(teamB[0], teamB[1]),
    (teammateCounts.get(pairKey(teamB[0], teamB[1])) ?? 0) + 1
  );

  for (const player of teamA) {
    for (const opponent of teamB) {
      const key = pairKey(player, opponent);
      opponentCounts.set(key, (opponentCounts.get(key) ?? 0) + 1);
    }
  }
}

function ensureUniqueNames(names: string[]) {
  const seen = new Map<string, number>();
  return names.map((raw, index) => {
    const base = raw.trim() || `Player ${index + 1}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

function buildSchedule(players: string[], numMatches: number) {
  const playCounts = new Map(players.map((player) => [player, 0]));
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const matches: MatchCard[] = [];

  for (let i = 0; i < numMatches; i += 1) {
    const teams = pickBestMatch(players, playCounts, teammateCounts, opponentCounts);
    if (!teams) {
      break;
    }
    updateCounts(teams, playCounts, teammateCounts, opponentCounts);
    matches.push({
      id: randomId(),
      index: i + 1,
      teams,
    });
  }

  const stats: PlayerStat[] = players.map((player) => ({
    name: player,
    playCount: playCounts.get(player) ?? 0,
  }));

  stats.sort((a, b) => a.name.localeCompare(b.name));

  return { players, matches, stats };
}

export default function MatchBuilderPage() {
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: DEFAULT_PLAYERS }, (_, i) => `Player ${i + 1}`)
  );
  const [numMatches, setNumMatches] = useState(DEFAULT_MATCHES);
  const [seed, setSeed] = useState(0);

  const numPlayers = playerNames.length;
  const normalizedNames = useMemo(
    () => ensureUniqueNames(playerNames),
    [playerNames]
  );

  const schedule = useMemo(() => {
    if (numPlayers < 4) {
      return null;
    }
    return buildSchedule(normalizedNames, numMatches);
  }, [normalizedNames, numPlayers, numMatches, seed]);

  const matches = schedule?.matches ?? [];
  const stats = schedule?.stats ?? [];

  return (
    <div className="builder-shell text-left">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Round Robin Lab</p>
          <h1 className="hero-title">Match Builder</h1>
          <p className="hero-subtitle">
            Build a doubles schedule that keeps play time balanced and mixes teammates
            and opponents across the group.
          </p>
        </div>
      </header>

      <section className="controls-panel">
        <label className="control">
          <span>Number of players</span>
          <input
            type="number"
            min={4}
            max={MAX_PLAYERS}
            value={numPlayers}
            onChange={(e) =>
              setPlayerNames((prev) => {
                const nextCount = Math.min(
                  MAX_PLAYERS,
                  Math.max(4, Number(e.target.value) || 4)
                );
                if (nextCount === prev.length) {
                  return prev;
                }
                if (nextCount < prev.length) {
                  return prev.slice(0, nextCount);
                }
                const extras = Array.from(
                  { length: nextCount - prev.length },
                  (_, i) => `Player ${prev.length + i + 1}`
                );
                return [...prev, ...extras];
              })
            }
          />
        </label>

        <label className="control">
          <span>Number of matches</span>
          <input
            type="number"
            min={1}
            max={MAX_MATCHES}
            value={numMatches}
            onChange={(e) =>
              setNumMatches(
                Math.min(MAX_MATCHES, Math.max(1, Number(e.target.value) || 1))
              )
            }
          />
        </label>

        <button
          type="button"
          onClick={() => setSeed((value) => value + 1)}
          className="glow-button"
        >
          Generate schedule
        </button>
      </section>

      <section className="table-panel">
        <h2 className="panel-title">Roster</h2>
        <p className="panel-subtitle">
          Edit player names here. Names stay attached to the schedule below.
        </p>
        <div className="roster-grid">
          {playerNames.map((name, index) => (
            <div key={`player-${index}`} className="roster-row">
              <span className="roster-label">Player {index + 1}</span>
              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setPlayerNames((prev) =>
                    prev.map((value, idx) =>
                      idx === index ? e.target.value : value
                    )
                  )
                }
                placeholder={`Player ${index + 1}`}
              />
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setPlayerNames((prev) =>
                    prev.length <= 4
                      ? prev
                      : prev.filter((_, idx) => idx !== index)
                  )
                }
                disabled={playerNames.length <= 4}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="roster-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              setPlayerNames((prev) =>
                prev.length >= MAX_PLAYERS
                  ? prev
                  : [...prev, `Player ${prev.length + 1}`]
              )
            }
            disabled={playerNames.length >= MAX_PLAYERS}
          >
            Add player
          </button>
          <span className="roster-note">
            {playerNames.length} players
          </span>
        </div>
      </section>

      {numPlayers < 4 ? (
        <div className="table-panel">
          <p className="empty-state">
            You need at least 4 players to build doubles matches.
          </p>
        </div>
      ) : (
        <div className="builder-grid">
          <section className="table-panel">
            <h2 className="panel-title">Matchups</h2>
            {matches.length === 0 ? (
              <p className="empty-state">No matchups yet.</p>
            ) : (
              <div className="matches-list">
                {matches.map((match) => (
                  <article key={match.id} className="match-card">
                    <div className="match-index">Match {match.index}</div>
                    <div className="match-teams">
                      <div>
                        <span className="team-label">Team A</span>
                        <div className="team-names">
                          {match.teams[0][0]} &amp; {match.teams[0][1]}
                        </div>
                      </div>
                      <div className="versus">vs</div>
                      <div>
                        <span className="team-label">Team B</span>
                        <div className="team-names">
                          {match.teams[1][0]} &amp; {match.teams[1][1]}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="table-panel">
            <h2 className="panel-title">Player Balance</h2>
            <p className="panel-subtitle">
              Each player should land within one match of the group average.
            </p>
            <div className="stats-grid">
              {stats.map((player) => (
                <div key={player.name} className="stat-card">
                  <span className="stat-label">{player.name}</span>
                  <span className="stat-value">{player.playCount}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
