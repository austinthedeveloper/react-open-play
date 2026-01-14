import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_PLAYERS = 8;
const DEFAULT_MATCHES = 6;
const DEFAULT_COURTS = 2;
const MAX_PLAYERS = 24;
const MAX_MATCHES = 20;

const TEAMMATE_WEIGHT = 5;
const OPPONENT_WEIGHT = 2;
const BALANCE_WEIGHT = 1.5;

const STORAGE_KEY = "matchBuilderState";

const PLAYER_COLORS = [
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

type GenderOption = "" | "male" | "female";

type PlayerProfile = {
  id: string;
  name: string;
  color?: string;
  gender?: GenderOption;
};

type MatchTeam = [string, string];

type MatchCard = {
  id: string;
  index: number;
  teams: [MatchTeam, MatchTeam];
};

type Schedule = {
  matches: MatchCard[];
};

type PlayerStat = {
  id: string;
  name: string;
  color?: string;
  gender?: GenderOption;
  playCount: number;
};

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function pickNextColor(players: PlayerProfile[], index: number) {
  const used = new Set(players.map((player) => player.color).filter(Boolean));
  const available = PLAYER_COLORS.filter((color) => !used.has(color));
  if (available.length > 0) {
    return available[0];
  }
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
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

function buildSchedule(
  players: PlayerProfile[],
  numRounds: number,
  numCourts: number
) {
  const playCounts = new Map(players.map((player) => [player.id, 0]));
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const matches: MatchCard[] = [];
  const courts = Math.max(1, Math.min(numCourts, Math.floor(players.length / 4)));

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

function buildStats(players: PlayerProfile[], matches: MatchCard[]) {
  const playCounts = new Map(players.map((player) => [player.id, 0]));
  for (const match of matches) {
    for (const playerId of [...match.teams[0], ...match.teams[1]]) {
      if (playCounts.has(playerId)) {
        playCounts.set(playerId, (playCounts.get(playerId) ?? 0) + 1);
      }
    }
  }

  const stats: PlayerStat[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    gender: player.gender,
    playCount: playCounts.get(player.id) ?? 0,
  }));

  stats.sort((a, b) => a.name.localeCompare(b.name));

  return stats;
}

export default function MatchBuilderPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>(
    Array.from({ length: DEFAULT_PLAYERS }, (_, i) => ({
      id: randomId(),
      name: `Player ${i + 1}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      gender: "",
    }))
  );
  const [numMatches, setNumMatches] = useState(DEFAULT_MATCHES);
  const [numCourts, setNumCourts] = useState(DEFAULT_COURTS);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const numPlayers = players.length;
  const maxCourts = useMemo(
    () => Math.max(1, Math.floor(numPlayers / 4)),
    [numPlayers]
  );
  const normalizedPlayers = useMemo(() => {
    const seen = new Map<string, number>();
    return players.map((player, index) => {
      const base = player.name.trim() || `Player ${index + 1}`;
      const count = (seen.get(base) ?? 0) + 1;
      seen.set(base, count);
      return {
        ...player,
        name: count === 1 ? base : `${base} (${count})`,
      };
    });
  }, [players]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as {
        players?: PlayerProfile[];
        numMatches?: number;
        numCourts?: number;
        schedule?: Schedule | null;
      };
      if (Array.isArray(parsed.players)) {
        const sanitized = parsed.players.map((player, index) => ({
          id: player.id || randomId(),
          name: player.name || `Player ${index + 1}`,
          color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length],
          gender: player.gender || "",
        }));

        setPlayers(sanitized);
      }
      if (typeof parsed.numMatches === "number") {
        setNumMatches(parsed.numMatches);
      }
      if (typeof parsed.numCourts === "number") {
        setNumCourts(parsed.numCourts);
      }
      if (parsed.schedule && Array.isArray(parsed.schedule.matches)) {
        setSchedule({ matches: parsed.schedule.matches });
      }
    } catch {
      // ignore storage parse errors
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
      JSON.stringify({ players, numMatches, numCourts, schedule })
    );
  }, [players, numMatches, numCourts, schedule, isLoaded]);

  useEffect(() => {
    setNumCourts((prev) => Math.min(Math.max(1, prev), maxCourts));
  }, [maxCourts]);

  const matches = schedule?.matches ?? [];
  const playerLookup = useMemo(() => {
    return new Map(normalizedPlayers.map((player) => [player.id, player]));
  }, [normalizedPlayers]);
  const matchRounds = useMemo(() => {
    const perRound = Math.max(1, numCourts);
    const rounds: MatchCard[][] = [];
    for (let i = 0; i < matches.length; i += perRound) {
      rounds.push(matches.slice(i, i + perRound));
    }
    return rounds;
  }, [matches, numCourts]);
  const stats = useMemo(() => {
    if (!schedule) {
      return [];
    }
    return buildStats(normalizedPlayers, schedule.matches);
  }, [normalizedPlayers, schedule]);
  const getPlayerName = (playerId: string) =>
    playerLookup.get(playerId)?.name ?? "Unknown";
  const getPlayerColor = (playerId: string) =>
    playerLookup.get(playerId)?.color ?? "transparent";

  useEffect(() => {
    if (activeRound > matchRounds.length - 1) {
      setActiveRound(Math.max(0, matchRounds.length - 1));
    }
  }, [activeRound, matchRounds.length]);

  const openFullscreen = () => {
    setActiveRound(0);
    setIsFullscreen(true);
    if (fullscreenRef.current?.requestFullscreen) {
      fullscreenRef.current.requestFullscreen().catch(() => undefined);
    }
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => undefined);
    }
  };

  return (
    <div className="builder-shell text-left">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Round Robin Lab</p>
          <h1 className="hero-title">Match Builder</h1>
          <p className="hero-subtitle">
            Build a doubles schedule that keeps play time balanced and mixes
            teammates and opponents across the group.
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
              setPlayers((prev) => {
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
                  (_, i) => ({
                    id: randomId(),
                    name: `Player ${prev.length + i + 1}`,
                    color: pickNextColor(prev, prev.length + i),
                    gender: "",
                  })
                );
                return [...prev, ...extras];
              })
            }
          />
        </label>

        <label className="control">
          <span>Number of rounds</span>
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
        <label className="control">
          <span>Number of courts</span>
          <input
            type="number"
            min={1}
            max={maxCourts}
            value={numCourts}
            onChange={(e) =>
              setNumCourts(
                Math.min(
                  maxCourts,
                  Math.max(1, Number(e.target.value) || 1)
                )
              )
            }
          />
        </label>

        <div className="control-actions">
          <button
            type="button"
            onClick={() => {
              if (numPlayers < 4) {
                setSchedule(null);
                return;
              }
              const matchesList = buildSchedule(
                normalizedPlayers,
                numMatches,
                numCourts
              );
              setSchedule({ matches: matchesList });
            }}
            className="glow-button"
          >
            Generate schedule
          </button>
          <button
            type="button"
            onClick={() => setSchedule(null)}
            className="ghost-button"
            disabled={!schedule || schedule.matches.length === 0}
          >
            Clear schedule
          </button>
        </div>
      </section>

      <section className="table-panel">
        <h2 className="panel-title">Roster</h2>
        <p className="panel-subtitle">
          Edit player names here. Optionally set a color or gender for each
          player.
        </p>
        <div className="roster-header">
          <span className="roster-header-cell">Player</span>
          <span className="roster-header-cell">Name</span>
          <span className="roster-header-cell">Color</span>
          <span className="roster-header-cell">Gender</span>
          <span className="roster-header-cell">Actions</span>
        </div>
        <div className="roster-grid">
          {players.map((player, index) => (
            <div key={player.id} className="roster-row">
              <span className="roster-label">Player {index + 1}</span>
              <input
                type="text"
                value={player.name}
                onChange={(e) =>
                  setPlayers((prev) =>
                    prev.map((entry, idx) =>
                      idx === index ? { ...entry, name: e.target.value } : entry
                    )
                  )
                }
                placeholder={`Player ${index + 1}`}
              />
              <input
                type="color"
                className="color-input"
                value={player.color || "#0b0d12"}
                onChange={(e) =>
                  setPlayers((prev) =>
                    prev.map((entry, idx) =>
                      idx === index
                        ? { ...entry, color: e.target.value }
                        : entry
                    )
                  )
                }
                aria-label={`Color for player ${index + 1}`}
              />
              <select
                value={player.gender ?? ""}
                onChange={(e) =>
                  setPlayers((prev) =>
                    prev.map((entry, idx) =>
                      idx === index
                        ? { ...entry, gender: e.target.value as GenderOption }
                        : entry
                    )
                  )
                }
              >
                <option value="">Unspecified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setPlayers((prev) =>
                    prev.length <= 4
                      ? prev
                      : prev.filter((_, idx) => idx !== index)
                  )
                }
                disabled={players.length <= 4}
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
              setPlayers((prev) =>
                prev.length >= MAX_PLAYERS
                  ? prev
                  : [
                      ...prev,
                      {
                        id: randomId(),
                        name: `Player ${prev.length + 1}`,
                        color: pickNextColor(prev, prev.length),
                        gender: "",
                      },
                    ]
              )
            }
            disabled={players.length >= MAX_PLAYERS}
          >
            Add player
          </button>
          <span className="roster-note">{players.length} players</span>
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
            <div className="panel-header">
              <h2 className="panel-title">Matchups</h2>
              <button
                type="button"
                className="ghost-button"
                onClick={openFullscreen}
                disabled={matches.length === 0}
              >
                Fullscreen view
              </button>
            </div>
            {matches.length === 0 ? (
              <p className="empty-state">No matchups yet.</p>
            ) : (
              <div className="matches-list">
                {matchRounds.map((roundMatches, roundIndex) => (
                  <div key={`round-${roundIndex}`} className="round-block">
                    <div className="round-header">Round {roundIndex + 1}</div>
                    <div className="round-courts">
                      {roundMatches.map((match, matchIndex) => (
                        <article key={match.id} className="match-card">
                          <div className="match-index">
                            Court {matchIndex + 1} • Match {match.index}
                          </div>
                          <div className="match-teams">
                            <div>
                              <span className="team-label">Team A</span>
                              <div className="team-names">
                                {getPlayerName(match.teams[0][0])} &amp;{" "}
                                {getPlayerName(match.teams[0][1])}
                              </div>
                            </div>
                            <div className="versus">vs</div>
                            <div>
                              <span className="team-label">Team B</span>
                              <div className="team-names">
                                {getPlayerName(match.teams[1][0])} &amp;{" "}
                                {getPlayerName(match.teams[1][1])}
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
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
                <div key={player.id} className="stat-card">
                  <span className="stat-card-label">
                    <span
                      className="stat-dot"
                      style={{
                        backgroundColor: player.color || "transparent",
                      }}
                    />
                    {player.name}
                  </span>
                  <span className="stat-value">{player.playCount}</span>
                  {player.gender ? (
                    <span className="stat-card-sub">
                      {player.gender === "male" ? "Male" : "Female"}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
      {isFullscreen ? (
        <div className="match-fullscreen" ref={fullscreenRef}>
          <div className="match-fullscreen-backdrop" />
          <div className="match-fullscreen-frame">
            <header className="match-fullscreen-header">
              <div>
                <div className="fullscreen-eyebrow">Round</div>
                <h2 className="fullscreen-title">
                  {matchRounds.length === 0 ? 0 : activeRound + 1}
                </h2>
              </div>
              <div className="fullscreen-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() =>
                    setActiveRound((prev) => Math.max(0, prev - 1))
                  }
                  disabled={activeRound <= 0}
                >
                  Previous round
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() =>
                    setActiveRound((prev) =>
                      Math.min(matchRounds.length - 1, prev + 1)
                    )
                  }
                  disabled={activeRound >= matchRounds.length - 1}
                >
                  Next round
                </button>
                <button
                  type="button"
                  className="glow-button"
                  onClick={closeFullscreen}
                >
                  Exit fullscreen
                </button>
              </div>
            </header>
            <section className="fullscreen-round">
              {matchRounds[activeRound]?.map((match, matchIndex) => (
                <article key={match.id} className="fullscreen-match-card">
                  <div className="match-index">
                    Court {matchIndex + 1} • Match {match.index}
                  </div>
                  <div className="match-teams">
                    <div>
                      <span className="team-label">Team A</span>
                      <div className="team-names">
                        <span
                          className="player-dot"
                          style={{ backgroundColor: getPlayerColor(match.teams[0][0]) }}
                        />
                        {getPlayerName(match.teams[0][0])} &amp;{" "}
                        <span
                          className="player-dot"
                          style={{ backgroundColor: getPlayerColor(match.teams[0][1]) }}
                        />
                        {getPlayerName(match.teams[0][1])}
                      </div>
                    </div>
                    <div className="versus">vs</div>
                    <div>
                      <span className="team-label">Team B</span>
                      <div className="team-names">
                        <span
                          className="player-dot"
                          style={{ backgroundColor: getPlayerColor(match.teams[1][0]) }}
                        />
                        {getPlayerName(match.teams[1][0])} &amp;{" "}
                        <span
                          className="player-dot"
                          style={{ backgroundColor: getPlayerColor(match.teams[1][1]) }}
                        />
                        {getPlayerName(match.teams[1][1])}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
