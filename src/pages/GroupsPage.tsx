import { useEffect, useMemo, useState } from "react";
import type { Player, PlayerGroup } from "../interfaces";
import { authService } from "../services/authService";
import { groupsService } from "../services/groupsService";
import { playersService } from "../services/playersService";
import "./PlayerGroupManager.css";

const buildNameLookup = (players: Player[]) =>
  new Map(players.map((player) => [player.id, player.name]));

export default function GroupsPage() {
  const [token, setToken] = useState(() => authService.getToken());
  const [players, setPlayers] = useState<Player[]>([]);
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", playerIds: [] as string[] });

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
      setGroups([]);
      setError(null);
      setLoading(false);
      return;
    }
    let isActive = true;
    setLoading(true);
    setError(null);
    Promise.all([playersService.list(), groupsService.list()])
      .then(([playersData, groupsData]) => {
        if (!isActive) {
          return;
        }
        setPlayers(playersData);
        setGroups(groupsData);
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Unable to load groups";
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

  const nameLookup = useMemo(() => buildNameLookup(players), [players]);
  const canSubmit = draft.name.trim().length > 0;

  const handleToggleDraftPlayer = (playerId: string) => {
    setDraft((prev) => {
      const exists = prev.playerIds.includes(playerId);
      return {
        ...prev,
        playerIds: exists
          ? prev.playerIds.filter((id) => id !== playerId)
          : [...prev.playerIds, playerId],
      };
    });
  };

  const handleAddGroup = async () => {
    if (!canSubmit) {
      setError("Add a group name to continue.");
      return;
    }
    setError(null);
    try {
      const created = await groupsService.create({
        name: draft.name.trim(),
        playerIds: draft.playerIds,
      });
      setGroups((prev) => [created, ...prev]);
      setDraft({ name: "", playerIds: [] });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to add group";
      setError(message);
    }
  };

  const updateGroupLocal = (groupId: string, patch: Partial<PlayerGroup>) => {
    setGroups((prev) =>
      prev.map((group) => (group.id === groupId ? { ...group, ...patch } : group))
    );
  };

  const handleToggleGroupPlayer = (group: PlayerGroup, playerId: string) => {
    const hasPlayer = group.playerIds.includes(playerId);
    const nextPlayerIds = hasPlayer
      ? group.playerIds.filter((id) => id !== playerId)
      : [...group.playerIds, playerId];
    updateGroupLocal(group.id, { playerIds: nextPlayerIds });
  };

  const handleSaveGroup = async (groupId: string) => {
    const group = groups.find((entry) => entry.id === groupId);
    if (!group) {
      return;
    }
    setSavingId(groupId);
    setError(null);
    try {
      const updated = await groupsService.update(groupId, group);
      setGroups((prev) =>
        prev.map((entry) => (entry.id === groupId ? updated : entry))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save group";
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    setSavingId(groupId);
    setError(null);
    try {
      await groupsService.remove(groupId);
      setGroups((prev) => prev.filter((entry) => entry.id !== groupId));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to remove group";
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
            <h1 className="hero-title">Groups</h1>
            <p className="hero-subtitle">
              Bundle players together for quick match setup.
            </p>
          </div>
        </header>
        <section className="panel manager-panel">
          <p className="manager-helper">
            Sign in to create and manage your player groups.
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
          <h1 className="hero-title">Groups</h1>
          <p className="hero-subtitle">
            Create reusable squads of players for roster builds.
          </p>
        </div>
      </header>

      <div className="manager-grid">
        <section className="panel manager-panel">
          <div className="panel-header">
            <h2 className="panel-title">Add group</h2>
          </div>
          <div className="manager-form">
            <div className="manager-form-row">
              <div className="manager-field">
                <label htmlFor="group-name">Group name</label>
                <input
                  id="group-name"
                  type="text"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Group name"
                />
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddGroup}
                disabled={!canSubmit}
              >
                Add group
              </button>
            </div>
            <div>
              <p className="manager-helper">Select players for this group.</p>
              {players.length === 0 ? (
                <p className="manager-helper">
                  Add players first to start creating groups.
                </p>
              ) : (
                <div className="manager-checkbox-grid">
                  {players.map((player) => (
                    <label key={player.id} className="manager-checkbox">
                      <input
                        type="checkbox"
                        checked={draft.playerIds.includes(player.id)}
                        onChange={() => handleToggleDraftPlayer(player.id)}
                      />
                      {player.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            {error ? <p className="manager-error">{error}</p> : null}
          </div>
        </section>

        <section className="panel manager-panel">
          <div className="panel-header">
            <h2 className="panel-title">Saved groups</h2>
            <span className="manager-helper">{groups.length} total</span>
          </div>
          {loading ? (
            <p className="manager-helper">Loading groups...</p>
          ) : groups.length === 0 ? (
            <p className="manager-empty">No saved groups yet.</p>
          ) : (
            <div className="manager-list">
              {groups.map((group) => (
                <article key={group.id} className="manager-card">
                  <div className="manager-card-header">
                    <input
                      type="text"
                      value={group.name}
                      onChange={(event) =>
                        updateGroupLocal(group.id, { name: event.target.value })
                      }
                    />
                    <div className="manager-card-actions">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleSaveGroup(group.id)}
                        disabled={savingId === group.id}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => handleRemoveGroup(group.id)}
                        disabled={savingId === group.id}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="manager-helper">
                      {group.playerIds.length} players ·{" "}
                      {group.playerIds
                        .map((id) => nameLookup.get(id))
                        .filter(Boolean)
                        .join(", ") || "No players selected"}
                    </p>
                    {players.length === 0 ? null : (
                      <div className="manager-checkbox-grid">
                        {players.map((player) => (
                          <label key={player.id} className="manager-checkbox">
                            <input
                              type="checkbox"
                              checked={group.playerIds.includes(player.id)}
                              onChange={() =>
                                handleToggleGroupPlayer(group, player.id)
                              }
                            />
                            {player.name}
                          </label>
                        ))}
                      </div>
                    )}
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
