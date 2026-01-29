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
  MatchSession,
  MatchType,
  MatchWinner,
  PlayerProfile,
  TeamMember,
} from "../interfaces";
import {
  buildDefaultPlayers,
  buildSchedule,
  buildStats,
  BYE_PLAYER_ID,
  pickNextColor,
  randomId,
  resolveMatchTeam,
  resolveScheduleMatches,
  validateMixedDoublesPairing,
} from "../utilities";
import { matchBuilderActions } from "../store/matchBuilderSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  formatCourtNumbers,
  parseCourtNumbers,
} from "../store/matchBuilderStorage";
import { matchesService } from "../services/matchesService";
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
  const partnerPairs = useAppSelector(
    (state) => state.matchBuilder.partnerPairs
  );
  const isControlsOpen = useAppSelector(
    (state) => state.matchBuilder.isControlsOpen
  );
  const isRosterOpen = useAppSelector(
    (state) => state.matchBuilder.isRosterOpen
  );
  const activeMatchId = useAppSelector(
    (state) => state.matchBuilder.activeMatchId
  );
  const matchHistory = useAppSelector(
    (state) => state.matchBuilder.matchHistory
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeRound, setActiveRound] = useState(0);
  const [pairingError, setPairingError] = useState<string | null>(null);
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
  const resolvedMatches = useMemo(() => {
    if (!schedule) {
      return [];
    }
    return resolveScheduleMatches(schedule, matchResults);
  }, [matchResults, schedule]);
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
  const playerOrderLookup = useMemo(() => {
    return new Map(normalizedPlayers.map((player, index) => [player.id, index]));
  }, [normalizedPlayers]);
  const partnerLookup = useMemo(() => {
    const lookup = new Map<string, string>();
    for (const [first, second] of partnerPairs) {
      lookup.set(first, second);
      lookup.set(second, first);
    }
    return lookup;
  }, [partnerPairs]);
  const matchLookup = useMemo(
    () => new Map(matches.map((match) => [match.id, match])),
    [matches]
  );
  const matchRoundLookup = useMemo(() => {
    const lookup = new Map<string, number>();
    if (!schedule?.rounds) {
      return lookup;
    }
    schedule.rounds.forEach((round, roundIndex) => {
      round.forEach((match) => {
        lookup.set(match.id, roundIndex);
      });
    });
    return lookup;
  }, [schedule]);
  const bracketRoundStatus = useMemo(() => {
    if (!schedule?.rounds) {
      return [];
    }
    return schedule.rounds.map((round) =>
      round.every((match) => Boolean(matchResults[match.id]))
    );
  }, [matchResults, schedule]);
  const matchRounds = useMemo(() => {
    if (schedule?.rounds && schedule.rounds.length > 0) {
      const resolvedLookup = new Map(
        resolvedMatches.map((match) => [match.id, match])
      );
      const roundChunks: MatchCardType[][] = [];
      const perRound = Math.max(1, activeCourtCount);
      schedule.rounds.forEach((round) => {
        const resolvedRound = round.map(
          (match) => resolvedLookup.get(match.id) ?? match
        );
        for (let i = 0; i < resolvedRound.length; i += perRound) {
          roundChunks.push(resolvedRound.slice(i, i + perRound));
        }
      });
      return roundChunks;
    }
    const perRound = Math.max(1, activeCourtCount);
    const rounds: MatchCardType[][] = [];
    for (let i = 0; i < resolvedMatches.length; i += perRound) {
      rounds.push(resolvedMatches.slice(i, i + perRound));
    }
    return rounds;
  }, [activeCourtCount, resolvedMatches, schedule]);
  const matchRoundLabels = useMemo(() => {
    if (schedule?.rounds && schedule.rounds.length > 0) {
      const perRound = Math.max(1, activeCourtCount);
      const labels: string[] = [];
      schedule.rounds.forEach((round, roundIndex) => {
        const chunkCount = Math.max(1, Math.ceil(round.length / perRound));
        for (let i = 0; i < chunkCount; i += 1) {
          const letter =
            chunkCount > 1
              ? String.fromCharCode(65 + (i % 26))
              : "";
          labels.push(`Round ${roundIndex + 1}${letter}`);
        }
      });
      return labels;
    }
    return matchRounds.map((_, index) => `Round ${index + 1}`);
  }, [activeCourtCount, matchRounds, schedule]);
  const stats = useMemo(() => {
    if (!schedule) {
      return [];
    }
    return buildStats(normalizedPlayers, resolvedMatches, matchResults);
  }, [normalizedPlayers, resolvedMatches, matchResults, schedule]);
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
  const resolvePlayer = (playerId: string) => {
    if (playerId === BYE_PLAYER_ID) {
      return { name: "BYE", color: "transparent" };
    }
    if (!playerId) {
      return { name: "TBD", color: "transparent" };
    }
    return { name: getPlayerName(playerId), color: getPlayerColor(playerId) };
  };
  const resolveTeam = (
    match: MatchCardType,
    teamIndex: 0 | 1
  ): [TeamMember, TeamMember] => {
    const sourceId = match.sourceMatchIds?.[teamIndex];
    if (sourceId) {
      const sourceRound = matchRoundLookup.get(sourceId);
      if (
        typeof sourceRound === "number" &&
        !bracketRoundStatus[sourceRound]
      ) {
        const sourceMatch = matchLookup.get(sourceId);
        const label = sourceMatch
          ? `Winner of Match ${sourceMatch.index}`
          : "TBD";
        return [
          { name: label, color: "transparent" },
          { name: label, color: "transparent" },
        ];
      }
    }
    const resolvedTeam = resolveMatchTeam(
      match,
      teamIndex,
      matchLookup,
      matchResults
    );
    if (resolvedTeam) {
      return [resolvePlayer(resolvedTeam[0]), resolvePlayer(resolvedTeam[1])];
    }
    const sourceMatch = sourceId ? matchLookup.get(sourceId) : null;
    const label = sourceMatch
      ? `Winner of Match ${sourceMatch.index}`
      : "TBD";
    return [
      { name: label, color: "transparent" },
      { name: label, color: "transparent" },
    ];
  };

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
    dispatch(matchBuilderActions.setPartnerPairs([]));
    setPairingError(null);
    dispatch(matchBuilderActions.setIsControlsOpen(true));
    dispatch(matchBuilderActions.setIsRosterOpen(true));
    setActiveRound(0);
    closeFullscreen();
  }, [closeFullscreen, dispatch]);

  useEffect(() => {
    if (matchType !== "mixed_doubles") {
      if (pairingError) {
        setPairingError(null);
      }
      return;
    }
    const nextError = validateMixedDoublesPairing(players, partnerPairs);
    if (!pairingError) {
      return;
    }
    if (!nextError) {
      setPairingError(null);
      return;
    }
    if (nextError !== pairingError) {
      setPairingError(nextError);
    }
  }, [matchType, pairingError, partnerPairs, players]);

  useEffect(() => {
    if (!matchId) {
      resetAll();
      return;
    }
    if (activeMatchId === matchId) {
      return;
    }
    const existingSession = matchHistory.find((entry) => entry.id === matchId);
    if (existingSession) {
      dispatch(matchBuilderActions.loadMatchSession(matchId));
      return;
    }
    let isActive = true;
    matchesService
      .get(matchId)
      .then((session) => {
        if (!isActive) {
          return;
        }
        dispatch(matchBuilderActions.upsertMatchSession(session));
        dispatch(matchBuilderActions.loadMatchSession(matchId));
      })
      .catch((error) => {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load match session";
        console.warn(message);
      });
    return () => {
      isActive = false;
    };
  }, [activeMatchId, dispatch, matchHistory, matchId, resetAll]);

  useEffect(() => {
    if (!activeMatchId) {
      return;
    }
    const patch: Partial<MatchSession> = {
      matchType,
      players,
      numMatches,
      numCourts,
      courtNumbers,
      schedule,
      matchResults,
      partnerPairs,
    };
    matchesService.update(activeMatchId, patch).catch((error) => {
      const message =
        error instanceof Error ? error.message : "Unable to save match updates";
      console.warn(message);
    });
  }, [
    activeMatchId,
    courtNumbers,
    matchResults,
    matchType,
    numCourts,
    numMatches,
    partnerPairs,
    players,
    schedule,
  ]);

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

  const handlePartnerChange = (playerId: string, partnerId?: string | null) => {
    if (!playerId) {
      return;
    }
    const nextPairs = partnerPairs.filter(
      (pair) => !pair.includes(playerId) && !pair.includes(partnerId ?? "")
    );
    if (partnerId && partnerId !== playerId) {
      const firstIndex = playerOrderLookup.get(playerId) ?? 0;
      const secondIndex = playerOrderLookup.get(partnerId) ?? 0;
      const ordered: [string, string] =
        firstIndex <= secondIndex
          ? [playerId, partnerId]
          : [partnerId, playerId];
      nextPairs.push(ordered);
    }
    dispatch(matchBuilderActions.setPartnerPairs(nextPairs));
  };

  const handleGenerateSchedule = async () => {
    if (numPlayers < 4) {
      dispatch(matchBuilderActions.setSchedule(null));
      return;
    }
    if (matchType === "mixed_doubles") {
      const validationError = validateMixedDoublesPairing(
        normalizedPlayers,
        partnerPairs
      );
      if (validationError) {
        setPairingError(validationError);
        return;
      }
    }
    setPairingError(null);
    const { schedule: nextSchedule, matchResults: nextResults } = buildSchedule(
      normalizedPlayers,
      numMatches,
      activeCourtCount,
      matchType,
      partnerPairs
    );
    const nextId = randomId();
    const session: MatchSession = {
      id: nextId,
      createdAt: Date.now(),
      matchType,
      players,
      numMatches,
      numCourts,
      courtNumbers,
      schedule: nextSchedule,
      matchResults: nextResults,
      partnerPairs,
    };
    try {
      const savedSession = await matchesService.create(session);
      const mergedSession: MatchSession = {
        ...savedSession,
        partnerPairs:
          partnerPairs.length > 0 &&
          (!savedSession.partnerPairs ||
            savedSession.partnerPairs.length === 0)
            ? partnerPairs
            : savedSession.partnerPairs ?? [],
      };
      dispatch(matchBuilderActions.setActiveMatchSession(mergedSession));
      navigate(`/match-builder/${mergedSession.id}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to save match session";
      console.warn(message);
      dispatch(matchBuilderActions.setActiveMatchSession(session));
      navigate(`/match-builder/${nextId}`);
    }
  };

  return (
    <div className="builder-shell text-left">
      <MatchBuilderHero matchTypeLabel={matchTypeLabel} />

      <ControlsPanel
        matchType={matchType}
        matchTypeOptions={MATCH_TYPES}
        isScheduleGenerated={isScheduleGenerated}
        isOpen={isControlsOpen}
        onToggleOpen={() =>
          dispatch(matchBuilderActions.setIsControlsOpen(!isControlsOpen))
        }
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
          void handleGenerateSchedule();
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
        showGenderSelect={matchType === "mixed_doubles"}
        showPartnerSelect={matchType === "tournament" || matchType === "mixed_doubles"}
        warningText={pairingError ?? undefined}
        partnerLookup={partnerLookup}
        onPartnerChange={handlePartnerChange}
        onRemovePlayer={removePlayer}
        onAddPlayer={addPlayer}
        canRemovePlayer={players.length > 4}
        canAddPlayer={players.length < MAX_PLAYERS}
      />

      {numPlayers < 4 ? (
        <div className="panel">
          <p className="empty-state">
            You need at least 4 players to build doubles matches.
          </p>
        </div>
      ) : (
        <div className="builder-grid">
          <MatchupsPanel
            matchRounds={matchRounds}
            roundLabels={matchRoundLabels}
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
        roundLabels={matchRoundLabels}
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
