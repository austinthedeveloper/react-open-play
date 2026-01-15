import type { GenderOption, PlayerProfile } from "../../interfaces";
import "./RosterPanel.css";

export type RosterPanelProps = {
  players: PlayerProfile[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onPlayerNameChange: (index: number, name: string) => void;
  onPlayerColorChange: (index: number, color: string) => void;
  onPlayerGenderChange: (index: number, gender: GenderOption) => void;
  onRemovePlayer: (index: number) => void;
  onAddPlayer: () => void;
  canRemovePlayer: boolean;
  canAddPlayer: boolean;
};

export default function RosterPanel({
  players,
  isOpen,
  onToggleOpen,
  onPlayerNameChange,
  onPlayerColorChange,
  onPlayerGenderChange,
  onRemovePlayer,
  onAddPlayer,
  canRemovePlayer,
  canAddPlayer,
}: RosterPanelProps) {
  return (
    <section className="table-panel">
      <div className="panel-header">
        <h2 className="panel-title">Roster</h2>
        <button type="button" className="ghost-button" onClick={onToggleOpen}>
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>
      <p className="panel-subtitle">
        Edit player names here. Optionally set a color or gender for each player.
      </p>
      {isOpen ? (
        <>
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
                  onChange={(event) =>
                    onPlayerNameChange(index, event.target.value)
                  }
                  placeholder={`Player ${index + 1}`}
                />
                <input
                  type="color"
                  className="color-input"
                  value={player.color || "#0b0d12"}
                  onChange={(event) =>
                    onPlayerColorChange(index, event.target.value)
                  }
                  aria-label={`Color for player ${index + 1}`}
                />
                <div
                  className="gender-toggle"
                  role="group"
                  aria-label={`Gender for player ${index + 1}`}
                >
                  <button
                    type="button"
                    className={`gender-toggle-button ${
                      player.gender === "male" ? "is-active" : ""
                    }`}
                    data-value="male"
                    aria-pressed={player.gender === "male"}
                    aria-label="Male"
                    onClick={() => onPlayerGenderChange(index, "male")}
                  >
                    <span className="material-icons" aria-hidden="true">
                      male
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`gender-toggle-button ${
                      !player.gender ? "is-active" : ""
                    }`}
                    data-value=""
                    aria-pressed={!player.gender}
                    aria-label="Unspecified"
                    onClick={() => onPlayerGenderChange(index, "")}
                  >
                    <span className="material-icons" aria-hidden="true">
                      remove
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`gender-toggle-button ${
                      player.gender === "female" ? "is-active" : ""
                    }`}
                    data-value="female"
                    aria-pressed={player.gender === "female"}
                    aria-label="Female"
                    onClick={() => onPlayerGenderChange(index, "female")}
                  >
                    <span className="material-icons" aria-hidden="true">
                      female
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onRemovePlayer(index)}
                  disabled={!canRemovePlayer}
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
              onClick={onAddPlayer}
              disabled={!canAddPlayer}
            >
              Add player
            </button>
            <span className="roster-note">{players.length} players</span>
          </div>
        </>
      ) : null}
    </section>
  );
}
