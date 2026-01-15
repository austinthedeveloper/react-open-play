import type { ReactNode } from "react";

export type ControlsPanelProps = {
  numPlayers: number;
  numMatches: number;
  numCourts: number;
  maxCourts: number;
  maxPlayers: number;
  maxMatches: number;
  onPlayerCountChange: (nextCount: number) => void;
  onMatchCountChange: (nextCount: number) => void;
  onCourtCountChange: (nextCount: number) => void;
  onGenerateSchedule: () => void;
  onClearSchedule: () => void;
  onResetAll: () => void;
  canClearSchedule: boolean;
  actionsSlot?: ReactNode;
};

export default function ControlsPanel({
  numPlayers,
  numMatches,
  numCourts,
  maxCourts,
  maxPlayers,
  maxMatches,
  onPlayerCountChange,
  onMatchCountChange,
  onCourtCountChange,
  onGenerateSchedule,
  onClearSchedule,
  onResetAll,
  canClearSchedule,
  actionsSlot,
}: ControlsPanelProps) {
  return (
    <section className="controls-panel">
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
