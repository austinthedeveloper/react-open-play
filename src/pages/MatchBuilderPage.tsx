import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DEFAULT_COURTS,
  DEFAULT_MATCHES,
  DEFAULT_PLAYERS,
  DEFAULT_MATCH_TYPE,
  MAX_MATCHES,
  MAX_PLAYERS,
  MATCH_TYPES,
} from "../data";
import type {
  GenderOption,
  MatchCard as MatchCardType,
  MatchTeam,
  MatchType,
  MatchWinner,
  PlayerProfile,
  TeamMember,
} from "../interfaces";
import {
  buildDefaultPlayers,
  buildSchedule,
  buildStats,
  pickNextColor,
  randomId,
} from "../utilities";
import { matchBuilderActions } from "../store/matchBuilderSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  formatCourtNumbers,
  parseCourtNumbers,
} from "../store/matchBuilderStorage";
import ControlsPanel from "../components/matchBuilder/ControlsPanel";
import FullscreenOverlay from "../components/matchBuilder/FullscreenOverlay";
import MatchBuilderHero from "../components/matchBuilder/MatchBuilderHero";
import MatchupsPanel from "../components/matchBuilder/MatchupsPanel";
import RosterPanel from "../components/matchBuilder/RosterPanel";
import StatsPanel from "../components/matchBuilder/StatsPanel";
import "./MatchBuilderPage.css";

const resolveMatchTypeLabel = (type: MatchType) =>
  MATCH_TYPES.find((option) => option.value === type)?.label ?? "Round Robin";

export default function MatchBuilderPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id: matchId } = useParams();
  const players = useAppSelector((state) => state.matchBuilder.players);
  const matchType = useAppSelector((state) => state.matchBuilder.matchType);
  const numMatches = useAppSelector((state) => state.matchBuilder.numMatches);
  const numCourts = useAppSelector((state) => state.matchBuilder.numCourts);
  const courtNumbers = useAppSelector(
    (state) => state.matchBuilder.courtNumbers
  );
  const courtNumbersText = useAppSelector(
    (state) => state.matchBuilder.courtNumbersText
  );
  const schedule = useAppSelector((state) => state.matchBuilder.schedule);
  const matchResults = useAppSelector(
    (state) => state.matchBuilder.matchResults
  );
  const isRosterOpen = useAppSelector(
    (state) => state.matchBuilder.isRosterOpen
  );
  const activeMatchId = useAppSelector(
    (state) => state.matchBuilder.activeMatchId
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const fullscreenRef = useRef<HTMLDivElement | null>(null);
  const isSessionView = Boolean(matchId);

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
    if (numCourts > maxCourts) {
      dispatch(matchBuilderActions.setNumCourts(maxCourts));
    }
  }, [dispatch, maxCourts, numCourts]);

  useEffect(() => {
    if (courtNumbers.length <= maxCourts) {
      return;
    }
    const trimmed = courtNumbers.slice(0, maxCourts);
    dispatch(matchBuilderActions.setCourtNumbers(trimmed));
    dispatch(
      matchBuilderActions.setCourtNumbersText(formatCourtNumbers(trimmed))
    );
  }, [courtNumbers, dispatch, maxCourts]);

  const matches = schedule?.matches ?? [];
  const isScheduleGenerated = matches.length > 0;
  const activeCourtNumbers = useMemo(() => {
    const fallback = Array.from(
      { length: Math.max(1, numCourts) },
      (_, index) => index + 1
    );
    const selected = courtNumbers.length > 0 ? courtNumbers : fallback;
    return selected.slice(0, Math.max(1, maxCourts));
  }, [courtNumbers, maxCourts, numCourts]);
  const activeCourtCount = Math.max(1, activeCourtNumbers.length);
  const matchTypeLabel = resolveMatchTypeLabel(matchType);
  const playerLookup = useMemo(() => {
    return new Map(normalizedPlayers.map((player) => [player.id, player]));
  }, [normalizedPlayers]);
  const matchRounds = useMemo(() => {
    const perRound = Math.max(1, activeCourtCount);
    const rounds: MatchCardType[][] = [];
    for (let i = 0; i < matches.length; i += perRound) {
      rounds.push(matches.slice(i, i + perRound));
    }
    return rounds;
  }, [matches, activeCourtCount]);
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
    if (!schedule) {
      if (Object.keys(matchResults).length > 0) {
        dispatch(matchBuilderActions.setMatchResults({}));
      }
      return;
    }
    const matchIds = new Set(schedule.matches.map((match) => match.id));
    let changed = false;
    const next: Record<string, MatchWinner> = {};
    for (const [matchId, winner] of Object.entries(matchResults)) {
      if (matchIds.has(matchId)) {
        next[matchId] = winner;
      } else {
        changed = true;
      }
    }
    if (changed) {
      dispatch(matchBuilderActions.setMatchResults(next));
    }
  }, [dispatch, matchResults, schedule]);

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

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  const resetAll = useCallback(() => {
    dispatch(matchBuilderActions.clearActiveMatch());
    dispatch(matchBuilderActions.setPlayers(buildDefaultPlayers(DEFAULT_PLAYERS)));
    dispatch(matchBuilderActions.setMatchType(DEFAULT_MATCH_TYPE));
    dispatch(matchBuilderActions.setNumMatches(DEFAULT_MATCHES));
    dispatch(matchBuilderActions.setNumCourts(DEFAULT_COURTS));
    dispatch(matchBuilderActions.setCourtNumbers([]));
    dispatch(matchBuilderActions.setCourtNumbersText(""));
    dispatch(matchBuilderActions.setSchedule(null));
    dispatch(matchBuilderActions.setMatchResults({}));
    dispatch(matchBuilderActions.setIsRosterOpen(true));
    setActiveRound(0);
    closeFullscreen();
  }, [closeFullscreen, dispatch]);

  useEffect(() => {
    if (!matchId) {
      resetAll();
      return;
    }
    if (activeMatchId !== matchId) {
      dispatch(matchBuilderActions.loadMatchSession(matchId));
    }
  }, [activeMatchId, dispatch, matchId, resetAll]);

  const handleSelectWinner = (matchId: string, winner: MatchWinner | null) => {
    if (!winner) {
      if (!matchResults[matchId]) {
        return;
      }
      const next = { ...matchResults };
      delete next[matchId];
      dispatch(matchBuilderActions.setMatchResults(next));
      return;
    }
    dispatch(
      matchBuilderActions.setMatchResults({
        ...matchResults,
        [matchId]: winner,
      })
    );
  };

  const handlePlayerCountChange = (nextCount: number) => {
    const clamped = Math.min(
      MAX_PLAYERS,
      Math.max(4, Number(nextCount) || 4)
    );
    if (clamped === players.length) {
      return;
    }
    if (clamped < players.length) {
      dispatch(matchBuilderActions.setPlayers(players.slice(0, clamped)));
      return;
    }
    const nextPlayers = [...players];
    for (let i = players.length; i < clamped; i += 1) {
      nextPlayers.push({
        id: randomId(),
        name: `Player ${i + 1}`,
        color: pickNextColor(nextPlayers, i),
        gender: "" as GenderOption,
      });
    }
    dispatch(matchBuilderActions.setPlayers(nextPlayers));
  };

  const updatePlayer = (index: number, updates: Partial<PlayerProfile>) => {
    dispatch(
      matchBuilderActions.setPlayers(
        players.map((player, idx) =>
          idx === index ? { ...player, ...updates } : player
        )
      )
    );
  };

  const removePlayer = (index: number) => {
    if (players.length <= 4) {
      return;
    }
    dispatch(
      matchBuilderActions.setPlayers(
        players.filter((_, idx) => idx !== index)
      )
    );
  };

  const addPlayer = () => {
    if (players.length >= MAX_PLAYERS) {
      return;
    }
    dispatch(
      matchBuilderActions.setPlayers([
        ...players,
        {
          id: randomId(),
          name: `Player ${players.length + 1}`,
          color: pickNextColor(players, players.length),
          gender: "" as GenderOption,
        },
      ])
    );
  };

  return (
    <div className="builder-shell text-left">
      <MatchBuilderHero matchTypeLabel={matchTypeLabel} />

      <ControlsPanel
        matchType={matchType}
        matchTypeOptions={MATCH_TYPES}
        isScheduleGenerated={isScheduleGenerated}
        numPlayers={numPlayers}
        numMatches={numMatches}
        numCourts={numCourts}
        maxCourts={maxCourts}
        maxPlayers={MAX_PLAYERS}
        maxMatches={MAX_MATCHES}
        courtNumbers={courtNumbersText}
        onPlayerCountChange={handlePlayerCountChange}
        onMatchCountChange={(value) =>
          dispatch(
            matchBuilderActions.setNumMatches(
              Math.min(MAX_MATCHES, Math.max(1, value))
            )
          )
        }
        onCourtCountChange={(value) =>
          dispatch(
            matchBuilderActions.setNumCourts(
              Math.min(maxCourts, Math.max(1, value))
            )
          )
        }
        onMatchTypeChange={(value) =>
          dispatch(matchBuilderActions.setMatchType(value))
        }
        onCourtNumbersChange={(value) => {
          dispatch(matchBuilderActions.setCourtNumbersText(value));
          dispatch(matchBuilderActions.setCourtNumbers(parseCourtNumbers(value)));
        }}
        onGenerateSchedule={() => {
          if (numPlayers < 4) {
            dispatch(matchBuilderActions.setSchedule(null));
            return;
          }
          const matchesList = buildSchedule(
            normalizedPlayers,
            numMatches,
            activeCourtCount
          );
          const nextId = randomId();
          dispatch(
            matchBuilderActions.createMatchSession({
              id: nextId,
              schedule: { matches: matchesList },
            })
          );
          navigate(`/match-builder/${nextId}`);
        }}
        onClearSchedule={() => {
          dispatch(matchBuilderActions.setSchedule(null));
          dispatch(matchBuilderActions.setMatchResults({}));
        }}
        onResetAll={resetAll}
        canClearSchedule={Boolean(schedule && schedule.matches.length > 0)}
        showActions={!isSessionView}
      />

      <RosterPanel
        players={players}
        isOpen={isRosterOpen}
        onToggleOpen={() =>
          dispatch(matchBuilderActions.setIsRosterOpen(!isRosterOpen))
        }
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
            activeRound={activeRound}
            onPreviousRound={() =>
              setActiveRound((prev) => Math.max(0, prev - 1))
            }
            onNextRound={() =>
              setActiveRound((prev) =>
                Math.min(matchRounds.length - 1, prev + 1)
              )
            }
            resolveTeam={resolveTeam}
            matchesCount={matches.length}
            courtNumbers={activeCourtNumbers}
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
        courtNumbers={activeCourtNumbers}
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
