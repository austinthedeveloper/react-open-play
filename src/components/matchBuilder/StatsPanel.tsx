import type { PlayerStat } from "../../interfaces";
import { shortenName } from "../../utilities";
import "./StatsPanel.css";

export type StatsPanelProps = {
  stats: PlayerStat[];
};

export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <section className="table-panel">
      <h2 className="panel-title">Player Balance</h2>
      <p className="panel-subtitle">
        Each player should land within one match of the group average.
      </p>
      <div className="stats-grid">
        {stats.map((player) => (
          <div key={player.id} className="stat-card">
            <span className="stat-card-label">
              <span
                className="stat-dot"
                style={{
                  backgroundColor: player.color || "transparent",
                }}
              />
              {shortenName(player.name)}
            </span>
            <span className="stat-value">
              {player.wins}W · {player.losses}L
            </span>
            <span className="stat-card-sub">Played {player.playCount}</span>
            {player.gender ? (
              <span
                className="stat-card-sub"
                aria-label={player.gender === "male" ? "Male" : "Female"}
              >
                <span
                  className={`material-icons stat-gender-icon ${
                    player.gender === "male"
                      ? "stat-gender-icon--male"
                      : "stat-gender-icon--female"
                  }`}
                  aria-hidden="true"
                >
                  {player.gender === "male" ? "male" : "female"}
                </span>
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
