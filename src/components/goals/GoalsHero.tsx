import type { Profile } from "../../interfaces";

type GoalsHeroProps = {
  profile: Profile;
  playedCount: number;
  completedCount: number;
  totalMatches: number;
};

export default function GoalsHero({
  profile,
  playedCount,
  completedCount,
  totalMatches,
}: GoalsHeroProps) {
  return (
    <header className="hero-panel">
      <div>
        <p className="eyebrow">Open Play Lab</p>
        <h1 className="hero-title">Open Play Goals</h1>
        <p className="hero-subtitle">
          Profile: <strong>{profile.ratingRange}</strong> &middot; Default
          opponent level:{" "}
          <strong className="capitalize">
            {profile.defaultOpponentLevel}
          </strong>
        </p>
      </div>

      <div className="hero-stats">
        <div>
          <span className="stat-label">Played</span>
          <span className="stat-value">
            {playedCount} / {totalMatches}
          </span>
        </div>
        <div>
          <span className="stat-label">Goals completed</span>
          <span className="stat-value">{completedCount}</span>
        </div>
      </div>
    </header>
  );
}
