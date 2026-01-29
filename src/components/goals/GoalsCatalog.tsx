import { useMemo, useState } from "react";
import type { GoalEntity, OpponentLevel } from "../../interfaces";
import type { AuthUser } from "../../services/authService";
import { goalsService } from "../../services/goalsService";
import { goalsCatalogActions } from "../../store/goalsCatalogSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import "./GoalsCatalog.css";

const parseAdminEmails = (raw: string | undefined) =>
  (raw ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);

const adminEmails = parseAdminEmails(
  import.meta.env.VITE_GOALS_ADMIN_EMAILS as string | undefined
);

const formatLevel = (level?: string | null) => {
  if (!level) {
    return null;
  }
  return level[0].toUpperCase() + level.slice(1);
};

export default function GoalsCatalog({ user }: { user: AuthUser | null }) {
  const dispatch = useAppDispatch();
  const { globalGoals, userGoals, isLoading, error } = useAppSelector(
    (state) => state.goalsCatalog
  );

  const isAdmin = useMemo(() => {
    if (!user?.email) {
      return false;
    }
    if (adminEmails.length === 0) {
      return false;
    }
    return adminEmails.includes(user.email.toLowerCase());
  }, [user]);

  const [userDraft, setUserDraft] = useState({
    goalText: "",
    opponentLevel: "" as OpponentLevel | "",
  });
  const [globalDraft, setGlobalDraft] = useState({
    goalText: "",
    opponentLevel: "" as OpponentLevel | "",
  });
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    goalText: "",
    opponentLevel: "" as OpponentLevel | "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (goal: GoalEntity) => {
    setEditingGoalId(goal.id);
    setEditDraft({
      goalText: goal.goalText,
      opponentLevel: (goal.opponentLevel ?? "") as OpponentLevel | "",
    });
  };

  const cancelEdit = () => {
    setEditingGoalId(null);
    setEditDraft({ goalText: "", opponentLevel: "" });
  };

  const handleCreateUserGoal = async () => {
    if (!user) {
      dispatch(goalsCatalogActions.setGoalsError("Sign in to create goals."));
      return;
    }
    if (!userDraft.goalText.trim()) {
      return;
    }
    setIsSaving(true);
    dispatch(goalsCatalogActions.setGoalsError(null));
    try {
      const goal = await goalsService.createUser({
        goalText: userDraft.goalText.trim(),
        opponentLevel: userDraft.opponentLevel || null,
      });
      dispatch(goalsCatalogActions.addUserGoal(goal));
      setUserDraft({ goalText: "", opponentLevel: "" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create goal";
      dispatch(goalsCatalogActions.setGoalsError(message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateGlobalGoal = async () => {
    if (!isAdmin) {
      dispatch(goalsCatalogActions.setGoalsError("Admin access required."));
      return;
    }
    if (!globalDraft.goalText.trim()) {
      return;
    }
    setIsSaving(true);
    dispatch(goalsCatalogActions.setGoalsError(null));
    try {
      const goal = await goalsService.createGlobal({
        goalText: globalDraft.goalText.trim(),
        opponentLevel: globalDraft.opponentLevel || null,
      });
      dispatch(goalsCatalogActions.setGlobalGoals([goal, ...globalGoals]));
      setGlobalDraft({ goalText: "", opponentLevel: "" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create goal";
      dispatch(goalsCatalogActions.setGoalsError(message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUserGoal = async (goalId: string) => {
    if (!editDraft.goalText.trim()) {
      return;
    }
    setIsSaving(true);
    dispatch(goalsCatalogActions.setGoalsError(null));
    try {
      const updated = await goalsService.updateUser(goalId, {
        goalText: editDraft.goalText.trim(),
        opponentLevel: editDraft.opponentLevel || null,
      });
      dispatch(goalsCatalogActions.updateUserGoal(updated));
      cancelEdit();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update goal";
      dispatch(goalsCatalogActions.setGoalsError(message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUserGoal = async (goalId: string) => {
    if (!window.confirm("Delete this goal?")) {
      return;
    }
    setIsSaving(true);
    dispatch(goalsCatalogActions.setGoalsError(null));
    try {
      await goalsService.removeUser(goalId);
      dispatch(goalsCatalogActions.removeUserGoal(goalId));
      if (editingGoalId === goalId) {
        cancelEdit();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete goal";
      dispatch(goalsCatalogActions.setGoalsError(message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="panel goals-catalog">
      <header className="goals-catalog__header">
        <div>
          <h2 className="panel-title">Goal Library</h2>
          <p className="panel-subtitle">
            Pull from global goals or manage your personal goal list.
          </p>
        </div>
        {isLoading ? <span className="goals-catalog__loading">Loading</span> : null}
      </header>

      {error ? <p className="goals-catalog__error">{error}</p> : null}

      <div className="goals-catalog__grid">
        <div className="goals-catalog__column">
          <h3 className="goals-catalog__title">Global goals</h3>
          {globalGoals.length === 0 ? (
            <p className="empty-state">No global goals yet.</p>
          ) : (
            <div className="goals-catalog__list">
              {globalGoals.map((goal) => (
                <article key={goal.id} className="goals-catalog__card">
                  <div className="goals-catalog__meta">
                    <span className="goals-catalog__pill">Global</span>
                    {goal.opponentLevel ? (
                      <span className="goals-catalog__level">
                        {formatLevel(goal.opponentLevel)}
                      </span>
                    ) : null}
                  </div>
                  <p className="goals-catalog__text">{goal.goalText}</p>
                  <p className="goals-catalog__byline">
                    Added by {goal.createdByName ?? "Admin"}
                  </p>
                </article>
              ))}
            </div>
          )}

          {isAdmin ? (
            <div className="goals-catalog__form">
              <h4>Create global goal</h4>
              <textarea
                value={globalDraft.goalText}
                onChange={(event) =>
                  setGlobalDraft((prev) => ({
                    ...prev,
                    goalText: event.target.value,
                  }))
                }
                placeholder="Write a global goal"
                rows={3}
              />
              <select
                value={globalDraft.opponentLevel}
                onChange={(event) =>
                  setGlobalDraft((prev) => ({
                    ...prev,
                    opponentLevel: event.target.value as OpponentLevel | "",
                  }))
                }
              >
                <option value="">Any opponent level</option>
                <option value="lower">Lower</option>
                <option value="same">Same</option>
                <option value="higher">Higher</option>
              </select>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleCreateGlobalGoal}
                disabled={isSaving || !globalDraft.goalText.trim()}
              >
                Add global goal
              </button>
            </div>
          ) : null}
        </div>

        <div className="goals-catalog__column">
          <h3 className="goals-catalog__title">Your goals</h3>
          {user ? (
            <div className="goals-catalog__form">
              <h4>Add a personal goal</h4>
              <textarea
                value={userDraft.goalText}
                onChange={(event) =>
                  setUserDraft((prev) => ({
                    ...prev,
                    goalText: event.target.value,
                  }))
                }
                placeholder="Write a personal goal"
                rows={3}
              />
              <select
                value={userDraft.opponentLevel}
                onChange={(event) =>
                  setUserDraft((prev) => ({
                    ...prev,
                    opponentLevel: event.target.value as OpponentLevel | "",
                  }))
                }
              >
                <option value="">Any opponent level</option>
                <option value="lower">Lower</option>
                <option value="same">Same</option>
                <option value="higher">Higher</option>
              </select>
              <button
                type="button"
                className="btn-ghost"
                onClick={handleCreateUserGoal}
                disabled={isSaving || !userDraft.goalText.trim()}
              >
                Add personal goal
              </button>
            </div>
          ) : (
            <p className="goals-catalog__note">Sign in to manage goals.</p>
          )}

          {userGoals.length === 0 ? (
            <p className="empty-state">No personal goals yet.</p>
          ) : (
            <div className="goals-catalog__list">
              {userGoals.map((goal) => {
                const isEditing = editingGoalId === goal.id;
                return (
                  <article key={goal.id} className="goals-catalog__card">
                    <div className="goals-catalog__meta">
                      <span className="goals-catalog__pill is-user">Personal</span>
                      {goal.opponentLevel ? (
                        <span className="goals-catalog__level">
                          {formatLevel(goal.opponentLevel)}
                        </span>
                      ) : null}
                    </div>
                    {isEditing ? (
                      <div className="goals-catalog__edit">
                        <textarea
                          value={editDraft.goalText}
                          onChange={(event) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              goalText: event.target.value,
                            }))
                          }
                          rows={3}
                        />
                        <select
                          value={editDraft.opponentLevel}
                          onChange={(event) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              opponentLevel: event.target.value as OpponentLevel | "",
                            }))
                          }
                        >
                          <option value="">Any opponent level</option>
                          <option value="lower">Lower</option>
                          <option value="same">Same</option>
                          <option value="higher">Higher</option>
                        </select>
                        <div className="goals-catalog__actions">
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleUpdateUserGoal(goal.id)}
                            disabled={isSaving || !editDraft.goalText.trim()}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={cancelEdit}
                            disabled={isSaving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="goals-catalog__text">{goal.goalText}</p>
                        <div className="goals-catalog__actions">
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => startEdit(goal)}
                            disabled={isSaving}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleDeleteUserGoal(goal.id)}
                            disabled={isSaving}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
