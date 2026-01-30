import { useEffect, useMemo, useState } from "react";
import { PLAYER_COLORS } from "../data";
import type { GenderOption, Player } from "../interfaces";
import { authService } from "../services/authService";
import { playersService } from "../services/playersService";
import "./PlayerGroupManager.css";

const resolveNextColor = (players: Player[]) => {
  const used = new Set(players.map((player) => player.color).filter(Boolean));
  const available = PLAYER_COLORS.find((color) => !used.has(color));
  return available ?? PLAYER_COLORS[players.length % PLAYER_COLORS.length];
};

export default function PlayersPage() {
  const [token, setToken] = useState(() => authService.getToken());
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    color: PLAYER_COLORS[0],
    gender: "" as GenderOption,
  });

  const handleLogin = () => {
    try {
      window.location.assign(authService.getGoogleLoginUrl());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to start login";
      console.warn(message);
    }
  };

  useEffect(() => authService.onTokenChange(setToken), []);

  useEffect(() => {
    if (!token) {
      setPlayers([]);
      setError(null);
      setLoading(false);
      return;
    }
    let isActive = true;
    setLoading(true);
    setError(null);
    playersService
      .list()
      .then((data) => {
        if (isActive) {
          setPlayers(data);
        }
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Unable to load players";
        setError(message);
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      color: prev.color || resolveNextColor(players),
    }));
  }, [players]);

  const canSubmit = draft.name.trim().length > 0;
  const nextColor = useMemo(() => resolveNextColor(players), [players]);

  const handleAddPlayer = async () => {
    if (!canSubmit) {
      setError("Add a player name to continue.");
      return;
    }
    setError(null);
    try {
      const created = await playersService.create({
        name: draft.name.trim(),
        color: draft.color || nextColor,
        gender: draft.gender,
      });
      setPlayers((prev) => [created, ...prev]);
      setDraft({ name: "", color: nextColor, gender: "" as GenderOption });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to add player";
      setError(message);
    }
  };

  const updatePlayerLocal = (playerId: string, patch: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((player) =>
        player.id === playerId ? { ...player, ...patch } : player
      )
    );
  };

  const handleSavePlayer = async (playerId: string) => {
    const player = players.find((entry) => entry.id === playerId);
    if (!player) {
      return;
    }
    setSavingId(playerId);
    setError(null);
    try {
      const updated = await playersService.update(playerId, player);
      setPlayers((prev) =>
        prev.map((entry) => (entry.id === playerId ? updated : entry))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save player";
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    setSavingId(playerId);
    setError(null);
    try {
      await playersService.remove(playerId);
      setPlayers((prev) => prev.filter((entry) => entry.id !== playerId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to remove player";
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  if (!token) {
    return (
      <div className="app-shell text-left">
        <header className="panel-hero">
          <div>
            <p className="eyebrow">Match Builder Lab</p>
            <h1 className="hero-title">Players</h1>
            <p className="hero-subtitle">
              Save reusable player profiles for faster match setup.
            </p>
          </div>
        </header>
        <section className="panel manager-panel">
          <p className="manager-helper">
            Sign in to create and manage your player library.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={handleLogin}
          >
            Sign in with Google
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell text-left">
      <header className="panel-hero">
        <div>
          <p className="eyebrow">Match Builder Lab</p>
          <h1 className="hero-title">Players</h1>
          <p className="hero-subtitle">
            Build a reusable roster of players with colors and gender.
          </p>
        </div>
      </header>

      <div className="manager-grid">
        <section className="panel manager-panel">
          <div className="panel-header">
            <h2 className="panel-title">Add player</h2>
          </div>
          <div className="manager-form">
            <div className="manager-form-row">
              <div className="manager-field">
                <label htmlFor="player-name">Player name</label>
                <input
                  id="player-name"
                  type="text"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Player name"
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddPlayer}
                disabled={!canSubmit}
              >
                Add player
              </button>
            </div>
            <div className="manager-grid-fields">
              <div className="manager-field">
                <label htmlFor="player-color">Color</label>
                <input
                  id="player-color"
                  type="color"
                  className="color-input"
                  value={draft.color || nextColor}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      color: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="manager-field">
                <label>Gender</label>
                <div
                  className="gender-toggle"
                  role="group"
                  aria-label="Gender"
                >
                  <button
                    type="button"
                    className={`gender-toggle-button ${
                      draft.gender === "male" ? "is-active" : ""
                    }`}
                    data-value="male"
                    aria-pressed={draft.gender === "male"}
                    aria-label="Male"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, gender: "male" }))
                    }
                  >
                    <span className="material-icons" aria-hidden="true">
                      male
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`gender-toggle-button ${
                      !draft.gender ? "is-active" : ""
                    }`}
                    data-value=""
                    aria-pressed={!draft.gender}
                    aria-label="Unspecified"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, gender: "" }))
                    }
                  >
                    <span className="material-icons" aria-hidden="true">
                      remove
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`gender-toggle-button ${
                      draft.gender === "female" ? "is-active" : ""
                    }`}
                    data-value="female"
                    aria-pressed={draft.gender === "female"}
                    aria-label="Female"
                    onClick={() =>
                      setDraft((prev) => ({ ...prev, gender: "female" }))
                    }
                  >
                    <span className="material-icons" aria-hidden="true">
                      female
                    </span>
                  </button>
                </div>
              </div>
            </div>
            {error ? <p className="manager-error">{error}</p> : null}
          </div>
        </section>

        <section className="panel manager-panel">
          <div className="panel-header">
            <h2 className="panel-title">Saved players</h2>
            <span className="manager-helper">{players.length} total</span>
          </div>
          {loading ? (
            <p className="manager-helper">Loading players...</p>
          ) : players.length === 0 ? (
            <p className="manager-empty">No saved players yet.</p>
          ) : (
            <div className="manager-list">
              {players.map((player) => (
                <article key={player.id} className="manager-card">
                  <div className="manager-card-header">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(event) =>
                        updatePlayerLocal(player.id, {
                          name: event.target.value,
                        })
                      }
                    />
                    <div className="manager-card-actions">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleSavePlayer(player.id)}
                        disabled={savingId === player.id}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleRemovePlayer(player.id)}
                        disabled={savingId === player.id}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="manager-grid-fields">
                    <input
                      type="color"
                      className="color-input"
                      value={player.color || nextColor}
                      onChange={(event) =>
                        updatePlayerLocal(player.id, {
                          color: event.target.value,
                        })
                      }
                      aria-label={`Color for ${player.name}`}
                    />
                    <div
                      className="gender-toggle"
                      role="group"
                      aria-label={`Gender for ${player.name}`}
                    >
                      <button
                        type="button"
                        className={`gender-toggle-button ${
                          player.gender === "male" ? "is-active" : ""
                        }`}
                        data-value="male"
                        aria-pressed={player.gender === "male"}
                        aria-label="Male"
                        onClick={() =>
                          updatePlayerLocal(player.id, { gender: "male" })
                        }
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
                        onClick={() => updatePlayerLocal(player.id, { gender: "" })}
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
                        onClick={() =>
                          updatePlayerLocal(player.id, { gender: "female" })
                        }
                      >
                        <span className="material-icons" aria-hidden="true">
                          female
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
