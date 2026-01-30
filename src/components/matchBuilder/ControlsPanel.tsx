import type { ReactNode } from "react";
import type { MatchType } from "../../interfaces";

export type ControlsPanelProps = {
  matchType: MatchType;
  matchTypeOptions: ReadonlyArray<{
    value: MatchType;
    label: string;
    description?: string;
  }>;
  isOpen: boolean;
  onToggleOpen: () => void;
  isScheduleGenerated?: boolean;
  numPlayers: number;
  numMatches: number;
  numCourts: number;
  maxCourts: number;
  maxPlayers: number;
  maxMatches: number;
  courtNumbers: string;
  onPlayerCountChange: (nextCount: number) => void;
  onMatchCountChange: (nextCount: number) => void;
  onCourtCountChange: (nextCount: number) => void;
  onMatchTypeChange: (nextType: MatchType) => void;
  onCourtNumbersChange: (nextNumbers: string) => void;
  onGenerateSchedule: () => void;
  onClearSchedule: () => void;
  onResetAll: () => void;
  canClearSchedule: boolean;
  actionsSlot?: ReactNode;
  showActions?: boolean;
};

export default function ControlsPanel({
  matchType,
  matchTypeOptions,
  isOpen,
  onToggleOpen,
  numPlayers,
  numMatches,
  numCourts,
  maxCourts,
  maxPlayers,
  maxMatches,
  courtNumbers,
  onPlayerCountChange,
  onMatchCountChange,
  onCourtCountChange,
  onMatchTypeChange,
  onCourtNumbersChange,
  onGenerateSchedule,
  onClearSchedule,
  onResetAll,
  canClearSchedule,
  actionsSlot,
  showActions = true,
  isScheduleGenerated = false,
}: ControlsPanelProps) {
  const lockedMessage =
    "Locked after schedule generation. Clear schedule to change.";
  const selectedMatchType = matchTypeOptions.find(
    (option) => option.value === matchType
  );
  return (
    <section className="panel-glass panel-glass-card">
      <div className="panel-header">
        <h2 className="panel-title">Match type</h2>
        <button type="button" className="btn-ghost" onClick={onToggleOpen}>
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>
      {isOpen ? (
        <>
          {selectedMatchType?.description ? (
            <p className="panel-subtitle">{selectedMatchType.description}</p>
          ) : null}
          <div className="panel-glass-body">
            <label className="control">
              <span className="control-label">
                Match type
                {isScheduleGenerated ? (
                  <span className="control-lock">Locked</span>
                ) : null}
              </span>
              <select
                value={matchType}
                disabled={isScheduleGenerated}
                title={isScheduleGenerated ? lockedMessage : undefined}
                onChange={(event) =>
                  onMatchTypeChange(event.target.value as MatchType)
                }
              >
                {matchTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isScheduleGenerated ? (
                <small className="control-helper">{lockedMessage}</small>
              ) : null}
            </label>

            <label className="control">
              <span className="control-label">
                Number of players
                {isScheduleGenerated ? (
                  <span className="control-lock">Locked</span>
                ) : null}
              </span>
              <input
                type="number"
                min={4}
                max={maxPlayers}
                value={numPlayers}
                disabled={isScheduleGenerated}
                title={isScheduleGenerated ? lockedMessage : undefined}
                onChange={(event) =>
                  onPlayerCountChange(Number(event.target.value) || 4)
                }
              />
              {isScheduleGenerated ? (
                <small className="control-helper">{lockedMessage}</small>
              ) : null}
            </label>

            <label className="control">
              <span className="control-label">
                Number of rounds
                {isScheduleGenerated ? (
                  <span className="control-lock">Locked</span>
                ) : null}
              </span>
              <input
                type="number"
                min={1}
                max={maxMatches}
                value={numMatches}
                disabled={isScheduleGenerated}
                title={isScheduleGenerated ? lockedMessage : undefined}
                onChange={(event) =>
                  onMatchCountChange(Number(event.target.value) || 1)
                }
              />
              {isScheduleGenerated ? (
                <small className="control-helper">{lockedMessage}</small>
              ) : null}
            </label>
            <label className="control">
              <span className="control-label">
                Number of courts
                {isScheduleGenerated ? (
                  <span className="control-lock">Locked</span>
                ) : null}
              </span>
              <input
                type="number"
                min={1}
                max={maxCourts}
                value={numCourts}
                disabled={isScheduleGenerated}
                title={isScheduleGenerated ? lockedMessage : undefined}
                onChange={(event) =>
                  onCourtCountChange(Number(event.target.value) || 1)
                }
              />
              {isScheduleGenerated ? (
                <small className="control-helper">{lockedMessage}</small>
              ) : null}
            </label>

            <label className="control">
              <span className="control-label">Court numbers (optional)</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 3, 6"
                value={courtNumbers}
                onChange={(event) => onCourtNumbersChange(event.target.value)}
              />
            </label>
          </div>

          {showActions && (
            <div className="control-actions">
              <button
                type="button"
                onClick={onGenerateSchedule}
                className="btn-primary"
                disabled={isScheduleGenerated}
              >
                Generate schedule
              </button>
              <button
                type="button"
                onClick={onClearSchedule}
                className="btn-ghost"
                disabled={!canClearSchedule}
              >
                Clear schedule
              </button>
              <button
                type="button"
                onClick={onResetAll}
                className="btn-ghost"
              >
                Reset all
              </button>
              {actionsSlot}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
