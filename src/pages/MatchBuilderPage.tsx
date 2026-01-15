import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_COURTS,
  DEFAULT_MATCHES,
  DEFAULT_PLAYERS,
  MAX_MATCHES,
  MAX_PLAYERS,
  PLAYER_COLORS,
  STORAGE_KEY,
} from "../data";
import type {
  GenderOption,
  MatchCard as MatchCardType,
  MatchTeam,
  MatchWinner,
  PlayerProfile,
  Schedule,
  TeamMember,
} from "../interfaces";
import {
  buildDefaultPlayers,
  buildSchedule,
  buildStats,
  pickNextColor,
  randomId,
} from "../utilities";
import ControlsPanel from "../components/matchBuilder/ControlsPanel";
import FullscreenOverlay from "../components/matchBuilder/FullscreenOverlay";
import MatchBuilderHero from "../components/matchBuilder/MatchBuilderHero";
import MatchupsPanel from "../components/matchBuilder/MatchupsPanel";
import RosterPanel from "../components/matchBuilder/RosterPanel";
import StatsPanel from "../components/matchBuilder/StatsPanel";
import "./MatchBuilderPage.css";

export default function MatchBuilderPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>(() =>
    buildDefaultPlayers(DEFAULT_PLAYERS)
  );
  const [numMatches, setNumMatches] = useState(DEFAULT_MATCHES);
  const [numCourts, setNumCourts] = useState(DEFAULT_COURTS);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [matchResults, setMatchResults] = useState<
    Record<string, MatchWinner>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRosterOpen, setIsRosterOpen] = useState(true);
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
        matchResults?: Record<string, MatchWinner>;
        isRosterOpen?: boolean;
      };
      if (Array.isArray(parsed.players)) {
        const sanitized = parsed.players.map((player, index) => ({
          id: player.id || randomId(),
          name: player.name || `Player ${index + 1}`,
          color: player.color || PLAYER_COLORS[index % PLAYER_COLORS.length],
          gender: (player.gender ?? "") as GenderOption,
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
      if (parsed.matchResults && typeof parsed.matchResults === "object") {
        setMatchResults(parsed.matchResults);
      }
      if (typeof parsed.isRosterOpen === "boolean") {
        setIsRosterOpen(parsed.isRosterOpen);
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
      JSON.stringify({
        players,
        numMatches,
        numCourts,
        schedule,
        matchResults,
        isRosterOpen,
      })
    );
  }, [
    players,
    numMatches,
    numCourts,
    schedule,
    matchResults,
    isRosterOpen,
    isLoaded,
  ]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    setNumCourts((prev) => (prev > maxCourts ? maxCourts : prev));
  }, [maxCourts, isLoaded]);

  const matches = schedule?.matches ?? [];
  const playerLookup = useMemo(() => {
    return new Map(normalizedPlayers.map((player) => [player.id, player]));
  }, [normalizedPlayers]);
  const matchRounds = useMemo(() => {
    const perRound = Math.max(1, numCourts);
    const rounds: MatchCardType[][] = [];
    for (let i = 0; i < matches.length; i += perRound) {
      rounds.push(matches.slice(i, i + perRound));
    }
    return rounds;
  }, [matches, numCourts]);
  const stats = useMemo(() => {
    if (!schedule) {
      return [];
    }
    return buildStats(normalizedPlayers, schedule.matches, matchResults);
  }, [normalizedPlayers, schedule, matchResults]);
  const statsByWins = useMemo(() => {
    return [...stats].sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return a.name.localeCompare(b.name);
    });
  }, [stats]);
  const getPlayerName = (playerId: string) =>
    playerLookup.get(playerId)?.name ?? "Unknown";
  const getPlayerColor = (playerId: string) =>
    playerLookup.get(playerId)?.color ?? "transparent";
  const resolveTeam = (team: MatchTeam): [TeamMember, TeamMember] => [
    { name: getPlayerName(team[0]), color: getPlayerColor(team[0]) },
    { name: getPlayerName(team[1]), color: getPlayerColor(team[1]) },
  ];

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (!schedule) {
      setMatchResults((prev) => (Object.keys(prev).length > 0 ? {} : prev));
      return;
    }
    const matchIds = new Set(schedule.matches.map((match) => match.id));
    setMatchResults((prev) => {
      let changed = false;
      const next: Record<string, MatchWinner> = {};
      for (const [matchId, winner] of Object.entries(prev)) {
        if (matchIds.has(matchId)) {
          next[matchId] = winner;
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [isLoaded, schedule]);

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

  const resetAll = () => {
    setPlayers(buildDefaultPlayers(DEFAULT_PLAYERS));
    setNumMatches(DEFAULT_MATCHES);
    setNumCourts(DEFAULT_COURTS);
    setSchedule(null);
    setMatchResults({});
    setActiveRound(0);
    closeFullscreen();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleSelectWinner = (matchId: string, winner: MatchWinner | null) => {
    setMatchResults((prev) => {
      if (!winner) {
        if (!prev[matchId]) {
          return prev;
        }
        const next = { ...prev };
        delete next[matchId];
        return next;
      }
      return {
        ...prev,
        [matchId]: winner,
      };
    });
  };

  const handlePlayerCountChange = (nextCount: number) => {
    setPlayers((prev) => {
      const clamped = Math.min(
        MAX_PLAYERS,
        Math.max(4, Number(nextCount) || 4)
      );
      if (clamped === prev.length) {
        return prev;
      }
      if (clamped < prev.length) {
        return prev.slice(0, clamped);
      }
      const nextPlayers = [...prev];
      for (let i = prev.length; i < clamped; i += 1) {
        nextPlayers.push({
          id: randomId(),
          name: `Player ${i + 1}`,
          color: pickNextColor(nextPlayers, i),
          gender: "" as GenderOption,
        });
      }
      return nextPlayers;
    });
  };

  const updatePlayer = (index: number, updates: Partial<PlayerProfile>) => {
    setPlayers((prev) =>
      prev.map((player, idx) =>
        idx === index ? { ...player, ...updates } : player
      )
    );
  };

  const removePlayer = (index: number) => {
    setPlayers((prev) =>
      prev.length <= 4 ? prev : prev.filter((_, idx) => idx !== index)
    );
  };

  const addPlayer = () => {
    setPlayers((prev) =>
      prev.length >= MAX_PLAYERS
        ? prev
        : [
            ...prev,
            {
              id: randomId(),
              name: `Player ${prev.length + 1}`,
              color: pickNextColor(prev, prev.length),
              gender: "" as GenderOption,
            },
          ]
    );
  };

  return (
    <div className="builder-shell text-left">
      <MatchBuilderHero />

      <ControlsPanel
        numPlayers={numPlayers}
        numMatches={numMatches}
        numCourts={numCourts}
        maxCourts={maxCourts}
        maxPlayers={MAX_PLAYERS}
        maxMatches={MAX_MATCHES}
        onPlayerCountChange={handlePlayerCountChange}
        onMatchCountChange={(value) =>
          setNumMatches(Math.min(MAX_MATCHES, Math.max(1, value)))
        }
        onCourtCountChange={(value) =>
          setNumCourts(Math.min(maxCourts, Math.max(1, value)))
        }
        onGenerateSchedule={() => {
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
          setMatchResults({});
        }}
        onClearSchedule={() => {
          setSchedule(null);
          setMatchResults({});
        }}
        onResetAll={resetAll}
        canClearSchedule={Boolean(schedule && schedule.matches.length > 0)}
      />

      <RosterPanel
        players={players}
        isOpen={isRosterOpen}
        onToggleOpen={() => setIsRosterOpen((prev) => !prev)}
        onPlayerNameChange={(index, name) =>
          updatePlayer(index, { name })
        }
        onPlayerColorChange={(index, color) =>
          updatePlayer(index, { color })
        }
        onPlayerGenderChange={(index, gender) =>
          updatePlayer(index, { gender })
        }
        onRemovePlayer={removePlayer}
        onAddPlayer={addPlayer}
        canRemovePlayer={players.length > 4}
        canAddPlayer={players.length < MAX_PLAYERS}
      />

      {numPlayers < 4 ? (
        <div className="table-panel">
          <p className="empty-state">
            You need at least 4 players to build doubles matches.
          </p>
        </div>
      ) : (
        <div className="builder-grid">
          <MatchupsPanel
            matchRounds={matchRounds}
            matchResults={matchResults}
            onSelectWinner={handleSelectWinner}
            onOpenFullscreen={openFullscreen}
            resolveTeam={resolveTeam}
            matchesCount={matches.length}
          />

          <StatsPanel stats={stats} />
        </div>
      )}

      <FullscreenOverlay
        isOpen={isFullscreen}
        fullscreenRef={fullscreenRef}
        activeRound={activeRound}
        matchRounds={matchRounds}
        matchResults={matchResults}
        statsByWins={statsByWins}
        onSelectWinner={handleSelectWinner}
        onPreviousRound={() => setActiveRound((prev) => Math.max(0, prev - 1))}
        onNextRound={() =>
          setActiveRound((prev) =>
            Math.min(matchRounds.length - 1, prev + 1)
          )
        }
        onClose={closeFullscreen}
        resolveTeam={resolveTeam}
      />
    </div>
  );
}
