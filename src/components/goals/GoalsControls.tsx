import type { OpponentLevel } from "../../interfaces";

type GoalsControlsProps = {
  numMatches: number;
  ratingRange: string;
  defaultOpponentLevel: OpponentLevel;
  isOpen: boolean;
  onToggleOpen: () => void;
  onChangeNumMatches: (value: number) => void;
  onChangeRatingRange: (value: string) => void;
  onChangeOpponentLevel: (level: OpponentLevel) => void;
  onGenerate: () => void;
};

const clampMatchCount = (value: number) =>
  Math.min(20, Math.max(1, Number.isFinite(value) ? value : 1));

export default function GoalsControls({
  numMatches,
  ratingRange,
  defaultOpponentLevel,
  isOpen,
  onToggleOpen,
  onChangeNumMatches,
  onChangeRatingRange,
  onChangeOpponentLevel,
  onGenerate,
}: GoalsControlsProps) {
  return (
    <section className="panel-glass panel-glass-card">
      <div className="panel-header">
        <h2 className="panel-title">Goals setup</h2>
        <button type="button" className="btn-ghost" onClick={onToggleOpen}>
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>
      {isOpen ? (
        <>
          <div className="panel-glass-body">
            <label className="control">
              <span className="control-label">Matches this session</span>
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
              <span className="control-label">Level of play</span>
              <select
                value={ratingRange}
                onChange={(e) => onChangeRatingRange(e.target.value)}
              >
                <option value="2-2.5">2-2.5</option>
                <option value="3-3.5">3-3.5</option>
                <option value="3.5-4">3.5-4</option>
                <option value="4+">4+</option>
              </select>
            </label>

            <label className="control">
              <span className="control-label">Opponent level</span>
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
          </div>

          <button type="button" onClick={onGenerate} className="btn-primary">
            Generate goals
          </button>
        </>
      ) : null}
    </section>
  );
}
