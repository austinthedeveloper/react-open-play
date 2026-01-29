import type { PlayerStat } from "../../interfaces";
import { shortenName } from "../../utilities";
import "./StatsPanel.css";

export type StatsPanelProps = {
  stats: PlayerStat[];
  teamStats?: TeamStat[];
  mode?: "player" | "team";
  title?: string;
  subtitle?: string;
};

export type TeamStat = {
  id: string;
  players: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  wins: number;
  losses: number;
  playCount: number;
};

const DEFAULT_PLAYER_TITLE = "Player Balance";
const DEFAULT_PLAYER_SUBTITLE =
  "Each player should land within one match of the group average.";
const DEFAULT_TEAM_TITLE = "Team Balance";
const DEFAULT_TEAM_SUBTITLE =
  "Partners stay together, so results are tracked by team.";

export default function StatsPanel({
  stats,
  teamStats = [],
  mode = "player",
  title,
  subtitle,
}: StatsPanelProps) {
  const isTeamView = mode === "team";
  const panelTitle = title ?? (isTeamView ? DEFAULT_TEAM_TITLE : DEFAULT_PLAYER_TITLE);
  const panelSubtitle =
    subtitle ?? (isTeamView ? DEFAULT_TEAM_SUBTITLE : DEFAULT_PLAYER_SUBTITLE);
  const visibleStats = isTeamView ? teamStats : stats;
  return (
    <section className="panel">
      <h2 className="panel-title">{panelTitle}</h2>
      <p className="panel-subtitle">{panelSubtitle}</p>
      <div className="stats-grid">
        {visibleStats.map((entry) => {
          if (isTeamView) {
            const team = entry as TeamStat;
            return (
              <div key={team.id} className="stat-card stat-card--team">
                <span className="stat-card-label stat-card-label--team">
                  {team.players.map((player) => (
                    <span key={player.id} className="stat-team-member">
                      <span
                        className="stat-dot"
                        style={{
                          backgroundColor: player.color || "transparent",
                        }}
                      />
                      {shortenName(player.name)}
                    </span>
                  ))}
                </span>
                <span className="stat-value">
                  {team.wins}W · {team.losses}L
                </span>
                <span className="stat-card-sub">Played {team.playCount}</span>
              </div>
            );
          }

          const player = entry as PlayerStat;
          return (
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
          );
        })}
      </div>
    </section>
  );
}
