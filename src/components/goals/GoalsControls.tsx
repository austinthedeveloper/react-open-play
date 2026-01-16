import type { OpponentLevel } from "../../interfaces";

type GoalsControlsProps = {
  numMatches: number;
  defaultOpponentLevel: OpponentLevel;
  onChangeNumMatches: (value: number) => void;
  onChangeOpponentLevel: (level: OpponentLevel) => void;
  onGenerate: () => void;
};

const clampMatchCount = (value: number) =>
  Math.min(20, Math.max(1, Number.isFinite(value) ? value : 1));

export default function GoalsControls({
  numMatches,
  defaultOpponentLevel,
  onChangeNumMatches,
  onChangeOpponentLevel,
  onGenerate,
}: GoalsControlsProps) {
  return (
    <section className="controls-panel">
      <label className="control">
        <span>Matches this session</span>
        <input
          type="number"
          min={1}
          max={20}
          value={numMatches}
          onChange={(e) =>
            onChangeNumMatches(clampMatchCount(Number(e.target.value)))
          }
        />
      </label>

      <label className="control">
        <span>Opponent level</span>
        <select
          value={defaultOpponentLevel}
          onChange={(e) =>
            onChangeOpponentLevel(e.target.value as OpponentLevel)
          }
        >
          <option value="lower">Lower</option>
          <option value="same">Same</option>
          <option value="higher">Higher</option>
        </select>
      </label>

      <button type="button" onClick={onGenerate} className="glow-button">
        Generate goals
      </button>
    </section>
  );
}
