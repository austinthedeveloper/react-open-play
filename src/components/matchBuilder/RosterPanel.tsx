import type { GenderOption, PlayerProfile } from "../../interfaces";
import "./RosterPanel.css";

export type RosterPanelProps = {
  players: PlayerProfile[];
  isOpen: boolean;
  onToggleOpen: () => void;
  onPlayerNameChange: (index: number, name: string) => void;
  onPlayerColorChange: (index: number, color: string) => void;
  onPlayerGenderChange: (index: number, gender: GenderOption) => void;
  showGenderSelect?: boolean;
  showPartnerSelect?: boolean;
  warningText?: string;
  partnerLookup?: Map<string, string>;
  onPartnerChange?: (playerId: string, partnerId?: string | null) => void;
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
  showGenderSelect = true,
  showPartnerSelect = false,
  warningText,
  partnerLookup,
  onPartnerChange,
  onRemovePlayer,
  onAddPlayer,
  canRemovePlayer,
  canAddPlayer,
}: RosterPanelProps) {
  const getPartnerValue = (playerId: string) =>
    partnerLookup?.get(playerId) ?? "";
  const panelClassName = [
    "panel",
    "roster-panel",
    showGenderSelect ? "roster-panel--gender" : "",
    showPartnerSelect ? "roster-panel--partner" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className={panelClassName}>
      <div className="panel-header">
        <h2 className="panel-title">Roster</h2>
        <button type="button" className="btn-ghost" onClick={onToggleOpen}>
          {isOpen ? "Collapse" : "Expand"}
        </button>
      </div>
      <p className="panel-subtitle">
        Edit player names here. Optionally set a color or gender for each player.
        {showPartnerSelect
          ? " Lock partners to keep teams together."
          : ""}
      </p>
      {warningText ? (
        <p className="roster-warning" role="alert">
          {warningText}
        </p>
      ) : null}
      {isOpen ? (
        <>
          <div className="roster-header">
            <span className="roster-header-cell">Player</span>
            <span className="roster-header-cell">Name</span>
            <span className="roster-header-cell">Color</span>
            {showGenderSelect ? (
              <span className="roster-header-cell">Gender</span>
            ) : null}
            {showPartnerSelect ? (
              <span className="roster-header-cell">Partner</span>
            ) : null}
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
                {showGenderSelect ? (
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
                ) : null}
                {showPartnerSelect ? (
                  <select
                    className="partner-select"
                    value={getPartnerValue(player.id)}
                    onChange={(event) =>
                      onPartnerChange?.(player.id, event.target.value || null)
                    }
                  >
                    <option value="">Auto-pair</option>
                    {players
                      .filter((candidate) => candidate.id !== player.id)
                      .map((candidate) => {
                        const candidatePartner =
                          partnerLookup?.get(candidate.id);
                        const isLockedElsewhere =
                          Boolean(candidatePartner) &&
                          candidatePartner !== player.id;
                        const label = `${candidate.name || "Player"}${
                          isLockedElsewhere ? " (locked)" : ""
                        }`;
                        return (
                          <option key={candidate.id} value={candidate.id}>
                            {label}
                          </option>
                        );
                      })}
                  </select>
                ) : null}
                <button
                  type="button"
                  className="btn-ghost"
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
              className="btn-ghost"
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
