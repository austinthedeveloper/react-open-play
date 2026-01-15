import type { ReactNode } from "react";
import type { MatchType } from "../../interfaces";

export type ControlsPanelProps = {
  matchType: MatchType;
  matchTypeOptions: { value: MatchType; label: string }[];
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
};

export default function ControlsPanel({
  matchType,
  matchTypeOptions,
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
}: ControlsPanelProps) {
  return (
    <section className="controls-panel">
      <label className="control">
        <span>Match type</span>
        <select
          value={matchType}
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
      </label>

      <label className="control">
        <span>Number of players</span>
        <input
          type="number"
          min={4}
          max={maxPlayers}
          value={numPlayers}
          onChange={(event) =>
            onPlayerCountChange(Number(event.target.value) || 4)
          }
        />
      </label>

      <label className="control">
        <span>Number of rounds</span>
        <input
          type="number"
          min={1}
          max={maxMatches}
          value={numMatches}
          onChange={(event) =>
            onMatchCountChange(Number(event.target.value) || 1)
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
          onChange={(event) =>
            onCourtCountChange(Number(event.target.value) || 1)
          }
        />
      </label>

      <label className="control">
        <span>Court numbers (optional)</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 3, 6"
          value={courtNumbers}
          onChange={(event) => onCourtNumbersChange(event.target.value)}
        />
      </label>

      <div className="control-actions">
        <button type="button" onClick={onGenerateSchedule} className="glow-button">
          Generate schedule
        </button>
        <button
          type="button"
          onClick={onClearSchedule}
          className="ghost-button"
          disabled={!canClearSchedule}
        >
          Clear schedule
        </button>
        <button type="button" onClick={onResetAll} className="ghost-button">
          Reset all
        </button>
        {actionsSlot}
      </div>
    </section>
  );
}
